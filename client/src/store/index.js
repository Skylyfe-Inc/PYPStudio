// Importing the proxy function from 'valtio' library for state management
import { proxy } from "valtio";

// Defining a state object using 'proxy' to make it reactive
const state = proxy({
  intro: false, // Determines if an introductory element is to be shown
  // login:false, // login state, if user is logged in then show the main content
  color: "#0000FF", // Default color for some UI elements
  buttonColor: "#EFBD48", // Default color for button UI elements
  isLogoTexture: true, // Determines if a texture is to be applied on logo
  isFullTexture: false, // Determines if a full texture is to be applied on some UI element
  isBackLogoTexture: false,
  isBackFullTexture: false,
  logoDecal: "../../public/PYPOTWBlack.png", // Path to the logo decal image
  fullDecal: "../../public/PYPOTWBlack.png", // Path to the full decal image
  backLogoDecal: "../../public/PYPOTWBlack.png",
  backFullDecal: "../../public/PYPOTWBlack.png",
  modelScale: { x: 1, y: 1, z: 1 }, // Default scaling values for the model
  decalScale: {
    logo: { x: 1, y: 1, z: 1 },
    full: { x: 1, y: 1, z: 1 },
    backLogo: { x: 1, y: 1, z: 1 },
    backFull: { x: 1, y: 1, z: 1 },
  },
  decalOffset: {
    logo: { x: 0, y: 0, z: 0 },
    full: { x: 0, y: 0, z: 0 },
    backLogo: { x: 0, y: 0, z: 0 },
    backFull: { x: 0, y: 0, z: 0 },
  },
  activeTool: "",
  activeDecalKey: "logo",
  manualRotation: { x: 0, y: 0, z: 0 },
  activeModel: "shirt",
});

// Exporting the reactive state object
export default state;
