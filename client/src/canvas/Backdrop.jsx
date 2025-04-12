// Importing necessary modules from react, maath, and react-three/drei
import React, { useRef } from "react";
import { easing } from "maath";
import { useFrame } from "@react-three/fiber";
import { AccumulativeShadows, RandomizedLight } from "@react-three/drei";

// Defining the Backdrop component
const Backdrop = () => {
  // useRef is used to create a reference to the AccumulativeShadows component
  const shadows = useRef();

  // Return the JSX for the component
  return (
    // Using the AccumulativeShadows component from drei library to add realistic shadows
    <AccumulativeShadows
      ref={shadows} // Using the ref created above
      temporal // Enabling temporal accumulation mode for more realistic shadows
      frames={60} // Setting the amount of frames to accumulate over
      alphaTest={0.85} // Setting the alpha discard level
      scale={10} // Scaling the size of the shadow
      rotation={[Math.PI / 2, 0, 0]} // Rotating the shadow
      position={[0, 0, -0.14]} // Positioning the shadow
    >
      {/* Using the RandomizedLight component from drei library to add randomized lighting */}
      <RandomizedLight
        amount={3} // Setting the amount of lights
        radius={9} // Setting the radius of the light
        intensity={2.9} // Setting the intensity of the light
        ambient={0.35} // Setting the ambient light level
        position={[5, 5, -10]} // Positioning the light
      />
    </AccumulativeShadows>
  );
};

// Exporting the Backdrop component
export default Backdrop;
