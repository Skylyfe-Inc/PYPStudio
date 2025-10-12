import { useSnapshot } from "valtio";
import state from "../store";

const Tab = ({ tab, isFilterTab, isActiveTab, handleClick }) => {
  const snap = useSnapshot(state);
  const activeStyles =
    isFilterTab && isActiveTab
      ? { backgroundColor: snap.color, opacity: 0.5 }
      : { backgroundColor: "transparent", opacity: 1 };
  const label = tab.label || tab.name;

  return (
    <div
      key={tab.name}
      className={`tab-btn  ${
        isFilterTab ? "rounded-full glassmorhism" : "rounded-4"
      }`}
      onClick={handleClick}
      style={activeStyles}
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
        <span className="tab-label">{label}</span>
      )}
    </div>
  );
};

export default Tab;
