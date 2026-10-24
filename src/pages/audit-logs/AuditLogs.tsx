import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  fetchAuditLogs,
  selectAuditLogsItems,
  selectAuditLogsListError,
  selectAuditLogsListStatus,
  selectAuditLogsPage,
} from "@/entities/audit-logs";
import { selectRealmsItems } from "@/entities/realms";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
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
import { PurgeDialog } from "./AuditDialogs";
import { readAuditLogsListParams } from "./params";

const ACTIONS = [
  "realm.create",
  "realm.update",
  "realm.delete",
  "client.create",
  "client.update",
  "client.delete",
  "user.create",
  "user.update",
  "user.delete",
  "role.create",
  "role.update",
  "role.delete",
  "scope_role.create",
  "scope_role.update",
  "scope_role.delete",
];

const ACTOR_TYPES = ["admin_user", "api_key"];
const TARGET_TYPES = ["realm", "client", "user", "role", "scope_role"];

export const AuditLogs = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readAuditLogsListParams(searchParams);
  const items = useAppSelector(selectAuditLogsItems);
  const page = useAppSelector(selectAuditLogsPage);
  const status = useAppSelector(selectAuditLogsListStatus);
  const error = useAppSelector(selectAuditLogsListError);
  const realms = useAppSelector(selectRealmsItems);
  const [purgeOpen, setPurgeOpen] = useState(false);
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Audit log</h2>
          <p className="text-sm text-muted-foreground">
            Every admin write on realms, clients, users, roles and scope-role
            mappings.
          </p>
        </div>
        <Button variant="outline" onClick={() => setPurgeOpen(true)}>
          Purge…
        </Button>
      </div>
      {notice ? (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <EntitySelect
            label="Realm"
            value={params.realm_id ?? ""}
            onChange={(value) => updateParams({ realm_id: value || undefined })}
            options={realms.map((realm) => ({
              id: realm.id,
              name: realm.name,
            }))}
            allLabel="All realms"
          />
        </div>
        <div className="w-56">
          <EntitySelect
            label="Action"
            value={params.action ?? ""}
            onChange={(value) => updateParams({ action: value || undefined })}
            options={ACTIONS.map((action) => ({ id: action, name: action }))}
            allLabel="All actions"
          />
        </div>
        <div className="w-48">
          <EntitySelect
            label="Actor"
            value={params.actor_type ?? ""}
            onChange={(value) =>
              updateParams({ actor_type: value || undefined })
            }
            options={ACTOR_TYPES.map((actor) => ({ id: actor, name: actor }))}
            allLabel="All actors"
          />
        </div>
        <div className="w-48">
          <EntitySelect
            label="Target"
            value={params.target_type ?? ""}
            onChange={(value) =>
              updateParams({ target_type: value || undefined })
            }
            options={TARGET_TYPES.map((target) => ({
              id: target,
              name: target,
            }))}
            allLabel="All targets"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="audit-from">From</Label>
          <Input
            id="audit-from"
            type="date"
            value={params.from ?? ""}
            onChange={(event) =>
              updateParams({ from: event.target.value || undefined })
            }
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="audit-to">To</Label>
          <Input
            id="audit-to"
            type="date"
            value={params.to ?? ""}
            onChange={(event) =>
              updateParams({ to: event.target.value || undefined })
            }
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
              {error?.message ?? "Could not load the audit log."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchAuditLogs(params))}
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
                No entries match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Link
                          to={`/audit-logs/${entry.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {entry.action}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.actor_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.target_type}</Badge>
                      </TableCell>
                      <TableCell>{entry.created_at}</TableCell>
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
      <PurgeDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        onPurged={(count) => {
          setNotice(`Purged ${count} ${count === 1 ? "entry" : "entries"}.`);
          dispatch(fetchAuditLogs(params));
        }}
      />
    </div>
  );
};
