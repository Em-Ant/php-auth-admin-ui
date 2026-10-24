import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  fetchRealmById,
  selectRealmDetail,
  selectRealmDetailError,
  selectRealmDetailStatus,
} from "@/entities/realms";
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
import { formatTtl } from "./format";
import { DeleteRealmDialog, EditRealmDialog } from "./RealmDialogs";

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

const PolicyValue = ({ value }: { value: number | null }) => {
  if (value === null) {
    return <span className="font-normal text-muted-foreground">inherit</span>;
  }
  return <span>{value}</span>;
};

export const RealmDetail = () => {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const detail = useAppSelector(selectRealmDetail);
  const status = useAppSelector(selectRealmDetailStatus);
  const error = useAppSelector(selectRealmDetailError);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (status === "loading" && detail?.id !== id) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load realm</CardTitle>
          <CardDescription role="alert" className="text-destructive">
            {error?.message ?? "Unknown error."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/realms">
              <ArrowLeft />
              Back to realms
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
          <CardTitle>Realm not found</CardTitle>
          <CardDescription>No realm with this id exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/realms">
              <ArrowLeft />
              Back to realms
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/realms">
              <ArrowLeft />
              Realms
            </Link>
          </Button>
          <h2 className="text-xl font-semibold">{detail.name}</h2>
          <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit realm
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Name">{detail.name}</DetailRow>
              <DetailRow label="Scope">
                <span className="flex flex-wrap justify-end gap-1">
                  {detail.scope
                    .split(" ")
                    .filter(Boolean)
                    .map((scope) => (
                      <Badge key={scope} variant="outline">
                        {scope}
                      </Badge>
                    ))}
                </span>
              </DetailRow>
              <DetailRow label="Key set">
                <span className="font-mono">{detail.keys_id}</span>
              </DetailRow>
              <DetailRow label="Created">{detail.created_at}</DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Token lifetimes</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Access token">
                {formatTtl(detail.access_token_expires_in)}
              </DetailRow>
              <DetailRow label="Refresh token">
                {formatTtl(detail.refresh_token_expires_in)}
              </DetailRow>
              <DetailRow label="Pending login">
                {formatTtl(detail.pending_login_expires_in)}
              </DetailRow>
              <DetailRow label="Authenticated login">
                {formatTtl(detail.authenticated_login_expires_in)}
              </DetailRow>
              <DetailRow label="Session max lifetime">
                {formatTtl(detail.session_expires_in)}
              </DetailRow>
              <DetailRow label="Session idle cutoff">
                {formatTtl(detail.idle_session_expires_in)}
              </DetailRow>
              <DetailRow label="Offline refresh token">
                {formatTtl(detail.offline_refresh_token_expires_in)}
              </DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password policy</CardTitle>
            <CardDescription>
              Empty rules inherit the global server config.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Min length">
                <PolicyValue value={detail.password_policy.min_length} />
              </DetailRow>
              <DetailRow label="Min lowercase">
                <PolicyValue value={detail.password_policy.min_lower} />
              </DetailRow>
              <DetailRow label="Min uppercase">
                <PolicyValue value={detail.password_policy.min_upper} />
              </DetailRow>
              <DetailRow label="Min digits">
                <PolicyValue value={detail.password_policy.min_digits} />
              </DetailRow>
              <DetailRow label="Min special">
                <PolicyValue value={detail.password_policy.min_special} />
              </DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Deleting a realm is irreversible. Remove its clients and users
              first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete realm
            </Button>
          </CardContent>
        </Card>
      </div>
      <EditRealmDialog
        realm={detail}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => dispatch(fetchRealmById(id))}
      />
      <DeleteRealmDialog
        realm={detail}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => void navigate("/realms")}
      />
    </div>
  );
};
