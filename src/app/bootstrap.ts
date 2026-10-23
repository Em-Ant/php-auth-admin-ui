import { initKeycloak } from "@/shared/auth";
import { getConfig } from "@/shared/config";

let bootstrapPromise: Promise<void> | null = null;

const applyStoredTheme = () => {
  try {
    const stored = window.localStorage.getItem("theme");
    const isDark = stored !== "light";
    document.documentElement.classList.toggle("dark", isDark);
  } catch {
    document.documentElement.classList.add("dark");
  }
};

const start = async () => {
  const { auth: kcConfig } = await getConfig();
  await initKeycloak(kcConfig);
};

/**
 * React Router runs the loaders of every matched route in parallel, so this
 * must be safe to call from several loaders at once. The first call starts
 * config fetching + Keycloak init; the others await the same promise.
 *
 * Theme is applied synchronously on the first call so the stored preference
 * (or the dark default) is in place before the first async await.
 */
const bootstrap = () => {
  if (typeof document !== "undefined") {
    applyStoredTheme();
  }
  bootstrapPromise ??= start();
  return bootstrapPromise;
};

export default bootstrap;
