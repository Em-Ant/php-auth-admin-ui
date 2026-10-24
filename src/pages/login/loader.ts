import { redirect } from "react-router";
import { isAuthenticated } from "@/shared/auth";

/**
 * Sends an already authenticated operator back into the app. The route table
 * wraps this with bootstrap, so the page never imports the app layer.
 */
export const loginLoader = async () => {
  if (await isAuthenticated()) {
    return redirect("/");
  }
  return null;
};
