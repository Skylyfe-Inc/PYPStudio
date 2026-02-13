// server/routes/stripe-connect.routes.js
import { Router } from "express";
import Stripe from "stripe";
import { db, FieldValue } from "../utils/firebase.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * Stripe SDK (server-only secret key)
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

/**
 * Frontend URL used for onboarding redirect return/refresh
 * Example: http://localhost:5173
 */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Helper: fetch user doc once
 */
async function getUserDoc(uid) {
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  return { ref, snap, data: snap.exists ? snap.data() : null };
}

/**
 * Helper: enforce vendor-only access based on Firestore doc role
 * (If you later switch to custom claims, update this check accordingly.)
 */
function assertVendorOrThrow(userData) {
  if (userData?.role !== "vendor") {
    const err = new Error("Only vendors can use Stripe Connect.");
    err.statusCode = 403;
    throw err;
  }
}

/**
 * Helper: sanitize + standardize account status payload
 */
function mapAccountStatus(account) {
  const payoutsEnabled = !!account.payouts_enabled;
  const detailsSubmitted = !!account.details_submitted;
  const chargesEnabled = !!account.charges_enabled;
  const onboardingComplete = payoutsEnabled && detailsSubmitted && chargesEnabled;

  // Stripe sometimes provides helpful error / requirements fields
  const requirements = account.requirements || {};
  const currentlyDue = requirements.currently_due || [];
  const eventuallyDue = requirements.eventually_due || [];
  const disabledReason = requirements.disabled_reason || null;

  return {
    payoutsEnabled,
    detailsSubmitted,
    chargesEnabled,
    onboardingComplete,
    currentlyDue,
    eventuallyDue,
    disabledReason,
  };
}

/**
 * Helper: persist status in Firestore
 */
async function writeStripeStatus(ref, status) {
  await ref.set(
    {
      stripeOnboardingComplete: status.onboardingComplete,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeDetailsSubmitted: status.detailsSubmitted,
      stripeChargesEnabled: status.chargesEnabled,
      stripeRequirementsCurrentlyDue: status.currentlyDue,
      stripeRequirementsEventuallyDue: status.eventuallyDue,
      stripeDisabledReason: status.disabledReason,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * GET /api/v1/stripe/connect/ping
 */
router.get("/ping", (req, res) => res.json({ ok: true }));

/**
 * POST /api/v1/stripe/connect/onboard
 * - Creates an Express Connect account once per vendor
 * - Stores stripeConnectAccountId in Firestore
 * - Returns Stripe onboarding URL
 */
router.post("/onboard", requireAuth, async (req, res) => {
  try {
    console.log("=== Stripe Connect: /onboard ===");
    console.log("STRIPE_SECRET_KEY exists?", !!process.env.STRIPE_SECRET_KEY);
    console.log("FRONTEND_URL:", FRONTEND_URL);
    console.log("User UID:", req.user?.uid);
    console.log("User email:", req.user?.email);

    const uid = req.user?.uid;
    const email = req.user?.email;

    if (!uid) return res.status(401).json({ message: "Missing auth user uid" });
    if (!email) return res.status(400).json({ message: "Missing auth user email" });

    const { ref, data } = await getUserDoc(uid);

    // Must have user doc + role vendor
    if (!data) {
      return res.status(404).json({ message: "User profile not found in Firestore (users/{uid})." });
    }
    try {
      assertVendorOrThrow(data);
    } catch (e) {
      return res.status(e.statusCode || 403).json({ message: e.message });
    }

    // 1) Create Connect account if missing
    let accountId = data?.stripeConnectAccountId;

    if (!accountId) {
      console.log("Creating Stripe Express account for vendor:", uid);

      const account = await stripe.accounts.create({
        type: "express",
        email,
        // metadata is super helpful for support/debugging
        metadata: { firebaseUid: uid },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      console.log("Created Stripe account:", accountId);

      // Save baseline + current status snapshot
      const status = mapAccountStatus(account);

      await ref.set(
        {
          stripeConnectAccountId: accountId,
          // baseline flags
          stripeOnboardingComplete: status.onboardingComplete,
          stripePayoutsEnabled: status.payoutsEnabled,
          stripeDetailsSubmitted: status.detailsSubmitted,
          stripeChargesEnabled: status.chargesEnabled,
          // helpful debug/support fields
          stripeRequirementsCurrentlyDue: status.currentlyDue,
          stripeRequirementsEventuallyDue: status.eventuallyDue,
          stripeDisabledReason: status.disabledReason,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      console.log("Using existing Stripe account:", accountId);
    }

    // 2) Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${FRONTEND_URL}/vendor/dashboard?onboarding=refresh`,
      return_url: `${FRONTEND_URL}/vendor/dashboard?onboarding=return`,
    });

    return res.json({ url: accountLink.url, accountId });
  } catch (err) {
    console.error("❌ Stripe /onboard error:", err);
    return res.status(err?.statusCode || 500).json({
      message: "Onboarding failed",
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/stripe/connect/login-link
 * - Creates an Express dashboard login link
 */
router.post("/login-link", requireAuth, async (req, res) => {
  try {
    console.log("=== Stripe Connect: /login-link ===");
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Missing auth user uid" });

    const { data } = await getUserDoc(uid);

    if (!data) return res.status(404).json({ message: "User profile not found." });

    try {
      assertVendorOrThrow(data);
    } catch (e) {
      return res.status(e.statusCode || 403).json({ message: e.message });
    }

    const accountId = data?.stripeConnectAccountId;
    if (!accountId) {
      return res.status(400).json({
        message: "No Stripe Connect account found. Please complete onboarding first.",
      });
    }

    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return res.json({ url: loginLink.url, accountId });
  } catch (err) {
    console.error("❌ Stripe /login-link error:", err);
    return res.status(err?.statusCode || 500).json({
      message: "Failed to create login link",
      error: err.message,
    });
  }
});

/**
 * POST /api/v1/stripe/connect/refresh-status
 * - Fetches latest status from Stripe
 * - Writes status into Firestore
 * - Returns the status payload (handy for UI)
 */
router.post("/refresh-status", requireAuth, async (req, res) => {
  try {
    console.log("=== Stripe Connect: /refresh-status ===");
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: "Missing auth user uid" });

    const { ref, data } = await getUserDoc(uid);
    if (!data) return res.status(404).json({ message: "User profile not found." });

    try {
      assertVendorOrThrow(data);
    } catch (e) {
      return res.status(e.statusCode || 403).json({ message: e.message });
    }

    const accountId = data?.stripeConnectAccountId;
    if (!accountId) {
      return res.status(400).json({
        message: "No Stripe Connect account found. Please complete onboarding first.",
      });
    }

    const account = await stripe.accounts.retrieve(accountId);
    const status = mapAccountStatus(account);

    await writeStripeStatus(ref, status);

    return res.json({
      success: true,
      accountId,
      status,
    });
  } catch (err) {
    console.error("❌ Stripe /refresh-status error:", err);
    return res.status(err?.statusCode || 500).json({
      message: "Failed to refresh status",
      error: err.message,
    });
  }
});

export default router;
