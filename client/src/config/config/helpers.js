import { jwtDecode as jwt_decode } from "jwt-decode";
import Cookies from "universal-cookie";

const selectRendererCanvas = () =>
  document.querySelector("canvas[data-engine='three.js']") ||
  document.querySelector("canvas");

const canvasToBlob = (canvas, mimeType) =>
  new Promise((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob returned null"));
        },
        mimeType,
        1,
      );
      return;
    }

    try {
      const dataURL = canvas.toDataURL(mimeType);
      const [header, data] = dataURL.split(",");
      const mimeMatch = /:(.*?);/.exec(header || "");
      const byteString = atob(data || "");
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uintArray = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i += 1) {
        uintArray[i] = byteString.charCodeAt(i);
      }
      resolve(new Blob([arrayBuffer], { type: mimeMatch?.[1] || mimeType }));
    } catch (error) {
      reject(error);
    }
  });

export const downloadCanvasToImage = async ({
  fileName = "custom-design",
  mimeType = "image/png",
  multiplier = 1,
} = {}) => {
  const canvas = selectRendererCanvas();
  if (!canvas) {
    console.error("No canvas element found to download.");
    return false;
  }

  const safeMultiplier =
    Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;

  const ensureExtension = (name, type) => {
    if (name.toLowerCase().endsWith(".png") || name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".jpeg") || name.toLowerCase().endsWith(".webp")) {
      return name;
    }
    if (type === "image/jpeg") return `${name}.jpg`;
    if (type === "image/webp") return `${name}.webp`;
    return `${name}.png`;
  };

  const downloadName = ensureExtension(fileName, mimeType);

  let targetCanvas = canvas;

  try {
    if (safeMultiplier !== 1) {
      const offscreen = document.createElement("canvas");
      offscreen.width = Math.max(1, Math.round(canvas.width * safeMultiplier));
      offscreen.height = Math.max(
        1,
        Math.round(canvas.height * safeMultiplier),
      );
      const ctx = offscreen.getContext("2d");
      if (!ctx) throw new Error("Unable to get offscreen canvas context");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
      targetCanvas = offscreen;
    }
  } catch (error) {
    console.error("Failed to generate download image", error);
    return false;
  }

  try {
    const blob = await canvasToBlob(targetCanvas, mimeType);
    if (!blob) throw new Error("Canvas blob conversion failed");

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
    return true;
  } catch (error) {
    console.error("Unable to download canvas image", error);
    return false;
  }
};

export const captureCanvasImage = () => {
  const canvas = selectRendererCanvas();
  if (!canvas) return null;

  try {
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to capture canvas image", error);
    return null;
  }
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
