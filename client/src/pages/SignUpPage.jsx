import React from "react";
import fingerprint from '../assets/assets/fingerprint.png';
import {
  
  CustomButton,
} from "../components/index.js";
//import fingerprint from "../assets/fingerprint.png"; // Add your fingerprint image to assets

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-sm bg-gray-200 p-6 rounded-lg shadow-md flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-black">SIGN UP</h2>
        <img
          src={fingerprint}
          alt="Fingerprint"
           className="w-20 h-20 object-contain"
        />

        <form className="w-full flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Company Name"
            className="border border-black rounded-md px-4 py-2 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Company Address"
            className="border border-black rounded-md px-4 py-2 focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            className="border border-black rounded-md px-4 py-2 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-black rounded-md px-4 py-2 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="border border-black rounded-md px-4 py-2 focus:outline-none"
          />

          <CustomButton
            type="filled"
            title="Sign Up"
            customStyles="w-full mt-4"
            handleClick={() => alert("Sign up clicked")}
          />
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
