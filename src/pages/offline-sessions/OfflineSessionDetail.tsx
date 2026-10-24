import { ArrowLeft, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useParams } from "react-router";
import { selectClientsItems } from "@/entities/clients";
import {
  fetchOfflineSessionById,
  revokeOfflineSessionThunk,
  selectOfflineSessionDetail,
  selectOfflineSessionDetailError,
  selectOfflineSessionDetailStatus,
} from "@/entities/offline-sessions";
import { selectRealmsItems } from "@/entities/realms";
import { selectUsersItems } from "@/entities/users";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { ConfirmDialog } from "@/widgets/confirm-dialog";

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 border-b py-2 last:border-0">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="text-right text-sm font-medium">{children}</dd>
  </div>
);

export const OfflineSessionDetail = () => {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const detail = useAppSelector(selectOfflineSessionDetail);
  const status = useAppSelector(selectOfflineSessionDetailStatus);
  const error = useAppSelector(selectOfflineSessionDetailError);
  const realms = useAppSelector(selectRealmsItems);
  const users = useAppSelector(selectUsersItems);
  const clients = useAppSelector(selectClientsItems);
  const [revokeOpen, setRevokeOpen] = useState(false);

  if (status === "loading" && detail?.id !== id) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load offline session</CardTitle>
          <CardDescription role="alert" className="text-destructive">
            {error?.message ?? "Unknown error."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/offline-sessions">
              <ArrowLeft />
              Back to offline sessions
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!detail || detail.id !== id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Offline session not found</CardTitle>
          <CardDescription>
            No offline session with this id exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/offline-sessions">
              <ArrowLeft />
              Back to offline sessions
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const realmName =
    realms.find((realm) => realm.id === detail.realm_id)?.name ??
    detail.realm_id;
  const userName =
    users.find((user) => user.id === detail.user_id)?.email ?? detail.user_id;
  const clientName =
    clients.find((client) => client.id === detail.client_id)?.name ??
    detail.client_id;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/offline-sessions">
            <ArrowLeft />
            Offline sessions
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">{userName}</h2>
        <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Status">
                <Badge
                  variant={detail.status === "ACTIVE" ? "secondary" : "outline"}
                >
                  {detail.status}
                </Badge>
              </DetailRow>
              <DetailRow label="User">{userName}</DetailRow>
              <DetailRow label="Client">{clientName}</DetailRow>
              <DetailRow label="Realm">{realmName}</DetailRow>
              <DetailRow label="ACR">{detail.acr}</DetailRow>
              <DetailRow label="Scope">{detail.scope}</DetailRow>
              <DetailRow label="Created">{detail.created_at}</DetailRow>
              <DetailRow label="Authenticated at">
                {detail.authenticated_at ?? "—"}
              </DetailRow>
              <DetailRow label="Updated">{detail.updated_at ?? "—"}</DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Revoking marks the grant expired; the row stays listable for
              audit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              disabled={detail.status !== "ACTIVE"}
              onClick={() => setRevokeOpen(true)}
            >
              <Trash2 />
              Revoke grant
            </Button>
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke this offline session?"
        description="The grant is marked expired — the row stays visible with status EXPIRED."
        confirmLabel="Revoke grant"
        onConfirm={() => dispatch(revokeOfflineSessionThunk(id)).unwrap()}
        onDone={() => dispatch(fetchOfflineSessionById(id))}
      />
    </div>
  );
};
