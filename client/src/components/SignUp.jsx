import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { signupFields } from "../config/config/constants";
import { toastNotify } from "./Toast";
import FormAction from "./FormAction";
import Input from "./Input";

const fields = signupFields;
const fieldsState = fields.reduce((acc, f) => ({ ...acc, [f.id]: "" }), {});

export default function Signup() {
  const navigate = useNavigate();
  const [signupState, setSignupState] = useState(fieldsState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setSignupState({ ...signupState, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createAccount();
  };

  const createAccount = async () => {
    const username = (signupState.username || "").trim();
    const rawEmail = signupState["email-address"] ?? "";
    const email = rawEmail.trim().toLowerCase();
    const password = signupState.password ?? "";
    const confirmPassword = signupState["confirm-password"] ?? "";

    //  Validation
    if (!username || !email || !password || !confirmPassword) {
      toastNotify("Please fill in all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      toastNotify("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      toastNotify("Password must be at least 6 characters", "error");
      return;
    }

    // Debug: confirm which Firebase project this auth instance belongs to
    console.log("✅ Signup component running");
    console.log("🔥 Firebase projectId (client):", auth?.app?.options?.projectId);
    console.log("🧾 SIGNUP email raw:", JSON.stringify(email));
    console.log("🧾 SIGNUP password length:", password.length);

    try {
      setLoading(true);

      // CREATE user in Firebase Auth (this is what makes it appear in Firebase Console → Users)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ SIGNUP created UID:", user.uid);
      console.log("✅ SIGNUP created EMAIL:", user.email);

      //  Set display name in Firebase Auth profile
      await updateProfile(user, { displayName: username });
      console.log("✅ SIGNUP updated displayName:", username);

      //  Get token for backend (best practice)
      const idToken = await user.getIdToken();

      //  Save extra profile info to your backend/Firestore 
      // If this fails, the Firebase user STILL exists.
      try {
        const response = await fetch("http://localhost:8080/api/v1/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            username,
          }),
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          console.error("⚠️ Backend /signup failed:", response.status, errText);
          toastNotify("Firebase account created, but backend profile save failed.", "error");
        } else {
          console.log("✅ Backend profile saved");
        }
      } catch (backendErr) {
        console.error("⚠️ Backend /signup request error:", backendErr);
        toastNotify("Firebase account created, but backend was unreachable.", "error");
      }

      toastNotify(`Account created! Now log in with ${email}`, "success");

      //  Optional: force logout so user must log in after signup
      await signOut(auth);

      //  Navigate to login
      navigate("/");
    } catch (error) {
      console.error("❌ SIGNUP FAILED:", error.code, error.message);

      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Try logging in instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/Password sign-up is not enabled in Firebase.";
      }

      toastNotify(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div>
        {fields.map((field) => (
          <Input
            key={field.id}
            handleChange={handleChange}
            value={signupState[field.id]}
            labelText={field.labelText}
            labelFor={field.labelFor}
            id={field.id}
            name={field.name}
            type={field.type}
            isRequired={field.isRequired}
            placeholder={field.placeholder}
          />
        ))}

        <FormAction
          handleSubmit={handleSubmit}
          text={loading ? "Creating Account..." : "Signup"}
          disabled={loading}
        />
      </div>
    </form>
  );
}
