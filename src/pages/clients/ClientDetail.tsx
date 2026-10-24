import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  addScopeRoleThunk,
  deleteClientThunk,
  deleteScopeRoleThunk,
  fetchClientById,
  fetchScopeRoles,
  selectClientDetail,
  selectClientDetailError,
  selectClientDetailStatus,
  selectClientScopeRoles,
  toggleScopeRoleThunk,
} from "@/entities/clients";
import { selectRealmsItems } from "@/entities/realms";
import { selectRolesItems } from "@/entities/roles";
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
import { Switch } from "@/shared/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { ConfirmDialog } from "@/widgets/confirm-dialog";
import { AddScopeRoleDialog, EditClientDialog } from "./ClientDialogs";

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

export const ClientDetail = () => {
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const detail = useAppSelector(selectClientDetail);
  const status = useAppSelector(selectClientDetailStatus);
  const error = useAppSelector(selectClientDetailError);
  const scopeRoles = useAppSelector(selectClientScopeRoles);
  const realms = useAppSelector(selectRealmsItems);
  const roles = useAppSelector(selectRolesItems);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [removing, setRemoving] = useState<{
    scope: string;
    roleId: string;
  } | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);

  const refresh = () => {
    dispatch(fetchClientById(id));
    dispatch(fetchScopeRoles(id));
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
          <CardTitle>Could not load client</CardTitle>
          <CardDescription role="alert" className="text-destructive">
            {error?.message ?? "Unknown error."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/clients">
              <ArrowLeft />
              Back to clients
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
          <CardTitle>Client not found</CardTitle>
          <CardDescription>No client with this id exists.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link to="/clients">
              <ArrowLeft />
              Back to clients
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const realmName =
    realms.find((realm) => realm.id === detail.realm_id)?.name ??
    detail.realm_id;
  const realmScope =
    realms.find((realm) => realm.id === detail.realm_id)?.scope ?? "";
  const validScopes = (detail.scope ?? realmScope).split(" ").filter(Boolean);
  const roleOptions = roles
    .filter((role) => role.realm_id === detail.realm_id)
    .map((role) => ({
      id: role.id,
      name: role.client_id ? `${role.name} (client)` : role.name,
    }));

  const toggleRequired = (scope: string, roleId: string, required: boolean) => {
    setMappingError(null);
    dispatch(toggleScopeRoleThunk({ clientId: id, scope, roleId, required }))
      .unwrap()
      .catch((error: unknown) =>
        setMappingError(
          (error as { message?: string })?.message ??
            "Could not update mapping.",
        ),
      );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/clients">
              <ArrowLeft />
              Clients
            </Link>
          </Button>
          <h2 className="text-xl font-semibold">{detail.name}</h2>
          <p className="font-mono text-xs text-muted-foreground">{detail.id}</p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit client
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
              <DetailRow label="Redirect URIs">
                <span className="font-mono">{detail.uri}</span>
              </DetailRow>
              <DetailRow label="Realm">{realmName}</DetailRow>
              <DetailRow label="Type">
                <Badge variant={detail.require_auth ? "default" : "secondary"}>
                  {detail.require_auth ? "confidential" : "public"}
                </Badge>
              </DetailRow>
              <DetailRow label="Has secret">
                {detail.has_secret ? "yes" : "no"}
              </DetailRow>
              <DetailRow label="Scope">
                {detail.scope ?? "inherits realm"}
              </DetailRow>
              <DetailRow label="Created">{detail.created_at}</DetailRow>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>
              Deleting a client is irreversible. Remove its active logins and
              offline sessions first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete client
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Scope-role mappings</CardTitle>
            <CardDescription>
              Granting a scope in a token also grants the mapped role.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setMappingOpen(true)}>
            <Plus />
            Add mapping
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {mappingError ? (
            <p role="alert" className="px-6 pb-3 text-sm text-destructive">
              {mappingError}
            </p>
          ) : null}
          {scopeRoles.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              No mappings yet. Map a scope to a role to grant it automatically.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopeRoles.map((mapping) => (
                  <TableRow key={`${mapping.scope}/${mapping.role_id}`}>
                    <TableCell>
                      <Badge variant="outline">{mapping.scope}</Badge>
                    </TableCell>
                    <TableCell>{mapping.role_name}</TableCell>
                    <TableCell>
                      <Switch
                        aria-label={`Required for ${mapping.scope}`}
                        checked={mapping.required}
                        onCheckedChange={(checked) =>
                          toggleRequired(
                            mapping.scope,
                            mapping.role_id,
                            checked,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRemoving({
                            scope: mapping.scope,
                            roleId: mapping.role_id,
                          })
                        }
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
      <EditClientDialog
        client={detail}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={refresh}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete client "${detail.name}"?`}
        description="The client is deleted permanently. Active logins and offline sessions block the delete."
        confirmLabel="Delete client"
        onConfirm={() => dispatch(deleteClientThunk(id)).unwrap()}
        onDone={() => void navigate("/clients")}
      />
      <AddScopeRoleDialog
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        validScopes={validScopes}
        roleOptions={roleOptions}
        onAdd={(input) =>
          dispatch(addScopeRoleThunk({ clientId: id, input }))
            .unwrap()
            .then(() => {
              dispatch(fetchScopeRoles(id));
            })
        }
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(next) => !next && setRemoving(null)}
        title="Remove this mapping?"
        description="The scope will no longer grant the role. Recreating it is a new POST."
        confirmLabel="Remove mapping"
        onConfirm={() => {
          if (!removing) {
            return Promise.reject(new Error("Nothing to remove."));
          }
          const { scope, roleId } = removing;
          return dispatch(deleteScopeRoleThunk({ clientId: id, scope, roleId }))
            .unwrap()
            .then(() => {
              dispatch(fetchScopeRoles(id));
              setRemoving(null);
            });
        }}
        onDone={() => undefined}
      />
    </div>
  );
};
