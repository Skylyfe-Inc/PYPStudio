import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import previewShirt from "../assets/assets/logo-tshirt.png";
import state from "../store";

const ordersSeed = [
  {
    id: "A1029",
    label: "Order #A1029",
    date: "Feb 16, 2024",
    total: 44.99,
    status: "Shipped",
    canCancel: false,
  },
  {
    id: "A0981",
    label: "Order #A0981",
    date: "Jan 12, 2024",
    total: 59.49,
    status: "Processing",
    canCancel: true,
  },
];

const designsSeed = [
  {
    id: "design-1",
    name: "Electric Violet Tee",
    updatedAt: "Feb 16, 2024",
    image: previewShirt,
  },
  {
    id: "design-2",
    name: "Sunset Gradient Hoodie",
    updatedAt: "Jan 26, 2024",
    image: previewShirt,
  },
];

const Profile = () => {
  const navigate = useNavigate();

  const orders = useMemo(() => ordersSeed, []);
  const designs = useMemo(() => designsSeed, []);

  const handleBackToCustomizer = () => {
    state.intro = false;
    navigate("/home");
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-100 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-slate-900 md:text-4xl">
              User Profile
            </h1>
            <button
              type="button"
              onClick={handleBackToCustomizer}
              className="hidden rounded-full border-2 border-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white md:inline-flex"
            >
              Customize Again
            </button>
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
          <p className="max-w-3xl text-sm text-slate-600 md:text-base">
            Review your account details, revisit past orders, and keep your
            favorite designs close so you can remix them anytime.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-lg lg:col-span-1">
            <div className="flex flex-col items-center gap-5">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-900 bg-slate-200 text-4xl font-black text-slate-600">
                JD
              </div>
              <div className="w-full space-y-3 text-sm text-slate-600">
                <ProfileField label="First name" value="Jordan" />
                <ProfileField label="Last name" value="Doe" />
                <ProfileField label="Email" value="jordan.doe@email.com" />
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
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-400 sm:grid-cols-[auto_1fr_auto]"
                >
                  <img
                    src={previewShirt}
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
                        />
                      )}
                      <ProfileActionButton label="Add to Bag" tone="primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              <button
                type="button"
                className="rounded-full border-2 border-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-900 hover:text-white"
              >
                Upload New Design
              </button>
            </div>

            <div className="space-y-3">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="grid gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-slate-400 sm:grid-cols-[auto_1fr_auto]"
                >
                  <img
                    src={design.image}
                    alt={design.name}
                    className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{design.name}</p>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Last edited: {design.updatedAt}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
                    <ProfileActionButton label="Add to Cart" tone="primary" />
                    <ProfileActionButton label="Edit Design" tone="default" />
                    <ProfileActionButton label="Delete Design" tone="danger" />
                  </div>
                </div>
              ))}
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

const ProfileActionButton = ({ label, tone = "default" }) => {
  const variant = tones[tone] || tones.default;
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${variant}`}
    >
      {label}
    </button>
  );
};

export default Profile;
