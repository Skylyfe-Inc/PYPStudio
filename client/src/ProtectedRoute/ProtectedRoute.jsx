import { Outlet, Navigate } from "react-router-dom";
import AppRoutes from "../config/config/Routes";
import { getToken } from "../config/config/helpers";

const ProtectedRoute = () => {
  const token = getToken();

  // Redirecting if token not found or user not logged in.

  if (!token || token === undefined) {
    return <Navigate to={AppRoutes.Login.path} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
