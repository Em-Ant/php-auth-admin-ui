import { type LoaderFunctionArgs, redirect } from "react-router";
import { isAuthenticated } from "@/shared/auth";

/**
 * Sends an already authenticated operator back into the app. The route table
 * wraps this with bootstrap, so the page never imports the app layer.
 */
export const loginLoader = async ({ request }: LoaderFunctionArgs) => {
  if (await isAuthenticated()) {
    const from = new URL(request.url).searchParams.get("from");
    // Only ever redirect inside the app, never to "//evil.example".
    return redirect(
      from?.startsWith("/") && !from.startsWith("//") ? from : "/",
    );
  }
  return null;
};
