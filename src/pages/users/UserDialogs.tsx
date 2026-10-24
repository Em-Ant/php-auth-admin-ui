import { useState } from "react";
import { selectRealmsItems } from "@/entities/realms";
import {
  assignUserRoleThunk,
  type CreateUserInput,
  createUserThunk,
  type UpdateUserInput,
  updateUserThunk,
} from "@/entities/users";
import type { User } from "@/shared/api/contract";
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

export interface UserFormValues {
  realm_id: string;
  email: string;
  name: string;
  password: string;
  valid: boolean;
  email_verified: boolean;
}

export const newUserFormValues = (realm_id = ""): UserFormValues => ({
  realm_id,
  email: "",
  name: "",
  password: "",
  valid: true,
  email_verified: true,
});

export const userToFormValues = (user: User): UserFormValues => ({
  realm_id: user.realm_id,
  email: user.email,
  name: user.name ?? "",
  password: "",
  valid: user.valid,
  email_verified: user.email_verified,
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

interface UserFormProps {
  initial: UserFormValues;
  mode: "create" | "edit";
  submitLabel: string;
  saving: boolean;
  serverError: string | null;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => void;
}

export const UserForm = ({
  initial,
  mode,
  submitLabel,
  saving,
  serverError,
  onCancel,
  onSubmit,
}: UserFormProps) => {
  const realms = useAppSelector(selectRealmsItems);
  const [realmId, setRealmId] = useState(initial.realm_id);
  const [email, setEmail] = useState(initial.email);
  const [name, setName] = useState(initial.name);
  const [password, setPassword] = useState("");
  const [valid, setValid] = useState(initial.valid);
  const [verified, setVerified] = useState(initial.email_verified);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!realmId) {
      nextErrors.realm_id = "A realm is required.";
    }
    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    }
    if (mode === "create" && !password) {
      nextErrors.password = "A password is required.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit({
      realm_id: realmId,
      email: email.trim(),
      name: name.trim(),
      password,
      valid,
      email_verified: verified,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
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
      <div className="grid gap-1.5">
        <Label htmlFor="user-email">Email</Label>
        <Input
          id="user-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email !== undefined}
        />
        <FieldNote error={errors.email} hint="Unique per realm." />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="user-name">Name</Label>
        <Input
          id="user-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="user-password">Password</Label>
        <Input
          id="user-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={errors.password !== undefined}
          placeholder={
            mode === "edit" ? "Empty keeps the current password…" : undefined
          }
        />
        <FieldNote
          error={errors.password}
          hint="Plaintext over TLS; the backend hashes it and never stores it here."
        />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <Label htmlFor="user-valid">Active</Label>
          <p className="text-xs text-muted-foreground">
            Off deactivates the user: they can no longer authenticate.
          </p>
        </div>
        <Switch id="user-valid" checked={valid} onCheckedChange={setValid} />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <Label htmlFor="user-verified">Email verified</Label>
        </div>
        <Switch
          id="user-verified"
          checked={verified}
          onCheckedChange={setVerified}
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

const toCreateInput = (values: UserFormValues): CreateUserInput => ({
  realm_id: values.realm_id,
  email: values.email,
  password: values.password,
  ...(values.name ? { name: values.name } : {}),
  valid: values.valid,
  email_verified: values.email_verified,
});

const toUpdateInput = (values: UserFormValues): UpdateUserInput => ({
  email: values.email,
  name: values.name === "" ? null : values.name,
  valid: values.valid,
  email_verified: values.email_verified,
  ...(values.password ? { password: values.password } : {}),
});

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateUserDialog = ({
  open,
  onOpenChange,
  onCreated,
}: DialogProps & { onCreated: () => void }) => {
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
          <DialogTitle>Create user</DialogTitle>
        </DialogHeader>
        <UserForm
          key="new-user"
          initial={newUserFormValues()}
          mode="create"
          submitLabel="Create user"
          saving={saving}
          serverError={serverError}
          onCancel={close}
          onSubmit={(values) => {
            setSaving(true);
            setServerError(null);
            dispatch(createUserThunk(toCreateInput(values)))
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

export const EditUserDialog = ({
  user,
  open,
  onOpenChange,
  onSaved,
}: DialogProps & { user: User; onSaved: () => void }) => {
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
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <UserForm
          key={user.id}
          initial={userToFormValues(user)}
          mode="edit"
          submitLabel="Save changes"
          saving={saving}
          serverError={serverError}
          onCancel={close}
          onSubmit={(values) => {
            setSaving(true);
            setServerError(null);
            dispatch(
              updateUserThunk({ id: user.id, input: toUpdateInput(values) }),
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

interface AssignRoleDialogProps extends DialogProps {
  userId: string;
  roleOptions: EntityOption[];
  onAssigned: () => void;
}

export const AssignRoleDialog = ({
  userId,
  roleOptions,
  open,
  onOpenChange,
  onAssigned,
}: AssignRoleDialogProps) => {
  const dispatch = useAppDispatch();
  const [roleId, setRoleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    setRoleId("");
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleId) {
      setServerError("Select a role.");
      return;
    }
    setSaving(true);
    setServerError(null);
    dispatch(assignUserRoleThunk({ userId, roleId }))
      .unwrap()
      .then(() => {
        onAssigned();
        close();
      })
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
          <DialogTitle>Assign role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <EntitySelect
            label="Role"
            value={roleId}
            onChange={setRoleId}
            options={roleOptions}
            placeholder="Select a role…"
          />
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
              {saving ? "Assigning…" : "Assign role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
