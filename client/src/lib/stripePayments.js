import { getAuth } from "firebase/auth";
import app from "../config/firebase";

export function getCurrentUserOrThrow() {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in to checkout.");
  return user;
}
