/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate, useLocation } from "react-router-dom";
import state from "../store";
import { reader } from "../config/config/helpers";

import cartLogo from "../assets/assets/cartLogo.png";

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
} from "../components/index.js";
import ScalingControls from "../components/ScalingControls.jsx";

const STORAGE_KEY = "customizer_payload";

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
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  });
  const [activeModelTab, setActiveModelTab] = useState({
    shirt: snap.activeModel === "shirt",
    hoodie: snap.activeModel === "hoodie",
    boot: snap.activeModel === "boot",
    sneaker: snap.activeModel === "sneaker",
  });

  // Reset scale when model changes
  useEffect(() => {
    switch (snap.activeModel) {
      case "shirt":
      case "hoodie":
      case "boot":
      case "sneaker":
      default:
        state.modelScale = { x: 1, y: 1, z: 1 };
    }
  }, [snap.activeModel]);

  const handleBackNavigation = () => {
    state.intro = true;
    navigate("/home");
  };

  const handleCartNavigation = () => {
    state.intro = true;
    navigate("/cart");
  };

  // ----- Tabs -----
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "scaling":
        return <ScalingControls />;
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
    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab);
    }
  };

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
        state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }
    setActiveFilterTab((prev) => ({ ...prev, [tabName]: !prev[tabName] }));
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
                    handleClick={() => setActiveEditorTab(tab.name)}
                  />
                ))}
                {generateTabContent()}
              </div>
            </div>
          </motion.div>

          {/* Cart button + badge */}
          <div className="fixed top-5 right-40 flex space-x-4">
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

          {/* Back */}
          <motion.div className="absolute z-10 top-5 right-5" {...fadeAnimation}>
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={handleBackNavigation}
              customStyles="w=fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>

          {/* Add to Cart */}
          <CustomButton
            type="filled"
            title="Add to Cart"
            handleAddCartClick={() => console.log("Add to Cart")}
            customStyles="py-2 px-4 font-bold text-sm fixed bottom-5 right-40 bg-blue-600 text-white z-50"
            handleClick={handleAddCartClick}
          />

          {/* Download */}
          <CustomButton
            type="filled"
            title="Download"
            handleClick={() => console.log("Handle Download")}
            customStyles="py-2 px-4 font-bold text-sm fixed bottom-5 right-5"
          />

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
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
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
          </div>

          
        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;
