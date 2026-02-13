import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { setToken } from "../config/config/helpers";
import { toastNotify } from "../components/Toast";
import fingerprint from "../assets/assets/fingerprint.png";
import state from "../store";
import { fetchUserRole } from "../lib/fetchUserRole";

const PROFILE_STORAGE_KEY = "pyp_user_profile";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function authenticateUser() {
    try {
      console.log("🔐 Attempting to sign in with:", email);

      // Sign in with Firebase Authentication
      const cleanEmail = (email || "").trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      console.log("🔐 Attempting to sign in with:", JSON.stringify(cleanEmail));

      const user = userCredential.user;

      console.log("Firebase sign in successful:", user.uid);

      // ✅ Update global auth state immediately
      state.authUser = user;

      // ✅ Fetch role from Firestore users/{uid}
      const role = await fetchUserRole(user.uid);
      state.userRole = role;
      console.log("✅ User role set:", role);

      // Get the ID token
      const idToken = await user.getIdToken();
      const refreshToken = user.refreshToken;

      console.log("🎫 Got tokens, sending to backend...");

      // Send tokens to backend to set cookies
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        credentials: 'include', // Important: enables cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          refreshToken
        })
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Backend error:", error);
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      console.log("Backend response:", data);

      // Store token locally as well (for backward compatibility)
      setToken(idToken);

      const nameParts = (user.displayName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const fallbackProfile = {
        uid: user.uid,
        email: user.email || cleanEmail,
        displayName: user.displayName || user.email || cleanEmail,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" "),
        role, // ✅ set role from Firestore
      };
      const profile = { ...fallbackProfile, ...(data?.user?.profile || {}) };
      state.userProfile = profile;
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } catch (storageError) {
        console.warn("Unable to persist profile locally", storageError);
      }

      toastNotify("Logged In Successfully!", "success");
      return true;
    } catch (error) {
      console.error("❌ Authentication error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // User-friendly error messages
      let errorMessage = "Login failed. Please try again.";

      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toastNotify(errorMessage, "error");
      throw error;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toastNotify("Please enter both email and password", "error");
      return;
    }

    try {
      setLoading(true);
      await authenticateUser();

      console.log("About to navigate to /home");
      navigate("/home");
      console.log("navigate() called");
    } catch (error) {
      // Error already handled in authenticateUser
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
