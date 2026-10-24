import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { selectClientsItems } from "@/entities/clients";
import {
  fetchOfflineSessions,
  revokeOfflineSessionThunk,
  selectOfflineSessionsItems,
  selectOfflineSessionsListError,
  selectOfflineSessionsListStatus,
  selectOfflineSessionsPage,
} from "@/entities/offline-sessions";
import { selectRealmsItems } from "@/entities/realms";
import { selectUsersItems } from "@/entities/users";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Pager } from "@/shared/ui/pager";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { ConfirmDialog } from "@/widgets/confirm-dialog";
import { EntitySelect } from "@/widgets/entity-select";
import { readOfflineSessionsListParams } from "./params";

export const OfflineSessions = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readOfflineSessionsListParams(searchParams);
  const items = useAppSelector(selectOfflineSessionsItems);
  const page = useAppSelector(selectOfflineSessionsPage);
  const status = useAppSelector(selectOfflineSessionsListStatus);
  const error = useAppSelector(selectOfflineSessionsListError);
  const realms = useAppSelector(selectRealmsItems);
  const users = useAppSelector(selectUsersItems);
  const clients = useAppSelector(selectClientsItems);
  const [revoking, setRevoking] = useState<string | null>(null);

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    next.set("offset", "0");
    void setSearchParams(next);
  };

  const goToOffset = (offset: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("limit", String(params.limit));
    next.set("offset", String(Math.max(0, offset)));
    void setSearchParams(next);
  };

  const selectRealm = (value: string) => {
    updateParams({
      realm_id: value || undefined,
      user_id: undefined,
      client_id: undefined,
    });
  };

  const emailOf = (userId: string) =>
    users.find((user) => user.id === userId)?.email ?? userId;
  const clientNameOf = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.name ?? clientId;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Offline sessions</h2>
        <p className="text-sm text-muted-foreground">
          Standing access: long-lived refresh grants that survive SSO logout.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <EntitySelect
            label="Realm"
            value={params.realm_id ?? ""}
            onChange={selectRealm}
            options={realms.map((realm) => ({
              id: realm.id,
              name: realm.name,
            }))}
            allLabel="All realms"
          />
        </div>
        <div className="w-64">
          <EntitySelect
            label="User"
            value={params.user_id ?? ""}
            onChange={(value) => updateParams({ user_id: value || undefined })}
            options={users.map((user) => ({ id: user.id, name: user.email }))}
            allLabel="All users"
          />
        </div>
        <div className="w-64">
          <EntitySelect
            label="Client"
            value={params.client_id ?? ""}
            onChange={(value) =>
              updateParams({ client_id: value || undefined })
            }
            options={clients.map((client) => ({
              id: client.id,
              name: client.name,
            }))}
            allLabel="All clients"
          />
        </div>
      </div>
      {status === "loading" && items.length === 0 ? (
        <div className="grid gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}
      {status === "failed" ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p role="alert" className="text-sm text-destructive">
              {error?.message ?? "Could not load offline sessions."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchOfflineSessions(params))}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {status !== "loading" || items.length > 0 ? (
        <Card>
          <CardContent className="px-0">
            {items.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground">
                No offline sessions match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Link
                          to={`/offline-sessions/${session.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {emailOf(session.user_id)}
                        </Link>
                      </TableCell>
                      <TableCell>{clientNameOf(session.client_id)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            session.status === "ACTIVE"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.created_at}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={session.status !== "ACTIVE"}
                          onClick={() => setRevoking(session.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Pager
              total={page.total}
              limit={page.limit}
              offset={page.offset}
              onPrevious={() => goToOffset(page.offset - page.limit)}
              onNext={() => goToOffset(page.offset + page.limit)}
            />
          </CardContent>
        </Card>
      ) : null}
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(next) => !next && setRevoking(null)}
        title="Revoke this offline session?"
        description="The grant is marked expired — the row stays visible with status EXPIRED."
        confirmLabel="Revoke grant"
        onConfirm={() =>
          revoking
            ? dispatch(revokeOfflineSessionThunk(revoking)).unwrap()
            : Promise.reject(new Error("Nothing to revoke."))
        }
        onDone={() => setRevoking(null)}
      />
    </div>
  );
};
