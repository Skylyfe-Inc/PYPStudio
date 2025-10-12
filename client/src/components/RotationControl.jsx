import React, { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import state from "../store";

const normalizeAngle = (value) => {
  const twoPi = Math.PI * 2;
  const wrapped = ((value % twoPi) + twoPi) % twoPi;
  return wrapped > Math.PI ? wrapped - Math.PI * 2 : wrapped;
};

const RotationControl = () => {
  const snap = useSnapshot(state);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const disabled = snap.activeTool === "move" || snap.activeTool === "scale";
  const currentRotation = snap.manualRotation ?? { x: 0, y: 0, z: 0 };

  const cleanupListeners = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    dragRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => cleanupListeners, []);

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();

    const dx = event.clientX - drag.startX;
    const sensitivity = 0.008;

    const nextYaw = normalizeAngle(drag.initialYaw - dx * sensitivity);

    state.manualRotation = { x: 0, y: nextYaw, z: 0 };
    state.activeTool = "rotate";
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    cleanupListeners();
    state.activeTool = "";
  };

  const handlePointerDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();

    const pointerId = event.pointerId ?? 0;
    dragRef.current = {
      pointerId,
      startX: event.clientX,
      initialYaw: currentRotation.y ?? 0,
    };
    setIsDragging(true);
    state.activeTool = "rotate";

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerUp, { passive: false });
  };

  const handleReset = () => {
    if (disabled) return;
    state.manualRotation = { x: 0, y: 0, z: 0 };
  };

  const active = snap.activeTool === "rotate" || isDragging;
  const containerClasses = [
    "rotation-thumb",
    disabled ? "rotation-thumb--disabled" : "",
    active ? "rotation-thumb--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      <button
        type="button"
        className="rotation-thumb__dial"
        onPointerDown={handlePointerDown}
        aria-label="Rotate model"
        disabled={disabled}
      >
        <span className="rotation-thumb__icon">↻</span>
      </button>
      <div className="rotation-thumb__readout">
        <span>{Math.round((normalizeAngle(currentRotation.y ?? 0) * 180) / Math.PI)}°</span>
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default RotationControl;
