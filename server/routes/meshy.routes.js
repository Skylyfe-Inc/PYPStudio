import express from "express";
import axios from "axios";

const router = express.Router();

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

export default router;
