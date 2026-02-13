import { firebase_admin } from "../utils/firebase.js";

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Attaches decoded user info to req.user
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    
    if (!match) {
      return res.status(401).json({ message: "Missing Bearer token" });
    }

    const idToken = match[1];
    const decoded = await firebase_admin.auth().verifyIdToken(idToken);
    
    // Attach decoded token to request object
    // Contains: uid, email, name, picture, etc.
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
