import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import state from "../store";

import logoPlaceholder from "../assets/assets/gotbLogo.png";
import hoodiePlaceholder from "../assets/assets/3d-hoodie-icon.png";

import { getCurrentUserOrThrow } from "../lib/stripePayments";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "../config/firebase";

const PRINTIFY_LOGO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='80' viewBox='0 0 160 80'><rect width='160' height='80' rx='18' fill='%23111827'/><text x='50%25' y='50%25' fill='white' font-family='Arial, sans-serif' font-size='20' font-weight='700' text-anchor='middle' dominant-baseline='middle'>Printify</text></svg>";

const db = getFirestore(app);

/** Deep sanitization for Firestore - handles nested objects, proxies, etc. */
const isPlainObject = (v) =>
  v !== null && typeof v === "object" && (v.constructor === Object || Object.getPrototypeOf(v) === null);

const toFirestoreSafe = (value, path = "root") => {
  // remove undefined
  if (value === undefined) return undefined;

  // allow primitives + null
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;

  // allow Date (convert to ISO string)
  if (value instanceof Date) return value.toISOString();

  // arrays
  if (Array.isArray(value)) {
    const arr = value
      .map((v, i) => toFirestoreSafe(v, `${path}[${i}]`))
      .filter((v) => v !== undefined);
    return arr;
  }

  // plain objects only
  if (isPlainObject(value)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = toFirestoreSafe(v, `${path}.${k}`);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }

  // everything else is invalid (Proxy, Map, Set, File, Blob, HTMLImageElement, etc.)
  return String(value);
};

/**
 * Only keep fields you actually need in Firestore.
 * This avoids accidentally storing nested entities like decals/toggles/proxies.
 * Returns a plain object with ONLY primitive values (strings/numbers).
 */
const pickOrderItem = (i) => {
  // Explicitly build a plain object with only primitives - no sanitizer wrapper
  const item = {
    id: String(i.id || ""),
    name: String(i.name || "Custom Design"),
    price: Number(i.price) || 0,
    quantity: Number(i.quantity) || 1,
    model: String(i.model || "shirt"),
  };

  // Conditionally add string fields only if they exist and are strings
  if (typeof i.thumbnail === "string" && i.thumbnail) item.thumbnail = i.thumbnail;
  if (typeof i.placeholder === "string" && i.placeholder) item.placeholder = i.placeholder;
  if (typeof i.imageURL === "string" && i.imageURL) item.imageURL = i.imageURL;
  if (typeof i.colorHex === "string" && i.colorHex) item.colorHex = i.colorHex;
  if (typeof i.colorLabel === "string" && i.colorLabel) item.colorLabel = i.colorLabel;
  if (typeof i.designName === "string" && i.designName) item.designName = i.designName;
  if (typeof i.designId === "string" && i.designId) item.designId = i.designId;
  if (typeof i.designSignature === "string" && i.designSignature) item.designSignature = i.designSignature;
  if (typeof i.stripePriceId === "string" && i.stripePriceId) item.stripePriceId = i.stripePriceId;

  return item;
};

const normalizeName = (user) => {
  let firstName = "";
  let lastName = "";

  if (user?.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  if (!firstName || !lastName) {
    const fullName = window.prompt(
      "Please enter your full name (First Last):",
      user?.displayName || ""
    );
    if (!fullName || !fullName.trim()) return null;

    const parts = fullName.trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || parts[0] || "";
  }

  return { firstName, lastName };
};

/**
 * Waits for the Stripe extension to write back either `url` or `error`
 * on the checkout_sessions/{docId} document.
 */
const waitForCheckoutUrl = (uid, sessionDocId) =>
  new Promise((resolve, reject) => {
    const ref = doc(db, "customers", uid, "checkout_sessions", sessionDocId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        if (!data) return;

        if (data.error) {
          unsub();
          reject(
            new Error(
              data.error?.message ||
                data.error?.error?.message ||
                "Stripe checkout session failed."
            )
          );
          return;
        }

        if (data.url) {
          unsub();
          resolve(data.url);
        }
      },
      (err) => {
        unsub();
        reject(err);
      }
    );
  });

const Cart = () => {
  const navigate = useNavigate();
  const snap = useSnapshot(state);
  const cartItems = Array.isArray(snap.cartItems) ? snap.cartItems : [];

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = typeof item.price === "number" ? item.price : 44.99;
      const quantity = Math.max(
        0,
        typeof item.quantity === "number" ? item.quantity : 1
      );
      return sum + price * quantity;
    }, 0);

    const itemCount = cartItems.reduce(
      (sum, item) =>
        sum + Math.max(0, typeof item.quantity === "number" ? item.quantity : 1),
      0
    );

    return { subtotal, itemCount };
  }, [cartItems]);

  const provider = snap.selectedPrintProvider || {};
  const providerName =
    provider.name || provider.title || provider.company || "Printify Provider";
  const providerLogo = provider.logo || PRINTIFY_LOGO;
  const providerUrl = provider.url || "";

  const adjustQuantity = (id, delta) => {
    state.cartItems = (state.cartItems || []).map((entry) => {
      if (entry.id !== id) return entry;
      const currentQty = Math.max(
        1,
        typeof entry.quantity === "number" ? entry.quantity : 1
      );
      const nextQty = Math.max(1, currentQty + delta);
      return { ...entry, quantity: nextQty };
    });
  };

  const handleRemove = (id) => {
    state.cartItems = (state.cartItems || []).filter((entry) => entry.id !== id);
  };

  const handleClear = () => {
    state.cartItems = [];
  };

  const handleCheckout = async () => {
    try {
      if (!totals.itemCount) return;

      // 1) Require login (Stripe extension ties sessions to customers/{uid})
      const user = getCurrentUserOrThrow();
      const uid = user.uid;

      // 2) Get name
      const name = normalizeName(user);
      if (!name) {
        alert("Name is required for checkout.");
        return;
      }
      const { firstName, lastName } = name;

      // 3) Create minimal order - just the essentials
      const orderPayload = {
        userId: uid,
        email: user.email || "",
        firstName,
        lastName,
        status: "pending",
        createdAt: serverTimestamp(),
        subtotal: Number(totals.subtotal) || 0,
        itemCount: Number(totals.itemCount) || 0,
      };

      const orderRef = await addDoc(collection(db, "orders"), orderPayload);

      // 4) Ensure customers/{uid} exists for the Stripe extension
      await setDoc(
        doc(db, "customers", uid),
        {
          email: user.email ?? null,
          firstName,
          lastName,
        },
        { merge: true }
      );

      // 5) Create checkout session
      const priceId = cartItems?.[0]?.stripePriceId;
      if (!priceId) throw new Error("Missing stripePriceId on cart item.");

      const sessionRef = await addDoc(
        collection(db, "customers", uid, "checkout_sessions"),
        {
          price: priceId,
          mode: "payment",
          success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cart`,
          allow_promotion_codes: true,
          metadata: {
            orderId: orderRef.id,
            userId: uid,
          },
        }
      );

      // 6) Wait for url then redirect
      const url = await waitForCheckoutUrl(uid, sessionRef.id);
      window.location.assign(url);
    } catch (err) {
      console.error("❌ Checkout failed - Full error:", err);
      console.error("❌ Error name:", err?.name);
      console.error("❌ Error message:", err?.message);
      console.error("❌ Error code:", err?.code);
      console.error("❌ Error stack:", err?.stack);
      alert(err?.message || err?.code || "Checkout failed. Check console for details.");
    }
  };

  const handleStartNewDesign = () => {
    state.intro = false;
    navigate("/home");
  };

  const handleSelectVendor = () => {
    navigate("/printify-catalog");
  };

  const isEmpty = cartItems.length === 0;

  return (
    <div className="h-screen overflow-y-auto bg-zinc-200 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="rounded-3xl bg-white px-6 py-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-900 text-2xl">
                🛒
              </div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-zinc-900">
                My Cart
              </h1>
            </div>
            {!isEmpty && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-semibold text-rose-600 transition hover:text-rose-500"
              >
                Remove all
              </button>
            )}
          </div>
        </header>

        <section className="rounded-3xl bg-white px-6 py-8 shadow-lg">
          {isEmpty ? (
            <div className="text-center">
              <p className="text-lg font-semibold text-zinc-800">
                Your cart is empty.
              </p>
              <button
                type="button"
                onClick={handleStartNewDesign}
                className="mt-4 inline-flex items-center justify-center rounded-full border-2 border-zinc-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-zinc-900 hover:text-white"
              >
                Start a new design
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                {cartItems.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onDecrease={() => adjustQuantity(item.id, -1)}
                    onIncrease={() => adjustQuantity(item.id, 1)}
                    onRemove={() => handleRemove(item.id)}
                    onCustomize={handleStartNewDesign}
                    showDivider={index !== cartItems.length - 1}
                  />
                ))}
              </div>

              <CartSummary
                totals={totals}
                onCheckout={handleCheckout}
                onStartNewDesign={handleStartNewDesign}
                providerName={providerName}
                providerLogo={providerLogo}
                providerUrl={providerUrl}
                onSelectVendor={handleSelectVendor}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const CartItem = ({ item, onDecrease, onIncrease, onRemove, onCustomize, showDivider }) => {
  const quantity = Math.max(1, typeof item.quantity === "number" ? item.quantity : 1);
  const priceEach = typeof item.price === "number" ? item.price : 44.99;
  const lineTotal = priceEach * quantity;

  const colorHex = typeof item.colorHex === "string" ? item.colorHex : "#3f3dfa";
  const colorLabel = item.colorLabel || colorHex;

  const designName = item.name || "Custom Design";

  // ✅ REVERTED: preserve original display logic
  const thumbnail = item.thumbnail || item.placeholder || hoodiePlaceholder;

  return (
    <article
      className={`flex flex-col gap-6 md:flex-row md:items-center md:justify-between ${
        showDivider ? "border-b border-zinc-200 pb-6 md:pb-8" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <img
          src={thumbnail}
          alt={designName}
          className="h-24 w-24 rounded-2xl border border-zinc-200 object-cover"
        />
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{designName}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
              <span
                className="h-3 w-3 rounded-full border border-zinc-300"
                style={{ backgroundColor: colorHex }}
              />
              <span>{colorLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-semibold text-zinc-800">
            <QuantityButton label="-" onClick={onDecrease} disabled={quantity <= 1} />
            <span className="min-w-[2rem] text-center text-base">{quantity}</span>
            <QuantityButton label="+" onClick={onIncrease} />
          </div>

          <button
            type="button"
            onClick={onCustomize}
            className="text-sm font-semibold text-indigo-600 underline decoration-2 underline-offset-2"
          >
            Continue customizing
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-3 text-right">
        <p className="text-xl font-bold text-zinc-900">${lineTotal.toFixed(2)}</p>
        <button
          type="button"
          className="text-sm font-semibold text-indigo-600 underline decoration-2 underline-offset-2"
        >
          Save for later
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-semibold text-rose-600 underline decoration-2 underline-offset-2"
        >
          Remove
        </button>
      </div>
    </article>
  );
};

const CartSummary = ({
  totals,
  onCheckout,
  onStartNewDesign,
  providerName,
  providerLogo,
  providerUrl,
  onSelectVendor,
}) => (
  <article className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-center">
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-zinc-900">Selected Vendor</h3>
      <div className="space-y-1 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-800">{providerName}</p>
        {providerUrl ? (
          <a
            href={providerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline decoration-2 underline-offset-2"
          >
            Provider info
          </a>
        ) : (
          <span className="text-xs text-zinc-400">Provider info unavailable</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <img
          src={providerLogo || logoPlaceholder}
          alt={`${providerName} logo`}
          className="h-20 w-24 rounded-xl border border-zinc-200 object-contain"
        />
        <button
          type="button"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-indigo-500"
          onClick={onSelectVendor}
        >
          Select
        </button>
      </div>
    </div>

    <div className="flex flex-col items-end gap-4 text-right">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Sub-total
        </p>
        <p className="text-xs text-zinc-400">
          {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}
        </p>
        <p className="text-3xl font-black text-zinc-900">
          ${totals.subtotal.toFixed(2)}
        </p>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        disabled={!totals.itemCount}
        className={`w-full max-w-[200px] rounded-full border-2 border-zinc-900 px-6 py-2 text-sm font-semibold uppercase tracking-wide transition ${
          totals.itemCount
            ? "bg-amber-400 text-zinc-900 hover:bg-amber-300"
            : "cursor-not-allowed bg-zinc-200 text-zinc-400"
        }`}
      >
        Checkout
      </button>
      <button
        type="button"
        onClick={onStartNewDesign}
        className="w-full max-w-[200px] rounded-full bg-black px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-900"
      >
        New Design
      </button>
    </div>
  </article>
);

const QuantityButton = ({ label, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-zinc-900 text-sm font-bold transition ${
      disabled
        ? "cursor-not-allowed border-zinc-200 text-zinc-300"
        : "bg-white text-zinc-900 hover:bg-zinc-900 hover:text-white"
    }`}
  >
    {label}
  </button>
);

export default Cart;
