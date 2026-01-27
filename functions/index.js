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
exports.stripeWebhook = onRequest(
    {
      region: "us-east1",
      secrets: [stripeSecretKey, stripeWebhookSecret],
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

          // Mark the order as paid
          await admin.firestore().collection("orders").doc(orderId).set(
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

          console.log(`Order ${orderId} marked as paid`);

          // Fetch order details for email notification
          const orderDoc = await admin.firestore().collection("orders").doc(orderId).get();
          if (orderDoc.exists) {
            const orderData = orderDoc.data();

            // Send email notification to vendor
            // Note: You need to configure Firebase Extensions for email
            // or implement your own email service (SendGrid, Mailgun, etc.)
            try {
              await admin.firestore().collection("mail").add({
                to: process.env.VENDOR_EMAIL || "vendor@yourstore.com",
                message: {
                  subject: `New Order Received - Order #${orderId}`,
                  html: `
                    <h2>New Order Notification</h2>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Customer:</strong> ${orderData.firstName} ${orderData.lastName}</p>
                    <p><strong>Email:</strong> ${orderData.email}</p>
                    <p><strong>Amount:</strong> $${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase()}</p>
                    <p><strong>Status:</strong> Paid</p>
                    <p><strong>Payment Intent:</strong> ${session.payment_intent}</p>
                    ${orderData.cartItems ? `
                      <h3>Order Items:</h3>
                      <ul>
                        ${orderData.cartItems.map((item) => `
                          <li>${item.title || "Custom Product"} - Quantity: ${item.quantity || 1}</li>
                        `).join("")}
                      </ul>
                    ` : ""}
                    <p><strong>Shipping Address:</strong></p>
                    <p>${orderData.address || ""}<br>
                    ${orderData.city || ""}, ${orderData.state || ""} ${orderData.postalCode || ""}<br>
                    ${orderData.country || ""}</p>
                  `,
                },
              });
              console.log(`Vendor notification email queued for order ${orderId}`);
            } catch (emailErr) {
              console.error("Failed to send vendor notification:", emailErr);
              // Don't fail the webhook if email fails
            }
          }
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
