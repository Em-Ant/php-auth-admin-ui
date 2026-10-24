import type {
  AuditLogEntry,
  Client,
  Login,
  OfflineSession,
  Realm,
  Role,
  ScopeRoleMapping,
  Session,
  User,
} from "@/shared/api/contract";

/**
 * In-memory store behind the MSW handlers. The seed is the only copy of the
 * fixture data; `resetMockDb` deep-clones it back so dev reloads and tests
 * each start from the same state.
 */
export interface MockDb {
  realms: Realm[];
  clients: Client[];
  users: User[];
  roles: Role[];
  sessions: Session[];
  logins: Login[];
  offlineSessions: OfflineSession[];
  auditLogs: AuditLogEntry[];
  /** userId -> assigned roleIds */
  userRoles: Record<string, string[]>;
  /** clientId -> scope-role mappings */
  scopeRoles: Record<string, ScopeRoleMapping[]>;
  /** key-set ids created through POST /admin/keys */
  keyIds: string[];
}

const seed: MockDb = {
  realms: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "test",
      keys_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      refresh_token_expires_in: 1800,
      access_token_expires_in: 300,
      pending_login_expires_in: 300,
      authenticated_login_expires_in: 300,
      session_expires_in: 86400,
      idle_session_expires_in: 1800,
      offline_refresh_token_expires_in: 2592000,
      password_policy: {
        min_length: 8,
        min_lower: 0,
        min_upper: 0,
        min_digits: 1,
        min_special: 0,
      },
      scope: "openid profile email",
      created_at: "2026-01-10 09:00:00",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "admin",
      keys_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      refresh_token_expires_in: 1800,
      access_token_expires_in: 300,
      pending_login_expires_in: 300,
      authenticated_login_expires_in: 300,
      session_expires_in: 86400,
      idle_session_expires_in: 1800,
      offline_refresh_token_expires_in: 2592000,
      password_policy: {
        min_length: 8,
        min_lower: 0,
        min_upper: 0,
        min_digits: 1,
        min_special: 1,
      },
      scope: "openid profile email",
      created_at: "2026-01-10 09:00:00",
    },
  ],
  clients: [
    {
      id: "c0000000-0000-0000-0000-000000000001",
      name: "admin-ui",
      realm_id: "11111111-1111-1111-1111-111111111111",
      uri: "http://localhost:5173/*",
      require_auth: false,
      scope: null,
      has_secret: false,
      created_at: "2026-01-11 10:00:00",
    },
    {
      id: "c0000000-0000-0000-0000-000000000002",
      name: "spa",
      realm_id: "11111111-1111-1111-1111-111111111111",
      uri: "http://localhost:5173/*",
      require_auth: false,
      scope: "openid profile email",
      has_secret: false,
      created_at: "2026-01-12 10:00:00",
    },
    {
      id: "c0000000-0000-0000-0000-000000000003",
      name: "api-service",
      realm_id: "22222222-2222-2222-2222-222222222222",
      uri: "https://api.example.com/*",
      require_auth: true,
      scope: null,
      has_secret: true,
      created_at: "2026-01-13 10:00:00",
    },
  ],
  users: [
    {
      id: "u0000000-0000-0000-0000-000000000001",
      realm_id: "11111111-1111-1111-1111-111111111111",
      name: "Ada Operator",
      email: "ada@example.com",
      valid: true,
      email_verified: true,
      created_at: "2026-02-01 09:00:00",
    },
    {
      id: "u0000000-0000-0000-0000-000000000002",
      realm_id: "11111111-1111-1111-1111-111111111111",
      name: "Bob Builder",
      email: "bob@example.com",
      valid: true,
      email_verified: true,
      created_at: "2026-02-02 09:00:00",
    },
    {
      id: "u0000000-0000-0000-0000-000000000003",
      realm_id: "11111111-1111-1111-1111-111111111111",
      name: null,
      email: "carol@example.com",
      valid: false,
      email_verified: false,
      created_at: "2026-02-03 09:00:00",
    },
    {
      id: "u0000000-0000-0000-0000-000000000004",
      realm_id: "22222222-2222-2222-2222-222222222222",
      name: "Dan Admin",
      email: "dan@example.com",
      valid: true,
      email_verified: true,
      created_at: "2026-02-04 09:00:00",
    },
  ],
  roles: [
    {
      id: "r0000000-0000-0000-0000-000000000001",
      realm_id: "11111111-1111-1111-1111-111111111111",
      client_id: null,
      name: "admin",
      description: "Realm administrators.",
      created_at: "2026-01-15 09:00:00",
    },
    {
      id: "r0000000-0000-0000-0000-000000000002",
      realm_id: "11111111-1111-1111-1111-111111111111",
      client_id: null,
      name: "editor",
      description: null,
      created_at: "2026-01-16 09:00:00",
    },
    {
      id: "r0000000-0000-0000-0000-000000000003",
      realm_id: "11111111-1111-1111-1111-111111111111",
      client_id: "c0000000-0000-0000-0000-000000000002",
      name: "viewer",
      description: "Read-only access to the spa client.",
      created_at: "2026-01-17 09:00:00",
    },
  ],
  sessions: [
    {
      id: "s0000000-0000-0000-0000-000000000001",
      realm_id: "11111111-1111-1111-1111-111111111111",
      user_id: "u0000000-0000-0000-0000-000000000001",
      acr: "0",
      status: "ACTIVE",
      created_at: "2026-03-01 09:00:00",
      updated_at: "2026-03-01 09:05:00",
    },
    {
      id: "s0000000-0000-0000-0000-000000000002",
      realm_id: "11111111-1111-1111-1111-111111111111",
      user_id: "u0000000-0000-0000-0000-000000000002",
      acr: "0",
      status: "EXPIRED",
      created_at: "2026-02-20 09:00:00",
      updated_at: "2026-02-21 09:00:00",
    },
  ],
  logins: [
    {
      id: "l0000000-0000-0000-0000-000000000001",
      client_id: "c0000000-0000-0000-0000-000000000001",
      session_id: "s0000000-0000-0000-0000-000000000001",
      scope: "openid profile email",
      status: "ACTIVE",
      created_at: "2026-03-01 09:00:00",
      authenticated_at: "2026-03-01 09:01:00",
      updated_at: "2026-03-01 09:05:00",
    },
    {
      id: "l0000000-0000-0000-0000-000000000002",
      client_id: "c0000000-0000-0000-0000-000000000002",
      session_id: "s0000000-0000-0000-0000-000000000002",
      scope: "openid profile email",
      status: "EXPIRED",
      created_at: "2026-02-20 09:00:00",
      authenticated_at: "2026-02-20 09:01:00",
      updated_at: "2026-02-21 09:00:00",
    },
    {
      id: "l0000000-0000-0000-0000-000000000003",
      client_id: "c0000000-0000-0000-0000-000000000002",
      session_id: "s0000000-0000-0000-0000-000000000002",
      scope: "openid profile email",
      status: "PENDING",
      created_at: "2026-03-02 09:00:00",
      authenticated_at: null,
      updated_at: null,
    },
  ],
  offlineSessions: [
    {
      id: "o0000000-0000-0000-0000-000000000001",
      realm_id: "11111111-1111-1111-1111-111111111111",
      user_id: "u0000000-0000-0000-0000-000000000001",
      client_id: "c0000000-0000-0000-0000-000000000003",
      acr: "0",
      scope: "openid offline_access",
      status: "ACTIVE",
      created_at: "2026-03-01 09:00:00",
      authenticated_at: "2026-03-01 09:01:00",
      updated_at: null,
    },
    {
      id: "o0000000-0000-0000-0000-000000000002",
      realm_id: "11111111-1111-1111-1111-111111111111",
      user_id: "u0000000-0000-0000-0000-000000000002",
      client_id: "c0000000-0000-0000-0000-000000000001",
      acr: "0",
      scope: "openid offline_access",
      status: "EXPIRED",
      created_at: "2026-02-20 09:00:00",
      authenticated_at: "2026-02-20 09:01:00",
      updated_at: "2026-02-21 09:00:00",
    },
  ],
  auditLogs: [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      action: "user.create",
      actor_type: "admin_user",
      actor_id: "u0000000-0000-0000-0000-000000000004",
      realm_id: "11111111-1111-1111-1111-111111111111",
      target_type: "user",
      target_id: "u0000000-0000-0000-0000-000000000001",
      detail: { email: "ada@example.com" },
      created_at: "2026-03-01 10:00:00",
    },
    {
      id: "a0000000-0000-0000-0000-000000000002",
      action: "client.create",
      actor_type: "admin_user",
      actor_id: "u0000000-0000-0000-0000-000000000004",
      realm_id: "11111111-1111-1111-1111-111111111111",
      target_type: "client",
      target_id: "c0000000-0000-0000-0000-000000000002",
      detail: { name: "spa" },
      created_at: "2026-03-02 10:00:00",
    },
    {
      id: "a0000000-0000-0000-0000-000000000003",
      action: "realm.create",
      actor_type: "api_key",
      actor_id: null,
      realm_id: null,
      target_type: "realm",
      target_id: "22222222-2222-2222-2222-222222222222",
      detail: { name: "admin" },
      created_at: "2026-01-10 09:00:00",
    },
  ],
  userRoles: {
    "u0000000-0000-0000-0000-000000000001": [
      "r0000000-0000-0000-0000-000000000001",
    ],
    "u0000000-0000-0000-0000-000000000002": [
      "r0000000-0000-0000-0000-000000000002",
    ],
  },
  scopeRoles: {
    "c0000000-0000-0000-0000-000000000002": [
      {
        scope: "profile",
        role_name: "viewer",
        role_id: "r0000000-0000-0000-0000-000000000003",
        required: false,
      },
    ],
  },
  keyIds: ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
};

const clone = (db: MockDb): MockDb => structuredClone(db);

let live: MockDb = clone(seed);

/** The working store every handler reads and writes. */
export const getMockDb = () => live;

/** Restore the seed; call between tests and on mock startup. */
export const resetMockDb = () => {
  live = clone(seed);
};

/** SQL-style `YYYY-MM-DD HH:MM:SS` timestamp for rows created at runtime. */
export const nowSqlDateTime = () => {
  const iso = new Date().toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
};
