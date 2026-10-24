import { HttpResponse, http, passthrough } from "msw";
import type { ScopeRoleMapping } from "@/shared/api/contract";
import { getMockDb, nowSqlDateTime } from "./db";
import {
  errorResponse,
  isValidAuditDate,
  matchesPrefixQuery,
  paginate,
} from "./http";

/**
 * Thin stateful mock of the php-auth admin API (API-CONTRACT.md). Every
 * handler reads and writes the in-memory store in `./db`, so POST/PUT/DELETE
 * are visible to later GETs until `resetMockDb` runs.
 *
 * Anything not listed here — OIDC discovery, the token endpoint, the served
 * login form, ops endpoints — passes through to the real backend, which is
 * what lets dev log in for real while the admin data stays mocked.
 */

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null;

const readBody = async (request: Request): Promise<JsonRecord> => {
  try {
    const parsed: unknown = await request.json();
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

/** Query param first, JSON body second — both shapes are used in the wild. */
const readParam = (url: URL, body: JsonRecord, key: string) => {
  const fromQuery = url.searchParams.get(key);
  if (fromQuery !== null) {
    return fromQuery;
  }
  const fromBody = body[key];
  return typeof fromBody === "string" ? fromBody : undefined;
};

const notFound = (kind: string, id: string) =>
  errorResponse(404, "not found", `${kind} '${id}' not found`);

const newId = () => crypto.randomUUID();

/** Scope catalog for a client: its own scope, or the realm scope it inherits. */
const clientScopes = (clientId: string) => {
  const db = getMockDb();
  const client = db.clients.find((entry) => entry.id === clientId);
  if (!client) {
    return [];
  }
  const source =
    client.scope ??
    db.realms.find((realm) => realm.id === client.realm_id)?.scope ??
    "";
  return source.split(" ").filter(Boolean);
};

const realmById = (id: string) =>
  getMockDb().realms.find((realm) => realm.id === id);

const clientById = (id: string) =>
  getMockDb().clients.find((client) => client.id === id);

const userById = (id: string) =>
  getMockDb().users.find((user) => user.id === id);

const roleById = (id: string) =>
  getMockDb().roles.find((role) => role.id === id);

const positiveIntOrNull = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1;

const nonNegativeIntOrNull = (value: unknown) =>
  value === null ||
  (typeof value === "number" && Number.isInteger(value) && value >= 0);

const healthHandlers = [
  http.get("*/health", () => HttpResponse.json({ status: "ok" })),
  http.get("*/ready", () => HttpResponse.json({ status: "ok" })),
];

const authPassthrough = [
  http.all("*/realms/*/protocol/*", () => passthrough()),
  http.all("*/realms/*/.well-known/*", () => passthrough()),
];

const realmHandlers = [
  http.get("*/admin/realms", ({ request }) => {
    const items = [...getMockDb().realms].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return HttpResponse.json(paginate(items, new URL(request.url)));
  }),

  http.post("*/admin/realms", async ({ request }) => {
    const body = await readBody(request);
    if (typeof body.name !== "string" || typeof body.keys_id !== "string") {
      return errorResponse(
        400,
        "invalid_request",
        "missing required field 'name' or 'keys_id'",
      );
    }
    const db = getMockDb();
    const realm = {
      id: newId(),
      name: body.name,
      keys_id: body.keys_id,
      refresh_token_expires_in: 1800,
      access_token_expires_in: 300,
      pending_login_expires_in: 300,
      authenticated_login_expires_in: 300,
      session_expires_in: 86400,
      idle_session_expires_in: 1800,
      offline_refresh_token_expires_in: 2592000,
      password_policy: {
        min_length: null,
        min_lower: null,
        min_upper: null,
        min_digits: null,
        min_special: null,
      },
      scope: "openid profile email",
      created_at: nowSqlDateTime(),
    };
    db.realms.push(realm);
    return HttpResponse.json(realm, { status: 201 });
  }),

  http.get("*/admin/realms/:id", ({ params }) => {
    const realm = realmById(params.id as string);
    return realm
      ? HttpResponse.json(realm)
      : notFound("realm", params.id as string);
  }),

  http.put("*/admin/realms/:id", async ({ params, request }) => {
    const db = getMockDb();
    const realm = db.realms.find((entry) => entry.id === params.id);
    if (!realm) {
      return notFound("realm", params.id as string);
    }
    const body = await readBody(request);
    const ttlFields = [
      "refresh_token_expires_in",
      "access_token_expires_in",
      "pending_login_expires_in",
      "authenticated_login_expires_in",
      "session_expires_in",
      "idle_session_expires_in",
      "offline_refresh_token_expires_in",
    ] as const;
    for (const field of ttlFields) {
      if (field in body && !positiveIntOrNull(body[field])) {
        return errorResponse(
          400,
          "invalid_request",
          `'${field}' must be a positive integer`,
        );
      }
    }
    const policyFields = [
      "password_min_length",
      "password_min_lower",
      "password_min_upper",
      "password_min_digits",
      "password_min_special",
    ] as const;
    for (const field of policyFields) {
      if (field in body && !nonNegativeIntOrNull(body[field])) {
        return errorResponse(
          400,
          "invalid_request",
          `'${field}' must be a non-negative integer or null`,
        );
      }
    }
    if (typeof body.name === "string") {
      realm.name = body.name;
    }
    if (typeof body.keys_id === "string") {
      realm.keys_id = body.keys_id;
    }
    if (typeof body.scope === "string") {
      realm.scope = body.scope;
    }
    for (const field of ttlFields) {
      if (field in body) {
        realm[field] = body[field] as number;
      }
    }
    const policyTarget = {
      password_min_length: "min_length",
      password_min_lower: "min_lower",
      password_min_upper: "min_upper",
      password_min_digits: "min_digits",
      password_min_special: "min_special",
    } as const;
    for (const [field, target] of Object.entries(policyTarget)) {
      if (field in body) {
        realm.password_policy[target] = body[field] as number | null;
      }
    }
    return HttpResponse.json(realm);
  }),

  http.delete("*/admin/realms/:id", ({ params }) => {
    const db = getMockDb();
    const index = db.realms.findIndex((entry) => entry.id === params.id);
    if (index === -1) {
      return notFound("realm", params.id as string);
    }
    const id = params.id as string;
    const blocked =
      db.clients.some((client) => client.realm_id === id) ||
      db.users.some((user) => user.realm_id === id);
    if (blocked) {
      return errorResponse(409, "conflict", "realm still has clients or users");
    }
    db.realms.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/admin/keys", () => {
    const kid = newId();
    getMockDb().keyIds.push(kid);
    return HttpResponse.json({ kid }, { status: 201 });
  }),
];

const clientHandlers = [
  http.get("*/admin/clients", ({ request }) => {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realm_id");
    const q = url.searchParams.get("q");
    const items = getMockDb().clients.filter(
      (client) =>
        (realmId === null || client.realm_id === realmId) &&
        (q === null || matchesPrefixQuery(q, [client.name, client.uri])),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.post("*/admin/clients", async ({ request }) => {
    const body = await readBody(request);
    if (
      typeof body.name !== "string" ||
      typeof body.uri !== "string" ||
      typeof body.realm_id !== "string"
    ) {
      return errorResponse(
        400,
        "invalid_request",
        "missing required field 'name', 'uri' or 'realm_id'",
      );
    }
    if (!realmById(body.realm_id)) {
      return errorResponse(400, "invalid_request", "unknown realm");
    }
    const requireAuth = body.require_auth ?? false;
    if (typeof requireAuth !== "boolean") {
      return errorResponse(
        400,
        "invalid_request",
        "'require_auth' must be a boolean",
      );
    }
    const hasSecret = body.client_secret !== undefined;
    if (requireAuth && !hasSecret) {
      return errorResponse(
        409,
        "conflict",
        "confidential client requires 'client_secret'",
      );
    }
    if (!requireAuth && hasSecret) {
      return errorResponse(
        409,
        "conflict",
        "public client must not send 'client_secret'",
      );
    }
    const db = getMockDb();
    if (
      db.clients.some(
        (client) => client.name === body.name && client.uri === body.uri,
      )
    ) {
      return errorResponse(409, "conflict", "duplicate client name and uri");
    }
    const client = {
      id: newId(),
      name: body.name,
      realm_id: body.realm_id,
      uri: body.uri,
      require_auth: requireAuth,
      scope: typeof body.scope === "string" ? body.scope : null,
      has_secret: requireAuth,
      created_at: nowSqlDateTime(),
    };
    db.clients.push(client);
    return HttpResponse.json(client, { status: 201 });
  }),

  http.get("*/admin/clients/:id", ({ params }) => {
    const client = clientById(params.id as string);
    return client
      ? HttpResponse.json(client)
      : notFound("client", params.id as string);
  }),

  http.put("*/admin/clients/:id", async ({ params, request }) => {
    const client = clientById(params.id as string);
    if (!client) {
      return notFound("client", params.id as string);
    }
    const body = await readBody(request);
    const nextRequireAuth =
      body.require_auth === undefined ? client.require_auth : body.require_auth;
    if (typeof nextRequireAuth !== "boolean") {
      return errorResponse(
        400,
        "invalid_request",
        "'require_auth' must be a boolean",
      );
    }
    const sendsSecret = body.client_secret !== undefined;
    if (nextRequireAuth && !client.has_secret && !sendsSecret) {
      return errorResponse(
        409,
        "conflict",
        "promoting to confidential requires 'client_secret'",
      );
    }
    if (!nextRequireAuth && sendsSecret) {
      return errorResponse(
        409,
        "conflict",
        "public client must not send 'client_secret'",
      );
    }
    if (typeof body.name === "string") {
      client.name = body.name;
    }
    if (typeof body.uri === "string") {
      client.uri = body.uri;
    }
    if (body.scope === null || typeof body.scope === "string") {
      client.scope = body.scope;
    }
    client.require_auth = nextRequireAuth;
    if (sendsSecret) {
      client.has_secret = true;
    }
    if (!nextRequireAuth) {
      client.has_secret = false;
    }
    return HttpResponse.json(client);
  }),

  http.delete("*/admin/clients/:id", ({ params }) => {
    const db = getMockDb();
    const index = db.clients.findIndex((entry) => entry.id === params.id);
    if (index === -1) {
      return notFound("client", params.id as string);
    }
    const id = params.id as string;
    const blocked =
      db.logins.some(
        (login) => login.client_id === id && login.status !== "EXPIRED",
      ) ||
      db.offlineSessions.some(
        (session) => session.client_id === id && session.status === "ACTIVE",
      );
    if (blocked) {
      return errorResponse(
        409,
        "conflict",
        "client still has active logins or offline sessions",
      );
    }
    db.clients.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

const userHandlers = [
  http.get("*/admin/users", ({ request }) => {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realm_id");
    const q = url.searchParams.get("q");
    const items = getMockDb().users.filter(
      (user) =>
        (realmId === null || user.realm_id === realmId) &&
        (q === null || matchesPrefixQuery(q, [user.email, user.name])),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.post("*/admin/users", async ({ request }) => {
    const body = await readBody(request);
    if (
      typeof body.realm_id !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return errorResponse(
        400,
        "invalid_request",
        "missing required field 'realm_id', 'email' or 'password'",
      );
    }
    if (!realmById(body.realm_id)) {
      return errorResponse(400, "invalid_request", "unknown realm");
    }
    const db = getMockDb();
    if (
      db.users.some(
        (user) => user.realm_id === body.realm_id && user.email === body.email,
      )
    ) {
      return errorResponse(
        409,
        "conflict",
        "email already exists in this realm",
      );
    }
    const user = {
      id: newId(),
      realm_id: body.realm_id,
      name: typeof body.name === "string" ? body.name : null,
      email: body.email,
      valid: typeof body.valid === "boolean" ? body.valid : true,
      email_verified:
        typeof body.email_verified === "boolean" ? body.email_verified : true,
      created_at: nowSqlDateTime(),
    };
    db.users.push(user);
    return HttpResponse.json(user, { status: 201 });
  }),

  http.get("*/admin/users/:id", ({ params }) => {
    const user = userById(params.id as string);
    return user
      ? HttpResponse.json(user)
      : notFound("user", params.id as string);
  }),

  http.put("*/admin/users/:id", async ({ params, request }) => {
    const db = getMockDb();
    const user = db.users.find((entry) => entry.id === params.id);
    if (!user) {
      return notFound("user", params.id as string);
    }
    const body = await readBody(request);
    if ("realm_roles" in body) {
      return errorResponse(
        400,
        "invalid_request",
        "'realm_roles' was removed; assign roles instead",
      );
    }
    if (typeof body.email === "string" && body.email !== user.email) {
      const taken = db.users.some(
        (entry) =>
          entry.id !== user.id &&
          entry.realm_id === user.realm_id &&
          entry.email === body.email,
      );
      if (taken) {
        return errorResponse(
          409,
          "conflict",
          "email already exists in this realm",
        );
      }
      user.email = body.email;
    }
    if (body.name === null || typeof body.name === "string") {
      user.name = body.name;
    }
    if (typeof body.valid === "boolean") {
      user.valid = body.valid;
    }
    if (typeof body.email_verified === "boolean") {
      user.email_verified = body.email_verified;
    }
    return HttpResponse.json(user);
  }),

  http.delete("*/admin/users/:id", ({ params }) => {
    const db = getMockDb();
    const index = db.users.findIndex((entry) => entry.id === params.id);
    if (index === -1) {
      return notFound("user", params.id as string);
    }
    const id = params.id as string;
    const blocked =
      db.sessions.some(
        (session) => session.user_id === id && session.status === "ACTIVE",
      ) ||
      db.offlineSessions.some(
        (session) => session.user_id === id && session.status === "ACTIVE",
      );
    if (blocked) {
      return errorResponse(
        409,
        "conflict",
        "user still has an active session or offline session",
      );
    }
    db.users.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/admin/users/:userId/roles", ({ params, request }) => {
    const db = getMockDb();
    if (!userById(params.userId as string)) {
      return notFound("user", params.userId as string);
    }
    const assigned = db.userRoles[params.userId as string] ?? [];
    const items = db.roles.filter((role) => assigned.includes(role.id));
    return HttpResponse.json(paginate(items, new URL(request.url)));
  }),

  http.post("*/admin/users/:userId/roles", async ({ params, request }) => {
    const db = getMockDb();
    const user = userById(params.userId as string);
    if (!user) {
      return notFound("user", params.userId as string);
    }
    const body = await readBody(request);
    if (typeof body.role_id !== "string") {
      return errorResponse(
        400,
        "invalid_request",
        "missing required field 'role_id'",
      );
    }
    const role = roleById(body.role_id);
    if (!role || role.realm_id !== user.realm_id) {
      return errorResponse(
        400,
        "invalid_request",
        "role must belong to the user's realm",
      );
    }
    if (db.userRoles[user.id] === undefined) {
      db.userRoles[user.id] = [];
    }
    const assigned = db.userRoles[user.id];
    if (!assigned.includes(role.id)) {
      assigned.push(role.id);
    }
    return HttpResponse.json(role, { status: 201 });
  }),

  http.delete("*/admin/users/:userId/roles/:roleId", ({ params }) => {
    const db = getMockDb();
    if (!userById(params.userId as string)) {
      return notFound("user", params.userId as string);
    }
    const assigned = db.userRoles[params.userId as string] ?? [];
    db.userRoles[params.userId as string] = assigned.filter(
      (id) => id !== params.roleId,
    );
    return new HttpResponse(null, { status: 204 });
  }),
];

const roleHandlers = [
  http.get("*/admin/roles", ({ request }) => {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realm_id");
    const clientId = url.searchParams.get("client_id");
    const items = getMockDb().roles.filter(
      (role) =>
        (realmId === null || role.realm_id === realmId) &&
        (clientId === null || role.client_id === clientId),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.post("*/admin/roles", async ({ request }) => {
    const body = await readBody(request);
    if (typeof body.realm_id !== "string" || typeof body.name !== "string") {
      return errorResponse(
        400,
        "invalid_request",
        "missing required field 'realm_id' or 'name'",
      );
    }
    if (!realmById(body.realm_id)) {
      return errorResponse(400, "invalid_request", "unknown realm");
    }
    if (body.client_id !== undefined && body.client_id !== null) {
      if (typeof body.client_id !== "string" || !clientById(body.client_id)) {
        return errorResponse(400, "invalid_request", "unknown client");
      }
    }
    const role = {
      id: newId(),
      realm_id: body.realm_id,
      client_id: typeof body.client_id === "string" ? body.client_id : null,
      name: body.name,
      description:
        typeof body.description === "string" ? body.description : null,
      created_at: nowSqlDateTime(),
    };
    getMockDb().roles.push(role);
    return HttpResponse.json(role, { status: 201 });
  }),

  http.get("*/admin/roles/:id", ({ params }) => {
    const role = roleById(params.id as string);
    return role
      ? HttpResponse.json(role)
      : notFound("role", params.id as string);
  }),

  http.put("*/admin/roles/:id", async ({ params, request }) => {
    const role = roleById(params.id as string);
    if (!role) {
      return notFound("role", params.id as string);
    }
    const body = await readBody(request);
    if (typeof body.name === "string") {
      role.name = body.name;
    }
    if (body.description === null || typeof body.description === "string") {
      role.description = body.description;
    }
    return HttpResponse.json(role);
  }),

  http.delete("*/admin/roles/:id", ({ params }) => {
    const db = getMockDb();
    const index = db.roles.findIndex((entry) => entry.id === params.id);
    if (index === -1) {
      return notFound("role", params.id as string);
    }
    const id = params.id as string;
    const assigned = Object.values(db.userRoles).some((ids) =>
      ids.includes(id),
    );
    const referenced = Object.values(db.scopeRoles).some((mappings) =>
      mappings.some((mapping) => mapping.role_id === id),
    );
    if (assigned || referenced) {
      return errorResponse(
        409,
        "conflict",
        "role is still assigned to users or referenced by a scope-role mapping",
      );
    }
    db.roles.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/admin/clients/:clientId/scope-roles", ({ params, request }) => {
    const db = getMockDb();
    if (!clientById(params.clientId as string)) {
      return notFound("client", params.clientId as string);
    }
    const items = db.scopeRoles[params.clientId as string] ?? [];
    return HttpResponse.json(paginate(items, new URL(request.url)));
  }),

  http.post(
    "*/admin/clients/:clientId/scope-roles",
    async ({ params, request }) => {
      const db = getMockDb();
      const client = clientById(params.clientId as string);
      if (!client) {
        return notFound("client", params.clientId as string);
      }
      const body = await readBody(request);
      if (typeof body.scope !== "string" || typeof body.role_id !== "string") {
        return errorResponse(
          400,
          "invalid_request",
          "missing required field 'scope' or 'role_id'",
        );
      }
      if (!clientScopes(client.id).includes(body.scope)) {
        return errorResponse(
          400,
          "invalid_request",
          "scope is not valid for this client",
        );
      }
      const role = roleById(body.role_id);
      if (!role || role.realm_id !== client.realm_id) {
        return errorResponse(
          400,
          "invalid_request",
          "role must belong to the client's realm",
        );
      }
      if (db.scopeRoles[client.id] === undefined) {
        db.scopeRoles[client.id] = [];
      }
      const mappings = db.scopeRoles[client.id];
      if (
        mappings.some(
          (mapping) =>
            mapping.scope === body.scope && mapping.role_id === role.id,
        )
      ) {
        return errorResponse(
          409,
          "conflict",
          "scope-role mapping already exists",
        );
      }
      const mapping: ScopeRoleMapping = {
        scope: body.scope,
        role_name: role.name,
        role_id: role.id,
        required: body.required === true,
      };
      mappings.push(mapping);
      return HttpResponse.json(mapping, { status: 201 });
    },
  ),

  http.put(
    "*/admin/clients/:clientId/scope-roles/:scope/:roleId",
    async ({ params, request }) => {
      const db = getMockDb();
      if (!clientById(params.clientId as string)) {
        return notFound("client", params.clientId as string);
      }
      const mappings = db.scopeRoles[params.clientId as string] ?? [];
      const mapping = mappings.find(
        (entry) =>
          entry.scope === params.scope && entry.role_id === params.roleId,
      );
      if (!mapping) {
        return errorResponse(404, "not found", "scope-role mapping not found");
      }
      const body = await readBody(request);
      if (typeof body.required === "boolean") {
        mapping.required = body.required;
      }
      const { scope, role_id, required } = mapping;
      return HttpResponse.json({ scope, role_id, required });
    },
  ),

  http.delete(
    "*/admin/clients/:clientId/scope-roles/:scope/:roleId",
    ({ params }) => {
      const db = getMockDb();
      const mappings = db.scopeRoles[params.clientId as string] ?? [];
      db.scopeRoles[params.clientId as string] = mappings.filter(
        (entry) =>
          !(entry.scope === params.scope && entry.role_id === params.roleId),
      );
      return new HttpResponse(null, { status: 204 });
    },
  ),
];

const sessionHandlers = [
  http.get("*/admin/sessions", ({ request }) => {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realm_id");
    const userId = url.searchParams.get("user_id");
    const items = getMockDb().sessions.filter(
      (session) =>
        (realmId === null || session.realm_id === realmId) &&
        (userId === null || session.user_id === userId),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.delete("*/admin/sessions/:id", ({ params }) => {
    const db = getMockDb();
    const session = db.sessions.find((entry) => entry.id === params.id);
    if (!session) {
      return notFound("session", params.id as string);
    }
    session.status = "EXPIRED";
    session.updated_at = nowSqlDateTime();
    for (const login of db.logins) {
      if (login.session_id === session.id && login.status !== "EXPIRED") {
        login.status = "EXPIRED";
        login.updated_at = session.updated_at;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/admin/sessions/invalidate", async ({ request }) => {
    const url = new URL(request.url);
    const body = await readBody(request);
    const userId = readParam(url, body, "user_id");
    const clientId = readParam(url, body, "client_id");
    if (userId === undefined && clientId === undefined) {
      return errorResponse(
        400,
        "invalid_request",
        "one of 'user_id' or 'client_id' is required",
      );
    }
    const db = getMockDb();
    const stamped = nowSqlDateTime();
    let invalidated = 0;
    const sessionLinkedToClient = (sessionId: string) =>
      clientId === undefined ||
      db.logins.some(
        (login) =>
          login.session_id === sessionId &&
          login.client_id === clientId &&
          login.status !== "EXPIRED",
      );
    for (const session of db.sessions) {
      const matchesUser = userId === undefined || session.user_id === userId;
      if (
        session.status === "ACTIVE" &&
        matchesUser &&
        sessionLinkedToClient(session.id)
      ) {
        session.status = "EXPIRED";
        session.updated_at = stamped;
        invalidated += 1;
        for (const login of db.logins) {
          if (login.session_id === session.id && login.status !== "EXPIRED") {
            login.status = "EXPIRED";
            login.updated_at = stamped;
          }
        }
      }
    }
    for (const offline of db.offlineSessions) {
      const matchesUser = userId === undefined || offline.user_id === userId;
      const matchesClient =
        clientId === undefined || offline.client_id === clientId;
      if (offline.status === "ACTIVE" && matchesUser && matchesClient) {
        offline.status = "EXPIRED";
        offline.updated_at = stamped;
        invalidated += 1;
      }
    }
    return HttpResponse.json({ invalidated });
  }),

  http.get("*/admin/logins", ({ request }) => {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realm_id");
    const clientId = url.searchParams.get("client_id");
    const db = getMockDb();
    const realmOfClient = (id: string) => clientById(id)?.realm_id;
    const items = db.logins.filter(
      (login) =>
        (clientId === null || login.client_id === clientId) &&
        (realmId === null || realmOfClient(login.client_id) === realmId),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.delete("*/admin/logins/:id", ({ params }) => {
    const db = getMockDb();
    const index = db.logins.findIndex((entry) => entry.id === params.id);
    if (index === -1) {
      return notFound("login", params.id as string);
    }
    db.logins.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/admin/offline-sessions", ({ request }) => {
    const url = new URL(request.url);
    const realmId = url.searchParams.get("realm_id");
    const userId = url.searchParams.get("user_id");
    const clientId = url.searchParams.get("client_id");
    const items = getMockDb().offlineSessions.filter(
      (session) =>
        (realmId === null || session.realm_id === realmId) &&
        (userId === null || session.user_id === userId) &&
        (clientId === null || session.client_id === clientId),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.get("*/admin/offline-sessions/:id", ({ params }) => {
    const session = getMockDb().offlineSessions.find(
      (entry) => entry.id === params.id,
    );
    return session
      ? HttpResponse.json(session)
      : notFound("offline session", params.id as string);
  }),

  http.delete("*/admin/offline-sessions/:id", ({ params }) => {
    const session = getMockDb().offlineSessions.find(
      (entry) => entry.id === params.id,
    );
    if (!session) {
      return notFound("offline session", params.id as string);
    }
    session.status = "EXPIRED";
    session.updated_at = nowSqlDateTime();
    return new HttpResponse(null, { status: 204 });
  }),
];

const auditHandlers = [
  http.get("*/admin/audit-logs", ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const actorType = url.searchParams.get("actor_type");
    const targetType = url.searchParams.get("target_type");
    const realmId = url.searchParams.get("realm_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (
      (from !== null && !isValidAuditDate(from)) ||
      (to !== null && !isValidAuditDate(to))
    ) {
      return errorResponse(
        400,
        "invalid_request",
        "'from' and 'to' must be YYYY-MM-DD dates",
      );
    }
    const items = getMockDb().auditLogs.filter(
      (entry) =>
        (action === null || entry.action === action) &&
        (actorType === null || entry.actor_type === actorType) &&
        (targetType === null || entry.target_type === targetType) &&
        (realmId === null || entry.realm_id === realmId) &&
        (from === null || entry.created_at.slice(0, 10) >= from) &&
        (to === null || entry.created_at.slice(0, 10) <= to),
    );
    return HttpResponse.json(paginate(items, url));
  }),

  http.get("*/admin/audit-logs/:id", ({ params }) => {
    const entry = getMockDb().auditLogs.find((item) => item.id === params.id);
    return entry
      ? HttpResponse.json(entry)
      : notFound("audit log", params.id as string);
  }),

  http.delete("*/admin/audit-logs", async ({ request }) => {
    const url = new URL(request.url);
    const body = await readBody(request);
    const realmId = readParam(url, body, "realm_id");
    const olderThan = readParam(url, body, "older_than");
    if (realmId === undefined && olderThan === undefined) {
      return errorResponse(
        400,
        "invalid_request",
        "one of 'realm_id' or 'older_than' is required",
      );
    }
    if (olderThan !== undefined && !isValidAuditDate(olderThan)) {
      return errorResponse(
        400,
        "invalid_request",
        "'older_than' must be a YYYY-MM-DD date",
      );
    }
    const db = getMockDb();
    const before = db.auditLogs.length;
    db.auditLogs = db.auditLogs.filter(
      (entry) =>
        !(
          (realmId !== undefined && entry.realm_id === realmId) ||
          (olderThan !== undefined && entry.created_at.slice(0, 10) < olderThan)
        ),
    );
    return HttpResponse.json({ deleted: before - db.auditLogs.length });
  }),
];

export const handlers = [
  ...healthHandlers,
  ...realmHandlers,
  ...clientHandlers,
  ...userHandlers,
  ...roleHandlers,
  ...sessionHandlers,
  ...auditHandlers,
  ...authPassthrough,
];
