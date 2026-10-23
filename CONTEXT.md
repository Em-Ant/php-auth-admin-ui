# Admin UI

The browser dashboard used to administer the php-auth OIDC server: realms, clients, users, roles and their authentication activity.

## Language

**Realm**:
The hard isolation boundary of the auth server. Clients, users, roles, keys and token policy all belong to exactly one realm, and nothing crosses between realms.
_Avoid_: Tenant, organisation, workspace, account

**Client**:
An application registered in exactly one realm to request tokens. It is either public (browser-based, no secret) or confidential (server-side, authenticates with a secret).
_Avoid_: Application, app, service

**User**:
A person who can authenticate in a realm, uniquely identified by email within that realm. A user can be deactivated — they can no longer sign in — without being deleted.
_Avoid_: Account, identity, principal

**Role**:
A named authorization unit that can be assigned to a user. It belongs to a realm and is either a realm role, or a client role scoped to one client.
_Avoid_: Permission, group, policy

**Session**:
The SSO state saying that one browser is signed in as one user. It is created when an authentication attempt succeeds and ends by idle/max lifetime or explicit revocation.
_Avoid_: Login, token, auth session

**Login**:
One authentication attempt against one client. It becomes a Session only when authenticated; PENDING and AUTHENTICATED logins have not produced tokens yet.
_Avoid_: Session, sign-in session

**Offline session**:
A long-lived refresh grant that lets one client re-authenticate without a browser. It survives SSO logout and is revoked by marking it expired, not by erasing it.
_Avoid_: Offline token, persistent session

**Scope**:
A token capability string from a realm's catalog — for example `openid`, `profile`, `email` or `offline_access` — that a client requests. A scope is neither a role nor a permission grant.
_Avoid_: Permission, grant, right

**Scope-role mapping**:
A per-client rule that granting one scope in a token also grants one client role. It pairs a scope with a role and belongs to exactly one client.
_Avoid_: Permission mapping, role mapping, scope permission

**Audit entry**:
One recorded admin write: the action, the actor (an authenticated admin or the static API key), the target and an untyped detail payload. It is immutable.
_Avoid_: Audit event, history row

**Operator**:
The person using this dashboard, authenticated in the admin realm with the admin role. Distinct from the Users being administered.
_Avoid_: Admin user, viewer

### Actions

**Deactivate**:
The reversible switch that stops a User from authenticating while its row and history remain. Distinct from delete, which is guarded and irreversible.
_Avoid_: Disable, suspend, archive

**Revoke**:
The end of a Session or an Offline session, recorded by its status becoming EXPIRED; the row survives and stays listable.
_Avoid_: Delete, terminate, kill

**Invalidate**:
A bulk Revoke applied to every Session and Offline session matching a User and/or a Client. Not a per-resource action.
_Avoid_: Revoke all, purge, force logout
