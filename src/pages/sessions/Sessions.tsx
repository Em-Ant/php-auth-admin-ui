import { useState } from "react";
import { useSearchParams } from "react-router";

import { selectRealmsItems } from "@/entities/realms";
import {
  fetchSessions,
  revokeSessionThunk,
  selectSessionsItems,
  selectSessionsListError,
  selectSessionsListStatus,
  selectSessionsPage,
} from "@/entities/sessions";
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
import { readSessionsListParams } from "./params";
import { InvalidateDialog } from "./SessionsDialogs";

export const Sessions = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readSessionsListParams(searchParams);
  const items = useAppSelector(selectSessionsItems);
  const page = useAppSelector(selectSessionsPage);
  const status = useAppSelector(selectSessionsListStatus);
  const error = useAppSelector(selectSessionsListError);
  const realms = useAppSelector(selectRealmsItems);
  const users = useAppSelector(selectUsersItems);
  const [invalidateOpen, setInvalidateOpen] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    updateParams({ realm_id: value || undefined, user_id: undefined });
  };

  const emailOf = (userId: string) =>
    users.find((user) => user.id === userId)?.email ?? userId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Who is currently signed in: one SSO session per browser.
          </p>
        </div>
        <Button variant="outline" onClick={() => setInvalidateOpen(true)}>
          Invalidate…
        </Button>
      </div>
      {notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      ) : null}
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
              {error?.message ?? "Could not load sessions."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchSessions(params))}
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
                No sessions match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ACR</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {emailOf(session.user_id)}
                      </TableCell>
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
                      <TableCell>{session.acr}</TableCell>
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
      <InvalidateDialog
        open={invalidateOpen}
        onOpenChange={setInvalidateOpen}
        onInvalidated={(count) => {
          setNotice(`Invalidated ${count} session${count === 1 ? "" : "s"}.`);
          dispatch(fetchSessions(params));
        }}
      />
      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(next) => !next && setRevoking(null)}
        title="Revoke this session?"
        description="The SSO session ends and its logins are expired with it. The row stays visible with status EXPIRED."
        confirmLabel="Revoke session"
        onConfirm={() =>
          revoking
            ? dispatch(revokeSessionThunk(revoking)).unwrap()
            : Promise.reject(new Error("Nothing to revoke."))
        }
        onDone={() => setRevoking(null)}
      />
    </div>
  );
};
