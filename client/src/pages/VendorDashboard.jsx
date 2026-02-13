import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import { useState, useEffect, useCallback } from "react";
import state from "../store";
import { auth } from "../config/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import app from "../config/firebase";
import { toastNotify } from "../components/Toast";
import config from "../config/config/config";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const snap = useSnapshot(state);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeStatus, setStripeStatus] = useState({
    onboardingComplete: false,
    payoutsEnabled: false,
    hasAccount: false,
  });

  const mode = import.meta.env.MODE || "development";
  const API_BASE_URL = config[mode]?.backendUrl || config.development.backendUrl;

  /* ---------------------------------------------
     Backend API helper
  --------------------------------------------- */
  const callBackend = async (path) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");

    const idToken = await user.getIdToken();

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Request failed");
    return data;
  };

  /* ---------------------------------------------
     Read Stripe status from Firestore
  --------------------------------------------- */
  const loadStripeFromFirestore = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore(app);
    const snap = await getDoc(doc(db, "users", user.uid));

    if (!snap.exists()) return;

    const d = snap.data();
    setStripeStatus({
      onboardingComplete: !!d.stripeOnboardingComplete,
      payoutsEnabled: !!d.stripePayoutsEnabled,
      hasAccount: !!d.stripeConnectAccountId,
    });
  }, []);

  /* ---------------------------------------------
     Force Stripe → Firestore sync
  --------------------------------------------- */
  const refreshFromStripe = async () => {
    try {
      await callBackend("/api/v1/stripe/connect/refresh-status");
      await loadStripeFromFirestore();
    } catch (e) {
      console.error("Stripe refresh failed:", e);
    }
  };

  /* ---------------------------------------------
     Initial Load + Return from Stripe
  --------------------------------------------- */
  useEffect(() => {
    loadStripeFromFirestore();

    const params = new URLSearchParams(window.location.search);
    const onboarding = params.get("onboarding");

    if (onboarding === "return") {
      toastNotify("Stripe setup submitted. Checking status…", "success");

      // Stripe needs time to process the form
      setTimeout(refreshFromStripe, 2000);
      setTimeout(refreshFromStripe, 6000);
      setTimeout(refreshFromStripe, 12000);
    }

    if (onboarding === "refresh") {
      toastNotify("Finish your Stripe setup", "info");
    }
  }, [loadStripeFromFirestore]);

  /* ---------------------------------------------
     Start onboarding
  --------------------------------------------- */
  const handleStripeOnboard = async () => {
    try {
      setStripeLoading(true);
      const { url } = await callBackend("/api/v1/stripe/connect/onboard");

      // ⚠️ Must use full redirect (Stripe blocks iframe)
      window.location.href = url;
    } catch (err) {
      toastNotify(err.message || "Stripe onboarding failed", "error");
    } finally {
      setStripeLoading(false);
    }
  };

  /* ---------------------------------------------
     Open Express dashboard
  --------------------------------------------- */
  const handleOpenStripeDashboard = async () => {
    try {
      setStripeLoading(true);
      const { url } = await callBackend("/api/v1/stripe/connect/login-link");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toastNotify(err.message || "Failed to open Stripe", "error");
    } finally {
      setStripeLoading(false);
    }
  };

  /* ---------------------------------------------
     UI
  --------------------------------------------- */
  return (
    <div className="h-screen overflow-y-auto bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-black">Vendor Dashboard</h1>

        {/* Stripe Box */}
        <div className="rounded-xl border bg-white p-6 shadow">
          <p className="font-semibold">Stripe Payouts</p>

          <div className="mt-3 flex items-center gap-3">
            {stripeStatus.onboardingComplete ? (
              <>
                <span className="text-green-600">✅</span>
                <span className="text-green-700">Payouts enabled</span>
              </>
            ) : stripeStatus.hasAccount ? (
              <>
                <span className="text-yellow-600">⏳</span>
                <span className="text-yellow-700">Setup in progress</span>
              </>
            ) : (
              <>
                <span className="text-gray-400">⚪</span>
                <span className="text-gray-600">Not configured</span>
              </>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            {stripeStatus.onboardingComplete ? (
              <button
                onClick={handleOpenStripeDashboard}
                disabled={stripeLoading}
                className="rounded bg-black px-4 py-2 text-white"
              >
                Open Stripe Dashboard
              </button>
            ) : (
              <button
                onClick={handleStripeOnboard}
                disabled={stripeLoading}
                className="rounded bg-indigo-600 px-4 py-2 text-white"
              >
                {stripeStatus.hasAccount ? "Finish Stripe Setup" : "Enable Payouts"}
              </button>
            )}

            {!stripeStatus.onboardingComplete && stripeStatus.hasAccount && (
              <button
                onClick={refreshFromStripe}
                className="rounded border px-4 py-2"
              >
                Refresh Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
