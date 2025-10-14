import { useSnapshot } from "valtio";
import state from "../store";
import { getContrastingColor } from "../config/config/helpers";

const Tab = ({ tab, isFilterTab, isActiveTab, handleClick }) => {
  const snap = useSnapshot(state);
  const label = tab.label || tab.name;

  return (
    <div
      key={tab.name}
      className={`tab-btn  ${
        isFilterTab ? "rounded-full glassmorhism" : "rounded-4"
      }`}
      onClick={handleClick}
      title={label}
    >
      <img
        src={tab.icon}
        alt={tab.name}
        className={`${
          isFilterTab ? "w-2/3 h-2/3" : "w-11/12 h-11/12 object-contain"
        }`}
      />
      {isFilterTab && (
        <span
          className={`tab-label inline-flex items-center justify-center px-2 py-1 rounded-full transition-all duration-150 border ${
            isActiveTab ? "shadow-sm" : "border-transparent"
          }`}
          style={
            isActiveTab
              ? {
                  backgroundColor: snap.color,
                  color: getContrastingColor(snap.color),
                  borderColor: snap.color,
                }
              : { color: "rgba(15,23,42,0.85)" }
          }
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Tab;
