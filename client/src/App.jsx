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

// Using Lazy loading so as to improve the app performance. Only load pages when ever needed.
const NotFound = React.lazy(() => import("./pages/NotFound"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const SignupPage = React.lazy(() => import("./pages/SignUpPage"));
const Home = React.lazy(() => import("./pages/Home"));
const Customizer = React.lazy(() => import("./pages/Customizer"));
const Canvas = React.lazy(() => import("./canvas"));
const Cart = React.lazy(() => import("./pages/Cart"));
const UserProfile = React.lazy(() => import ("./pages/UserProfile"));
function App() {
    const snap = useSnapshot(state);

    const token = getToken(); // fetching the token.

    //setting the initial state of intro to true if the user is already logged in.
    useEffect(() => {
        if (token || token !== undefined) state.intro = true;
    }, [token])


    return (
        <Suspense fallback={<Loading />}>
            <main className="app transtion-allease-in">
                <Toast /> {/*Toast Notification Component to view toast */}
                {/* Routes setup */}
                <Routes>
                    {/* Public Routes */}
                    <Route index path={AppRoutes.Login.path} element={<LoginPage/>} />
                    <Route path={AppRoutes.SignUp.path} element={<SignupPage/>} />
                    {/* Protected Routes => view protected routes component */}
                    <Route element={<ProtectedRoute/>}>
                        <Route path={AppRoutes.Home.path} element={<Layout/>}>
                            <Route path={AppRoutes.Sub.path} element={
                                <>
                                    {snap.intro ? <Home/> : <Customizer/>}
                                    <Suspense fallback={<Loading/>}>                                      
                                        <Canvas />
                                    </Suspense>
                                </>
                            } />
                              <Route path={AppRoutes.Cart.path} element={<Cart />} /> 
                              <Route path={AppRoutes.UserProfile.path} element={<UserProfile/>} />
                        </Route>
                    </Route>
                    {/* Redirect all undefined routed to not found page */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </Suspense>
    )
}

export default App
