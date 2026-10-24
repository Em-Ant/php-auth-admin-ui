import { useState } from "react";
import {
  type CreateClientInput,
  createClientThunk,
  type UpdateClientInput,
  updateClientThunk,
} from "@/entities/clients";
import { selectRealmsItems } from "@/entities/realms";
import type { Client } from "@/shared/api/contract";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { type EntityOption, EntitySelect } from "@/widgets/entity-select";

export interface ClientFormValues {
  name: string;
  uri: string;
  realm_id: string;
  require_auth: boolean;
  client_secret: string;
  scope: string;
}

export const newClientFormValues = (realm_id = ""): ClientFormValues => ({
  name: "",
  uri: "",
  realm_id,
  require_auth: false,
  client_secret: "",
  scope: "",
});

export const clientToFormValues = (client: Client): ClientFormValues => ({
  name: client.name,
  uri: client.uri,
  realm_id: client.realm_id,
  require_auth: client.require_auth,
  client_secret: "",
  scope: client.scope ?? "",
});

const FieldNote = ({ error, hint }: { error?: string; hint?: string }) => {
  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }
  if (hint) {
    return <p className="text-xs text-muted-foreground">{hint}</p>;
  }
  return null;
};

interface ClientFormProps {
  initial: ClientFormValues;
  mode: "create" | "edit";
  hasSecret: boolean;
  submitLabel: string;
  saving: boolean;
  serverError: string | null;
  onCancel: () => void;
  onSubmit: (values: ClientFormValues) => void;
}

export const ClientForm = ({
  initial,
  mode,
  hasSecret,
  submitLabel,
  saving,
  serverError,
  onCancel,
  onSubmit,
}: ClientFormProps) => {
  const realms = useAppSelector(selectRealmsItems);
  const [name, setName] = useState(initial.name);
  const [uri, setUri] = useState(initial.uri);
  const [realmId, setRealmId] = useState(initial.realm_id);
  const [requireAuth, setRequireAuth] = useState(initial.require_auth);
  const [secret, setSecret] = useState("");
  const [scope, setScope] = useState(initial.scope);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }
    if (!uri.trim()) {
      nextErrors.uri = "A redirect URI pattern is required.";
    }
    if (!realmId) {
      nextErrors.realm_id = "A realm is required.";
    }
    if (mode === "create" && requireAuth && !secret) {
      nextErrors.client_secret = "A confidential client needs a secret.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit({
      name: name.trim(),
      uri: uri.trim(),
      realm_id: realmId,
      require_auth: requireAuth,
      client_secret: secret,
      scope: scope.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="client-name">Name</Label>
        <Input
          id="client-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name !== undefined}
        />
        <FieldNote error={errors.name} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="client-uri">Redirect URI pattern</Label>
        <Input
          id="client-uri"
          value={uri}
          placeholder="http://localhost:5173/*"
          onChange={(event) => setUri(event.target.value)}
          aria-invalid={errors.uri !== undefined}
          className="font-mono"
        />
        <FieldNote error={errors.uri} />
      </div>
      <EntitySelect
        label="Realm"
        value={realmId}
        onChange={setRealmId}
        options={realms.map((realm) => ({ id: realm.id, name: realm.name }))}
        placeholder="Select a realm…"
        disabled={mode === "edit"}
      />
      {errors.realm_id ? (
        <p className="text-xs text-destructive">{errors.realm_id}</p>
      ) : null}
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <Label htmlFor="client-confidential">Confidential client</Label>
          <p className="text-xs text-muted-foreground">
            Server-side apps authenticate with a secret; browser apps use PKCE.
          </p>
        </div>
        <Switch
          id="client-confidential"
          checked={requireAuth}
          onCheckedChange={setRequireAuth}
        />
      </div>
      {mode === "edit" && hasSecret && !requireAuth ? (
        <p className="text-xs text-muted-foreground">
          Demoting to public clears the stored secret.
        </p>
      ) : null}
      {requireAuth || mode === "edit" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="client-secret">Client secret</Label>
          <Input
            id="client-secret"
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            aria-invalid={errors.client_secret !== undefined}
            placeholder={
              mode === "edit" ? "Empty keeps the current secret…" : undefined
            }
          />
          <FieldNote
            error={errors.client_secret}
            hint={
              mode === "edit"
                ? "Fill to rotate the secret; empty leaves it unchanged. The API never returns it."
                : "Shown once — the API never returns it."
            }
          />
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="client-scope">Scope</Label>
        <Input
          id="client-scope"
          value={scope}
          placeholder="Empty inherits the realm scope…"
          onChange={(event) => setScope(event.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
};

const toCreateInput = (values: ClientFormValues): CreateClientInput => ({
  name: values.name,
  uri: values.uri,
  realm_id: values.realm_id,
  require_auth: values.require_auth,
  ...(values.require_auth ? { client_secret: values.client_secret } : {}),
  ...(values.scope ? { scope: values.scope } : {}),
});

const toUpdateInput = (values: ClientFormValues): UpdateClientInput => ({
  name: values.name,
  uri: values.uri,
  require_auth: values.require_auth,
  ...(values.client_secret ? { client_secret: values.client_secret } : {}),
  scope: values.scope === "" ? null : values.scope,
});

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateClientDialog = ({
  open,
  onOpenChange,
  onCreated,
  initialRealmId,
}: DialogProps & { onCreated: () => void; initialRealmId?: string }) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create client</DialogTitle>
        </DialogHeader>
        <ClientForm
          key="new-client"
          initial={newClientFormValues(initialRealmId)}
          mode="create"
          hasSecret={false}
          submitLabel="Create client"
          saving={saving}
          serverError={serverError}
          onCancel={close}
          onSubmit={(values) => {
            setSaving(true);
            setServerError(null);
            dispatch(createClientThunk(toCreateInput(values)))
              .unwrap()
              .then(() => {
                onCreated();
                close();
              })
              .catch((error: unknown) =>
                setServerError(
                  (error as { message?: string })?.message ??
                    "Something went wrong.",
                ),
              )
              .finally(() => setSaving(false));
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const EditClientDialog = ({
  client,
  open,
  onOpenChange,
  onSaved,
}: DialogProps & { client: Client; onSaved: () => void }) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
        </DialogHeader>
        <ClientForm
          key={client.id}
          initial={clientToFormValues(client)}
          mode="edit"
          hasSecret={client.has_secret}
          submitLabel="Save changes"
          saving={saving}
          serverError={serverError}
          onCancel={close}
          onSubmit={(values) => {
            setSaving(true);
            setServerError(null);
            dispatch(
              updateClientThunk({
                id: client.id,
                input: toUpdateInput(values),
              }),
            )
              .unwrap()
              .then(() => {
                onSaved();
                close();
              })
              .catch((error: unknown) =>
                setServerError(
                  (error as { message?: string })?.message ??
                    "Something went wrong.",
                ),
              )
              .finally(() => setSaving(false));
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

interface AddScopeRoleDialogProps extends DialogProps {
  validScopes: string[];
  roleOptions: EntityOption[];
  onAdd: (input: {
    scope: string;
    role_id: string;
    required: boolean;
  }) => Promise<unknown>;
}

export const AddScopeRoleDialog = ({
  open,
  onOpenChange,
  validScopes,
  roleOptions,
  onAdd,
}: AddScopeRoleDialogProps) => {
  const [scope, setScope] = useState("");
  const [roleId, setRoleId] = useState("");
  const [required, setRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    setScope("");
    setRoleId("");
    setRequired(false);
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!scope || !roleId) {
      setServerError("Scope and role are required.");
      return;
    }
    setSaving(true);
    setServerError(null);
    onAdd({ scope, role_id: roleId, required })
      .then(() => close())
      .catch((error: unknown) =>
        setServerError(
          (error as { message?: string })?.message ?? "Something went wrong.",
        ),
      )
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Map scope to role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <EntitySelect
            label="Scope"
            value={scope}
            onChange={setScope}
            options={validScopes.map((entry) => ({ id: entry, name: entry }))}
            placeholder="Select a scope…"
          />
          <EntitySelect
            label="Role"
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
            placeholder="Select a role…"
          />
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="scope-role-required">Required</Label>
              <p className="text-xs text-muted-foreground">
                The token must grant this scope for the role to apply.
              </p>
            </div>
            <Switch
              id="scope-role-required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add mapping"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
