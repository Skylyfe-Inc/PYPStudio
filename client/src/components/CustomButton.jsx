import React from "react";
import state from "../store";
import { useSnapshot } from "valtio";
import { getContrastingColor } from "../config/config/helpers";

const CustomButton = ({ type, title, customStyles, handleClick, imageSrc, children, alt }) => {
  // useSnapshot is used to take a snapshot of the current state
  const snap = useSnapshot(state);

  // generateStyle function is used to generate the style based on the type
  const generateStyle = (type) => {
  if (type === "outline-black") {
    return {
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "#000",
      color: "#000",
      backgroundColor: "transparent",
    };
  } else if (type === "black") {
    return {
      backgroundColor: "#000000",
      color: "#ffffff",
    };
  } else if (type === "filled") {
    return {
      backgroundColor: snap.buttonColor,
      color: getContrastingColor(snap.color),
    };
  } else if (type === "outline") {
    return {
      borderWidth: "1px",
      borderColor: snap.buttonColor,
      color: snap.buttonColor,
    };
  }
};

  return (
    <button
      className={`px-2 py-1.5 flex-1 rounded-md ${customStyles}`}
      style={generateStyle(type)}
      onClick={handleClick}
    >
       {imageSrc && (
        <img
          src={imageSrc}
          alt={alt || "button image"}
          className="w-5 h-5 object-contain"
        />
      )}
      {children || title}
    </button>
  );
};

export default CustomButton;
