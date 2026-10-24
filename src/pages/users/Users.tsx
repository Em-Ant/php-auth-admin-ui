import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { selectRealmsItems } from "@/entities/realms";
import {
  fetchUsers,
  selectUsersItems,
  selectUsersListError,
  selectUsersListStatus,
  selectUsersPage,
} from "@/entities/users";
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
import { readUsersListParams } from "./params";
import { CreateUserDialog } from "./UserDialogs";

export const Users = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readUsersListParams(searchParams);
  const items = useAppSelector(selectUsersItems);
  const page = useAppSelector(selectUsersPage);
  const status = useAppSelector(selectUsersListStatus);
  const error = useAppSelector(selectUsersListError);
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
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            People in a realm: profile, active switch and roles.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create user
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
            <label htmlFor="users-q" className="text-sm font-medium">
              Search
            </label>
            <Input
              id="users-q"
              value={query}
              placeholder="Email or name prefix…"
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
              {error?.message ?? "Could not load users."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchUsers(params))}
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
                No users match these filters.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link
                          to={`/users/${user.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {user.email}
                        </Link>
                      </TableCell>
                      <TableCell>{user.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.valid ? "secondary" : "destructive"}
                        >
                          {user.valid ? "active" : "deactivated"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.email_verified ? "yes" : "no"}
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
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => dispatch(fetchUsers(params))}
      />
    </div>
  );
};
