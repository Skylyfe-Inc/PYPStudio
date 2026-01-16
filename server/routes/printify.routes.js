import { Router } from "express";
import { printifyGet } from "../utils/printify.js";

const router = Router();

router.get("/catalog/blueprints", async (_req, res) => {
  try {
    const data = await printifyGet("/catalog/blueprints.json");
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch Printify blueprints",
      error: error.payload || null,
    });
  }
});

router.get("/catalog/blueprints/:blueprintId", async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const data = await printifyGet(`/catalog/blueprints/${blueprintId}.json`);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch Printify blueprint",
      error: error.payload || null,
    });
  }
});

router.get("/catalog/blueprints/:blueprintId/providers", async (req, res) => {
  try {
    const { blueprintId } = req.params;
    const data = await printifyGet(
      `/catalog/blueprints/${blueprintId}/print_providers.json`,
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch Printify providers",
      error: error.payload || null,
    });
  }
});

router.get(
  "/catalog/blueprints/:blueprintId/providers/:providerId/variants",
  async (req, res) => {
    try {
      const { blueprintId, providerId } = req.params;
      const data = await printifyGet(
        `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || "Failed to fetch Printify variants",
        error: error.payload || null,
      });
    }
  },
);

router.get(
  "/catalog/blueprints/:blueprintId/providers/:providerId/shipping",
  async (req, res) => {
    try {
      const { blueprintId, providerId } = req.params;
      const data = await printifyGet(
        `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`,
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(error.status || 500).json({
        message: error.message || "Failed to fetch Printify shipping",
        error: error.payload || null,
      });
    }
  },
);

router.get("/catalog/print-providers", async (_req, res) => {
  try {
    const data = await printifyGet("/catalog/print_providers.json");
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch Printify print providers",
      error: error.payload || null,
    });
  }
});

router.get("/catalog/print-providers/:providerId", async (req, res) => {
  try {
    const { providerId } = req.params;
    const data = await printifyGet(
      `/catalog/print_providers/${providerId}.json`,
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Failed to fetch Printify print provider",
      error: error.payload || null,
    });
  }
});

export default router;
