import React from "react";
import state from "../store";
import { useSnapshot } from "valtio";
import { getContrastingColor } from "../config/config/helpers";

const CustomButton = ({ type, title, customStyles, handleClick }) => {
  // useSnapshot is used to take a snapshot of the current state
  const snap = useSnapshot(state);

  // generateStyle function is used to generate the style based on the type
  const generateStyle = (type) => {
    if (type === "filled") {
      return {
        backgroundColor: snap.buttonColor,
        color: getContrastingColor(snap.color),
      };
    } else if (type === "outline") {
      // style for outline type
      return {
        borderWidth: "1px",
        borderColor: snap.buttonColor,
        color: snap.buttonColor,
      };
    }
  };
  return (
    <button
      className={`px-2 py=1.5 flex-1 rounded-md ${customStyles}`}
      style={generateStyle(type)}
      onClick={handleClick}
    >
      {title}
    </button>
  );
};

export default CustomButton;
