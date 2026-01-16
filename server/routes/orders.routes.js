import { Router } from "express";
import { firebase_admin, db } from "../utils/firebase.js";

const router = Router();

const resolveUser = async (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    return await firebase_admin.auth().verifyIdToken(token);
  } catch (error) {
    console.warn("Order draft auth failed", error?.message || error);
    return null;
  }
};

router.post("/draft", async (req, res) => {
  try {
    const user = await resolveUser(req);
    const {
      items = [],
      shippingAddress = null,
      totals = null,
      provider = null,
      selection = null,
      design = null,
      metadata = null,
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Draft requires items" });
    }

    const now = new Date().toISOString();
    const draft = {
      status: "draft",
      items,
      shippingAddress,
      totals,
      provider,
      selection,
      design,
      metadata,
      createdAt: now,
      updatedAt: now,
      user: user
        ? { uid: user.uid, email: user.email || null }
        : null,
    };

    const docRef = await db.collection("orderDrafts").add(draft);
    return res.status(201).json({ id: docRef.id, ...draft });
  } catch (error) {
    console.error("Failed to create order draft", error);
    return res.status(500).json({
      message: "Failed to create order draft",
      error: error.message,
    });
  }
});

router.get("/draft/:id", async (req, res) => {
  try {
    const docRef = db.collection("orderDrafts").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: "Draft not found" });
    }
    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Failed to fetch order draft", error);
    return res.status(500).json({
      message: "Failed to fetch order draft",
      error: error.message,
    });
  }
});

export default router;
