import { useState } from "react";
import type { Realm } from "@/shared/api/contract";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/** Submit shape: numbers parsed, empty policy means "inherit" (null). */
export interface RealmFormValues {
  name: string;
  keys_id: string;
  scope: string;
  refresh_token_expires_in: number;
  access_token_expires_in: number;
  pending_login_expires_in: number;
  authenticated_login_expires_in: number;
  session_expires_in: number;
  idle_session_expires_in: number;
  offline_refresh_token_expires_in: number;
  password_min_length: number | null;
  password_min_lower: number | null;
  password_min_upper: number | null;
  password_min_digits: number | null;
  password_min_special: number | null;
}

export const newRealmFormValues = (): RealmFormValues => ({
  name: "",
  keys_id: "",
  scope: "openid profile email",
  refresh_token_expires_in: 1800,
  access_token_expires_in: 300,
  pending_login_expires_in: 300,
  authenticated_login_expires_in: 300,
  session_expires_in: 86400,
  idle_session_expires_in: 1800,
  offline_refresh_token_expires_in: 2592000,
  password_min_length: null,
  password_min_lower: null,
  password_min_upper: null,
  password_min_digits: null,
  password_min_special: null,
});

export const realmToFormValues = (realm: Realm): RealmFormValues => ({
  name: realm.name,
  keys_id: realm.keys_id,
  scope: realm.scope,
  refresh_token_expires_in: realm.refresh_token_expires_in,
  access_token_expires_in: realm.access_token_expires_in,
  pending_login_expires_in: realm.pending_login_expires_in,
  authenticated_login_expires_in: realm.authenticated_login_expires_in,
  session_expires_in: realm.session_expires_in,
  idle_session_expires_in: realm.idle_session_expires_in,
  offline_refresh_token_expires_in: realm.offline_refresh_token_expires_in,
  password_min_length: realm.password_policy.min_length,
  password_min_lower: realm.password_policy.min_lower,
  password_min_upper: realm.password_policy.min_upper,
  password_min_digits: realm.password_policy.min_digits,
  password_min_special: realm.password_policy.min_special,
});

interface RealmFormProps {
  initial: RealmFormValues;
  submitLabel: string;
  saving: boolean;
  serverError: string | null;
  onGenerateKeys: () => Promise<string>;
  onCancel: () => void;
  onSubmit: (values: RealmFormValues) => void;
}

const TTL_FIELDS = [
  {
    key: "access_token_expires_in",
    label: "Access token",
    hint: "How long one access token lasts.",
  },
  {
    key: "refresh_token_expires_in",
    label: "Refresh token",
    hint: "How long the refresh grant lasts.",
  },
  {
    key: "pending_login_expires_in",
    label: "Pending login",
    hint: "Window to finish a started login.",
  },
  {
    key: "authenticated_login_expires_in",
    label: "Authenticated login",
    hint: "Window to exchange an authenticated login.",
  },
  {
    key: "session_expires_in",
    label: "Session max lifetime",
    hint: "Maximum SSO session lifetime.",
  },
  {
    key: "idle_session_expires_in",
    label: "Session idle cutoff",
    hint: "The session ends at inactivity.",
  },
  {
    key: "offline_refresh_token_expires_in",
    label: "Offline refresh token",
    hint: "Standing access lifetime.",
  },
] as const;

const POLICY_FIELDS = [
  { key: "password_min_length", label: "Min length" },
  { key: "password_min_lower", label: "Min lowercase" },
  { key: "password_min_upper", label: "Min uppercase" },
  { key: "password_min_digits", label: "Min digits" },
  { key: "password_min_special", label: "Min special" },
] as const;

const FieldNote = ({ error, hint }: { error?: string; hint?: string }) => {
  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }
  if (hint) {
    return <p className="text-xs text-muted-foreground">{hint}</p>;
  }
  return null;
};

const textOf = (value: string | number | null) =>
  value === null ? "" : String(value);

/**
 * One form for create and edit (the dialogs own the open state and the
 * submit). Mounted with a `key` per realm so switching records resets it.
 */
export const RealmForm = ({
  initial,
  submitLabel,
  saving,
  serverError,
  onGenerateKeys,
  onCancel,
  onSubmit,
}: RealmFormProps) => {
  const [name, setName] = useState(initial.name);
  const [keysId, setKeysId] = useState(initial.keys_id);
  const [scope, setScope] = useState(initial.scope);
  const [ttls, setTtls] = useState<Record<string, string>>({
    refresh_token_expires_in: textOf(initial.refresh_token_expires_in),
    access_token_expires_in: textOf(initial.access_token_expires_in),
    pending_login_expires_in: textOf(initial.pending_login_expires_in),
    authenticated_login_expires_in: textOf(
      initial.authenticated_login_expires_in,
    ),
    session_expires_in: textOf(initial.session_expires_in),
    idle_session_expires_in: textOf(initial.idle_session_expires_in),
    offline_refresh_token_expires_in: textOf(
      initial.offline_refresh_token_expires_in,
    ),
  });
  const [policy, setPolicy] = useState<Record<string, string>>({
    password_min_length: textOf(initial.password_min_length),
    password_min_lower: textOf(initial.password_min_lower),
    password_min_upper: textOf(initial.password_min_upper),
    password_min_digits: textOf(initial.password_min_digits),
    password_min_special: textOf(initial.password_min_special),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const handleGenerateKeys = async () => {
    setGenerating(true);
    try {
      setKeysId(await onGenerateKeys());
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) {
      nextErrors.name = "Name is required.";
    }
    if (!keysId.trim()) {
      nextErrors.keys_id =
        "A key set is required — generate one or paste an id.";
    }
    const parsedTtls: Record<string, number> = {};
    for (const { key } of TTL_FIELDS) {
      const parsed = Number(ttls[key]);
      if (!Number.isInteger(parsed) || parsed < 1) {
        nextErrors[key] = "Must be a positive integer (seconds).";
      } else {
        parsedTtls[key] = parsed;
      }
    }
    const parsedPolicy: Record<string, number | null> = {};
    for (const { key } of POLICY_FIELDS) {
      const raw = policy[key].trim();
      if (raw === "") {
        parsedPolicy[key] = null;
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < 0) {
        nextErrors[key] = "Must be a non-negative integer.";
      } else {
        parsedPolicy[key] = parsed;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit({
      name: name.trim(),
      keys_id: keysId.trim(),
      scope: scope.trim(),
      refresh_token_expires_in: parsedTtls.refresh_token_expires_in,
      access_token_expires_in: parsedTtls.access_token_expires_in,
      pending_login_expires_in: parsedTtls.pending_login_expires_in,
      authenticated_login_expires_in: parsedTtls.authenticated_login_expires_in,
      session_expires_in: parsedTtls.session_expires_in,
      idle_session_expires_in: parsedTtls.idle_session_expires_in,
      offline_refresh_token_expires_in:
        parsedTtls.offline_refresh_token_expires_in,
      password_min_length: parsedPolicy.password_min_length,
      password_min_lower: parsedPolicy.password_min_lower,
      password_min_upper: parsedPolicy.password_min_upper,
      password_min_digits: parsedPolicy.password_min_digits,
      password_min_special: parsedPolicy.password_min_special,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">General</legend>
        <div className="grid gap-1.5">
          <Label htmlFor="realm-name">Name</Label>
          <Input
            id="realm-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name !== undefined}
          />
          <FieldNote error={errors.name} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="realm-keys">Key set id</Label>
          <div className="flex gap-2">
            <Input
              id="realm-keys"
              value={keysId}
              onChange={(event) => setKeysId(event.target.value)}
              aria-invalid={errors.keys_id !== undefined}
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleGenerateKeys()}
              disabled={generating || saving}
            >
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>
          <FieldNote
            error={errors.keys_id}
            hint="Keys are created once via POST /keys; paste the id or generate a new set."
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="realm-scope">Scope catalog</Label>
          <Input
            id="realm-scope"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          />
          <FieldNote hint="Space-delimited string, e.g. openid profile email." />
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">
          Token lifetimes (seconds)
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {TTL_FIELDS.map(({ key, label, hint }) => (
            <div key={key} className="grid gap-1.5">
              <Label htmlFor={`realm-${key}`}>{label}</Label>
              <Input
                id={`realm-${key}`}
                inputMode="numeric"
                value={ttls[key]}
                onChange={(event) =>
                  setTtls((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                aria-invalid={errors[key] !== undefined}
              />
              <FieldNote error={errors[key]} hint={hint} />
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Password policy</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {POLICY_FIELDS.map(({ key, label }) => (
            <div key={key} className="grid gap-1.5">
              <Label htmlFor={`realm-${key}`}>{label}</Label>
              <Input
                id={`realm-${key}`}
                inputMode="numeric"
                placeholder="inherit"
                value={policy[key]}
                onChange={(event) =>
                  setPolicy((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                aria-invalid={errors[key] !== undefined}
              />
              <FieldNote
                error={errors[key]}
                hint="Empty inherits the global config; 0 disables the rule."
              />
            </div>
          ))}
        </div>
      </fieldset>
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
