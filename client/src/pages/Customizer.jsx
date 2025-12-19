/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate, useLocation } from "react-router-dom";
import state from "../store";
import { reader, captureCanvasImage, downloadCanvasToImage } from "../config/config/helpers";

import cartLogo from "../assets/assets/cartLogo.png";
import downloadIcon from "../assets/assets/download.png";
import shirtIcon3D from "../assets/assets/3d-shirt-icon.png";
import hoodieIcon3D from "../assets/assets/3d-hoodie-icon.png";
import bootIcon3D from "../assets/assets/3d-boot-icon.png";
import sneakerIcon3D from "../assets/assets/3d-sneaker-icon.png";

import {
  EditorTabs,
  FilterTabs,
  DecalTypes,
  CarouselTabs,
} from "../config/config/constants";
import { fadeAnimation, slideAnimation } from "../config/config/motion";
import {
  AiPicker,
  ColorPicker,
  CustomButton,
  FilePicker,
  Tab,
  RotationControl,
} from "../components/index.js";

const STORAGE_KEY = "customizer_payload";

const DEFAULT_FILTER_STATE = {
  logoShirt: true,
  stylishShirt: false,
  logoBack: false,
  stylishBack: false,
};

const FILTER_CONFIG = {
  logoShirt: { boolKey: "isLogoTexture", decalKey: "logo" },
  stylishShirt: { boolKey: "isFullTexture", decalKey: "full" },
  logoBack: { boolKey: "isBackLogoTexture", decalKey: "backLogo" },
  stylishBack: { boolKey: "isBackFullTexture", decalKey: "backFull" },
};

const DECAL_KEY_ORDER = ["logo", "full", "backLogo", "backFull"];

const DECAL_KEY_TO_TAB = {
  logo: "logoShirt",
  full: "stylishShirt",
  backLogo: "logoBack",
  backFull: "stylishBack",
};

const ACTIVE_DECAL_LABELS = {
  logo: "Front Logo",
  full: "Front Full",
  backLogo: "Back Logo",
  backFull: "Back Full",
};

const MODEL_DISPLAY_NAMES = {
  shirt: "Custom Shirt",
  hoodie: "Custom Hoodie",
  boot: "Custom Boot",
  sneaker: "Custom Sneaker",
};

const MODEL_BASE_PRICING = {
  shirt: 44.99,
  hoodie: 64.99,
  boot: 84.99,
  sneaker: 74.99,
};

const MODEL_PLACEHOLDERS = {
  shirt: shirtIcon3D,
  hoodie: hoodieIcon3D,
  boot: bootIcon3D,
  sneaker: sneakerIcon3D,
};

const computeDesignSignature = (snap) => {
  const safeValue = (value) =>
    typeof value === "string" ? value : value ? JSON.stringify(value) : "";

  const toggles = {
    isLogoTexture: !!snap.isLogoTexture,
    isFullTexture: !!snap.isFullTexture,
    isBackLogoTexture: !!snap.isBackLogoTexture,
    isBackFullTexture: !!snap.isBackFullTexture,
  };

  const decals = {
    logo: safeValue(snap.logoDecal),
    full: safeValue(snap.fullDecal),
    backLogo: safeValue(snap.backLogoDecal),
    backFull: safeValue(snap.backFullDecal),
  };

  return JSON.stringify({
    model: snap.activeModel || "shirt",
    color: snap.color || "#000000",
    toggles,
    decals,
  });
};

const DEFAULT_EXPECTED_AI_COUNT = 6;
const API_BASE_URL = "http://localhost:8080";

const AI_TYPE_DETAILS = {
  logo: { placement: "front", coverage: "logo" },
  full: { placement: "front", coverage: "full" },
  backLogo: { placement: "back", coverage: "logo" },
  backFull: { placement: "back", coverage: "full" },
};

const encodeAiType = (placement, coverage) => {
  if (placement === "back") {
    return coverage === "logo" ? "backLogo" : "backFull";
  }
  return coverage === "logo" ? "logo" : "full";
};

const decodeAiType = (type) =>
  AI_TYPE_DETAILS[type] || { placement: "front", coverage: "logo" };

const getDefaultDecalScales = () => ({
  logo: { x: 1, y: 1, z: 1 },
  full: { x: 1, y: 1, z: 1 },
  backLogo: { x: 1, y: 1, z: 1 },
  backFull: { x: 1, y: 1, z: 1 },
});

const getDefaultDecalOffsets = () => ({
  logo: { x: 0, y: 0, z: 0 },
  full: { x: 0, y: 0, z: 0 },
  backLogo: { x: 0, y: 0, z: 0 },
  backFull: { x: 0, y: 0, z: 0 },
});

const computeFallbackDecalKey = (tabState) => {
  for (const key of DECAL_KEY_ORDER) {
    const tab = DECAL_KEY_TO_TAB[key];
    if (tabState[tab]) return key;
  }
  return "";
};

const Customizer = () => {
  const navigate = useNavigate();
  const { state: navState } = useLocation();            // NEW: get state from navigate()
  const snap = useSnapshot(state);

  // Always show the customizer when this route mounts
  useEffect(() => {
    state.intro = false;                                 // NEW: prevents white screen on revisit
  }, []);

  // Merge route state with a localStorage fallback so refresh/revisit won’t break
  const payload = useMemo(() => {                        // NEW: safe payload merge
    const defaults = { source: "unknown", email: "", companyName: "", companyAddress: "" };
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {}
    return { ...defaults, ...stored, ...(navState || {}) };
  }, [navState]);

  // Keep the latest payload persisted (optional but handy)
  useEffect(() => {                                      // NEW: persist newest payload
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
  }, [payload]);

  // --- existing local UI state ---
  const [file, setFile] = useState("");
  const [prompt, setPrompt] = useState("");
  const [meshPrompt, setMeshPrompt] = useState("");
  const [generatingImg, setGeneratingImg] = useState(false);
  const [aiResults, setAiResults] = useState([]);
  const [selectedAiImageId, setSelectedAiImageId] = useState(null);
  const [activeAiType, setActiveAiType] = useState(null);
  const [aiPlacement, setAiPlacement] = useState("front");
  const [aiCoverage, setAiCoverage] = useState("logo");
  const [aiExpectedCount, setAiExpectedCount] = useState(
    DEFAULT_EXPECTED_AI_COUNT,
  );
  const aiStreamRef = useRef(null);
  const aiImageCacheRef = useRef(new Map());
  const editorTabsRef = useRef(null);

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState(() => ({
    ...DEFAULT_FILTER_STATE,
  }));
  const [activeModelTab, setActiveModelTab] = useState({
    shirt: snap.activeModel === "shirt",
    hoodie: snap.activeModel === "hoodie",
    boot: snap.activeModel === "boot",
    sneaker: snap.activeModel === "sneaker",
    meshy: false,
  });
  const [isMeshyMode, setIsMeshyMode] = useState(false);
  const [meshyTask, setMeshyTask] = useState(null);
  const [meshyError, setMeshyError] = useState("");
  const [meshyLoading, setMeshyLoading] = useState(false);
  const meshyPollRef = useRef(null);
  const terminalMeshyStatuses = useMemo(
    () => ["succeeded", "failed", "canceled", "cancelled", "finished", "ready"],
    [],
  );

  const extractMeshyTask = (payload, fallbackStatus = "pending") => {
    if (!payload) return null;

    if (typeof payload === "string") {
      return { task_id: payload, status: fallbackStatus };
    }

    const directTask =
      payload?.result && typeof payload.result === "object"
        ? payload.result
        : payload;

    const taskId =
      payload?.task_id ||
      directTask?.task_id ||
      (typeof payload?.result === "string" ? payload.result : null);

    const status = directTask?.status || payload?.status || fallbackStatus;
    const nestedResult = directTask?.result || {};
    const assets =
      nestedResult?.assets || directTask?.assets || nestedResult?.outputs || [];
    const downloadUrl =
      nestedResult?.model_url ||
      nestedResult?.glb ||
      (Array.isArray(assets)
        ? assets.find((asset) => asset?.url && /glb|gltf/i.test(asset?.type || ""))?.url ||
          assets.find((asset) => asset?.url)?.url
        : null);

    return {
      task_id: taskId,
      status,
      assets,
      downloadUrl,
      raw: payload,
    };
  };

  // Reset scale when model changes
  const resetDecalTransforms = () => {
    const defaultTabs = { ...DEFAULT_FILTER_STATE };
    setActiveFilterTab(defaultTabs);

    state.isLogoTexture = defaultTabs.logoShirt;
    state.isFullTexture = defaultTabs.stylishShirt;
    state.isBackLogoTexture = defaultTabs.logoBack;
    state.isBackFullTexture = defaultTabs.stylishBack;

    state.modelScale = { x: 1, y: 1, z: 1 };
    state.decalScale = getDefaultDecalScales();
    state.decalOffset = getDefaultDecalOffsets();
    state.activeTool = "";
    state.manualRotation = { x: 0, y: 0, z: 0 };
    state.activeDecalKey = computeFallbackDecalKey(defaultTabs) || "logo";
  };

  useEffect(() => {
    resetDecalTransforms();
  }, []);

  useEffect(() => {
    resetDecalTransforms();
  }, [snap.activeModel]);

  useEffect(() => {
    return () => {
      if (meshyPollRef.current) {
        clearInterval(meshyPollRef.current);
        meshyPollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (aiStreamRef.current) {
        aiStreamRef.current.close();
        aiStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!editorTabsRef.current) {
        setActiveEditorTab("");
        state.activeTool = "";
        return;
      }
      if (editorTabsRef.current.contains(event.target)) return;
      setActiveEditorTab("");
      state.activeTool = "";
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const handleBackNavigation = () => {
    state.intro = true;
    navigate("/home");
  };

  const handleCartNavigation = () => {
    state.intro = true;
    navigate("/cart");
  };

  const handleCheckoutNavigation = () => {
    state.intro = true;
    navigate("/cart");
  };

  const handleProfileNavigation = () => {
    state.intro = true;
    navigate("/profile");
  };

  const handleDownload = async () => {
    console.debug("[Customizer] Download triggered");
    const promptMessage =
      "Choose download quality:\n1 - Standard (current resolution)\n2 - High (2x)\n3 - Ultra (3x)\nYou can also enter a custom scale value (e.g., 1.5).";
    const response = window.prompt(promptMessage, "1");
    if (response === null) return;

    const trimmed = response.trim();
    const quickMap = { "1": 1, "2": 2, "3": 3 };
    const parsed =
      quickMap[trimmed] ?? Number.parseFloat(trimmed.replace(/[^0-9.]/g, ""));
    const multiplier = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    const limitedMultiplier = Math.min(multiplier, 4); // prevent extreme values

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `pyp-design-${timestamp}`;

    console.debug("[Customizer] Requested download scale", {
      input: trimmed,
      parsedMultiplier: parsed,
      appliedMultiplier: limitedMultiplier,
    });

    const success = await downloadCanvasToImage({
      multiplier: limitedMultiplier,
      fileName,
      mimeType: "image/png",
    });

    if (!success) {
      alert("Unable to download the image right now. Please try again.");
      console.debug("[Customizer] Download failed");
    } else {
      console.debug("[Customizer] Download succeeded", { fileName });
    }
  };

  const handleAiPlacementChange = (placement) => {
    if (isMeshyMode) return;
    if (placement === aiPlacement) return;
    const nextType = encodeAiType(placement, aiCoverage);
    setAiPlacement(placement);
    handleSubmit(nextType, { reuseExisting: true });
  };

  // ----- Tabs -----
  const handleEditorTabClick = (tabName) => {
    const sameTab = activeEditorTab === tabName;
    const nextTab = sameTab ? "" : tabName;

    setActiveEditorTab(nextTab);

    if (nextTab === "move" || nextTab === "scale") {
      if (!state.activeDecalKey) {
        const fallback = computeFallbackDecalKey(activeFilterTab);
        if (fallback) state.activeDecalKey = fallback;
      }
      state.activeTool = nextTab;
    } else {
      state.activeTool = "";
    }
  };

  const normalizeImageSource = (image) => {
    if (!image) return "";

    const base64 = typeof image.base64 === "string" ? image.base64.trim() : "";
    const url = typeof image.url === "string" ? image.url.trim() : "";

    if (base64) {
      if (base64.startsWith("data:")) {
        return base64;
      }
      const mimeType =
        typeof image.mimeType === "string" && image.mimeType
          ? image.mimeType
          : "image/png";
      return `data:${mimeType};base64,${base64}`;
    }

    if (url) {
      return url;
    }

    return "";
  };

  const handleSelectAiImage = (image) => {
    if (!image) return;

    const cacheKey = activeAiType || encodeAiType(aiPlacement, aiCoverage);
    if (!cacheKey) return;

    const { placement, coverage } = decodeAiType(cacheKey);
    const imageId = image.id ?? null;
    const source = normalizeImageSource(image);

    setActiveAiType(cacheKey);
    setAiPlacement(placement);
    setAiCoverage(coverage);
    setSelectedAiImageId(imageId);

    const existing = aiImageCacheRef.current.get(cacheKey) || {};
    aiImageCacheRef.current.set(cacheKey, {
      ...existing,
      placement,
      coverage,
      selectedImageId: imageId,
    });

    if (source) {
      handleDecals(cacheKey, source);
    }
  };

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "move":
      case "scale": {
        const isMoveView = activeEditorTab === "move";
        const title = isMoveView ? "Move Artwork" : "Scale Artwork";
        const helper = isMoveView
          ? "Drag the overlay arrows to reposition your art."
          : "Use the handle or drag inside the box to resize.";
        return (
          <div className="move-scale-info">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-600">{helper}</p>
          </div>
        );
      }
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case "aipicker": {
        const aiMode = isMeshyMode ? "meshy" : "image";
        const currentAiType = encodeAiType(aiPlacement, aiCoverage);
        const currentAiLabel = isMeshyMode
          ? "Meshy Text to 3D"
          : ACTIVE_DECAL_LABELS[currentAiType] || "Front Logo";
        const activeAiLabel = isMeshyMode
          ? currentAiLabel
          : activeAiType
            ? ACTIVE_DECAL_LABELS[activeAiType]
            : currentAiLabel;
        return (
          <AiPicker
            mode={aiMode}
            prompt={aiMode === "meshy" ? meshPrompt : prompt}
            setPrompt={aiMode === "meshy" ? setMeshPrompt : setPrompt}
            generatingImg={aiMode === "meshy" ? meshyLoading : generatingImg}
            handleSubmit={handleSubmit}
            results={aiMode === "meshy" ? [] : aiResults}
            selectedImageId={aiMode === "meshy" ? null : selectedAiImageId}
            onSelectImage={aiMode === "meshy" ? undefined : handleSelectAiImage}
            onApply={aiMode === "meshy" ? undefined : handleApplySelectedImage}
            activeAiType={aiMode === "meshy" ? null : activeAiType}
            activeAiTypeLabel={activeAiLabel}
            currentType={aiMode === "meshy" ? null : currentAiType}
            currentTypeLabel={currentAiLabel}
            placement={aiPlacement}
            onPlacementChange={handleAiPlacementChange}
            coverage={aiCoverage}
            expectedCount={aiMode === "meshy" ? 0 : aiExpectedCount}
            onMeshySubmit={aiMode === "meshy" ? handleMeshySubmit : undefined}
            meshyLoading={meshyLoading}
            meshyTask={meshyTask}
            meshyError={meshyError}
          />
        );
      }
      default:
        return null;
    }
  };

  const startAiStream = (sessionId, type) => {
    if (!sessionId || !type) return;

    const { placement, coverage } = decodeAiType(type);

    const streamUrl = `${API_BASE_URL}/api/v1/images/generations/stream/${sessionId}`;

    if (aiStreamRef.current) {
      aiStreamRef.current.close();
      aiStreamRef.current = null;
    }

    const source = new EventSource(streamUrl);
    aiStreamRef.current = source;

    source.addEventListener("image", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        const { image } = payload || {};
        if (!image) return;

        setAiResults((prev) => {
          const previous = Array.isArray(prev) ? prev : [];
          const exists = previous.some((item) => item.id === image.id);
          if (exists) return previous;
          const next = [...previous, image];
          next.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
          aiImageCacheRef.current.set(type, {
            ...(aiImageCacheRef.current.get(type) || {}),
            placement,
            coverage,
            images: next,
          });
          return next;
        });

        setSelectedAiImageId((prevId) => {
          const entry = aiImageCacheRef.current.get(type) || {};
          const nextSelected =
            prevId || entry.selectedImageId || image.id || null;
          aiImageCacheRef.current.set(type, {
            ...entry,
            placement,
            coverage,
            selectedImageId: nextSelected,
          });
          return nextSelected;
        });
      } catch (err) {
        console.error("Failed to parse AI stream image payload", err);
      }
    });

    source.addEventListener("done", (event) => {
      if (event?.data) {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.total) {
            setAiExpectedCount(payload.total);
            const entry = aiImageCacheRef.current.get(type) || {};
            aiImageCacheRef.current.set(type, {
              ...entry,
              placement,
              coverage,
              expectedCount: payload.total,
            });
          }
        } catch (err) {
          console.error("Failed to parse AI stream completion payload", err);
        }
      }
      setGeneratingImg(false);
      source.close();
      aiStreamRef.current = null;
    });

    source.addEventListener("error", (event) => {
      if (source.readyState !== EventSource.CLOSED) {
        console.error("AI stream error", event);
      }
      setGeneratingImg(false);
      source.close();
      aiStreamRef.current = null;
    });
  };

  const handleMeshySubmit = async () => {
    const trimmedPrompt = (meshPrompt || "").trim();
    if (!trimmedPrompt) {
      alert("Please describe the 3D model you want to generate.");
      return;
    }

    setMeshyError("");
    if (meshyPollRef.current) {
      clearInterval(meshyPollRef.current);
      meshyPollRef.current = null;
    }
    setMeshyTask(null);
    setMeshyLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/meshy/text-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        const message = data?.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      const normalized = extractMeshyTask(data?.result ?? data, "pending");
      setMeshyTask(normalized);
    } catch (error) {
      setMeshyError(error instanceof Error ? error.message : String(error));
    } finally {
      setMeshyLoading(false);
    }
  };

  useEffect(() => {
    const taskId = meshyTask?.task_id;
    if (!taskId) {
      if (meshyPollRef.current) {
        clearInterval(meshyPollRef.current);
        meshyPollRef.current = null;
      }
      return;
    }

    const currentStatus = (meshyTask?.status || "").toLowerCase();
    if (terminalMeshyStatuses.includes(currentStatus)) {
      if (meshyPollRef.current) {
        clearInterval(meshyPollRef.current);
        meshyPollRef.current = null;
      }
      return;
    }

    const pollTaskStatus = async () => {
      try {
        const resp = await fetch(
          `${API_BASE_URL}/api/v1/meshy/text-to-3d/${encodeURIComponent(taskId)}`,
        );
        const data = await resp.json();
        if (!resp.ok || data?.success === false) {
          throw new Error(data?.message || `Status request failed with ${resp.status}`);
        }
        const normalized = extractMeshyTask(data?.result ?? data, meshyTask?.status);
        if (normalized) {
          setMeshyTask((prev) => ({
            ...(prev || {}),
            ...normalized,
          }));
        }
      } catch (error) {
        console.error("Meshy status polling failed", error);
        setMeshyError((prev) => prev || (error instanceof Error ? error.message : String(error)));
      }
    };

    pollTaskStatus();

    if (!meshyPollRef.current) {
      meshyPollRef.current = setInterval(pollTaskStatus, 5000);
    }

    return () => {
      if (meshyPollRef.current) {
        clearInterval(meshyPollRef.current);
        meshyPollRef.current = null;
      }
    };
  }, [meshyTask?.task_id, meshyTask?.status, terminalMeshyStatuses]);

  // ----- AI image submit -----
  const handleSubmit = async (type, options = {}) => {
    const { reuseExisting = false, force = false } = options;
    const { placement, coverage } = decodeAiType(type);
    const cached = aiImageCacheRef.current.get(type);
    const fallbackImages = cached?.images?.length ? cached.images : aiResults;
    const fallbackSelected = cached?.selectedImageId || selectedAiImageId || fallbackImages?.[0]?.id || null;
    const fallbackExpected = cached?.expectedCount || aiExpectedCount || DEFAULT_EXPECTED_AI_COUNT;

    if (reuseExisting && !force && fallbackImages?.length) {
      if (aiStreamRef.current) {
        aiStreamRef.current.close();
        aiStreamRef.current = null;
      }

      setAiPlacement(placement);
      setAiCoverage(coverage);
      setActiveAiType(type);
      setAiResults(fallbackImages);
      setSelectedAiImageId(fallbackSelected);
      setAiExpectedCount(fallbackExpected || DEFAULT_EXPECTED_AI_COUNT);
      setGeneratingImg(false);

      aiImageCacheRef.current.set(type, {
        placement,
        coverage,
        images: fallbackImages,
        expectedCount: fallbackExpected || fallbackImages.length || DEFAULT_EXPECTED_AI_COUNT,
        selectedImageId: fallbackSelected,
      });
      return;
    }

    if (reuseExisting && !fallbackImages?.length && !prompt) {
      setAiPlacement(placement);
      setAiCoverage(coverage);
      setActiveAiType(type);
      setGeneratingImg(false);
      return;
    }

    if (!prompt) {
      alert("Please enter a prompt to generate AI images");
      return;
    }

    if (aiStreamRef.current) {
      aiStreamRef.current.close();
      aiStreamRef.current = null;
    }

    setAiPlacement(placement);
    setAiCoverage(coverage);
    setAiResults([]);
    setSelectedAiImageId(null);
    setActiveAiType(type);
    setAiExpectedCount(DEFAULT_EXPECTED_AI_COUNT);
    setGeneratingImg(true);

    aiImageCacheRef.current.set(type, {
      placement,
      coverage,
      images: [],
      expectedCount: DEFAULT_EXPECTED_AI_COUNT,
      selectedImageId: null,
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          count: DEFAULT_EXPECTED_AI_COUNT,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || `HTTP error! Status: ${response.status}`,
        );
      }

      const { requestId, image, total } = data || {};

      if (!requestId || !image) {
        throw new Error("Invalid response from AI service");
      }

      const nextExpected = total || DEFAULT_EXPECTED_AI_COUNT;
      const initialImages = [image];

      setAiExpectedCount(nextExpected);
      setAiResults(initialImages);
      setSelectedAiImageId(image.id);

      aiImageCacheRef.current.set(type, {
        placement,
        coverage,
        images: initialImages,
        expectedCount: nextExpected,
        selectedImageId: image.id,
      });

      startAiStream(requestId, type);
    } catch (error) {
      setGeneratingImg(false);

      if (cached?.images?.length) {
        setAiResults(cached.images);
        setSelectedAiImageId(
          cached.selectedImageId || cached.images[0]?.id || null,
        );
        setAiExpectedCount(
          cached.expectedCount ||
            cached.images.length ||
            DEFAULT_EXPECTED_AI_COUNT,
        );
        aiImageCacheRef.current.set(type, cached);
      } else {
        setAiResults([]);
        setSelectedAiImageId(null);
        aiImageCacheRef.current.delete(type);
      }

      alert(error instanceof Error ? error.message : String(error));
    }
  };

  const handleApplySelectedImage = () => {
    if (!activeAiType) {
      alert("Select which decal to apply the image to.");
      return;
    }

    if (aiStreamRef.current) {
      aiStreamRef.current.close();
      aiStreamRef.current = null;
    }

    const selectedImage =
      aiResults.find((item) => item.id === selectedAiImageId) || aiResults[0];

    if (!selectedImage) {
      alert("No AI image selected.");
      return;
    }

    const source = normalizeImageSource(selectedImage);

    if (!source) {
      alert("Selected AI image does not include usable image data.");
      return;
    }

    if (activeAiType) {
      const entry = aiImageCacheRef.current.get(activeAiType) || {};
      aiImageCacheRef.current.set(activeAiType, {
        ...entry,
        selectedImageId: selectedAiImageId || selectedImage.id,
      });
    }

    handleDecals(activeAiType, source);
    setGeneratingImg(false);
    setActiveEditorTab("");
  };

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];
    state[decalType.stateProperty] = result;
    state.activeDecalKey = decalType.decalKey;
    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab);
    }
  };

  const handleActiveFilterTab = (tabName) => {
    const config = FILTER_CONFIG[tabName];
    if (!config) return;

    setActiveFilterTab((prev) => {
      const nextValue = !prev[tabName];
      const nextState = { ...prev, [tabName]: nextValue };

      state[config.boolKey] = nextValue;

      if (nextValue) {
        state.activeDecalKey = config.decalKey;
      } else if (state.activeDecalKey === config.decalKey) {
        state.activeDecalKey = computeFallbackDecalKey(nextState);
      }

      return nextState;
    });
  };

  const handleActiveModelTab = (tabName) => {
    if (tabName === "meshy") {
      setIsMeshyMode(true);
      setActiveModelTab((prev) => {
        const keys = new Set([...Object.keys(prev), "meshy"]);
        const updated = {};
        keys.forEach((key) => {
          updated[key] = key === "meshy";
        });
        return updated;
      });
      return;
    }

    setIsMeshyMode(false);
    state.activeModel = tabName;
    setActiveModelTab((prev) => {
      const keys = new Set([...Object.keys(prev), "meshy"]);
      const updated = {};
      keys.forEach((key) => {
        updated[key] = key === tabName ? true : false;
      });
      return updated;
    });
  };

  const readFile = (type) => {
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("");
    });
  };

  const cartCount = Array.isArray(snap.cartItems)
    ? snap.cartItems.reduce(
        (sum, item) =>
          sum + Math.max(0, typeof item.quantity === "number" ? item.quantity : 1),
        0,
      )
    : 0;

  const handleAddCartClick = () => {
    const modelKey = snap.activeModel || "shirt";
    const label = MODEL_DISPLAY_NAMES[modelKey] || "Custom Design";
    const price = MODEL_BASE_PRICING[modelKey] || MODEL_BASE_PRICING.shirt;
    const placeholder = MODEL_PLACEHOLDERS[modelKey] || shirtIcon3D;
    const capturedImage = captureCanvasImage();
    const designSignature = computeDesignSignature(snap);
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? `cart-${crypto.randomUUID()}`
      : `cart-${Date.now()}`;

    const existing = Array.isArray(state.cartItems) ? [...state.cartItems] : [];
    const matchIndex = existing.findIndex(
      (entry) => entry.designSignature === designSignature,
    );

    if (matchIndex !== -1) {
      const matchedItem = existing[matchIndex];
      const nextQuantity =
        Math.max(1, typeof matchedItem.quantity === "number" ? matchedItem.quantity : 1) +
        1;
      const nextThumbnail = capturedImage || matchedItem.thumbnail || placeholder;
      existing[matchIndex] = {
        ...matchedItem,
        quantity: nextQuantity,
        thumbnail: nextThumbnail,
      };
      state.cartItems = existing;
      return;
    }

    const newItem = {
      id,
      model: modelKey,
      name: label,
      price,
      quantity: 1,
      colorHex: snap.color,
      createdAt: new Date().toISOString(),
      thumbnail: capturedImage || placeholder,
      placeholder,
      decals: {
        logo: snap.logoDecal,
        full: snap.fullDecal,
        backLogo: snap.backLogoDecal,
        backFull: snap.backFullDecal,
      },
      toggles: {
        isLogoTexture: snap.isLogoTexture,
        isFullTexture: snap.isFullTexture,
        isBackLogoTexture: snap.isBackLogoTexture,
        isBackFullTexture: snap.isBackFullTexture,
      },
      designSignature,
    };

    state.cartItems = [...existing, newItem];
  };

  const isFloatingPanelActive =
    activeEditorTab === "aipicker" || activeEditorTab === "filepicker";
  const mobileCartWrapperClassName = [
    "md:hidden fixed left-1/2 -translate-x-1/2 bottom-20",
    isFloatingPanelActive
      ? "-z-10 pointer-events-none"
      : "z-30 pointer-events-auto",
  ].join(" ");

  return (
    <AnimatePresence>
      {/* This guard is why you saw white; mount effect forces intro=false */}
      {!snap.intro && (
        <>
          <motion.div
            key="custom"
            className="absolute top-0 left-0 z-10"
            {...slideAnimation("left")}
          >
            <div className="flex items-center min-h-screen">
              <div
                ref={editorTabsRef}
                className="editortabs-container tabs"
              >
                {EditorTabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    tab={tab}
                    isActiveTab={activeEditorTab === tab.name}
                    handleClick={() => handleEditorTabClick(tab.name)}
                  />
                ))}
                {generateTabContent()}
              </div>
            </div>
          </motion.div>

          {/* Cart button + badge - desktop */}
          <div className="hidden md:flex fixed top-5 right-40 space-x-4">
            <div className="relative">
              <CustomButton
                type="plain"
                customStyles="p-0 bg-transparent shadow-none hover:bg-transparent"
                imageSrc={cartLogo}
                alt="Cart Icon"
                handleClick={handleCartNavigation}
              />
              <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            </div>
          </div>

          {/* Back - desktop */}
          <motion.div
            className="hidden md:block absolute z-10 top-5 right-5"
            {...fadeAnimation}
          >
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={handleBackNavigation}
              customStyles="w=fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>

          {/* Add to Cart */}
          <div className="hidden md:block">
            <CustomButton
              type="filled"
              title="Add to Cart"
              handleAddCartClick={() => console.log("Add to Cart")}
              customStyles="py-2 px-4 font-bold text-sm fixed bottom-5 right-40 bg-blue-600 text-white z-50"
              handleClick={handleAddCartClick}
            />
          </div>

          {/* Download - desktop */}
          <div className="hidden md:block">
            <CustomButton
              type="filled"
              title="Download"
              handleClick={handleDownload}
              customStyles="py-2 px-4 font-bold text-sm fixed bottom-5 right-5"
            />
          </div>

          {/* Profile - desktop */}
          <div className="hidden md:flex fixed top-5 left-5 z-30">
            <button
              type="button"
              onClick={handleProfileNavigation}
              aria-label="Profile"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-900 bg-white/90 text-zinc-900 shadow-md transition-colors hover:bg-zinc-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                <path d="M4 20a8 8 0 0 1 16 0" />
              </svg>
            </button>
          </div>

          {/* Mobile action navbar */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-200 shadow-lg z-50">
            <div className="flex h-16">
              <button
                type="button"
                onClick={handleBackNavigation}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M3 11.5L12 4l9 7.5" />
                  <path d="M5 10.5V20h5v-5h4v5h5v-9.5" />
                </svg>
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={handleCartNavigation}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-gray-700"
              >
                <div className="relative">
                  <img
                    src={cartLogo}
                    alt="Add to Cart"
                    className="h-6 w-6 object-contain"
                  />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-2 inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span>Cart</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-gray-700"
              >
                <img
                  src={downloadIcon}
                  alt="Download"
                 className="h-6 w-6 object-contain"
                />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={handleProfileNavigation}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                  <path d="M4 20a8 8 0 0 1 16 0" />
                </svg>
                <span>Profile</span>
              </button>
              <button
                type="button"
                onClick={handleCheckoutNavigation}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Checkout</span>
              </button>
            </div>
          </nav>

          {/* Filter tabs */}
          <motion.div className="filtertabs-container" {...slideAnimation("up")}>
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() => handleActiveFilterTab(tab.name)}
              />
            ))}
          </motion.div>

          {/* Model carousel */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 top-20 md:top-0">
            <div className="carousel-container md:mt-0 mt-4">
              {CarouselTabs.map((tab) => (
                <Tab
                  key={tab.name}
                  tab={tab}
                  isFilterTab
                  isActiveTab={activeModelTab[tab.name]}
                  handleClick={() => handleActiveModelTab(tab.name)}
                />
              ))}
            </div>
          </div>

          {/* Add to Cart - mobile */}
          <div className={mobileCartWrapperClassName}>
            <CustomButton
              type="filled"
              title="Add to Cart"
              handleClick={handleAddCartClick}
              customStyles="px-8 py-2 text-sm font-bold shadow-lg"
            />
          </div>

          {/* Rotation control */}
          <div className="md:flex hidden fixed right-6 top-1/2 -translate-y-1/2 z-40">
            <RotationControl />
          </div>
          <div className="md:hidden fixed right-4 bottom-20 z-40">
            <RotationControl />
          </div>

        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;
