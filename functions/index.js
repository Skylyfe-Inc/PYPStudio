/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const printifyApiToken = defineSecret("PRINTIFY_API_TOKEN");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({maxInstances: 5}, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({maxInstances: 10}) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

/**
 * Stripe Webhook Handler
 * Listens for Stripe events and updates order status in Firestore
 */
const splitFullName = (fullName = "") => {
  const parts = String(fullName).trim().split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || parts[0] || "",
  };
};

const parseDataUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  return {mime: match[1], data: match[2]};
};

const printifyRequest = async (token, path, options = {}) => {
  const response = await fetch(`https://api.printify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = {raw: text};
    }
  }
  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText;
    const error = new Error(message || "Printify request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
};

const uploadPrintifyImage = async (token, fileName, imageValue) => {
  const dataUrl = parseDataUrl(imageValue);
  const payload = dataUrl
    ? {
        file_name: fileName,
        contents: dataUrl.data,
      }
    : {
        file_name: fileName,
        url: imageValue,
      };
  return printifyRequest(token, "/uploads/images.json", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

const buildPrintifyImages = (item) => {
  const images = [];
  const toggles = item?.toggles || {};
  const decals = item?.decals || {};
  const placementMap = {
    logo: "front",
    full: "front",
    backLogo: "back",
    backFull: "back",
  };

  Object.entries(placementMap).forEach(([key, placement]) => {
    if (!toggles[`is${key[0].toUpperCase()}${key.slice(1)}Texture`]) return;
    const value = decals[key];
    if (typeof value === "string" && /^(data:image|https?:\/\/)/i.test(value)) {
      images.push({placement, value});
    }
  });

  if (!images.length && typeof item?.thumbnail === "string") {
    if (/^data:image/i.test(item.thumbnail)) {
      images.push({placement: "front", value: item.thumbnail});
    }
  }

  return images;
};

const createPrintifyOrder = async ({
  token,
  shopId,
  orderId,
  orderData,
  session,
}) => {
  const selection = orderData?.printifySelection;
  if (!selection?.variantId || !selection?.printProviderId || !selection?.blueprintId) {
    return {skipped: true, reason: "Missing printify selection"};
  }

  const shipping = session?.shipping_details;
  if (!shipping?.address) {
    return {skipped: true, reason: "Missing shipping address"};
  }

  const {firstName, lastName} = splitFullName(shipping.name || "");
  const address = shipping.address || {};
  const email = session?.customer_details?.email || orderData?.email || null;

  const items = Array.isArray(orderData?.items) ? orderData.items : [];
  const primaryItem = items[0] || {};
  const images = buildPrintifyImages(primaryItem);
  if (!images.length) {
    return {skipped: true, reason: "No printable image found"};
  }

  const uploadedImages = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const result = await uploadPrintifyImage(
        token,
        `order-${orderId}-${image.placement}-${index + 1}.png`,
        image.value,
    );
    uploadedImages.push({placement: image.placement, id: result?.id});
  }

  const placeholders = uploadedImages.map((image) => ({
    position: image.placement,
    images: [
      {
        id: image.id,
        x: 0.5,
        y: 0.5,
        scale: 1,
        angle: 0,
      },
    ],
  }));

  const payload = {
    external_id: orderId,
    label: `Order ${orderId}`,
    line_items: [
      {
        blueprint_id: selection.blueprintId,
        print_provider_id: selection.printProviderId,
        variant_id: selection.variantId,
        quantity: primaryItem.quantity || 1,
        print_areas: [
          {
            variant_ids: [selection.variantId],
            placeholders,
          },
        ],
      },
    ],
    address_to: {
      first_name: firstName || orderData?.firstName || "",
      last_name: lastName || orderData?.lastName || "",
      email: email || "",
      phone: shipping?.phone || orderData?.phone || "",
      country: address.country || "",
      region: address.state || "",
      address1: address.line1 || "",
      address2: address.line2 || "",
      city: address.city || "",
      zip: address.postal_code || "",
    },
    send_shipping_notification: false,
  };

  const response = await printifyRequest(
      token,
      `/shops/${shopId}/orders.json`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
  );

  return {skipped: false, response};
};

exports.stripeWebhook = onRequest(
    {
      region: "us-east1",
      secrets: [stripeSecretKey, stripeWebhookSecret, printifyApiToken],
    },
    async (req, res) => {
      // Initialize Stripe inside the function to avoid deployment issues
      const stripeKey = stripeSecretKey.value();
      const webhookSecret = stripeWebhookSecret.value();

      if (!stripeKey || !webhookSecret) {
        console.error("Missing Stripe environment variables");
        return res.status(500).send("Stripe not configured");
      }

      const stripe = new Stripe(stripeKey, {
        apiVersion: "2023-10-16",
      });

      let event;

      try {
        // Stripe requires the *raw* request body for signature verification
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object;

          // We put this in metadata from the frontend
          const orderId = session?.metadata?.orderId;
          const uid = session?.metadata?.uid;

          if (!orderId || !uid) {
            console.warn("Missing orderId/uid in session metadata");
            return res.status(200).json({received: true});
          }

          const orderRef = admin.firestore().collection("orders").doc(orderId);
          const orderSnap = await orderRef.get();
          const orderData = orderSnap.exists ? orderSnap.data() : null;

          // Mark the order as paid
          await orderRef.set(
              {
                status: "paid",
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                stripe: {
                  checkoutSessionId: session.id,
                  customerId: session.customer,
                  paymentIntentId: session.payment_intent || null,
                  amountTotal: session.amount_total,
                  currency: session.currency,
                },
              },
              {merge: true},
          );

          if (!orderSnap.exists) {
            console.warn("Order not found for Printify sync", orderId);
          } else if (orderData?.printify?.orderId) {
            console.log(`Printify already created for order ${orderId}`);
          } else {
            const shopId = process.env.PRINTIFY_SHOP_ID;
            const token = printifyApiToken.value();
            if (!shopId || !token) {
              console.warn("Printify not configured for order", orderId);
            } else {
              try {
                const result = await createPrintifyOrder({
                  token,
                  shopId,
                  orderId,
                  orderData,
                  session,
                });
                if (result.skipped) {
                  await orderRef.set(
                      {
                        printify: {
                          status: "skipped",
                          reason: result.reason,
                          skippedAt: admin.firestore.FieldValue.serverTimestamp(),
                        },
                      },
                      {merge: true},
                  );
                } else {
                  await orderRef.set(
                      {
                        printify: {
                          status: "created",
                          orderId: result.response?.id || null,
                          createdAt: admin.firestore.FieldValue.serverTimestamp(),
                          details: result.response || null,
                        },
                      },
                      {merge: true},
                  );
                }
              } catch (printifyError) {
                console.error("Printify order creation failed", printifyError);
                await orderRef.set(
                    {
                      printify: {
                        status: "error",
                        error: printifyError.message || String(printifyError),
                        failedAt: admin.firestore.FieldValue.serverTimestamp(),
                      },
                    },
                    {merge: true},
                );
              }
            }
          }

          console.log(`Order ${orderId} marked as paid`);
        }

        // Handle async payment success
        if (event.type === "checkout.session.async_payment_succeeded") {
          const session = event.data.object;
          const orderId = session?.metadata?.orderId;

          if (orderId) {
            await admin.firestore().collection("orders").doc(orderId).set(
                {
                  status: "paid",
                  paidAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                {merge: true},
            );
            console.log(`Order ${orderId} async payment succeeded`);
          }
        }

        // Handle async payment failure
        if (event.type === "checkout.session.async_payment_failed") {
          const session = event.data.object;
          const orderId = session?.metadata?.orderId;

          if (orderId) {
            await admin.firestore().collection("orders").doc(orderId).set(
                {
                  status: "payment_failed",
                  paymentFailedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                {merge: true},
            );
            console.log(`Order ${orderId} async payment failed`);
          }
        }

        return res.status(200).json({received: true});
      } catch (err) {
        console.error("Webhook handler failed", err);
        return res.status(500).send("Webhook handler failed");
      }
    },
);

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
