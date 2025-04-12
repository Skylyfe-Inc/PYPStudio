/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
// import config from "../config/config/config";
import state from "../store";
// import { download } from "../assets/assets";
import { reader } from "../config/config/helpers";
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
import { useNavigate } from "react-router-dom";
import ScalingControls from "../components/ScalingControls.jsx";


const Customizer = () => {
  const navigate = useNavigate();
  const snap = useSnapshot(state);
  //Set Image Generation
  const [file, setFile] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generatingImg, setGeneratingImg] = useState(false);
  //Set Editor Tab & Filter Tab
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
    // Set default scale based on active model
    switch (snap.activeModel) {
      case "shirt":
      case "hoodie":
        state.modelScale = { x: 1, y: 1, z: 1 };
        break;
      case "boot":
      case "sneaker":
        state.modelScale = { x: 1, y: 1, z: 1 };
        break;
      default:
        state.modelScale = { x: 1, y: 1, z: 1 };
    }
  }, [snap.activeModel]);


  const handleBackNavigation = () => {
    state.intro = true;
    navigate("/home");
  };

  //Show tab content depending on the activeTab
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
  //Handle Open AI API Calls
  const handleSubmit = async (type) => {
    if (!prompt) return alert("Please enter a prompt");
    try {
      // Call our backend to generate AI Images
      setGeneratingImg(true);
      const response = await fetch(
        "http://localhost:8080/api/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // console.log(data)
      // Check if data.photo is defined and not an empty string
      if (
        data.photo !== undefined &&
        data.photoData !== null &&
        typeof data.photo === "string" &&
        data.photo.trim() !== ""
      ) {
        handleDecals(type, data.photoData);
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
    // Get the decal type from the DecalTypes Object
    const decalType = DecalTypes[type];

    // Update the state with the result
    state[decalType.stateProperty] = result;

    // If the activeFilterTab does not have the decalType filterTab,
    // call the handleActiveFilterTab function with the decalType filterTab
    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab);
    }
  };

  const handleActiveFilterTab = (tabName) => {
    // This function will handle the active filter tab
    switch (tabName) {
      case "logoShirt":
        // if the tabName is logoShirt, then set the isLogoTexture to its opposite value
        state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
        // if the tabName is stylishShirt, then set the isFullTexture to its opposite value
        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        // if the tabName is neither logoShirt nor stylishShirt, then set isLogoTexture to true and isFullTexture to false
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }
    //setting the state, activeFilterTab is updated
    setActiveFilterTab((prevState) => {
      return {
        ...prevState,
        [tabName]: !prevState[tabName],
      };
    });
  };

  const handleActiveModelTab = (tabName) => {
    state.activeModel = tabName;

    setActiveModelTab((prev) => {
      const updatedTabs = Object.keys(prev).reduce((acc, key) => {
        acc[key] = key === tabName;
        return acc;
      }, {});

      return { ...prev, ...updatedTabs };
    });
  };

  const readFile = (type) => {
    // Read the file
    reader(file).then((result) => {
      // Handle the decals with the given type and result
      handleDecals(type, result);
      // Set the active editor tab
      setActiveEditorTab("");
    });
  };

  return (
    <AnimatePresence>
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
          <motion.div
            className="absolute z-10 top-5 right-5"
            {...fadeAnimation}
          >
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={handleBackNavigation}
              customStyles="w=fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>
          <CustomButton
            type="filled"
            title="Download"
            handleClick={() => console.log("Handle Download")}
            customStyles="py-2 px-4 font-bold text-sm fixed bottom-5 right-5"
          />
          <motion.div
            className="filtertabs-container"
            {...slideAnimation("up")}
          >
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() =>
                  handleActiveFilterTab(tab.name) +
                  console.log("Filter Activated")
                }
              />
            ))}
          </motion.div>

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
