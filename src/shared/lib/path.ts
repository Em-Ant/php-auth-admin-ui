export const isAbsolute = (url: string) => /^https?:\/\//.test(url);

export const join = (paths: string[]) =>
  paths
    .join("/")
    .replace(/(?!:)\/{1,}/g, "/")
    .replace(":/", "://");

/**
 * Absolute path for a realm-scoped screen. Scoped screens only exist under an
 * active realm; without one the realms list is the only sensible target, since
 * that is where the operator picks the realm.
 */
export const realmPath = (realmId: string | null, path: string): string =>
  realmId === null ? "/realms" : `/${realmId}${path}`;
