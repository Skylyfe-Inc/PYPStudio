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
  logoDecal: "../../public/PYPOTWBlack.png", // Path to the logo decal image
  fullDecal: "../../public/PYPOTWBlack.png", // Path to the full decal image
  modelScale: { x: 1, y: 1, z: 1 }, // Default scaling values for the model
  decalScale: 1, // Default scaling value for decals
  activeModel: "shirt",
});

// Exporting the reactive state object
export default state;
