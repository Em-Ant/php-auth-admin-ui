import type { AppDispatch, RootState } from "@/app/store/store";
import { selectRealmOptions } from "@/entities/realms";
import type { RealmOption } from "@/shared/api/contract";
import { getConfig } from "@/shared/config";
import { selectActiveRealmId } from "./selectors";
import { setActiveRealm } from "./slice";

/**
 * Default-realm policy: the operator realm (`config.auth.realm`) when it is in
 * the catalog, otherwise the first realm the operator can see.
 */
export const pickDefaultRealm = (
  options: RealmOption[],
  operatorRealm: string,
): RealmOption | null =>
  options.find((option) => option.name === operatorRealm) ?? options[0] ?? null;

/**
 * Keep a stored realm that still exists in the catalog; otherwise resolve the
 * default and store it. The catalog is read from the realms entity slice, so
 * this cross-slice workflow stays out of the components (ADR-0003).
 */
export const resolveActiveRealm =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<void> => {
    const options = selectRealmOptions(getState());
    const storedId = selectActiveRealmId(getState());
    if (storedId !== null && options.some((option) => option.id === storedId)) {
      return;
    }

    const { auth } = await getConfig();
    const fallback = pickDefaultRealm(options, auth.realm);
    if (fallback) {
      dispatch(setActiveRealm(fallback));
    }
  };
