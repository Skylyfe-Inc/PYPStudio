import React, { useState } from "react";
import fingerprint from "../assets/assets/fingerprint.png";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
const LoginStudio = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleNavigateLogin = (e) => {
    e.preventDefault();
    // TODO: authenticate here, then navigate
    navigate("/WelcomeAiStudio");
  };

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center">
      <div className="w-full max-w-xs bg-gray-300 p-6 rounded-lg flex flex-col items-center">
      
        <Login />

      </div>
    </div>
  );
};

export default LoginStudio;
