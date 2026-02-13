import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../config/firebase";

const db = getFirestore(app);

/**
 * Fetches user role from Firestore users collection
 * @param {string} uid - Firebase user ID
 * @returns {Promise<string>} - "vendor" or "customer"
 */
export async function fetchUserRole(uid) {
  if (!uid) {
    console.log("[fetchUserRole] No uid provided, returning customer");
    return "customer";
  }

  try {
    console.log("[fetchUserRole] Fetching role for uid:", uid);
    const snap = await getDoc(doc(db, "users", uid));
    
    console.log("[fetchUserRole] Document exists?", snap.exists());
    
    if (snap.exists()) {
      const data = snap.data();
      console.log("[fetchUserRole] Document data:", data);
      const role = data?.role;
      console.log("[fetchUserRole] Raw role value:", role);
      const finalRole = role === "vendor" ? "vendor" : "customer";
      console.log("[fetchUserRole] Final role:", finalRole);
      return finalRole;
    }
    
    console.log("[fetchUserRole] Document doesn't exist, returning customer");
    return "customer";
  } catch (error) {
    console.error("[fetchUserRole] Error:", error);
    return "customer";
  }
}
