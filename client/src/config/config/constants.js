import {
  swatch,
  fileIcon,
  ai,
  logoShirt,
  stylishShirt,
  shirtIcon3D,
  hoodieIcon3D,
  bootIcon3D,
  sneakerIcon3D,
  scaleicon,
  moveIcon,
} from "../../assets/assets";

export const CarouselTabs = [
  {
    name: "shirt",
    icon: shirtIcon3D,
  },
  {
    name: "hoodie",
    icon: hoodieIcon3D,
  },
  {
    name: "boot",
    icon: bootIcon3D,
  },
  {
    name: "sneaker",
    icon: sneakerIcon3D,
  },
  {
    name: "meshy",
    icon: ai,
    label: "Text to 3D",
  },
];


export const EditorTabs = [
  {
    name: "move",
    icon: moveIcon,
  },
  {
    name: "scale",
    icon: scaleicon,
  },
  {
    name: "colorpicker",
    icon: swatch,
  },
  {
    name: "filepicker",
    icon: fileIcon,
  },
  {
    name: "aipicker",
    icon: ai,
  },
  
];

export const FilterTabs = [
  {
    name: "logoShirt",
    icon: logoShirt,
    label: "Front Logo",
  },
  {
    name: "stylishShirt",
    icon: stylishShirt,
    label: "Front Full",
  },
  {
    name: "logoBack",
    icon: logoShirt,
    label: "Back Logo",
  },
  {
    name: "stylishBack",
    icon: stylishShirt,
    label: "Back Full",
  },
];

export const DecalTypes = {
  logo: {
    stateProperty: "logoDecal",
    filterTab: "logoShirt",
    decalKey: "logo",
  },
  full: {
    stateProperty: "fullDecal",
    filterTab: "stylishShirt",
    decalKey: "full",
  },
  backLogo: {
    stateProperty: "backLogoDecal",
    filterTab: "logoBack",
    decalKey: "backLogo",
  },
  backFull: {
    stateProperty: "backFullDecal",
    filterTab: "stylishBack",
    decalKey: "backFull",
  },
};

export const loginFields = [
  {
    labelText: "Email address",
    labelFor: "email-address",
    id: "email-address",
    name: "email",
    type: "email",
    autoComplete: "email",
    isRequired: true,
    placeholder: "Email address",
  },
  {
    labelText: "Password",
    labelFor: "password",
    id: "password",
    name: "password",
    type: "password",
    autoComplete: "current-password",
    isRequired: true,
    placeholder: "Password",
  },
];

export const signupFields = [
  {
    labelText: "Username",
    labelFor: "username",
    id: "username",
    name: "username",
    type: "text",
    autoComplete: "username",
    isRequired: true,
    placeholder: "Username",
  },
  {
    labelText: "Email address",
    labelFor: "email-address",
    id: "email-address",
    name: "email",
    type: "email",
    autoComplete: "email",
    isRequired: true,
    placeholder: "Email address",
  },
  {
    labelText: "Password",
    labelFor: "password",
    id: "password",
    name: "password",
    type: "password",
    autoComplete: "current-password",
    isRequired: true,
    placeholder: "Password",
  },
  {
    labelText: "Confirm Password",
    labelFor: "confirm-password",
    id: "confirm-password",
    name: "confirm-password",
    type: "password",
    autoComplete: "confirm-password",
    isRequired: true,
    placeholder: "Confirm Password",
  },
];
