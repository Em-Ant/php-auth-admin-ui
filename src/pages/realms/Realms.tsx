import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  fetchRealms,
  selectRealmsItems,
  selectRealmsListError,
  selectRealmsListStatus,
  selectRealmsPage,
} from "@/entities/realms";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatTtl } from "./format";
import { readRealmsListParams } from "./params";
import { CreateRealmDialog } from "./RealmDialogs";

const RealmsSkeleton = () => (
  <div className="grid gap-2">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export const Realms = () => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readRealmsListParams(searchParams);
  const items = useAppSelector(selectRealmsItems);
  const page = useAppSelector(selectRealmsPage);
  const status = useAppSelector(selectRealmsListStatus);
  const error = useAppSelector(selectRealmsListError);
  const [createOpen, setCreateOpen] = useState(false);

  const goToOffset = (offset: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("limit", String(params.limit));
    next.set("offset", String(Math.max(0, offset)));
    void setSearchParams(next);
  };

  const showingFrom = page.total === 0 ? 0 : page.offset + 1;
  const showingTo = Math.min(page.offset + page.limit, page.total);
  const hasPrevious = page.offset > 0;
  const hasNext = page.offset + page.limit < page.total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Realms</h2>
          <p className="text-sm text-muted-foreground">
            Hard isolation boundaries: keys, token lifetimes, scope catalog and
            password policy.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create realm
        </Button>
      </div>
      {status === "loading" && items.length === 0 ? <RealmsSkeleton /> : null}
      {status === "failed" ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p role="alert" className="text-sm text-destructive">
              {error?.message ?? "Could not load realms."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(fetchRealms(params))}
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
                No realms yet. Create the first one to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Access token</TableHead>
                    <TableHead>Session max</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((realm) => (
                    <TableRow key={realm.id}>
                      <TableCell>
                        <Link
                          to={`/realms/${realm.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {realm.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="flex max-w-64 flex-wrap gap-1">
                          {realm.scope
                            .split(" ")
                            .filter(Boolean)
                            .map((scope) => (
                              <Badge key={scope} variant="outline">
                                {scope}
                              </Badge>
                            ))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatTtl(realm.access_token_expires_in)}
                      </TableCell>
                      <TableCell>
                        {formatTtl(realm.session_expires_in)}
                      </TableCell>
                      <TableCell>{realm.created_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {page.total > 0 ? (
              <div className="flex items-center justify-between gap-4 border-t px-6 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {showingFrom}–{showingTo} of {page.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrevious}
                    onClick={() => goToOffset(page.offset - page.limit)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => goToOffset(page.offset + page.limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <CreateRealmDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => dispatch(fetchRealms(params))}
      />
    </div>
  );
};
