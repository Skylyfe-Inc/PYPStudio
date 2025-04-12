import { jwtDecode as jwt_decode } from "jwt-decode";
import Cookies from "universal-cookie";

export const downloadCanvasToImage = () => {
  // Get the canvas element from the DOM
  const canvas = document.querySelector("canvas");

  // Convert the canvas to a dataURL
  const dataURL = canvas.toDataURL();

  // Create a link element and add it to the DOM
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "canvas.png";
  document.body.appendChild(link);

  // Trigger the download
  link.click();

  // Remove the link from the DOM
  document.body.removeChild(link);
};

export const reader = (file) =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsDataURL(file);
  });

export const getContrastingColor = (color) => {
  // Remove the '#' character if it exists
  const hex = color.replace("#", "");

  // Convert the hex string to RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate the brightness of the color
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white depending on the brightness
  return brightness > 128 ? "black" : "white";
};

export const setToken = (token) => {
  const cookies = new Cookies();
  cookies.set("accessToken", token);
};

export const getToken = () => {
  const cookies = new Cookies();
  return cookies.get("accessToken");
};

export const removeToken = () => {
  const cookies = new Cookies();
  return cookies.remove("accessToken");
};

export const authHeader = () => {
  const user = getToken();
  if (user && user.accessToken) {
    return { "x-access-token": user.accessToken };
  } else {
    return {};
  }
};

export const useDecoded = () => {
  const token = getToken();
  const decoded = jwt_decode(token);
  return decoded;
};
