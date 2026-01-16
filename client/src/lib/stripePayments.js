import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStripePayments } from "@invertase/firestore-stripe-payments";
import app from "../config/firebase";

export function stripePayments() {
  const auth = getAuth(app);
  const db = getFirestore(app);

  // IMPORTANT: this points to the collections the extension uses
  return getStripePayments(app, {
    productsCollection: "products",
    customersCollection: "customers",
  });
}

export function getCurrentUserOrThrow() {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to checkout.");
  return user;
}
