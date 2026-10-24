import { combineSlices } from "@reduxjs/toolkit";
import { operatorReducer } from "@/app/model/operator";
import { themeReducer } from "@/app/model/theme";
import { auditLogsReducer } from "@/entities/audit-logs";
import { clientsReducer } from "@/entities/clients";
import { loginsReducer } from "@/entities/logins";
import { offlineSessionsReducer } from "@/entities/offline-sessions";
import { realmsReducer } from "@/entities/realms";
import { rolesReducer } from "@/entities/roles";
import { sessionsReducer } from "@/entities/sessions";
import { usersReducer } from "@/entities/users";

const rootReducer = combineSlices({
  operator: operatorReducer,
  theme: themeReducer,
  realms: realmsReducer,
  clients: clientsReducer,
  users: usersReducer,
  roles: rolesReducer,
  sessions: sessionsReducer,
  logins: loginsReducer,
  offlineSessions: offlineSessionsReducer,
  auditLogs: auditLogsReducer,
});

export default rootReducer;
