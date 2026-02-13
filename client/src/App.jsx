import React, { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toast } from "./components/Toast";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import AppRoutes from "./config/config/Routes";
import Loading from "./components/Loading";
import { getToken } from "./config/config/helpers";
import state from "./store";
import Layout from "./pages/Layout";
import { useSnapshot } from "valtio";
import AccessGate from "./components/AccessGate";
import { auth } from "./config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fetchUserRole } from "./lib/fetchUserRole";
import { ensureUserDoc } from "./lib/ensureUserDoc";

// Using Lazy loading so as to improve the app performance. Only load pages when ever needed.
const NotFound = React.lazy(() => import("./pages/NotFound"));
//const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const SignupPage = React.lazy(() => import("./pages/SignUpPage"));
const Home = React.lazy(() => import("./pages/Home"));
const Customizer = React.lazy(() => import("./pages/Customizer"));
const Canvas = React.lazy(() => import("./canvas"));
const Cart = React.lazy(() => import("./pages/Cart"));
const Profile = React.lazy(() => import("./pages/Profile"));
const VendorSignUpPage = React.lazy(() => import("./pages/VendorSignUp"));
const LoginStudio = React.lazy(() => import("./pages/LoginStudio"));
const IndividualSignUp = React.lazy(() => import("./pages/IndividualSignUp"));
const WelcomeAiStudio = React.lazy(() => import("./pages/WelcomeAiStudio"));
const PrintifyCatalog = React.lazy(() => import("./pages/PrintifyCatalog"));
const OrderConfirmation = React.lazy(() => import("./pages/OrderConfirmation"));
const VendorDashboard = React.lazy(() => import("./pages/VendorDashboard"));
import VendorRoute from "./ProtectedRoute/VendorRoute";
function App() {
    const snap = useSnapshot(state);

    const token = getToken(); // fetching the token.

    //setting the initial state of intro to true if the user is already logged in.
    useEffect(() => {
        if (token || token !== undefined) state.intro = true;
    }, [token])

    // Auth listener to fetch user role from custom claims
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            state.authUser = user || null;

            if (!user) {
                state.userRole = "customer";
                return;
            }

            try {
                // Read role from custom claims (server-side controlled)
                const tokenResult = await user.getIdTokenResult(true);
                const role = tokenResult?.claims?.role;

                state.userRole = role === "vendor" ? "vendor" : "customer";

                console.log("[role] uid=", user.uid, "role=", state.userRole, "from claims");
                console.log("[claims]", tokenResult?.claims);
            } catch (e) {
                console.warn("Failed to fetch token claims:", e);
                state.userRole = "customer";
            }
        });

        return () => unsub();
    }, []);


    return (
        <Suspense fallback={<Loading />}>
            <AccessGate>
            <main className="app transtion-allease-in">
                <Toast /> {/*Toast Notification Component to view toast */}
                {/* Routes setup */}
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LoginStudio />} />
                    <Route path={AppRoutes.SignUp.path} element={<SignupPage />} />
                    <Route path={AppRoutes.WelcomeAiStudio.path} element={<WelcomeAiStudio />} />

                    <Route path={AppRoutes.IndividualSignUp.path} element={<IndividualSignUp />} />


                    <Route path={AppRoutes.VendorSignUpPage.path} element={<VendorSignUpPage />} />
                     <Route path={AppRoutes.Customizer.path} element={<Customizer />} />
                    <Route path={AppRoutes.OrderConfirmation.path} element={<OrderConfirmation />} />
                    
                    {/* Vendor-only Routes */}
                    <Route
                        path={AppRoutes.VendorDashboard.path}
                        element={
                            <VendorRoute>
                                <VendorDashboard />
                            </VendorRoute>
                        }
                    />
                    
                    {/* Protected Routes => view protected routes component */}
                    <Route element={<ProtectedRoute />}>



                       
                        <Route path={AppRoutes.Home.path} element={<Layout />}>

                            <Route path={AppRoutes.Sub.path} element={
                                <>
                                    {snap.intro ? <Home /> : <Customizer />}
                                    <Suspense fallback={<Loading />}>
                                        <Canvas />
                                    </Suspense>
                                </>
                            } />
                            <Route path={AppRoutes.Cart.path} element={<Cart />} />
                            <Route path={AppRoutes.Profile.path} element={<Profile />} />
                            <Route
                                path={AppRoutes.PrintifyCatalog.path}
                                element={<PrintifyCatalog />}
                            />
                        </Route>
                    </Route>
                    {/* Redirect all undefined routed to not found page */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            </AccessGate>
        </Suspense>
    )
}

export default App
