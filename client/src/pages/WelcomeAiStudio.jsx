import { useNavigate } from "react-router-dom";
import fingerprint from '../assets/assets/fingerprint.png';
import { CustomButton } from "../components/index.js";

const WelcomeAiStudio = () => {
  const navigate = useNavigate();

  const handleNavigateIndividual = () => {
    navigate("/IndividualSignUp");
  };

  const handleNavigateVendorSignUp = () => {
    navigate("/VendorSignUpPage");
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="flex flex-col items-center text-center">
        {/* Top Text */}
        <h2 className="text-2xl font-bold text-black tracking-wide mb-4">
          WELCOME TO
        </h2>

        {/* Image */}
        <img
          src={fingerprint}
          alt="Fingerprint"
          className="w-28 h-28 object-contain mb-4"
        />

        <h2 className="text-2xl font-bold text-black tracking-wide mb-8">
          PLACE YOUR PRINT AI STUDIO
        </h2>


        {/* Buttons */}
        <div className="flex gap-10">
          <button
            onClick={handleNavigateIndividual}
            className="px-5 py-2 bg-white border-2 border-black text-black font-semibold rounded-md hover:bg-gray-100"
          >
            INDIVIDUAL
          </button>
          <button
            onClick={handleNavigateVendorSignUp}
            className="px-5 py-2 bg-white border-2 border-black text-black font-semibold rounded-md hover:bg-gray-100"
          >
            COMPANY
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeAiStudio;
