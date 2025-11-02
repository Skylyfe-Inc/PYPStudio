import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import state from "../store";
import logoPlaceholder from "../assets/assets/gotbLogo.png";
import hoodiePlaceholder from "../assets/assets/3d-hoodie-icon.png";

const Cart = () => {
  const navigate = useNavigate();
  const snap = useSnapshot(state);
  const cartItems = Array.isArray(snap.cartItems) ? snap.cartItems : [];

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = typeof item.price === "number" ? item.price : 44.99;
      const quantity = Math.max(0, typeof item.quantity === "number" ? item.quantity : 1);
      return sum + price * quantity;
    }, 0);

    const itemCount = cartItems.reduce(
      (sum, item) => sum + Math.max(0, typeof item.quantity === "number" ? item.quantity : 1),
      0,
    );

    return { subtotal, itemCount };
  }, [cartItems]);

  const adjustQuantity = (id, delta) => {
    state.cartItems = (state.cartItems || []).map((entry) => {
      if (entry.id !== id) return entry;
      const currentQty = Math.max(1, typeof entry.quantity === "number" ? entry.quantity : 1);
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

  const handleCheckout = () => {
    if (!totals.itemCount) return;
    alert("Checkout flow coming soon!");
  };

  const handleStartNewDesign = () => {
    state.intro = false;
    navigate("/home");
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
  const thumbnail =
    item.thumbnail || item.placeholder || hoodiePlaceholder;

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

const CartSummary = ({ totals, onCheckout, onStartNewDesign }) => (
  <article className="grid gap-6 md:grid-cols-[2fr_1fr] md:items-center">
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-zinc-900">Select Vendor</h3>
      <div className="space-y-1 text-sm text-zinc-600">
        <p className="italic text-zinc-800">Hanes</p>
        <button
          type="button"
          className="text-indigo-600 underline decoration-2 underline-offset-2"
        >
          Visit Vendor Profile
        </button>
      </div>
      <div className="flex items-center gap-4">
        <img
          src={logoPlaceholder}
          alt="Hanes logo"
          className="h-20 w-24 rounded-xl border border-zinc-200 object-contain"
        />
        <button
          type="button"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-indigo-500"
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
        <p className="text-xs text-zinc-400">{totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}</p>
        <p className="text-3xl font-black text-zinc-900">${totals.subtotal.toFixed(2)}</p>
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
