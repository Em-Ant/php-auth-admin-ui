import { useState } from "react";
import { selectClientsItems } from "@/entities/clients";
import { invalidateSessionsThunk } from "@/entities/sessions";
import { selectUsersItems } from "@/entities/users";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { EntitySelect } from "@/widgets/entity-select";

interface InvalidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvalidated: (count: number) => void;
}

export const InvalidateDialog = ({
  open,
  onOpenChange,
  onInvalidated,
}: InvalidateDialogProps) => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsersItems);
  const clients = useAppSelector(selectClientsItems);
  const [userId, setUserId] = useState("");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    setUserId("");
    setClientId("");
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId && !clientId) {
      setServerError("Select a user, a client, or both.");
      return;
    }
    setSaving(true);
    setServerError(null);
    dispatch(
      invalidateSessionsThunk({
        ...(userId ? { user_id: userId } : {}),
        ...(clientId ? { client_id: clientId } : {}),
      }),
    )
      .unwrap()
      .then((count) => {
        onInvalidated(count);
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
          <DialogTitle>Invalidate sessions</DialogTitle>
          <DialogDescription>
            Expires every matching session, login and offline session. With only
            one side set it hits everything for that subject; with both, only
            the intersection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <EntitySelect
            label="User"
            value={userId}
            onChange={setUserId}
            options={users.map((user) => ({ id: user.id, name: user.email }))}
            allLabel="Any user"
          />
          <EntitySelect
            label="Client"
            value={clientId}
            onChange={setClientId}
            options={clients.map((client) => ({
              id: client.id,
              name: client.name,
            }))}
            allLabel="Any client"
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
              {saving ? "Invalidating…" : "Invalidate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
