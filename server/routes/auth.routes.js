import { Router } from "express";
import { firebase_admin, db } from "../utils/firebase.js";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

/**
 * POST /api/v1/auth/signup
 * Body:
 *  - idToken: string (required)
 *  - role: "individual" | "vendor" (optional, defaults to "individual")
 *  - firstName, lastName (individual)
 *  - companyName, companyAddress (vendor)
 *
 * This verifies the Firebase ID token, then writes a profile doc into:
 *  - collection "individuals" for individual users
 *  - collection "vendors" for vendors
 *
 * Document ID is the Firebase uid.
 */
router.post("/signup", async (req, res) => {
  try {
    const {
      idToken,
      role = "individual",
      firstName = "",
      lastName = "",
      companyName = "",
      companyAddress = "",
    } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    //  Verify token (ensures user belongs to THIS Firebase project)
    const decodedToken = await firebase_admin.auth().verifyIdToken(idToken);

    if (!decodedToken?.uid || !decodedToken?.email) {
      return res.status(400).json({ message: "Invalid ID token" });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Choose collection by role
    const normalizedRole = String(role).toLowerCase();
    const isVendor = normalizedRole === "vendor";

    // You can name these whatever you want:
    const collectionName = isVendor ? "vendors" : "individuals";

    //  Build common profile data
    const now = new Date().toISOString();

    const displayName = isVendor
      ? String(companyName || "").trim()
      : `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

    const baseProfile = {
      uid,
      email,
      role: isVendor ? "vendor" : "individual",
      displayName: displayName || email,
      updatedAt: now,
      // only set createdAt once (if doc doesn't exist)
    };

    //  Role-specific fields
    const roleFields = isVendor
      ? {
          companyName: String(companyName || "").trim(),
          companyAddress: String(companyAddress || "").trim(),
        }
      : {
          firstName: String(firstName || "").trim(),
          lastName: String(lastName || "").trim(),
        };

    //  Write profile doc
    // Use merge so repeated calls update fields without deleting others
    const docRef = db.collection(collectionName).doc(uid);

    const existing = await docRef.get();
    const createdAt = existing.exists ? existing.data()?.createdAt : now;

    await docRef.set(
      {
        ...baseProfile,
        ...roleFields,
        createdAt,
      },
      { merge: true }
    );

    return res.status(200).json({
      message: "Profile saved successfully",
      uid,
      collection: collectionName,
    });
  } catch (error) {
    console.error("Error saving user data:", error);
    return res.status(500).json({
      message: "Error saving user data",
      error: error.message,
    });
  }
});

// Login endpoint - sets auth token in cookie
router.post("/login", async (req, res) => {
  try {
    const { idToken, refreshToken } = req.body;

    if (!idToken) {
      return res.status(400).send({ message: "ID token is required" });
    }

    const decodedToken = await firebase_admin.auth().verifyIdToken(idToken);

    res.cookie("firebaseAuthToken", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });

    if (refreshToken) {
      res.cookie("firebaseRefreshAuthToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    res.status(200).send({
      message: "Login successful",
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(401).send({ message: "Unauthorized", error: error.message });
  }
});

// Refresh token endpoint
router.get("/refresh-token", async (req, res) => {
  try {
    const redirectPath = req.query.redirect || "/";
    const refreshToken = req.cookies.firebaseRefreshAuthToken;

    if (!refreshToken) {
      return res.redirect(redirectPath);
    }

    // IMPORTANT: this MUST be your Firebase Web API key on the server
    const webApiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!webApiKey) {
      console.error("Missing FIREBASE_WEB_API_KEY in env");
      return res.redirect("/");
    }

    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${webApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to refresh token");
    }

    const newToken = data.id_token;
    const newRefreshToken = data.refresh_token;

    res.cookie("firebaseAuthToken", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });

    res.cookie("firebaseRefreshAuthToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(redirectPath);
  } catch (error) {
    console.error("Failed to refresh token:", error);
    res.redirect("/");
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  res.clearCookie("firebaseAuthToken");
  res.clearCookie("firebaseRefreshAuthToken");
  res.status(200).send({ message: "Logged out successfully" });
});

// Verify token endpoint
router.get("/verify", async (req, res) => {
  try {
    const token =
      req.cookies.firebaseAuthToken ||
      req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).send({ message: "No token provided" });
    }

    const decodedToken = await firebase_admin.auth().verifyIdToken(token);

    res.status(200).send({
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      },
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).send({ valid: false, message: "Invalid token" });
  }
});

export default router;
