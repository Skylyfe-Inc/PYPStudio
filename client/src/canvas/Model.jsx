import { easing } from "maath";
import { useSnapshot } from "valtio";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Decal, useGLTF, useTexture, Html } from "@react-three/drei";
import state from "../store";

const Model = ({
  modelPath,
  geometryName,
  materialName,
  position,
  rotation,
  scale,
  decalProps,
  ...props
}) => {
  // useSnapshot() takes in a state object and returns a snapshot
  const snap = useSnapshot(state);
  const meshRef = useRef();
  const dragRef = useRef(null);
  const rotateDragRef = useRef(null);
  const ZERO_VECTOR = { x: 0, y: 0, z: 0 };
  const DECAL_KEYS = ["logo", "full", "backLogo", "backFull"];

  const ensureOffsetStructure = () => {
    if (
      !state.decalOffset ||
      typeof state.decalOffset !== "object" ||
      state.decalOffset === null
    ) {
      state.decalOffset = {};
    }
    DECAL_KEYS.forEach((key) => {
      const existing = state.decalOffset[key];
      if (!existing || typeof existing !== "object") {
        state.decalOffset[key] = { ...ZERO_VECTOR };
      } else {
        state.decalOffset[key] = {
          x: existing.x ?? 0,
          y: existing.y ?? 0,
          z: existing.z ?? 0,
        };
      }
    });
  };

  const ensureScaleStructure = () => {
    if (
      !state.decalScale ||
      typeof state.decalScale !== "object" ||
      state.decalScale === null
    ) {
      state.decalScale = {};
    }
    DECAL_KEYS.forEach((key) => {
      const existing = state.decalScale[key];
      if (!existing || typeof existing !== "object") {
        state.decalScale[key] = { x: 1, y: 1, z: 1 };
      } else {
        state.decalScale[key] = {
          x: existing.x ?? 1,
          y: existing.y ?? 1,
          z: existing.z ?? 1,
        };
      }
    });
  };

  const getScaleValues = (type) => {
    const source = snap.decalScale?.[type];
    if (!source) return { x: 1, y: 1, z: 1 };
    return {
      x: typeof source.x === "number" ? source.x : 1,
      y: typeof source.y === "number" ? source.y : 1,
      z: typeof source.z === "number" ? source.z : 1,
    };
  };

  const getOffsetValues = (type) => {
    const source = snap.decalOffset?.[type];
    if (!source) return { ...ZERO_VECTOR };
    return {
      x: typeof source.x === "number" ? source.x : 0,
      y: typeof source.y === "number" ? source.y : 0,
      z: typeof source.z === "number" ? source.z : 0,
    };
  };

  // useGLTF() takes in a path to a gltf file and returns nodes and materials
  const { nodes, materials } = useGLTF(modelPath);

  // useTexture() takes in a texture and returns a texture object
  const logoTexture = useTexture(snap.logoDecal) || null;

  // useTexture() takes in a texture and returns a texture object
  const fullTexture = useTexture(snap.fullDecal) || null;
  const backLogoTexture = useTexture(snap.backLogoDecal) || null;
  const backFullTexture = useTexture(snap.backFullDecal) || null;

  const computeDecalScale = (type, baseScale) => {
    const base = Array.isArray(baseScale)
      ? baseScale
      : typeof baseScale === "number"
        ? [baseScale, baseScale, baseScale]
        : [1, 1, 1];

    const scaleValues = getScaleValues(type);

    return [
      base[0] * (scaleValues.x ?? 1),
      base[1] * (scaleValues.y ?? 1),
      base[2] * (scaleValues.z ?? 1),
    ];
  };

  const decalEnabledMap = {
    logo: !!snap.isLogoTexture,
    full: !!snap.isFullTexture,
    backLogo: !!snap.isBackLogoTexture,
    backFull: !!snap.isBackFullTexture,
  };

  const determineActiveTarget = () => {
    const preferred = snap.activeDecalKey;
    if (preferred && decalEnabledMap[preferred]) return preferred;
    for (const key of DECAL_KEYS) {
      if (decalEnabledMap[key]) return key;
    }
    return null;
  };

  const activeTarget = determineActiveTarget();
  const isMoveActive = snap.activeTool === "move";
  const isScaleActive = snap.activeTool === "scale";

  const activeScaleValues = activeTarget ? getScaleValues(activeTarget) : { x: 1, y: 1, z: 1 };

  const uniformScale =
    Math.max(
      activeScaleValues.x ?? 1,
      activeScaleValues.y ?? 1,
      activeScaleValues.z ?? 1
    ) || 1;

  const cleanupDragListeners = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerUp);
    dragRef.current = null;
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (drag.type === "move") {
      const isFullTarget = drag.target === "full" || drag.target === "backFull";
      const moveSensitivity = isFullTarget ? 0.01 : 0.005;
      const next = {
        x: drag.initialOffset.x + dx * moveSensitivity,
        y: drag.initialOffset.y - dy * moveSensitivity,
        z: drag.initialOffset.z,
      };

      ensureOffsetStructure();
      state.decalOffset[drag.target] = { ...next };
    } else if (drag.type === "scale") {
      const scaleSensitivity = 0.002;
      const delta = (dx - dy) * scaleSensitivity;
      const base = drag.initialScale;
      const next = Math.min(5, Math.max(0.05, base + delta));

      ensureScaleStructure();
      state.decalScale[drag.target] = { x: next, y: next, z: next };
    }
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    cleanupDragListeners();
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const normalizeAngle = (value) => {
    const twoPi = Math.PI * 2;
    const wrapped = ((value % twoPi) + twoPi) % twoPi;
    return wrapped > Math.PI ? wrapped - twoPi : wrapped;
  };

  const clampPitch = (value) => clamp(value, -0.8, 0.8);

  const cleanupRotateListeners = () => {
    window.removeEventListener("pointermove", handleRotateMove);
    window.removeEventListener("pointerup", endRotateDrag);
    window.removeEventListener("pointercancel", endRotateDrag);
  };

  const startRotateDrag = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const currentTool = snap.activeTool;
    if (currentTool && currentTool !== "rotate") return;

    rotateDragRef.current = {
      pointerId: event.pointerId ?? 0,
      startX: event.clientX,
      startY: event.clientY,
      initialYaw: state.manualRotation?.y ?? 0,
      initialPitch: state.manualRotation?.x ?? 0,
      prevTool: currentTool === "rotate" ? "" : currentTool,
    };

    state.activeTool = "rotate";
    window.addEventListener("pointermove", handleRotateMove, { passive: false });
    window.addEventListener("pointerup", endRotateDrag, { passive: false });
    window.addEventListener("pointercancel", endRotateDrag, { passive: false });
  };

  const handleRotateMove = (event) => {
    const drag = rotateDragRef.current;
    if (!drag || (event.pointerId ?? 0) !== drag.pointerId) return;

    event.preventDefault();

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    const yawSensitivity = 0.008;
    const pitchSensitivity = 0.006;

    const nextYaw = normalizeAngle(drag.initialYaw - dx * yawSensitivity);
    const nextPitch = clampPitch(drag.initialPitch - dy * pitchSensitivity);

    state.manualRotation = { x: nextPitch, y: nextYaw, z: 0 };
  };

  const endRotateDrag = (event) => {
    const drag = rotateDragRef.current;
    if (!drag || (event.pointerId ?? 0) !== drag.pointerId) return;

    rotateDragRef.current = null;
    state.activeTool = drag.prevTool || "";
    cleanupRotateListeners();
  };

  const startDrag = (type, event) => {
    if (!activeTarget) return;
    if ((type === "move" && !isMoveActive) || (type === "scale" && !isScaleActive)) return;
    event.stopPropagation();
    event.preventDefault();

    const pointerId = event.pointerId ?? 0;
    ensureOffsetStructure();
    ensureScaleStructure();

    const currentOffsets = getOffsetValues(activeTarget);
    const currentScaleValues = getScaleValues(activeTarget);
    const currentScale = currentScaleValues.z ?? 1;

    dragRef.current = {
      type,
      pointerId,
      target: activeTarget,
      startX: event.clientX,
      startY: event.clientY,
      initialOffset: { ...currentOffsets },
      initialScale: currentScale,
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerUp, { passive: false });
  };

  useEffect(() => {
    return () => {
      cleanupDragListeners();
      cleanupRotateListeners();
    };
  }, []);

  const computeDecalPosition = (type) => {
    const basePosition = decalProps?.[type]?.position ?? [0, 0, 0];
    const base = Array.isArray(basePosition)
      ? basePosition
      : typeof basePosition === "number"
        ? [basePosition, basePosition, basePosition]
        : [0, 0, 0];

    const offset = getOffsetValues(type);

    return [
      base[0] + (offset.x ?? 0),
      base[1] + (offset.y ?? 0),
      base[2] + (offset.z ?? 0),
    ];
  };

  // Apply scaling from state
  useEffect(() => {
    if (meshRef.current && snap.modelScale) {
      // For models that already have a base scale, we multiply their base scale with the user's scale
      const baseScale = Array.isArray(scale)
        ? scale
        : typeof scale === "number"
          ? [scale, scale, scale]
          : [1, 1, 1];
      
      meshRef.current.scale.x = baseScale[0] * (snap.modelScale?.x ?? 1);
      meshRef.current.scale.y = baseScale[1] * (snap.modelScale?.y ?? 1);
      meshRef.current.scale.z = baseScale[2] * (snap.modelScale?.z ?? 1);
    }
  }, [snap.modelScale, scale]);

  // useFrame() takes in a state object and delta and returns an easing dampC
  useFrame((state, delta) =>
    easing.dampC(materials[materialName].color, snap.color, 0.25, delta)
  );

  // JSON.stringify() takes in a snapshot and returns a string
  const stateString = JSON.stringify(snap);

  return (
    <group key={stateString}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        geometry={nodes[geometryName].geometry}
        material={materials[materialName]}
        position={position}
        rotation={rotation}
        scale={scale}
        {...props}
        onPointerDown={startRotateDrag}
      >
        {snap.isFullTexture && fullTexture && (
          <Decal
            position={computeDecalPosition("full")}
            rotation={decalProps["full"].rotation}
            scale={computeDecalScale("full", decalProps["full"].scale)}
            material-map={fullTexture}
          />
        )}
        {snap.isLogoTexture && logoTexture && (
          <Decal
            position={computeDecalPosition("logo")}
            rotation={decalProps["logo"].rotation}
            scale={computeDecalScale("logo", decalProps["logo"].scale)}
            material-map={logoTexture}
            anisotropy={16}
          />
        )}
        {snap.isBackFullTexture && backFullTexture && (
          <Decal
            position={computeDecalPosition("backFull")}
            rotation={decalProps["backFull"].rotation}
            scale={computeDecalScale("backFull", decalProps["backFull"].scale)}
            material-map={backFullTexture}
          />
        )}
        {snap.isBackLogoTexture && backLogoTexture && (
          <Decal
            position={computeDecalPosition("backLogo")}
            rotation={decalProps["backLogo"].rotation}
            scale={computeDecalScale("backLogo", decalProps["backLogo"].scale)}
            material-map={backLogoTexture}
            anisotropy={16}
          />
        )}
        {activeTarget && (isMoveActive || isScaleActive) && (
          <Html
            position={computeDecalPosition(activeTarget)}
            zIndexRange={[10, 0]}
          >
            <div
              className={`decal-touch-wrapper ${isMoveActive ? "is-move" : ""} ${isScaleActive ? "is-scale" : ""}`}
              style={{
                width: `${Math.max(80, 120 * uniformScale)}px`,
                height: `${Math.max(80, 120 * uniformScale)}px`,
              }}
            >
              {isMoveActive && (
                <div
                  className="decal-touch-area"
                  role="presentation"
                  onPointerDown={(event) => startDrag("move", event)}
                >
                  <span className="decal-touch-label">Move</span>
                </div>
              )}
              {isScaleActive && (
                <>
                  <div
                    className="decal-scale-area"
                    role="presentation"
                    onPointerDown={(event) => startDrag("scale", event)}
                  >
                    <span className="decal-touch-label">Scale</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Scale image"
                    className="decal-scale-handle"
                    onPointerDown={(event) => startDrag("scale", event)}
                  >
                    ⇲
                  </button>
                </>
              )}
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

export default Model;
