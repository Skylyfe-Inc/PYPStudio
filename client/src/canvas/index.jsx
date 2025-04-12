/* eslint-disable react/no-unknown-property */
import { Canvas } from "@react-three/fiber";
import { Environment, Center } from "@react-three/drei";

import Model from "./Model";
import Backdrop from "./Backdrop";
import CameraRig from "./CameraRig";

import { useSnapshot } from "valtio";
import state from "../store";

const CanvasModel = () => {
  const snap = useSnapshot(state);

  const model = () => {
    switch (snap.activeModel) {
      case "shirt":
        return (
          <Model
            modelPath={"public/shirt_baked.glb"}
            geometryName={"T_Shirt_male"}
            materialName={"lambert1"}
            position={[0, 0.04, 1.5]}
            rotation={[0, 0, 0]}
            decalProps={{
              full: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 0.8 },
              logo: {
                position: [0, 0.04, 0.15],
                rotation: [0, 0, 0],
                scale: 0.15,
              },
            }}
          />
        );
      case "hoodie":
        return (
          <Model
            modelPath={"public/3Dhoodie.glb"}
            geometryName={"Hoodie"}
            materialName={"hoodie"}
            position={[0, 0.04, 1.5]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.008, 0.008, 0.008]}
            decalProps={{
              full: {
                position: [0, 55, 0],
                rotation: [-Math.PI / 2, 0, 0],
                scale: 140,
              },
              logo: {
                position: [0, 20, -5],
                rotation: [-Math.PI / 2, 0, 0],
                scale: 20,
              },
            }}
          />
        );
      case "boot":
        return (
          <Model
            modelPath={"public/boot.glb"}
            geometryName={"boot"}
            materialName={"boot"}
            position={[0, -0.1, 1.5]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={[0.1, 0.1, 0.1]}
            decalProps={{
              full: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 0.8 },
              logo: {
                position: [0.5, 1.15, -1],
                rotation: [0, Math.PI / 2, 0],
                scale: 1,
              },
            }}
          />
        );
      case "sneaker":
        return (
          <Model
            modelPath={"public/Sneaker.glb"}
            geometryName={"Sneaker"}
            materialName={"sneaker"}
            position={[0, 0.04, 1.5]}
            rotation={[0, Math.PI / 4, 0]}
            scale={[0.1, 0.1, 0.1]}
            decalProps={{
              full: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 5 },
              logo: { position: [1, -1, 0.97], rotation: [0, 0, 0], scale: 1 },
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 0], fov: 25 }}
      gl={{ preserveDrawingBuffer: true }}
      eventSource={document.getElementById("root")}
      eventPrefix="client"
      className="w-full max-w-full h-full transition-all ease-in"
    >
      <ambientLight intensity={0.5} />
      <Environment preset="city" />
      <CameraRig>
        <Backdrop />
        <Center>{model()}</Center>
      </CameraRig>
    </Canvas>
  );
};

export default CanvasModel;
