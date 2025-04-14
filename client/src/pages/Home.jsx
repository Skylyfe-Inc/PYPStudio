// Importing necessary libraries and components
import { motion, AnimatePresence } from "framer-motion"; // Motion components for animations
import { useSnapshot } from "valtio"; // Hook for state management
import { useNavigate } from "react-router-dom"; // Navigation function.
// Importing animations configurations
import {
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  slideAnimation,
} from "../config/config/motion";
import state from "../store"; // Importing global state
import { CustomButton } from "../components"; // Importing custom button component
import { removeToken } from "../config/config/helpers";

// Home component
const Home = () => {
  const snap = useSnapshot(state); // Using snapshot to access the state
  const navigate = useNavigate();
  const handleNavigate = () => {
    state.intro = false;
  };
  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };
  // The component returns a set of motion components for animations
  return (
    <AnimatePresence>
      {snap.intro && (
        <motion.div className="home" {...slideAnimation("left")}>
          <motion.header {...slideAnimation("down")}>
            <img
              src="/public/public/placedaprintwhitetee.png"
              alt="logo"
              className="w-30 h-20 object-contain"
            />
          </motion.header>

          <motion.div className="home-content" {...headContainerAnimation}>
            <motion.div {...headContentAnimation}>
              <h2 className="head-text">PLACE YOUR PRINT STUDIO.</h2>
            </motion.div>
            <motion.div {...headTextAnimation} className=" flex-col gap-5">
              <p className="max-w-md font-bold text-grey-600 text-base">
                Create your own 1 of 1 exclusive shirt with our brand new AI
                customization tool.
              </p>
              <CustomButton
                type="filled"
                title="Customize Now"
                handleClick={handleNavigate}
                customStyles="w-fit px-5 py-2.5 font-bold text-sm gap-4"
              />

              <CustomButton
                type="outline"
                title="Logout"
                handleClick={handleLogout}
                customStyles="w-fit px-5 py-2.5 mx-2 font-bold text-sm gap-4"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Exporting the Home component
export default Home;
