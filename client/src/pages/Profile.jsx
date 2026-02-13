import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import previewShirt from "../assets/assets/logo-tshirt.png";
import state from "../store";
import { toastNotify } from "../components/Toast";
import { auth } from "../config/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { removeToken } from "../config/config/helpers";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
  startAfter,
  startAt,
} from "firebase/firestore";
import app from "../config/firebase";

const PROFILE_STORAGE_KEY = "pyp_user_profile";
const SAVED_DESIGNS_KEY = "pyp_saved_designs";

const db = getFirestore(app);

const buildInitials = (displayName, profile = {}) => {
  const source = (displayName || profile.email || "").trim();
  if (!source) return "?";

  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second =
    parts.length > 1
      ? parts[parts.length - 1]?.[0] || ""
      : source.includes("@")
        ? source[1] || ""
        : "";

  const initials = `${first}${second}`.toUpperCase();
  return initials || "?";
};

const Profile = () => {
  const navigate = useNavigate();
  const snap = useSnapshot(state);

  const PAGE_SIZE = 4;

  const [uid, setUid] = useState(null);

  const [pageOrders, setPageOrders] = useState([]); // only current page
  const [ordersPage, setOrdersPage] = useState(1);

  // pagination cursor + mode
  const [pageCursor, setPageCursor] = useState(null); // DocumentSnapshot | null
  const [pageMode, setPageMode] = useState("init");   // "init" | "next" | "goto"

  // for UI buttons
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextCursor, setNextCursor] = useState(null); // DocumentSnapshot | null

  // stack of page-start cursors (DocumentSnapshot for first doc of each page)
  const [pageStartStack, setPageStartStack] = useState([]); // index 0 = page1 start (optional)

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const designs = useMemo(
    () => (Array.isArray(snap.savedDesigns) ? snap.savedDesigns : []),
    [snap.savedDesigns],
  );

  useEffect(() => {
    if (snap.userProfile) return;
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        state.userProfile = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Unable to read stored profile", error);
    }
  }, [snap.userProfile]);

  // Single auth listener (runs once)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUid(null);

        // reset paging
        setOrdersPage(1);
        setPageCursor(null);
        setPageMode("init");
        setPageStartStack([]);
        setHasNextPage(false);
        setNextCursor(null);

        setPageOrders([]);
        setOrdersLoading(false);
        setOrdersError(null);
        return;
      }

      setUid(user.uid);

      // reset paging on login
      setOrdersPage(1);
      setPageCursor(null);
      setPageMode("init");
      setPageStartStack([]);
      setHasNextPage(false);
      setNextCursor(null);

      setOrdersError(null);
      setOrdersLoading(true);
    });

    return () => unsub();
  }, []);

  // Orders listener for "current page only"
  useEffect(() => {
    if (!uid) return;

    setOrdersLoading(true);
    setOrdersError(null);

    const base = query(
      collection(db, "orders"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
    );

    // Fetch PAGE_SIZE + 1 so we can compute hasNextPage.
    let q;
    if (pageMode === "next" && pageCursor) {
      q = query(base, startAfter(pageCursor), limit(PAGE_SIZE + 1));
    } else if (pageMode === "goto" && pageCursor) {
      // goto a known page start cursor (used for Prev)
      q = query(base, startAt(pageCursor), limit(PAGE_SIZE + 1));
    } else {
      // init / page 1
      q = query(base, limit(PAGE_SIZE + 1));
    }

    const unsubOrders = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs; // DocumentSnapshot[]
        const hasExtra = docs.length > PAGE_SIZE;

        const visibleDocs = hasExtra ? docs.slice(0, PAGE_SIZE) : docs;

        // compute hasNext based on extra doc
        setHasNextPage(hasExtra);

        // store the page's FIRST doc cursor in stack so Prev is reliable
        const first = visibleDocs[0] ?? null;

        setPageStartStack((prev) => {
          // ensure we have an entry for this page (1-based)
          const next = [...prev];
          const idx = ordersPage - 1;

          // only set if not already set and cursor exists
          if (first && !next[idx]) next[idx] = first;

          // if we're on page 1, keep stack trimmed to at least 1 element
          return next;
        });

        // store last cursor for Next button
        setNextCursor(visibleDocs[visibleDocs.length - 1] ?? null);

        // map current page
        const mapped = visibleDocs.map((d) => ({ id: d.id, ...d.data() }));
        setPageOrders(mapped);

        setOrdersLoading(false);
      },
      (err) => {
        console.error("Paginated order listener error:", err);
        setOrdersError("Failed to load orders.");
        setOrdersLoading(false);
      },
    );

    return () => unsubOrders();
  }, [uid, pageMode, pageCursor, ordersPage]);

  useEffect(() => {
    if (Array.isArray(snap.savedDesigns) && snap.savedDesigns.length > 0) return;
    try {
      const stored = localStorage.getItem(SAVED_DESIGNS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.savedDesigns = parsed;
        }
      }
    } catch (error) {
      console.warn("Unable to read stored designs", error);
    }
  }, [snap.savedDesigns]);

  // Transform Firestore orders into UI format
  const uiOrders = useMemo(() => {
    return pageOrders.map((o) => {
      const created =
        o.createdAt?.toDate?.()
          ? o.createdAt.toDate()
          : o.createdAt
            ? new Date(o.createdAt)
            : null;

      const date = created
        ? created.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—";

      const totalCents = o.stripe?.amountTotal ?? 0;
      const total = totalCents / 100;

      const status = o.status || "Processing";

      const canCancel = o.canCancel ?? (status === "Processing" || status === "Paid");

      return {
        id: o.id,
        label: `Order #${o.id.slice(0, 6).toUpperCase()}`,
        date,
        total,
        status,
        canCancel,
        thumbnailUrl: o.thumbnailUrl || o.cartItems?.[0]?.thumbnail,
        raw: o,
      };
    });
  }, [pageOrders]);

  const profile = snap.userProfile || {};
  const displayName =
    profile.displayName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.email ||
    "User";
  const initials = useMemo(
    () => buildInitials(displayName, profile),
    [
      displayName,
      profile.email,
      profile.firstName,
      profile.lastName,
    ],
  );
  const splitName = displayName.split(" ").filter(Boolean);
  const profileFields = [
    {
      label: "First name",
      value: profile.firstName || splitName[0] || "Not provided",
    },
    {
      label: "Last name",
      value: profile.lastName || splitName.slice(1).join(" ") || "Not provided",
    },
    { label: "Email", value: profile.email || "Not provided" },
  ];

  const persistDesigns = (nextDesigns) => {
    state.savedDesigns = nextDesigns;
    try {
      localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(nextDesigns));
    } catch (error) {
      console.warn("Unable to persist saved designs", error);
    }
  };

  const handleDeleteDesign = (designId) => {
    const current = Array.isArray(state.savedDesigns) ? state.savedDesigns : [];
    const next = current.filter((design) => design.id !== designId);
    persistDesigns(next);
  };

  const handleEditDesign = (design) => {
    if (!design) return;
    console.debug("[Profile] Edit design clicked", {
      id: design.id,
      signature: design.designSignature,
      name: design.name,
      model: design.model,
    });
    state.intro = false;
    state.editDesignRef = {
      id: design.id,
      designSignature: design.designSignature,
    };
    toastNotify("Opening your design in the customizer...", "success");
    navigate("/home");
  };

  const handleAddDesignToCart = (design) => {
    if (!design) return;
    const price = typeof design.price === "number" ? design.price : 44.99;
    const placeholder = design.placeholder || previewShirt;
    const colorHex = design.color || "#3f3dfa";
    const designSignature = design.designSignature || design.id;
    const label = design.name || "Custom Design";
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? `cart-${crypto.randomUUID()}`
      : `cart-${Date.now()}`;

    const existing = Array.isArray(state.cartItems) ? [...state.cartItems] : [];
    const matchIndex = existing.findIndex(
      (entry) => entry.designSignature === designSignature,
    );

    if (matchIndex !== -1) {
      const matchedItem = existing[matchIndex];
      const nextQuantity =
        Math.max(1, typeof matchedItem.quantity === "number" ? matchedItem.quantity : 1) +
        1;
      existing[matchIndex] = {
        ...matchedItem,
        quantity: nextQuantity,
        thumbnail: design.image || matchedItem.thumbnail || placeholder,
      };
      state.cartItems = existing;
      return;
    }

    const newItem = {
      id,
      model: design.model || "shirt",
      name: label,
      price,
      quantity: 1,
      colorHex,
      createdAt: new Date().toISOString(),
      thumbnail: design.image || placeholder,
      placeholder,
      decals: design.decals || {},
      toggles: design.toggles || {},
      designSignature,
    };

    state.cartItems = [...existing, newItem];
  };

  const handleBackToCustomizer = () => {
    state.intro = false;
    navigate("/home");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Logout failed", error);
    }
    removeToken();
    state.userProfile = null;
    state.editDesignRef = null;
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      console.warn("Unable to clear stored profile", error);
    }
    toastNotify("Logged out successfully.", "success");
    navigate("/");
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "Cancelled",
        cancelledAt: serverTimestamp(),
      });
      toastNotify("Order cancelled.", "success");
    } catch (e) {
      console.error(e);
      toastNotify("Failed to cancel order.", "error");
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-100 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-slate-900 md:text-4xl">
              User Profile
            </h1>
            <div className="hidden items-center gap-3 md:flex">
              {snap.userRole === "vendor" && (
                <button
                  type="button"
                  onClick={() => navigate("/vendor/dashboard")}
                  className="rounded-full border-2 border-emerald-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                >
                  Dashboard
                </button>
              )}
              <button
                type="button"
                onClick={handleBackToCustomizer}
                className="rounded-full border-2 border-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white"
              >
                Customize Again
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border-2 border-rose-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-rose-600 transition hover:bg-rose-500 hover:text-white"
              >
                Logout
              </button>
            </div>
            <button
              type="button"
              onClick={handleBackToCustomizer}
              className="md:hidden inline-flex items-center justify-center rounded-full border-2 border-slate-900 bg-white/90 p-2 text-slate-700 shadow-sm transition hover:bg-slate-900 hover:text-white"
              aria-label="Customize"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="m3 21 1.9-5.7a1.1 1.1 0 0 1 .3-.5l9.9-9.9a2.3 2.3 0 1 1 3.3 3.3L8.5 18.1a1.1 1.1 0 0 1-.5.3L3 20.9" />
                <path d="m12 5 7 7" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="md:hidden inline-flex items-center justify-center self-start rounded-full border-2 border-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:bg-rose-500 hover:text-white"
          >
            Logout
          </button>
          <p className="max-w-3xl text-sm text-slate-600 md:text-base">
            Review your account details, revisit past orders, and keep your
            favorite designs close so you can remix them anytime.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg lg:col-span-1">
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-900 bg-slate-200 text-4xl font-black text-slate-600">
                {initials}
              </div>
              <div className="w-full space-y-3 text-sm text-slate-600">
                {profileFields.map((field) => (
                  <ProfileField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                  />
                ))}
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-600"
              >
                Message
              </button>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg lg:col-span-2">
            <SectionHeading icon="🕒" title="Order History" />
            <div className="mt-5 space-y-4">
              {ordersLoading ? (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Loading orders...
                </p>
              ) : ordersError ? (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-rose-600">
                  {ordersError}
                </p>
              ) : uiOrders.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  No orders yet.
                </p>
              ) : (
                uiOrders.map((order) => (
                  <div
                    key={order.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-400 sm:grid-cols-[auto_1fr_auto]"
                  >
                    <img
                      src={order.thumbnailUrl || previewShirt}
                      alt=""
                      className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{order.label}</p>
                      <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                        <div>{order.date}</div>
                        <div>Sub-total: ${order.total.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {order.status}
                      </span>
                      <div className="flex gap-2">
                        {order.canCancel && (
                          <ProfileActionButton
                            label="Cancel Item"
                            tone="danger"
                            onClick={() => handleCancelOrder(order.id)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {!ordersLoading && !ordersError && (
              <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Page <span className="text-slate-700">{ordersPage}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={ordersPage === 1}
                    onClick={() => {
                      if (ordersPage === 1) return;

                      const prevPage = ordersPage - 1;

                      // If going back to page 1, no cursor needed (init query)
                      if (prevPage === 1) {
                        setOrdersPage(1);
                        setPageMode("init");
                        setPageCursor(null);
                        return;
                      }

                      // Use the stored cursor for the previous page start
                      const prevCursor = pageStartStack[prevPage - 1];
                      if (!prevCursor) {
                        // fallback: go to page 1 if stack missing
                        setOrdersPage(1);
                        setPageMode("init");
                        setPageCursor(null);
                        return;
                      }

                      setOrdersPage(prevPage);
                      setPageMode("goto");
                      setPageCursor(prevCursor);
                    }}
                    className="rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>

                  <button
                    type="button"
                    disabled={!hasNextPage || !nextCursor}
                    onClick={() => {
                      if (!hasNextPage || !nextCursor) return;

                      setOrdersPage((p) => p + 1);
                      setPageMode("next");
                      setPageCursor(nextCursor);
                    }}
                    className="rounded-full border-2 border-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg">
          <SectionHeading icon="🎨" title="Profile Designs" />
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="flex w-full items-center gap-2 rounded-full border-2 border-slate-900 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:max-w-md">
                <span className="font-semibold uppercase tracking-wide">Search</span>
                <input
                  type="search"
                  placeholder="Search for a design"
                  className="w-full border-none bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>

            <div className="space-y-3">
              {designs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  No saved designs yet.
                </p>
              ) : (
                designs.map((design) => (
                  <div
                    key={design.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-400 sm:grid-cols-[auto_1fr_auto]"
                  >
                    <img
                      src={design.image || previewShirt}
                      alt={design.name}
                      className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {design.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Last edited: {design.updatedAt}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
                      <ProfileActionButton
                        label="Add to Cart"
                        tone="primary"
                        onClick={() => handleAddDesignToCart(design)}
                      />
                      <ProfileActionButton
                        label="Edit Design"
                        tone="default"
                        onClick={() => handleEditDesign(design)}
                      />
                      <ProfileActionButton
                        label="Delete Design"
                        tone="danger"
                        onClick={() => handleDeleteDesign(design.id)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const SectionHeading = ({ icon, title }) => (
  <div className="flex items-center gap-3">
    <span className="text-2xl" aria-hidden="true">
      {icon}
    </span>
    <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
      {title}
    </h2>
  </div>
);

const ProfileField = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
  </div>
);

const tones = {
  primary:
    "bg-sky-500 text-white hover:bg-sky-600 focus-visible:bg-sky-600 focus-visible:ring-sky-700",
  default:
    "bg-amber-400 text-slate-900 hover:bg-amber-300 focus-visible:bg-amber-300 focus-visible:ring-amber-500",
  danger:
    "bg-rose-500 text-white hover:bg-rose-600 focus-visible:bg-rose-600 focus-visible:ring-rose-700",
};

const ProfileActionButton = ({ label, tone = "default", onClick }) => {
  const variant = tones[tone] || tones.default;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variant}`}
    >
      {label}
    </button>
  );
};

export default Profile;
