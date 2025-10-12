/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate, useLocation } from "react-router-dom";
import state from "../store";
import { reader } from "../config/config/helpers";

import cartLogo from "../assets/assets/cartLogo.png";
import downloadIcon from "../assets/assets/download.png";

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

  // 🔒 Always show the customizer when this route mounts
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
  const [count, setCount] = useState(0);
  const [generatingImg, setGeneratingImg] = useState(false);

  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState(() => ({
    ...DEFAULT_FILTER_STATE,
  }));
  const [activeModelTab, setActiveModelTab] = useState({
    shirt: snap.activeModel === "shirt",
    hoodie: snap.activeModel === "hoodie",
    boot: snap.activeModel === "boot",
    sneaker: snap.activeModel === "sneaker",
  });

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

  const handleDownload = () => {
    console.log("Handle Download");
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
      case "aipicker":
        return (
          <AiPicker
            prompt={prompt}
            setPrompt={setPrompt}
            generatingImg={generatingImg}
            handleSubmit={handleSubmit}
          />
        );
      default:
        return null;
    }
  };

  // ----- AI image submit -----
  const handleSubmit = async (type) => {
    if (!prompt) return alert("Please enter a prompt");
    try {
      setGeneratingImg(true);
      const response = await fetch("http://localhost:8080/api/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      // NOTE: your API field names looked inconsistent; adjust as needed
      if (typeof data.photo === "string" && data.photo.trim()) {
        handleDecals(type, data.photo);                  // or data.photoData if that’s correct
      } else {
        throw new Error("Invalid or empty photo data in the response");
      }
    } catch (error) {
      alert(error);
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab("");
    }
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
    state.activeModel = tabName;
    setActiveModelTab((prev) => {
      const updated = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === tabName;
        return acc;
      }, {});
      return { ...prev, ...updated };
    });
  };

  const readFile = (type) => {
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("");
    });
  };

  const handleAddCartClick = () => {
    setCount((prev) => prev + 1);
  };

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
              <div className="editortabs-container tabs">
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
                {count}
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

          {/* Add to Cart - desktop */}
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
                  {count > 0 && (
                    <span className="absolute -top-1 -right-2 inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                      {count}
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
          <motion.div
            className="filtertabs-container md:bottom-5 bottom-24"
            {...slideAnimation("up")}
          >
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
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-4">
            <div className="carousel-container">
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
            <div className="md:hidden">
              <CustomButton
                type="filled"
                title="Add to Cart"
                handleClick={handleAddCartClick}
                customStyles="flex-none px-6 py-2 text-sm font-bold shadow-md"
              />
            </div>
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
