import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { selectClientsItems } from "@/entities/clients";
import { selectRealmsItems } from "@/entities/realms";
import {
  deleteRoleThunk,
  fetchRoleById,
  selectRoleDetail,
  selectRoleDetailError,
  selectRoleDetailStatus,
} from "@/entities/roles";
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
import { EditRoleDialog } from "./RoleDialogs";

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

export const RoleDetail = () => {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const detail = useAppSelector(selectRoleDetail);
  const status = useAppSelector(selectRoleDetailStatus);
  const error = useAppSelector(selectRoleDetailError);
  const realms = useAppSelector(selectRealmsItems);
  const clients = useAppSelector(selectClientsItems);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
          <CardTitle>Could not load role</CardTitle>
          <CardDescription role="alert" className="text-destructive">
            {error?.message ?? "Unknown error."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/roles">
              <ArrowLeft />
              Back to roles
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
          <CardTitle>Role not found</CardTitle>
          <CardDescription>No role with this id exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/roles">
              <ArrowLeft />
              Back to roles
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const realmName =
    realms.find((realm) => realm.id === detail.realm_id)?.name ??
    detail.realm_id;
  const clientName = detail.client_id
    ? (clients.find((client) => client.id === detail.client_id)?.name ??
      detail.client_id)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/roles">
              <ArrowLeft />
              Roles
            </Link>
          </Button>
          <h2 className="text-xl font-semibold">{detail.name}</h2>
          <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit role
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
              <DetailRow label="Realm">{realmName}</DetailRow>
              <DetailRow label="Scope">
                <Badge variant="outline">
                  {detail.client_id ? "client" : "realm"}
                </Badge>
              </DetailRow>
              {clientName ? (
                <DetailRow label="Client">{clientName}</DetailRow>
              ) : null}
              <DetailRow label="Description">
                {detail.description ?? "—"}
              </DetailRow>
              <DetailRow label="Created">{detail.created_at}</DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Deleting a role is irreversible. Unassign it from users and remove
              its scope-role mappings first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete role
            </Button>
          </CardContent>
        </Card>
      </div>
      <EditRoleDialog
        role={detail}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => dispatch(fetchRoleById(id))}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete role "${detail.name}"?`}
        description="The role is deleted permanently. Assignments and scope-role mappings block the delete."
        confirmLabel="Delete role"
        onConfirm={() => dispatch(deleteRoleThunk(id)).unwrap()}
        onDone={() => void navigate("/roles")}
      />
    </div>
  );
};
