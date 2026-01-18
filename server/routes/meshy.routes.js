import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "crypto";
import { firebase_admin } from "../utils/firebase.js";

const router = express.Router();
const execFileAsync = promisify(execFile);
const STL_TTL_MS = 60 * 60 * 1000;
const stlCache = new Map();

const cleanupStlCache = async () => {
  const now = Date.now();
  const deletions = [];
  for (const [id, entry] of stlCache.entries()) {
    if (now - entry.createdAt > STL_TTL_MS) {
      stlCache.delete(id);
      deletions.push(entry);
    }
  }
  await Promise.all(
    deletions.map(async (entry) => {
      if (entry.stlPath) {
        try {
          await fs.unlink(entry.stlPath);
        } catch (error) {
          console.warn("Failed to remove STL file", error);
        }
      }
      if (entry.glbPath) {
        try {
          await fs.unlink(entry.glbPath);
        } catch (error) {
          console.warn("Failed to remove GLB file", error);
        }
      }
    }),
  );
};

router.post("/text-to-3d", async (req, res) => {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Meshy API key is not configured on the server.",
    });
  }

  const {
    prompt,
    art_style,
    seed,
    ai_model,
    topology,
    target_polycount,
    should_remesh,
    symmetry_mode,
    pose_mode,
    is_a_t_pose,
    moderation,
  } = req.body || {};

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      message: "Prompt is required to generate a 3D model.",
    });
  }

  const payload = {
    mode: "preview",
    prompt: prompt.trim(),
  };

  const optionMap = {
    art_style,
    seed,
    ai_model,
    topology,
    target_polycount,
    should_remesh,
    symmetry_mode,
    pose_mode,
    is_a_t_pose,
    moderation,
  };

  Object.entries(optionMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      payload[key] = value;
    }
  });

  try {
    const response = await axios.post(
      "https://api.meshy.ai/openapi/v2/text-to-3d",
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

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
      "Failed to create Meshy text-to-3D task.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

router.get("/text-to-3d/:taskId", async (req, res) => {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Meshy API key is not configured on the server.",
    });
  }

  const { taskId } = req.params;
  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: "Task ID is required.",
    });
  }

  try {
    const response = await axios.get(
      `https://api.meshy.ai/openapi/v2/text-to-3d/${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

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
      "Failed to fetch Meshy task status.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

router.get("/text-to-3d/:taskId/stl", async (req, res) => {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Meshy API key is not configured on the server.",
    });
  }

  const { taskId } = req.params;
  if (!taskId) {
    return res.status(400).json({
      success: false,
      message: "Task ID is required.",
    });
  }

  try {
    const response = await axios.get(
      `https://api.meshy.ai/openapi/v2/text-to-3d/${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const assets = Array.isArray(response.data?.assets)
      ? response.data.assets
      : [];
    const stlAsset = assets.find((asset) => {
      const type = String(asset?.type || "").toLowerCase();
      const url = String(asset?.url || "").toLowerCase();
      return type.includes("stl") || url.endsWith(".stl");
    });

    if (!stlAsset?.url) {
      return res.status(404).json({
        success: false,
        message: "No STL asset is available for this task yet.",
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        url: stlAsset.url,
        asset: stlAsset,
      },
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch Meshy STL asset.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

router.post("/convert/glb-to-stl", async (req, res) => {
  const { glbUrl } = req.body || {};
  if (!glbUrl || typeof glbUrl !== "string") {
    return res.status(400).json({
      success: false,
      message: "glbUrl is required to convert a GLB file.",
    });
  }

  const normalizedUrl = glbUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    return res.status(400).json({
      success: false,
      message: "glbUrl must be an http(s) URL.",
    });
  }

  await cleanupStlCache();

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    firebase_admin.app().options.storageBucket;
  if (!bucketName) {
    return res.status(500).json({
      success: false,
      message: "FIREBASE_STORAGE_BUCKET is not configured on the server.",
    });
  }

  const id = crypto.randomUUID();
  const glbPath = path.join(os.tmpdir(), `meshy-${id}.glb`);
  const stlPath = path.join(os.tmpdir(), `meshy-${id}.stl`);

  try {
    const response = await axios.get(normalizedUrl, { responseType: "arraybuffer" });
    await fs.writeFile(glbPath, response.data);
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Failed to download the GLB file.",
      details: error.message || String(error),
    });
  }

  try {
    await execFileAsync("assimp", ["export", glbPath, stlPath, "-f", "stl"]);
  } catch (error) {
    const code = error?.code || "";
    const message =
      code === "ENOENT"
        ? "STL conversion requires the 'assimp' CLI installed on the server."
        : "Failed to convert GLB to STL.";
    return res.status(500).json({
      success: false,
      message,
      details: error.message || String(error),
    });
  }

  const bucket = firebase_admin.storage().bucket(bucketName);
  const storagePath = `meshy/conversions/${id}.stl`;

  try {
    await bucket.upload(stlPath, {
      destination: storagePath,
      contentType: "model/stl",
      metadata: {
        cacheControl: "public, max-age=3600",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload STL to Firebase Storage.",
      details: error.message || String(error),
    });
  } finally {
    try {
      await fs.unlink(stlPath);
    } catch (error) {
      console.warn("Failed to remove STL file", error);
    }
    try {
      await fs.unlink(glbPath);
    } catch (error) {
      console.warn("Failed to remove GLB file", error);
    }
  }

  stlCache.set(id, { storagePath, createdAt: Date.now() });

  const [signedUrl] = await bucket.file(storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json({
    success: true,
    result: {
      id,
      url: signedUrl,
      downloadPath: `/api/v1/meshy/convert/glb-to-stl/${id}`,
    },
  });
});

router.get("/convert/glb-to-stl/:id", async (req, res) => {
  const { id } = req.params || {};
  if (!id || !stlCache.has(id)) {
    return res.status(404).json({
      success: false,
      message: "Converted STL file not found or expired.",
    });
  }

  await cleanupStlCache();
  const entry = stlCache.get(id);
  if (!entry) {
    return res.status(404).json({
      success: false,
      message: "Converted STL file not found or expired.",
    });
  }

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    firebase_admin.app().options.storageBucket;
  if (!bucketName) {
    return res.status(500).json({
      success: false,
      message: "FIREBASE_STORAGE_BUCKET is not configured on the server.",
    });
  }

  const bucket = firebase_admin.storage().bucket(bucketName);
  const [signedUrl] = await bucket.file(entry.storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60 * 1000,
  });

  return res.redirect(signedUrl);
});

router.get("/proxy", async (req, res) => {
  const { url } = req.query || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({
      success: false,
      message: "Missing url query parameter.",
    });
  }

  const normalized = url.trim();
  if (!/^https:\/\/assets\.meshy\.ai\//i.test(normalized)) {
    return res.status(400).json({
      success: false,
      message: "Only Meshy asset URLs are allowed.",
    });
  }

  try {
    const response = await axios.get(normalized, {
      responseType: "stream",
    });

    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "model/gltf-binary",
    );
    res.setHeader("Cache-Control", "public, max-age=3600");
    response.data.pipe(res);
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to proxy Meshy asset.";
    res.status(status).json({ success: false, message });
  }
});

router.post("/text-to-3d/refine", async (req, res) => {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Meshy API key is not configured on the server.",
    });
  }

  const {
    preview_task_id,
    texture_prompt,
    texture_image_url,
    enable_pbr,
  } = req.body || {};

  if (!preview_task_id) {
    return res.status(400).json({
      success: false,
      message: "preview_task_id is required to refine a Meshy task.",
    });
  }

  const payload = {
    mode: "refine",
    preview_task_id,
  };

  const optionMap = {
    texture_prompt,
    texture_image_url,
    enable_pbr,
  };

  Object.entries(optionMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      payload[key] = value;
    }
  });

  try {
    const response = await axios.post(
      "https://api.meshy.ai/openapi/v2/text-to-3d",
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

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
      "Failed to create Meshy refine task.";

    return res.status(status).json({
      success: false,
      message,
      details: error.response?.data || null,
    });
  }
});

export default router;
