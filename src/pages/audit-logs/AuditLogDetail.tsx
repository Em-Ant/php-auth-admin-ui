import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import {
  selectAuditLogDetail,
  selectAuditLogDetailError,
  selectAuditLogDetailStatus,
} from "@/entities/audit-logs";
import { selectRealmsItems } from "@/entities/realms";
import { useAppSelector } from "@/shared/lib";
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

export const AuditLogDetail = () => {
  const { id = "" } = useParams();
  const detail = useAppSelector(selectAuditLogDetail);
  const status = useAppSelector(selectAuditLogDetailStatus);
  const error = useAppSelector(selectAuditLogDetailError);
  const realms = useAppSelector(selectRealmsItems);

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
          <CardTitle>Could not load entry</CardTitle>
          <CardDescription role="alert" className="text-destructive">
            {error?.message ?? "Unknown error."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/audit-logs">
              <ArrowLeft />
              Back to audit log
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
          <CardTitle>Entry not found</CardTitle>
          <CardDescription>No audit entry with this id exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/audit-logs">
              <ArrowLeft />
              Back to audit log
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const realmName = detail.realm_id
    ? (realms.find((realm) => realm.id === detail.realm_id)?.name ??
      detail.realm_id)
    : "—";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/audit-logs">
            <ArrowLeft />
            Audit log
          </Link>
        </Button>
        <h2 className="text-xl font-semibold">{detail.action}</h2>
        <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Action">
                <Badge>{detail.action}</Badge>
              </DetailRow>
              <DetailRow label="Actor">
                <Badge variant="outline">{detail.actor_type}</Badge>
              </DetailRow>
              <DetailRow label="Actor id">
                <span className="font-mono">{detail.actor_id ?? "—"}</span>
              </DetailRow>
              <DetailRow label="Realm">{realmName}</DetailRow>
              <DetailRow label="Target">
                <Badge variant="outline">{detail.target_type}</Badge>
              </DetailRow>
              <DetailRow label="Target id">
                <span className="font-mono">{detail.target_id ?? "—"}</span>
              </DetailRow>
              <DetailRow label="Created">{detail.created_at}</DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Detail payload</CardTitle>
            <CardDescription>
              Untyped and version-unstable: display only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(detail.detail, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
