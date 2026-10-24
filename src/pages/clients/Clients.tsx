import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  fetchClients,
  selectClientsItems,
  selectClientsListError,
  selectClientsListStatus,
  selectClientsPage,
} from "@/entities/clients";
import { selectRealmsItems } from "@/entities/realms";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
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
import { CreateClientDialog } from "./ClientDialogs";
import { readClientsListParams } from "./params";

export const Clients = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readClientsListParams(searchParams);
  const items = useAppSelector(selectClientsItems);
  const page = useAppSelector(selectClientsPage);
  const status = useAppSelector(selectClientsListStatus);
  const error = useAppSelector(selectClientsListError);
  const realms = useAppSelector(selectRealmsItems);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState(params.q ?? "");

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
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-sm text-muted-foreground">
            Applications in a realm: public browser apps or confidential
            server-side clients.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create client
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
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
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ q: query || undefined });
          }}
        >
          <div className="grid gap-1.5">
            <label htmlFor="clients-q" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="clients-q"
              value={query}
              placeholder="Name or URI prefix…"
              onChange={(event) => setQuery(event.target.value)}
              className="w-64"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
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
              {error?.message ?? "Could not load clients."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchClients(params))}
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
                No clients match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URI pattern</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scope</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Link
                          to={`/clients/${client.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {client.uri}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.require_auth ? "default" : "secondary"
                          }
                        >
                          {client.require_auth ? "confidential" : "public"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {client.scope ?? "inherits realm"}
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
      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => dispatch(fetchClients(params))}
      />
    </div>
  );
};
