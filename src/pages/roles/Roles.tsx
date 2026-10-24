import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { selectClientsItems } from "@/entities/clients";
import { selectRealmsItems } from "@/entities/realms";
import {
  fetchRoles,
  selectRolesItems,
  selectRolesListError,
  selectRolesListStatus,
  selectRolesPage,
} from "@/entities/roles";
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
import { EntitySelect } from "@/widgets/entity-select";
import { readRolesListParams } from "./params";
import { CreateRoleDialog } from "./RoleDialogs";

export const Roles = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readRolesListParams(searchParams);
  const items = useAppSelector(selectRolesItems);
  const page = useAppSelector(selectRolesPage);
  const status = useAppSelector(selectRolesListStatus);
  const error = useAppSelector(selectRolesListError);
  const realms = useAppSelector(selectRealmsItems);
  const clients = useAppSelector(selectClientsItems);
  const [createOpen, setCreateOpen] = useState(false);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Roles</h2>
          <p className="text-sm text-muted-foreground">
            Realm roles and client roles, the grants that scope-to-role mappings
            hand out.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create role
        </Button>
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
            allLabel="All roles"
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
              {error?.message ?? "Could not load roles."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchRoles(params))}
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
                No roles match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Link
                          to={`/roles/${role.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {role.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {role.client_id ? "client" : "realm"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-64 truncate">
                        {role.description ?? "—"}
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
      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => dispatch(fetchRoles(params))}
      />
    </div>
  );
};
