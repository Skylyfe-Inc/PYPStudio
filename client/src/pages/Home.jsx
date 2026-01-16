// Importing necessary libraries and components
import { motion, AnimatePresence } from "framer-motion"; // Motion components for animations
import { useSnapshot } from "valtio"; // Hook for state management
import { useEffect, useState } from "react";
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
import config from "../config/config/config";

// Home component
const Home = () => {
  const snap = useSnapshot(state); // Using snapshot to access the state
  const navigate = useNavigate();
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providerError, setProviderError] = useState("");

  const mode = import.meta.env.MODE || "development";
  const API_BASE_URL =
    config[mode]?.backendUrl || config.development.backendUrl;
  const handleNavigate = () => {
    state.intro = false;
  };

  const openVendorModal = () => {
    setShowVendorModal(true);
  };

  const handleSelectVendor = (vendor) => {
    if (!vendor) return;
    state.selectedPrintProvider = {
      id: vendor.id,
      name: vendor.title || vendor.name || `Provider ${vendor.id}`,
    };
    setShowVendorModal(false);
    navigate("/printify-catalog");
  };

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  useEffect(() => {
    if (!showVendorModal) return;
    const fetchProviders = async () => {
      setLoadingProviders(true);
      setProviderError("");
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/printify/catalog/print-providers`,
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || "Failed to load providers");
        }
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        setProviders(list);
      } catch (error) {
        setProviderError(error instanceof Error ? error.message : String(error));
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [showVendorModal]);
  // The component returns a set of motion components for animations
  return (
    <AnimatePresence>
      {snap.intro && (
        <motion.div className="home" {...slideAnimation("left")}>
          <motion.header {...slideAnimation("down")}>
            <img
              src="../../public/public/placedaprintwhitetee.png"
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
                title="Select Vendor"
                handleClick={openVendorModal}
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
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Select a vendor</h2>
            <p className="mt-1 text-sm text-slate-600">
              Choose a Printify provider to continue to the catalog.
            </p>
            {providerError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {providerError}
              </p>
            )}
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {loadingProviders ? (
                <p className="text-sm text-slate-500">Loading vendors...</p>
              ) : (
                providers.map((vendor, index) => (
                  <button
                    key={`${vendor.id || vendor.title || "provider"}-${index}`}
                    type="button"
                    onClick={() => handleSelectVendor(vendor)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-400"
                  >
                    <span className="font-semibold text-slate-900">
                      {vendor.title || vendor.name || `Provider ${vendor.id}`}
                    </span>
                    <span className="text-xs text-slate-500">Select</span>
                  </button>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVendorModal(false)}
                className="rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Exporting the Home component
export default Home;
