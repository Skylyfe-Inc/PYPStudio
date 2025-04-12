import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: "json" };

// Initialize Firebase Admin SDK
const firebase_admin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database reference
const db = firebase_admin.firestore();

// Verify Firebase ID token
async function verifyToken(idToken) {
    try {
        const decodedToken = await firebase_admin.auth().verifyIdToken(idToken);
        // Token is verified, you can get user information from `decodedToken`
        return decodedToken;
    } catch (error) {
        // Token verification failed
        console.error("Error verifying token:", error);
        return null;
    }
}

export { firebase_admin, db, verifyToken };
