import React from "react";
import state from "../store";
import { useSnapshot } from "valtio";
import { getContrastingColor } from "../config/config/helpers";

const CustomButton = ({
  type,
  title,
  customStyles = "",
  handleClick,
  imageSrc,
  children,
  alt,
  disabled = false,
  htmlType = "button",
}) => {
  // useSnapshot is used to take a snapshot of the current state
  const snap = useSnapshot(state);

  // generateStyle function is used to generate the style based on the type
  const generateStyle = (variant) => {
    if (variant === "outline-black") {
      return {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "#000",
        color: "#000",
        backgroundColor: "transparent",
      };
    }

    if (variant === "black") {
      return {
        backgroundColor: "#000000",
        color: "#ffffff",
      };
    }

    if (variant === "filled") {
      return {
        backgroundColor: snap.buttonColor,
        color: getContrastingColor(snap.color),
      };
    }

    if (variant === "outline") {
      return {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: snap.buttonColor,
        color: snap.buttonColor,
        backgroundColor: "transparent",
      };
    }

    return {};
  };

  return (
    <button
      type={htmlType}
      className={`px-2 py-1.5 rounded-md transition-transform duration-150 ${customStyles.includes("w-fit") ? "" : "flex-1"} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01]"} ${customStyles}`}
      style={generateStyle(type)}
      onClick={disabled ? undefined : handleClick}
      disabled={disabled}
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
