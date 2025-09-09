import { useState } from "react";
import fingerprint from "../assets/assets/fingerprint.png";
import { useNavigate } from "react-router-dom";
import { setToken } from "../config/config/helpers";    
import { toastNotify } from "../components/Toast";        

const IndividualSignUp = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setError(emailPattern.test(value) ? "" : "Please enter a valid email address");
  };

  const handleEmailVerification = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordError(confirmPassword && value !== confirmPassword ? "Passwords do not match" : "");
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setPasswordError(password && value !== password ? "Passwords do not match" : "");
  };

  async function authenticateUser() {
    // fake signup/login success
    setToken("dummy_token_123");
    toastNotify("Sign Up Successful!", "success");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // basic guards
    if (error || passwordError || !email || !password || !confirmPassword) return;

    try {
      setLoading(true);
      await authenticateUser();
      navigate("/");             
    } catch (err) {
      console.error(err);
      toastNotify("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-sm bg-gray-200 p-6 rounded-lg shadow-md flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6 text-black">Individual Sign Up</h2>

        <img src={fingerprint} alt="Fingerprint" className="w-28 h-28 object-contain mb-4" />

        <form className="w-full flex flex-col space-y-4" onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            placeholder="First Name"
            className="w-full bg-white border-4 border-black rounded-md px-4 py-2 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="w-full bg-white border-4 border-black rounded-md px-4 py-2 focus:outline-none"
            required
          />

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailVerification}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                error ? "border-red-600" : "border-black"
              }`}
              required
            />
            {error && <p className="text-red-600 mt-1 text-sm">{error}</p>}
          </div>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="bg-white border-4 border-black rounded-md px-4 py-2 focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            className="bg-white border-4 border-black rounded-md px-4 py-2 focus:outline-none"
            required
          />
          {passwordError && <p className="text-red-600 text-sm">{passwordError}</p>}

          <button
            type="submit"
            disabled={!!error || !!passwordError || !email || !password || !confirmPassword || loading}
            className={`w-full border-2 font-semibold rounded-full py-2 mt-4 ${
              loading
                ? "bg-gray-400 border-gray-400 cursor-not-allowed"
                : "bg-yellow-400 border-black text-black hover:bg-yellow-500"
            }`}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IndividualSignUp;
