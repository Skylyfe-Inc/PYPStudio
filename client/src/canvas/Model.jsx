import { easing } from "maath";
import { useSnapshot } from "valtio";
import { useFrame,} from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Decal, useGLTF, useTexture } from "@react-three/drei";
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


  // useGLTF() takes in a path to a gltf file and returns nodes and materials
  const { nodes, materials } = useGLTF(modelPath);

  // useTexture() takes in a texture and returns a texture object
  const logoTexture = useTexture(snap.logoDecal) || null;

  // useTexture() takes in a texture and returns a texture object
  const fullTexture = useTexture(snap.fullDecal) || null;

  // Apply scaling from state
  useEffect(() => {
    if (meshRef.current && snap.modelScale) {
      // For models that already have a base scale, we multiply their base scale with the user's scale
      const baseScale = Array.isArray(scale) 
        ? scale 
        : [scale, scale, scale];
      
      meshRef.current.scale.x = baseScale[0] * snap.modelScale.x;
      meshRef.current.scale.y = baseScale[1] * snap.modelScale.y;
      meshRef.current.scale.z = baseScale[2] * snap.modelScale.z;
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
        castShadow
        receiveShadow
        geometry={nodes[geometryName].geometry}
        material={materials[materialName]}
        position={position}
        rotation={rotation}
        scale={scale}
        {...props}
      >
        {snap.isFullTexture && fullTexture && (
          <Decal
            position={decalProps["full"].position}
            rotation={decalProps["full"].rotation}
            scale={decalProps["full"].scale}
            material-map={fullTexture}
          />
        )}
        {snap.isLogoTexture && logoTexture && (
          <Decal
            position={decalProps["logo"].position}
            rotation={decalProps["logo"].rotation}
            scale={decalProps["logo"].scale}
            material-map={logoTexture}
            anisotropy={16}
          />
        )}
      </mesh>
    </group>
  );
};

export default Model;
