import type { ActiveRealm } from "./slice";

const STORAGE_KEY = "activeRealm";

/**
 * Persistence for the active realm. The stored value is the only thing that
 * survives a reload, so reads are defensive: corrupt JSON or a half-written
 * record behaves like nothing was stored.
 */
export const readStoredRealm = (): ActiveRealm | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as { id?: unknown; name?: unknown };
    if (typeof parsed.id === "string" && typeof parsed.name === "string") {
      return { id: parsed.id, name: parsed.name };
    }
  } catch {
    // Corrupt or unreadable storage: behave as if nothing was stored.
  }
  return null;
};

export const writeStoredRealm = (realm: ActiveRealm): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(realm));
  } catch {
    // Ignore storage write failures; the in-memory state still applies.
  }
};

export const clearStoredRealm = (): void => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage write failures; the in-memory state still applies.
  }
};
