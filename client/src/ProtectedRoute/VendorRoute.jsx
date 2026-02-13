import { Navigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import state from "../store";

/**
 * VendorRoute component protects vendor-only routes
 * Redirects to home if user is not authenticated or not a vendor
 */
export default function VendorRoute({ children }) {
  const snap = useSnapshot(state);

  // If not authenticated, redirect to login
  if (!snap.authUser) {
    return <Navigate to="/" replace />;
  }

  // If not a vendor, redirect to home
  if (snap.userRole !== "vendor") {
    return <Navigate to="/home" replace />;
  }

  // User is authenticated and is a vendor
  return children;
}
