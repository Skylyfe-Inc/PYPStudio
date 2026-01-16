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

import { vendorSignupSchema, zodFieldErrors } from "../validation/authSchemas";

const VendorSignUp = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const navigate = useNavigate();

  /**
   * Creates Firebase Auth user (shows up in Firebase Console -> Authentication -> Users)
   * Then calls backend to write vendor profile fields to Firestore.
   */
  const createFirebaseVendorAndProfile = async ({
    cleanEmail,
    cleanCompanyName,
    cleanCompanyAddress,
    cleanPassword,
  }) => {
    //  Debug visibility (helps you confirm what's being sent)
    console.log("🚀 VendorSignUp submit fired");
    console.log("🔥 Firebase projectId:", auth?.app?.options?.projectId);
    console.log("🏢 companyName:", JSON.stringify(cleanCompanyName));
    console.log("📍 companyAddress:", JSON.stringify(cleanCompanyAddress));
    console.log("📧 email:", JSON.stringify(cleanEmail));

    // 1) Create vendor in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    const user = cred.user;

    // 2) Optional: set displayName to companyName
    if (cleanCompanyName) {
      await updateProfile(user, { displayName: cleanCompanyName });
    }

    // 3) Call backend to store vendor fields in Firestore
    // Backend verifies idToken and uses decoded.uid/decoded.email as source of truth
    try {
      const idToken = await user.getIdToken();

      const response = await fetch("http://localhost:8080/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idToken,
          role: "vendor",
          companyName: cleanCompanyName,          // send cleaned value
          companyAddress: cleanCompanyAddress,    // send cleaned value
          // email is optional; backend should prefer decodedToken.email
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("⚠️ Backend /signup failed:", response.status, text);
        toastNotify("Account created, but vendor profile save failed (backend).", "error");
      } else {
        const json = await response.json().catch(() => null);
        console.log("✅Backend /signup success:", json);
      }
    } catch (e) {
      console.error("⚠️ Backend call error:", e);
      toastNotify("Account created, but backend unreachable.", "error");
    }

    // 4) Force logout so vendor must log in after signup
    await signOut(auth);

    return cleanEmail;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Zod validation (single source of truth)
    const result = vendorSignupSchema.safeParse({
      companyName,
      companyAddress,
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

    // clear old errors
    setFieldErrors({});

    // ALWAYS use schema-cleaned values after validation
    const cleanEmail = result.data.email;
    const cleanCompanyName = result.data.companyName;
    const cleanCompanyAddress = result.data.companyAddress;
    const cleanPassword = result.data.password;

    try {
      setLoading(true);

      const createdEmail = await createFirebaseVendorAndProfile({
        cleanEmail,
        cleanCompanyName,
        cleanCompanyAddress,
        cleanPassword,
      });

      toastNotify(`Vendor account created! Log in with ${createdEmail}`, "success");
      navigate("/", { replace: true }); // send to login route
    } catch (err) {
      console.error("❌ Vendor signup error:", err?.code, err?.message);

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
      <div className="w-full max-w-sm p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4 text-black">VENDOR SIGN UP</h2>

        <img
          src={fingerprint}
          alt="Fingerprint"
          className="w-20 h-20 object-contain mb-6"
        />

        <form className="w-full flex flex-col space-y-3" onSubmit={handleSubmit} noValidate>
          <div>
            <input
              type="text"
              placeholder="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.companyName ? "border-red-600" : "border-black"
              }`}
              autoComplete="organization"
            />
            {fieldErrors.companyName && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.companyName}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder="Company Address"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className={`w-full bg-white border-4 rounded-md px-4 py-2 focus:outline-none ${
                fieldErrors.companyAddress ? "border-red-600" : "border-black"
              }`}
              autoComplete="street-address"
            />
            {fieldErrors.companyAddress && (
              <p className="text-red-600 mt-1 text-sm">{fieldErrors.companyAddress}</p>
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

export default VendorSignUp;
