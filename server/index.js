import express from "express";
import * as dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import { firebase_admin, FieldValue } from './utils/firebase.js';

import dalleRoutes from './routes/dalle.routes.js'; 
import authRoutes from './routes/auth.routes.js';
import designRoutes from './routes/design.routes.js';
import meshyRoutes from './routes/meshy.routes.js';
import printifyRoutes from './routes/printify.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import slant3dRoutes from './routes/slant3d.routes.js';
import stripeConnectRoutes from './routes/stripe-connect.routes.js';

dotenv.config(); // Loads environment variables from .env file

const app = express(); // Creates Express application
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL_ALT,
    'http://localhost:5173',
    'https://www.placeyourprintstudio.com',
    'https://placeyourprintstudio.com',
    'https://place-your-print-studio-6wmitxvtb-skylyfe-inc.vercel.app',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true // Allow cookies to be sent
})); // Enables Cross-Origin Resource Sharing

// ✅ CRITICAL: Stripe webhook MUST be mounted BEFORE express.json()
// because Stripe signature verification requires the raw request body
app.post("/api/v1/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  console.log("🔥 WEBHOOK HIT");
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log("✅ Webhook signature verified:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "account.updated") {
      const account = event.data.object;
      const accountId = account.id;
      const payoutsEnabled = !!account.payouts_enabled;
      const detailsSubmitted = !!account.details_submitted;
      const chargesEnabled = !!account.charges_enabled;
      const onboardingComplete = detailsSubmitted && chargesEnabled && payoutsEnabled;

      console.log("📥 Processing account.updated for:", accountId);
      console.log("   - payouts_enabled:", payoutsEnabled);
      console.log("   - details_submitted:", detailsSubmitted);
      console.log("   - charges_enabled:", chargesEnabled);

      // Find user by stripeConnectAccountId
      const usersQuery = await firebase_admin
        .firestore()
        .collection("users")
        .where("stripeConnectAccountId", "==", accountId)
        .limit(1)
        .get();

      if (!usersQuery.empty) {
        const userDocRef = usersQuery.docs[0].ref;
        const uid = usersQuery.docs[0].id;

        await userDocRef.set(
          {
            stripePayoutsEnabled: payoutsEnabled,
            stripeDetailsSubmitted: detailsSubmitted,
            stripeChargesEnabled: chargesEnabled,
            stripeOnboardingComplete: onboardingComplete,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(`✅ Updated user ${uid}:`, {
          stripeOnboardingComplete: onboardingComplete,
          stripePayoutsEnabled: payoutsEnabled,
        });
      } else {
        console.log("⚠️ No user found with stripeConnectAccountId:", accountId);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler failed:", err);
    return res.status(500).json({ message: "Webhook handler error" });
  }
});

app.use(express.json({limit: "50mb"})) // Sets the limit of the JSON body to 50 MB
app.use(cookieParser()); // Parse cookies

app.options('/generate-image', cors()); // Enable CORS for the OPTIONS request

app.use('/api/v1/images/generations', dalleRoutes); // Adds routes from dalleRoutes
app.use('/api/v1/auth', authRoutes); // Adds routes from authRoutes
app.use('/api/v1/designs', designRoutes); // Adds routes from designRoutes
app.use('/api/v1/meshy', meshyRoutes); // Adds routes for Meshy integration
app.use('/api/v1/printify', printifyRoutes); // Adds routes for Printify catalog
app.use('/api/v1/orders', ordersRoutes); // Adds routes for order drafts
app.use('/api/v1/slant3d', slant3dRoutes); // Adds routes for Slant 3D printing
app.use('/api/v1/stripe/connect', stripeConnectRoutes); // Adds routes for Stripe Connect

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'pypstudio-server',
        timestamp: new Date().toISOString(),
    });
});

app.get('/', (req,res) =>{ // GET request to root endpoint
    res.status(200).json({message: 'Hello From PlaceYourPrintStudio Server'}) // Sends 200 status code and JSON message
})

app.listen(8080, () => console.log('Server has started on Port 8080')) // Listens on port 8080
