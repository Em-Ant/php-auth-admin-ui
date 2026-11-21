import { useState } from "react";
import { selectClientsItems } from "@/entities/clients";
import {
  type CreateRoleInput,
  createRoleThunk,
  type UpdateRoleInput,
  updateRoleThunk,
} from "@/entities/roles";
import type { Role } from "@/shared/api/contract";
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
import { EntitySelect } from "@/widgets/entity-select";

export interface RoleFormValues {
  realm_id: string;
  name: string;
  client_id: string;
  description: string;
}

export const newRoleFormValues = (realm_id = ""): RoleFormValues => ({
  realm_id,
  name: "",
  client_id: "",
  description: "",
});

export const roleToFormValues = (role: Role): RoleFormValues => ({
  realm_id: role.realm_id,
  name: role.name,
  client_id: role.client_id ?? "",
  description: role.description ?? "",
});

const FieldNote = ({ error }: { error?: string }) => {
  if (!error) {
    return null;
  }
  return <p className="text-xs text-destructive">{error}</p>;
};

interface RoleFormProps {
  initial: RoleFormValues;
  mode: "create" | "edit";
  submitLabel: string;
  saving: boolean;
  serverError: string | null;
  onCancel: () => void;
  onSubmit: (values: RoleFormValues) => void;
}

export const RoleForm = ({
  initial,
  mode,
  submitLabel,
  saving,
  serverError,
  onCancel,
  onSubmit,
}: RoleFormProps) => {
  const clients = useAppSelector(selectClientsItems);
  const [name, setName] = useState(initial.name);
  const [clientId, setClientId] = useState(initial.client_id);
  const [description, setDescription] = useState(initial.description);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit({
      realm_id: initial.realm_id,
      name: name.trim(),
      client_id: clientId,
      description: description.trim(),
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
        <Label htmlFor="role-name">Name</Label>
        <Input
          id="role-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name !== undefined}
        />
        <FieldNote error={errors.name} />
      </div>
      <EntitySelect
        label="Client (optional)"
        value={clientId}
        onChange={setClientId}
        options={clients
          .filter((client) => client.realm_id === initial.realm_id)
          .map((client) => ({ id: client.id, name: client.name }))}
        allLabel="Realm role"
        disabled={mode === "edit"}
      />
      <div className="grid gap-1.5">
        <Label htmlFor="role-description">Description</Label>
        <Input
          id="role-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
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

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const submitCreate = (values: RoleFormValues): CreateRoleInput => ({
  realm_id: values.realm_id,
  name: values.name,
  ...(values.client_id ? { client_id: values.client_id } : {}),
  ...(values.description ? { description: values.description } : {}),
});

const submitUpdate = (values: RoleFormValues): UpdateRoleInput => ({
  name: values.name,
  description: values.description === "" ? null : values.description,
});

export const CreateRoleDialog = ({
  open,
  onOpenChange,
  onCreated,
  realmId,
}: DialogProps & { onCreated: () => void; realmId: string }) => {
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
          <DialogTitle>Create role</DialogTitle>
        </DialogHeader>
        <RoleForm
          key="new-role"
          initial={newRoleFormValues(realmId)}
          mode="create"
          submitLabel="Create role"
          saving={saving}
          serverError={serverError}
          onCancel={close}
          onSubmit={(values) => {
            setSaving(true);
            setServerError(null);
            dispatch(createRoleThunk(submitCreate(values)))
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

export const EditRoleDialog = ({
  role,
  open,
  onOpenChange,
  onSaved,
}: DialogProps & { role: Role; onSaved: () => void }) => {
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
          <DialogTitle>Edit role</DialogTitle>
        </DialogHeader>
        <RoleForm
          key={role.id}
          initial={roleToFormValues(role)}
          mode="edit"
          submitLabel="Save changes"
          saving={saving}
          serverError={serverError}
          onCancel={close}
          onSubmit={(values) => {
            setSaving(true);
            setServerError(null);
            dispatch(
              updateRoleThunk({ id: role.id, input: submitUpdate(values) }),
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
