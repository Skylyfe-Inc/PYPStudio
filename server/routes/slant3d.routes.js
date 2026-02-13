import { Router } from "express";
import axios from "axios";
import { db } from "../utils/firebase.js";

const router = Router();

// Slant3D v2 base URL (override via env for staging).
const SLANT3D_BASE_URL =
  process.env.SLANT3D_API_BASE || "https://slant3dapi.com/v2/api";
const SLANT3D_FILE_UPLOAD_PATH =
  process.env.SLANT3D_FILE_UPLOAD_PATH || "/files";

const resolveApiKey = () =>
  process.env.SLANT_3D_API_KEY || process.env.SLANT3D_API_KEY;

// v2 order payload: customer + items (PRINT) + optional metadata.
const buildOrderPayload = ({
  fileName,
  quantity,
  contact,
  shipping,
  publicFileServiceId,
  filamentId,
  platformId,
  itemName,
  sku,
  metadata,
}) => {
  const contactInfo = normalizeAddress(contact || {});
  const shipTo = normalizeAddress(shipping || {}, contactInfo);

  return {
    customer: {
      platformId: platformId || undefined,
      details: {
        email: contactInfo.email,
        address: {
          name: contactInfo.name || shipTo.name,
          line1: shipTo.street,
          line2: "",
          city: shipTo.city,
          state: shipTo.state,
          zip: shipTo.zip,
          country: shipTo.country,
        },
      },
    },
    items: [
      {
        type: "PRINT",
        publicFileServiceId,
        filamentId,
        quantity: Number(quantity) || 1,
        name: itemName || fileName || "3D Model",
        SKU: sku || undefined,
      },
    ],
    metadata: metadata || undefined,
  };
};

const normalizeAddress = (input = {}, fallback = {}) => {
  const address =
    input.address ||
    input.street ||
    input.street1 ||
    input.address1 ||
    fallback.address ||
    fallback.street ||
    fallback.street1 ||
    fallback.address1 ||
    "";

  return {
    name: input.name || fallback.name || "",
    email: input.email || fallback.email || "",
    phone: input.phone || fallback.phone || "",
    street: address,
    city: input.city || fallback.city || "",
    state: input.state || fallback.state || "",
    zip: input.zip || input.postalCode || fallback.zip || fallback.postalCode || "",
    country: input.country || input.countryCode || fallback.country || fallback.countryCode || "",
    isUSResidential:
      input.isUSResidential ?? fallback.isUSResidential ?? true,
  };
};

const computeServiceCharge = (amount) => {
  const base = Number(amount);
  if (!Number.isFinite(base) || base <= 0) return null;
  const serviceCharge = Number((base * 0.05).toFixed(2));
  return {
    baseAmount: Number(base.toFixed(2)),
    serviceCharge,
    totalWithServiceCharge: Number((base + serviceCharge).toFixed(2)),
  };
};

const extractQuoteBaseAmount = (payload) => {
  const data = payload || {};
  const order = data.order || data;
  const printingCost = Number(order?.printingCost ?? NaN);
  const deliveryCost = Number(order?.deliveryCost ?? NaN);
  if (Number.isFinite(printingCost) || Number.isFinite(deliveryCost)) {
    return Number(
      (Math.max(0, printingCost || 0) + Math.max(0, deliveryCost || 0)).toFixed(2),
    );
  }
  const total =
    Number(order?.total ?? order?.price ?? data?.total ?? data?.price ?? NaN);
  return Number.isFinite(total) ? Number(total.toFixed(2)) : null;
};


// Shared Slant3D request helper with Bearer auth.
const slantRequest = async ({ endpoint, apiKey, payload, method = "post" }) => {
  return axios({
    method,
    url: `${SLANT3D_BASE_URL}${endpoint}`,
    data: payload ?? undefined,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
};

// Creates a draft order (used as a "quote" in v2).
router.post("/quote", async (req, res) => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Slant 3D API key is not configured on the server.",
    });
  }

  const {
    fileName,
    quantity = 1,
    contact = null,
    shipping = null,
    publicFileServiceId = null,
    filamentId = null,
    platformId = null,
    itemName = null,
    sku = null,
    metadata = null,
  } = req.body || {};

  if (!fileName) {
    return res.status(400).json({
      success: false,
      message: "fileName is required to request a quote.",
    });
  }

  if (!publicFileServiceId || !filamentId || !platformId) {
    return res.status(400).json({
      success: false,
      message: "publicFileServiceId, filamentId, and platformId are required.",
    });
  }

  try {
    const orderPayload = buildOrderPayload({
      fileName,
      quantity,
      contact,
      shipping,
      publicFileServiceId,
      filamentId,
      platformId,
      itemName,
      sku,
      metadata,
    });
    const response = await slantRequest({
      endpoint: "/orders",
      apiKey,
      payload: orderPayload,
    });
    const baseAmount = extractQuoteBaseAmount(response.data);
    const serviceCharge = computeServiceCharge(baseAmount);

    try {
      await db.collection("slant3dQuotes").add({
        fileName,
        quantity,
        publicFileServiceId,
        filamentId,
        platformId,
        response: response.data,
        serviceCharge,
        createdAt: new Date().toISOString(),
      });
    } catch (storageError) {
      console.warn("Failed to store Slant 3D quote", storageError);
    }

    return res.status(200).json({
      success: true,
      result: {
        ...response.data,
        serviceCharge,
      },
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to create Slant 3D order draft.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

// Fetch available filament options for the picker UI.
router.get("/filaments", async (req, res) => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Slant 3D API key is not configured on the server.",
    });
  }

  try {
    const response = await slantRequest({
      endpoint: "/filaments",
      apiKey,
      payload: null,
      method: "get",
    });

    return res.status(200).json({
      success: true,
      result: response.data,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch Slant 3D filaments.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

// Server-side file upload: Slant downloads the STL from a public URL.
router.post("/files/upload", async (req, res) => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Slant 3D API key is not configured on the server.",
    });
  }

  const { fileUrl, fileName, platformId, ownerId } = req.body || {};
  const normalizedUrl = typeof fileUrl === "string" ? fileUrl.trim() : "";
  const normalizedName = typeof fileName === "string" ? fileName.trim() : "";

  if (!normalizedUrl || !normalizedName || !platformId) {
    return res.status(400).json({
      success: false,
      message: "fileUrl, fileName, and platformId are required to upload a file.",
    });
  }

  try {
    const payload = {
      url: normalizedUrl,
      fileURL: normalizedUrl,
      downloadURL: normalizedUrl,
      name: normalizedName,
      platformId,
      ownerId: ownerId || undefined,
    };

    const response = await slantRequest({
      endpoint: SLANT3D_FILE_UPLOAD_PATH,
      apiKey,
      payload,
    });

    try {
      await db.collection("slant3dFiles").add({
        fileUrl,
        fileName,
        platformId,
        ownerId: ownerId || null,
        response: response.data,
        createdAt: new Date().toISOString(),
      });
    } catch (storageError) {
      console.warn("Failed to store Slant 3D file upload", storageError);
    }

    return res.status(200).json({
      success: true,
      result: response.data,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to upload file to Slant 3D.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

// Creates and processes an order, or processes an existing publicOrderId.
router.post("/order", async (req, res) => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Slant 3D API key is not configured on the server.",
    });
  }

  const {
    fileName,
    quantity = 1,
    shipping = null,
    contact = null,
    publicFileServiceId = null,
    filamentId = null,
    platformId = null,
    itemName = null,
    sku = null,
    metadata = null,
    publicOrderId = null,
  } = req.body || {};

  try {
    let orderResponse = null;
    let processResponse = null;

    if (publicOrderId) {
      processResponse = await slantRequest({
        endpoint: `/orders/${publicOrderId}`,
        apiKey,
        payload: {},
        method: "post",
      });
    } else {
      if (!fileName) {
        return res.status(400).json({
          success: false,
          message: "fileName is required to place an order.",
        });
      }

      if (!publicFileServiceId || !filamentId || !platformId) {
        return res.status(400).json({
          success: false,
          message: "publicFileServiceId, filamentId, and platformId are required.",
        });
      }

      const contactInfo = normalizeAddress(contact || {});
      const shipTo = normalizeAddress(shipping || {}, contactInfo);
      const requiredAddress = ["street", "city", "state", "zip", "country"];
      const missingContact = ["name", "email"].filter(
        (key) => !String(contactInfo[key] || "").trim(),
      );
      const missingShipping = requiredAddress.filter(
        (key) => !String(shipTo[key] || "").trim(),
      );

      if (missingContact.length || missingShipping.length) {
        return res.status(400).json({
          success: false,
          message: `Missing contact/shipping fields: ${[
            ...missingContact.map((key) => `contact.${key}`),
            ...missingShipping.map((key) => `shipping.${key}`),
          ].join(", ")}`,
        });
      }

      const orderPayload = buildOrderPayload({
        fileName,
        quantity,
        contact,
        shipping,
        publicFileServiceId,
        filamentId,
        platformId,
        itemName,
        sku,
        metadata,
      });

      orderResponse = await slantRequest({
        endpoint: "/orders",
        apiKey,
        payload: orderPayload,
      });

      const publicId =
        orderResponse?.data?.order?.publicId ||
        orderResponse?.data?.publicId ||
        null;

      if (!publicId) {
        return res.status(502).json({
          success: false,
          message: "Slant 3D did not return a public order id.",
        });
      }

      processResponse = await slantRequest({
        endpoint: `/orders/${publicId}`,
        apiKey,
        payload: {},
        method: "post",
      });
    }

    try {
      await db.collection("slant3dOrders").add({
        fileName,
        quantity,
        shipping,
        contact,
        publicFileServiceId,
        filamentId,
        platformId,
        order: orderResponse?.data || null,
        processed: processResponse?.data || null,
        createdAt: new Date().toISOString(),
      });
    } catch (storageError) {
      console.warn("Failed to store Slant 3D order", storageError);
    }

    return res.status(201).json({
      success: true,
      result: {
        order: orderResponse?.data || null,
        processed: processResponse?.data || null,
      },
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to create Slant 3D order.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

export default router;
