import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account from JSON file or environment variables
let serviceAccount;
const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');

try {
  // Try to load from file first
  const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(serviceAccountFile);
  console.log('✓ Loaded service account from serviceAccountKey.json');
} catch (error) {
  // Fallback to environment variables
  console.log('⚠ serviceAccountKey.json not found, using environment variables');
  serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": "googleapis.com"
  };
}

// Initialize Firebase Admin SDK (server-side only)
const firebase_admin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database reference
const db = firebase_admin.firestore();

// Firestore FieldValue helper
const FieldValue = admin.firestore.FieldValue;

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

export { firebase_admin, db, verifyToken, FieldValue };
