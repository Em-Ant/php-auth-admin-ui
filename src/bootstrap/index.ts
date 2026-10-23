import { initKeycloak } from "./auth";
import { getConfig } from "./config";

let bootstrapPromise: Promise<void> | null = null;

const start = async () => {
  const { auth: kcConfig } = await getConfig();
  await initKeycloak(kcConfig);
};

/**
 * React Router runs the loaders of every matched route in parallel, so this
 * must be safe to call from several loaders at once. The first call starts
 * config fetching + Keycloak init; the others await the same promise.
 */
const bootstrap = () => {
  bootstrapPromise ??= start();
  return bootstrapPromise;
};

export default bootstrap;
