import { useState } from "react";
import fingerprint from "../assets/assets/fingerprint.png";
import { useNavigate } from "react-router-dom";
import { toastNotify } from "../components/Toast";

import { auth } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import { individualSignupSchema, zodFieldErrors } from "../validation/authSchemas";

const IndividualSignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  /**
   * Creates Firebase Auth user + (optional) updates profile.
   * Then calls your backend to write the Firestore profile document.
   */
  const createFirebaseUserAndProfile = async ({
    cleanEmail,
    firstName,
    lastName,
    displayName,
    password,
  }) => {
    // 1) Create user in Firebase Auth (this is what shows in Firebase Auth -> Users)
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    // 2) Update displayName in Firebase Auth profile (optional but nice)
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // 3) Call backend to write Firestore fields (firstName/lastName/email/etc)
    // IMPORTANT: backend should verify idToken and use decoded.uid, decoded.email
    try {
      const idToken = await user.getIdToken();

      const response = await fetch("http://localhost:8080/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          firstName,
          lastName,
          // you can send email too, but backend should trust decoded.email from token
          email: cleanEmail,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("⚠️ Backend /signup failed:", response.status, text);
        // Not fatal for Firebase Auth user creation — user still exists
        toastNotify("Account created, but profile save failed (backend).", "error");
      }
    } catch (e) {
      console.error("⚠️ Backend call error:", e);
      toastNotify("Account created, but backend unreachable.", "error");
    }

    // 4) Force logout so user must log in using email/password
    await signOut(auth);

    return cleanEmail;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Zod validation (single source of truth)
    const result = individualSignupSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors = zodFieldErrors(result.error);
      setFieldErrors(errors);

      const firstMsg = errors.form || Object.values(errors)[0] || "Invalid form";
      toastNotify(firstMsg, "error");
      return;
    }

    // Clear any previous errors
    setFieldErrors({});

    // Use schema-cleaned values if your schema transforms (trim/lowercase)
    const cleanEmail = result.data.email;
    const cleanFirst = result.data.firstName;
    const cleanLast = result.data.lastName;
    const cleanPassword = result.data.password;

    const displayName = `${cleanFirst} ${cleanLast}`.trim();

    try {
      setLoading(true);

      const createdEmail = await createFirebaseUserAndProfile({
        cleanEmail,
        firstName: cleanFirst,
        lastName: cleanLast,
        displayName,
        password: cleanPassword,
      });

      toastNotify(`Account created! Log in with ${createdEmail}`, "success");

   
      navigate("/", { replace: true });
    } catch (err) {
      console.error("❌ Signup error:", err?.code, err?.message);

      let msg = "Signup failed. Please try again.";
      if (err?.code === "auth/email-already-in-use") msg = "Email already in use. Try logging in.";
      if (err?.code === "auth/invalid-email") msg = "Invalid email address.";
      if (err?.code === "auth/weak-password") msg = "Weak password.";
      if (err?.code === "auth/operation-not-allowed") msg = "Email/Password sign up not enabled.";

      toastNotify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center">
      <div className="w-full max-w-sm bg-gray-200 p-6 rounded-lg shadow-md flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-6 text-black">Individual Sign Up</h2>

        <img src={fingerprint} alt="Fingerprint" className="w-28 h-28 object-contain mb-4" />

        <form className="w-full flex flex-col space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.firstName ? "border-red-600" : "border-black"
              }`}
              autoComplete="given-name"
            />
            {fieldErrors.firstName && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.firstName}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.lastName ? "border-red-600" : "border-black"
              }`}
              autoComplete="family-name"
            />
            {fieldErrors.lastName && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.lastName}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.email ? "border-red-600" : "border-black"
              }`}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.password ? "border-red-600" : "border-black"
              }`}
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.confirmPassword ? "border-red-600" : "border-black"
              }`}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full border-2 font-semibold rounded-full py-2 mt-3 ${
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
