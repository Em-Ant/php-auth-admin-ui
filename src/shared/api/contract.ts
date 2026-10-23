/**
 * Types shared by every admin API client, ported from admin-ui/API-CONTRACT.md.
 * The backend at commit 006ff4b is the only source of truth for these shapes.
 */

export const ADMIN_API_PREFIX = "/admin";

/** Every list endpoint returns this envelope: {items, total, limit, offset}. */
export interface ListEnvelope<T> {
  items: T[];
  /** Unfiltered-by-pagination match count — drives the pager directly. */
  total: number;
  /** Read this back from the response; out-of-range requests silently default to 50. */
  limit: number;
  offset: number;
}

/** OAuth2-shaped failure body: { error: "<slug>", error_description: "<sentence>" }. */
export interface ApiErrorEnvelope {
  error: string;
  error_description?: string;
}

/** Error slugs per API-CONTRACT.md §3. */
export type ApiErrorSlug =
  | "invalid_request"
  | "unauthorized"
  | "not found"
  | "conflict"
  | "server_error"
  | "migration_failed";

/** created_at / updated_at etc.: "YYYY-MM-DD HH:MM:SS" UTC, no timezone suffix. */
export type SqlDateTime = string;

export interface Realm {
  id: string;
  name: string;
  keys_id: string;
  refresh_token_expires_in: number;
  access_token_expires_in: number;
  pending_login_expires_in: number;
  authenticated_login_expires_in: number;
  session_expires_in: number;
  idle_session_expires_in: number;
  offline_refresh_token_expires_in: number;
  password_policy: {
    min_length: number | null;
    min_lower: number | null;
    min_upper: number | null;
    min_digits: number | null;
    min_special: number | null;
  };
  /** Single space-delimited string, not an array. */
  scope: string;
  created_at: SqlDateTime;
}

export interface Client {
  id: string;
  name: string;
  realm_id: string;
  /** Redirect-URI *pattern*, e.g. "http://localhost:5173/*". */
  uri: string;
  /** true = confidential (client_credentials + secret); false = public (PKCE). */
  require_auth: boolean;
  scope: string | null;
  /** Secret is write-only: the API never returns it, only this boolean. */
  has_secret: boolean;
  created_at: SqlDateTime;
}

export interface User {
  id: string;
  realm_id: string;
  name: string | null;
  email: string;
  /** false = deactivated, not deleted: the user can no longer authenticate. */
  valid: boolean;
  email_verified: boolean;
  created_at: SqlDateTime;
}

export interface Role {
  id: string;
  realm_id: string;
  /** null = realm role; set = client role scoped to that client. */
  client_id: string | null;
  name: string;
  description: string | null;
  created_at: SqlDateTime;
}

export type SessionStatus = "ACTIVE" | "EXPIRED";

export interface Session {
  id: string;
  realm_id: string;
  user_id: string;
  /** Authentication-context string; "0" = none. Render as opaque badge. */
  acr: string;
  status: SessionStatus;
  created_at: SqlDateTime;
  updated_at: SqlDateTime | null;
}

export type LoginStatus = "PENDING" | "AUTHENTICATED" | "ACTIVE" | "EXPIRED";

export interface Login {
  id: string;
  client_id: string;
  session_id: string;
  scope: string;
  status: LoginStatus;
  created_at: SqlDateTime;
  authenticated_at: SqlDateTime | null;
  updated_at: SqlDateTime | null;
}

export interface OfflineSession {
  id: string;
  realm_id: string;
  user_id: string;
  client_id: string;
  acr: string;
  scope: string;
  status: SessionStatus;
  created_at: SqlDateTime;
  authenticated_at: SqlDateTime | null;
  updated_at: SqlDateTime | null;
}

export type AuditAction =
  | "realm.create"
  | "realm.update"
  | "realm.delete"
  | "client.create"
  | "client.update"
  | "client.delete"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "role.create"
  | "role.update"
  | "role.delete"
  | "scope_role.create"
  | "scope_role.update"
  | "scope_role.delete";

export type AuditActorType = "admin_user" | "api_key";

export type AuditTargetType =
  | "realm"
  | "client"
  | "user"
  | "role"
  | "scope_role";

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actor_type: AuditActorType;
  actor_id: string | null;
  realm_id: string | null;
  target_type: AuditTargetType;
  target_id: string | null;
  /** Untyped and version-unstable: display only, never parse into a form. */
  detail: unknown;
  created_at: SqlDateTime;
}

/** Per-client scope-to-role join row (flatter than a normal object). */
export interface ScopeRoleMapping {
  scope: string;
  role_name: string;
  role_id: string;
  required: boolean;
}
