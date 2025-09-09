import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../config/config/helpers";
import { toastNotify } from "../components/Toast";
import fingerprint from "../assets/assets/fingerprint.png";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function authenticateUser() {
    setToken("dummy_token_123");
    toastNotify("Logged In Successfully!", "success");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      await authenticateUser();

      console.log("About to navigate to /home");
      navigate("/home");
      console.log("navigate() called");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center">
      <div className="w-full max-w-xs bg-gray-300 p-6 rounded-lg flex flex-col items-center">
        <h1 className="text-3xl font-extrabold tracking-wide text-black mb-1">
          LOGIN
        </h1>
        <div className="h-1 w-16 bg-black mb-4" />

        <img
          src={fingerprint}
          alt="Fingerprint"
          className="w-24 h-24 object-contain mb-4"
        />

        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          <input
            type="email"
            placeholder="Email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-full border-[3px] border-black bg-white px-4 py-2 text-center placeholder:text-gray-600 mb-3 focus:outline-none focus:ring-0"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-full border-[3px] border-black bg-white px-4 py-2 text-center placeholder:text-gray-600 mb-6 focus:outline-none focus:ring-0"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-400 border-black w-full border-2 font-semibold rounded-full py-2 mt-4 text-black hover:bg-yellow-500"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-sm text-black">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/WelcomeAiStudio")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
