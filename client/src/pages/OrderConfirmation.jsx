import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import app from "../config/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Loading from "../components/Loading";

const db = getFirestore(app);

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    
    // Wait for auth state to be initialized
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthChecked(true);
      
      if (!user) {
        setError("You must be signed in to view this order.");
        setLoading(false);
        return;
      }

      if (!sessionId) {
        setError("No session ID provided.");
        setLoading(false);
        return;
      }

      // Fetch order data
      await fetchOrderData(user);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const fetchOrderData = async (user) => {
    try {
      // Find the order by checking the checkout session
      // Query by sessionId field (not document ID) with retry logic
      const checkoutData = await findCheckoutSession(user);

      if (!checkoutData) {
        setError("Checkout session not found. Please try again.");
        setLoading(false);
        return;
      }

      const orderId = checkoutData?.metadata?.orderId;

      if (!orderId) {
        setError("Order ID not found in session.");
        setLoading(false);
        return;
      }

      // Fetch the order details
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        setError("Order not found.");
        setLoading(false);
        return;
      }

      // Mark order as paid and link to user
      await updateDoc(orderRef, {
        userId: user.uid,
        status: "Paid",
        paidAt: serverTimestamp(),
        stripeSessionId: sessionId,
      });

      const order = { id: orderSnap.id, ...orderSnap.data(), status: "Paid", userId: user.uid };
      setOrderData(order);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError(err.message || "Failed to load order details.");
      setLoading(false);
    }
  };

  const findCheckoutSession = async (user, attempts = 8) => {
    const sessionsCol = collection(db, "customers", user.uid, "checkout_sessions");

    for (let i = 0; i < attempts; i++) {
      // Query by sessionId field (the Stripe session ID is stored as a field)
      const q = query(sessionsCol, where("sessionId", "==", sessionId), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return snap.docs[0].data();
      }

      // Wait before retrying (sometimes redirect happens before Firestore is updated)
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    }

    return null;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: orderData.stripe?.currency?.toUpperCase() || "USD",
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Thank you, {orderData.firstName} {orderData.lastName}!
            </p>
            <p className="text-gray-600">
              Your order has been successfully placed. You will receive a confirmation email at{" "}
              <span className="font-semibold">{orderData.email}</span>
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono text-sm font-semibold">{orderData.id}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Status:</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {orderData.status || "Processing"}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-semibold">
                {orderData.createdAt?.toDate?.()?.toLocaleDateString?.("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) || "Just now"}
              </span>
            </div>

            {orderData.stripe?.amountTotal && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(orderData.stripe.amountTotal)}
                </span>
              </div>
            )}

            {orderData.stripe?.paymentIntentId && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-mono text-sm">{orderData.stripe.paymentIntentId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Information */}
        {(orderData.address || orderData.city || orderData.state || orderData.postalCode) && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h2>
            <div className="text-gray-700">
              <p className="font-semibold">
                {orderData.firstName} {orderData.lastName}
              </p>
              {orderData.address && <p>{orderData.address}</p>}
              <p>
                {orderData.city && `${orderData.city}, `}
                {orderData.state && `${orderData.state} `}
                {orderData.postalCode}
              </p>
              {orderData.country && <p>{orderData.country}</p>}
            </div>
          </div>
        )}

        {/* Order Items */}
        {orderData.cartItems && orderData.cartItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {orderData.cartItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-0">
                  {item.imageURL && (
                    <img
                      src={item.imageURL}
                      alt={item.title || "Product"}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.title || "Custom Product"}
                    </h3>
                    {item.color && (
                      <p className="text-sm text-gray-600">Color: {item.color}</p>
                    )}
                    {item.size && (
                      <p className="text-sm text-gray-600">Size: {item.size}</p>
                    )}
                    <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                  </div>
                  {item.price && (
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-3">What's Next?</h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>You'll receive an email confirmation with your receipt and invoice</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We'll send you shipping updates when your order is on its way</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Track your order status in your profile</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View Order History
          </button>
          <button
            onClick={() => navigate("/home")}
            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
