import { useState } from "react";
import { useSearchParams } from "react-router";
import { selectClientsItems } from "@/entities/clients";
import {
  deleteLoginThunk,
  fetchLogins,
  selectLoginsItems,
  selectLoginsListError,
  selectLoginsListStatus,
  selectLoginsPage,
} from "@/entities/logins";
import { selectRealmsItems } from "@/entities/realms";
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
import { readLoginsListParams } from "./params";

export const Logins = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readLoginsListParams(searchParams);
  const items = useAppSelector(selectLoginsItems);
  const page = useAppSelector(selectLoginsPage);
  const status = useAppSelector(selectLoginsListStatus);
  const error = useAppSelector(selectLoginsListError);
  const realms = useAppSelector(selectRealmsItems);
  const clients = useAppSelector(selectClientsItems);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    updateParams({ realm_id: value || undefined, client_id: undefined });
  };

  const clientNameOf = (clientId: string) =>
    clients.find((client) => client.id === clientId)?.name ?? clientId;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Logins</h2>
        <p className="text-sm text-muted-foreground">
          Sign-in activity: one authentication attempt per client, not a
          session.
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
              {error?.message ?? "Could not load logins."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchLogins(params))}
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
                No logins match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell className="font-medium">
                        {clientNameOf(login.client_id)}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {login.scope}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            login.status === "EXPIRED" ? "outline" : "secondary"
                          }
                        >
                          {login.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{login.created_at}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(login.id)}
                        >
                          Delete
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
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete this login record?"
        description="The authentication attempt is erased from the activity list."
        confirmLabel="Delete login"
        onConfirm={() =>
          deleting
            ? dispatch(deleteLoginThunk(deleting)).unwrap()
            : Promise.reject(new Error("Nothing to delete."))
        }
        onDone={() => setDeleting(null)}
      />
    </div>
  );
};
