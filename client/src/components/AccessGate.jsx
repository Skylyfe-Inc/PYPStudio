import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "pyps_site_access";
const DEFAULT_PASSWORD = import.meta.env.VITE_SITE_ACCESS_PASSWORD || "";

const AccessGate = ({ children }) => {
  const [attempt, setAttempt] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const secret = useMemo(() => DEFAULT_PASSWORD.trim(), []);

  useEffect(() => {
    if (!secret) {
      setIsUnlocked(true);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored === secret) {
        setIsUnlocked(true);
      }
    } catch (_) {
      // ignore storage errors (private mode, etc.)
    }
  }, [secret]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!secret) {
      setIsUnlocked(true);
      return;
    }
    if (attempt.trim() === secret) {
      try {
        localStorage.setItem(STORAGE_KEY, secret);
      } catch (_) {
        // ignore storage failures
      }
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (isUnlocked) return children;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900">
      <div className="w-[min(92vw,340px)] rounded-2xl bg-white px-6 py-8 shadow-2xl">
        <h1 className="text-lg font-semibold text-slate-900">Enter Access Code</h1>
        {secret ? (
          <p className="mt-1 text-sm text-slate-600">
            This preview is protected. Enter the access password to continue.
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            Access password is not configured. Please set <code>VITE_SITE_ACCESS_PASSWORD</code>.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            value={attempt}
            onChange={(event) => setAttempt(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="Password"
            autoComplete="current-password"
            disabled={!secret}
          />
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={!secret || !attempt.trim()}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessGate;
