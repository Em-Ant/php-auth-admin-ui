import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { selectRealmsItems } from "@/entities/realms";
import { selectRolesItems } from "@/entities/roles";
import {
  deleteUserThunk,
  fetchUserById,
  fetchUserRoles,
  removeUserRoleThunk,
  selectUserDetail,
  selectUserDetailError,
  selectUserDetailStatus,
  selectUserRoles,
} from "@/entities/users";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { ConfirmDialog } from "@/widgets/confirm-dialog";
import { AssignRoleDialog, EditUserDialog } from "./UserDialogs";

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

export const UserDetail = () => {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const detail = useAppSelector(selectUserDetail);
  const status = useAppSelector(selectUserDetailStatus);
  const error = useAppSelector(selectUserDetailError);
  const userRoles = useAppSelector(selectUserRoles);
  const realms = useAppSelector(selectRealmsItems);
  const roles = useAppSelector(selectRolesItems);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const refresh = () => {
    dispatch(fetchUserById(id));
    dispatch(fetchUserRoles(id));
  };

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
          <CardTitle>Could not load user</CardTitle>
          <CardDescription role="alert" className="text-destructive">
            {error?.message ?? "Unknown error."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/users">
              <ArrowLeft />
              Back to users
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
          <CardTitle>User not found</CardTitle>
          <CardDescription>No user with this id exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/users">
              <ArrowLeft />
              Back to users
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const realmName =
    realms.find((realm) => realm.id === detail.realm_id)?.name ??
    detail.realm_id;
  const assignedIds = new Set(userRoles.map((role) => role.id));
  const roleOptions = roles
    .filter(
      (role) => role.realm_id === detail.realm_id && !assignedIds.has(role.id),
    )
    .map((role) => ({
      id: role.id,
      name: role.client_id ? `${role.name} (client)` : role.name,
    }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/users">
              <ArrowLeft />
              Users
            </Link>
          </Button>
          <h2 className="text-xl font-semibold">{detail.email}</h2>
          <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit user
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Email">{detail.email}</DetailRow>
              <DetailRow label="Name">{detail.name ?? "—"}</DetailRow>
              <DetailRow label="Realm">{realmName}</DetailRow>
              <DetailRow label="Status">
                <Badge variant={detail.valid ? "secondary" : "destructive"}>
                  {detail.valid ? "active" : "deactivated"}
                </Badge>
              </DetailRow>
              <DetailRow label="Email verified">
                {detail.email_verified ? "yes" : "no"}
              </DetailRow>
              <DetailRow label="Created">{detail.created_at}</DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Deleting a user is irreversible. Revoke its active sessions and
              offline sessions first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete user
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Roles</CardTitle>
            <CardDescription>
              Realm roles and client roles assigned to this user.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAssignOpen(true)}>
            <Plus />
            Assign role
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {rolesError ? (
            <p role="alert" className="px-6 pb-3 text-sm text-destructive">
              {rolesError}
            </p>
          ) : null}
          {userRoles.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              No roles assigned yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.client_id ? "client" : "realm"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRolesError(null);
                          dispatch(
                            removeUserRoleThunk({
                              userId: id,
                              roleId: role.id,
                            }),
                          )
                            .unwrap()
                            .catch((error: unknown) =>
                              setRolesError(
                                (error as { message?: string })?.message ??
                                  "Could not remove role.",
                              ),
                            );
                        }}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <EditUserDialog
        user={detail}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete user "${detail.email}"?`}
        description="The user is deleted permanently. Active sessions and offline sessions block the delete."
        confirmLabel="Delete user"
        onConfirm={() => dispatch(deleteUserThunk(id)).unwrap()}
        onDone={() => void navigate("/users")}
      />
      <AssignRoleDialog
        userId={id}
        roleOptions={roleOptions}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => dispatch(fetchUserRoles(id))}
      />
    </div>
  );
};
