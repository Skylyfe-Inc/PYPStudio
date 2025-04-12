import React, { useState, useEffect } from "react";
import state from "../store";
import CustomButton from "./CustomButton";


const ScalingControls = () => {
    const snap = useSnapshot(state);
    const [showControls, setShowControls] = useState(false);
  
    //Initializes the scaling values from state or with default values
    const [scaleValues, setScaleValues] = useState({
        x: state.modelScale?.x || 1,
        y: state.modelScale?.y || 1,
        z: state.modelScale?.z || 1
      });


    // Update state when scale values change
  useEffect(() => {
    console.log(scaleValues + "scaleValues");
    state.modelScale = { ...scaleValues };
  }, [scaleValues]);


  // Handle slider changes
  const handleScaleChange = (axis, value) => {
    console.log(axis, value);
    setScaleValues(prev => ({
      ...prev,
      [axis]: parseFloat(value)
    }));
  };

  // Reset scales to default
  const resetScale = () => {
    // Get default scale based on active model
    let defaultScale = { x: 1, y: 1, z: 1 };
    
    switch(snap.activeModel) {
        case "shirt":
          defaultScale = { x: 0.008, y: 0.008, z: 0.008 };
          break; 
        case "hoodie":
          defaultScale = { x: 0.008, y: 0.008, z: 0.008 };
          break;
        case "boot":
        case "sneaker":
          defaultScale = { x: 0.1, y: 0.1, z: 0.1 };
          break;
        default:
          defaultScale = { x: 1, y: 1, z: 1 };
      }
      setScaleValues(defaultScale);
    };

  return (
    <div className="scaling-container">
      <div 
        className="scaling-button"
        onClick={() => setShowControls(!showControls)}
      >
        <CustomButton
          type="filled"
          title={showControls ? "Hide Scale" : "Scale Model"}
          customStyles="w-fit px-4 py-2.5 font-bold text-sm"
        />
      </div>
      
      {showControls && (
        <div className="scaling-controls bg-gray-100 p-4 rounded-md shadow-md">
          <h4 className="text-center font-bold mb-3">Adjust Model Size</h4>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-8 font-medium">X:</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={scaleValues.x}
                onChange={(e) => handleScaleChange('x', e.target.value)}
                className="w-32"
              />
              <span className="w-10 text-center">{scaleValues.x.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="w-8 font-medium">Y:</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={scaleValues.y}
                onChange={(e) => handleScaleChange('y', e.target.value)}
                className="w-32"
              />
              <span className="w-10 text-center">{scaleValues.y.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="w-8 font-medium">Z:</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={scaleValues.z}
                onChange={(e) => handleScaleChange('z', e.target.value)}
                className="w-32"
              />
              <span className="w-10 text-center">{scaleValues.z.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-center mt-2">
              <CustomButton
                type="outline"
                title="Reset"
                handleClick={resetScale}
                customStyles="w-fit px-4 py-1.5 font-bold text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScalingControls;