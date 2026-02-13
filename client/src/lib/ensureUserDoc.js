import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import app from "../config/firebase";

const db = getFirestore(app);

/**
 * Creates or updates a user document in Firestore users collection
 * @param {Object} user - Firebase auth user object
 * @param {string} role - User role ("customer" or "vendor")
 */
export async function ensureUserDoc(user, role = "customer") {
  if (!user?.uid) {
    console.log("[ensureUserDoc] No user uid, skipping");
    return;
  }

  const finalRole = role === "vendor" ? "vendor" : "customer";
  console.log("[ensureUserDoc] Creating/updating doc for uid:", user.uid, "with role:", finalRole);

  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email || "",
        role: finalRole,
        stripeConnectAccountId: "",
        stripeOnboardingComplete: false,
        stripePayoutsEnabled: false,
        stripeChargesEnabled: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("[ensureUserDoc] Successfully saved document");
  } catch (error) {
    console.error("[ensureUserDoc] Error saving document:", error);
    throw error;
  }
}
