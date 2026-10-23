/**
 * The realm role every `/admin/*` call must carry. The route guard and the
 * forbidden screen both read it, so it lives next to the auth adapter.
 */
export const ADMIN_ROLE = "admin";
