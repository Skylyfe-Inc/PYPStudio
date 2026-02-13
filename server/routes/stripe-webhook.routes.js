import { Router } from "express";
import Stripe from "stripe";
import { db } from "../utils/firebase.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/v1/stripe/webhook
 * Handle Stripe webhook events, specifically account.updated
 * 
 * IMPORTANT: This route MUST use express.raw() middleware instead of express.json()
 * because Stripe webhook signature verification requires the raw request body.
 * 
 * Mount this route in server/index.js BEFORE express.json():
 * app.post('/api/v1/stripe/webhook', express.raw({type: 'application/json'}), stripeWebhook);
 */
router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Construct the event from the raw body and signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log("✅ Webhook signature verified:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the account.updated event
  if (event.type === "account.updated") {
    const account = event.data.object;
    const acctId = account.id;

    console.log("📥 Processing account.updated for:", acctId);
    console.log("   - details_submitted:", account.details_submitted);
    console.log("   - charges_enabled:", account.charges_enabled);
    console.log("   - payouts_enabled:", account.payouts_enabled);

    try {
      // Find the user document with this Stripe Connect account ID
      const usersQuery = await db
        .collection("users")
        .where("stripeConnectAccountId", "==", acctId)
        .limit(1)
        .get();

      if (usersQuery.empty) {
        console.log("⚠️ No user found with stripeConnectAccountId:", acctId);
        return res.json({ received: true, message: "User not found" });
      }

      const userDocRef = usersQuery.docs[0].ref;
      const uid = usersQuery.docs[0].id;

      // Determine if onboarding is complete
      // Account is fully operational when both details_submitted and charges_enabled are true
      const onboardingComplete = Boolean(
        account.details_submitted && account.charges_enabled
      );

      // Update the user document
      await userDocRef.set(
        {
          stripeOnboardingComplete: onboardingComplete,
          stripePayoutsEnabled: account.payouts_enabled || false,
          stripeChargesEnabled: account.charges_enabled || false,
          stripeDetailsSubmitted: account.details_submitted || false,
        },
        { merge: true }
      );

      console.log(`✅ Updated user ${uid}:`, {
        stripeOnboardingComplete: onboardingComplete,
        stripePayoutsEnabled: account.payouts_enabled || false,
        stripeChargesEnabled: account.charges_enabled || false,
      });
    } catch (error) {
      console.error("❌ Error updating user document:", error);
      return res.status(500).json({ 
        received: true, 
        error: "Failed to update user document" 
      });
    }
  }

  // Return 200 to acknowledge receipt
  return res.json({ received: true });
});

export default router;
