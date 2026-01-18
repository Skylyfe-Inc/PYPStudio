import { Router } from "express";
import axios from "axios";
import { db } from "../utils/firebase.js";

const router = Router();

const SLANT3D_BASE_URL =
  process.env.SLANT3D_API_BASE || "https://api.slant3d.com/api";

const resolveApiKey = () =>
  process.env.SLANT_3D_API_KEY || process.env.SLANT3D_API_KEY;

const isStlFile = (fileUrl, fileName) => {
  const url = (fileUrl || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  return url.endsWith(".stl") || name.endsWith(".stl");
};

const buildLineItem = ({
  fileUrl,
  fileName,
  quantity,
  color,
  material,
}) => ({
  filename: fileName,
  fileURL: fileUrl,
  order_item_name: fileName || "3D Model",
  order_quantity: String(quantity),
  order_item_color: color,
  profile: material,
});

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

const buildOrderPayload = ({
  fileUrl,
  fileName,
  quantity,
  color,
  material,
  shipping,
  contact,
  billing,
}) => {
  const contactInfo = normalizeAddress(contact || {});
  const shipTo = normalizeAddress(shipping || {}, contactInfo);
  const billTo = normalizeAddress(billing || shipping || {}, contactInfo);
  const lineItem = buildLineItem({
    fileUrl,
    fileName,
    quantity,
    color,
    material,
  });

  return [
    {
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      filename: fileName,
      fileURL: fileUrl,
      bill_to_name: billTo.name,
      bill_to_email: billTo.email,
      bill_to_phone: billTo.phone,
      bill_to_street_1: billTo.street,
      bill_to_city: billTo.city,
      bill_to_state: billTo.state,
      bill_to_zip: billTo.zip,
      bill_to_country_as_iso: billTo.country,
      bill_to_is_US_residential: String(billTo.isUSResidential),
      ship_to_name: shipTo.name,
      ship_to_email: shipTo.email,
      ship_to_phone: shipTo.phone,
      ship_to_street_1: shipTo.street,
      ship_to_city: shipTo.city,
      ship_to_state: shipTo.state,
      ship_to_zip: shipTo.zip,
      ship_to_country_as_iso: shipTo.country,
      ship_to_is_US_residential: String(shipTo.isUSResidential),
      order_item_name: lineItem.order_item_name,
      order_quantity: lineItem.order_quantity,
      order_item_color: lineItem.order_item_color,
      profile: lineItem.profile,
    },
  ];
};

const slantRequest = async ({ endpoint, apiKey, payload }) => {
  return axios.post(`${SLANT3D_BASE_URL}${endpoint}`, payload, {
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
  });
};

router.post("/quote", async (req, res) => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Slant 3D API key is not configured on the server.",
    });
  }

  const {
    fileUrl,
    fileName,
    material = "PLA",
    color = "black",
    quantity = 1,
  } = req.body || {};

  if (!fileUrl || !fileName) {
    return res.status(400).json({
      success: false,
      message: "fileUrl and fileName are required to request a quote.",
    });
  }

  if (!isStlFile(fileUrl, fileName)) {
    return res.status(400).json({
      success: false,
      message: "Only STL files are supported for Slant 3D quotes.",
    });
  }

  try {
    const lineItem = buildLineItem({
      fileUrl,
      fileName,
      quantity,
      color,
      material,
    });
    const response = await slantRequest({
      endpoint: "/order/estimate",
      apiKey,
      payload: [lineItem],
    });

    try {
      await db.collection("slant3dQuotes").add({
        fileUrl,
        fileName,
        material,
        color,
        quantity,
        response: response.data,
        createdAt: new Date().toISOString(),
      });
    } catch (storageError) {
      console.warn("Failed to store Slant 3D quote", storageError);
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
      "Failed to fetch Slant 3D quote.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

router.post("/order", async (req, res) => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Slant 3D API key is not configured on the server.",
    });
  }

  const {
    fileUrl,
    fileName,
    material = "PLA",
    color = "black",
    quantity = 1,
    shipping = null,
    contact = null,
    billing = null,
  } = req.body || {};

  if (!fileUrl || !fileName) {
    return res.status(400).json({
      success: false,
      message: "fileUrl and fileName are required to place an order.",
    });
  }

  if (!isStlFile(fileUrl, fileName)) {
    return res.status(400).json({
      success: false,
      message: "Only STL files are supported for Slant 3D orders.",
    });
  }

  try {
    const orderPayload = buildOrderPayload({
      fileUrl,
      fileName,
      quantity,
      color,
      material,
      shipping,
      contact,
      billing,
    });
    const [orderEntry] = orderPayload;
    const requiredFields = [
      "bill_to_street_1",
      "bill_to_city",
      "bill_to_state",
      "bill_to_zip",
      "bill_to_country_as_iso",
      "ship_to_street_1",
      "ship_to_city",
      "ship_to_state",
      "ship_to_zip",
      "ship_to_country_as_iso",
    ];
    const missing = requiredFields.filter((key) => !orderEntry?.[key]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required shipping/billing fields: ${missing.join(", ")}`,
      });
    }
    const response = await slantRequest({
      endpoint: "/order",
      apiKey,
      payload: orderPayload,
    });

    try {
      await db.collection("slant3dOrders").add({
        fileUrl,
        fileName,
        material,
        color,
        quantity,
        shipping,
        contact,
        billing,
        response: response.data,
        createdAt: new Date().toISOString(),
      });
    } catch (storageError) {
      console.warn("Failed to store Slant 3D order", storageError);
    }

    return res.status(201).json({
      success: true,
      result: response.data,
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
