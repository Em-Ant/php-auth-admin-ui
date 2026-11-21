import { useState } from "react";
import { purgeAuditLogsThunk } from "@/entities/audit-logs";
import { useAppDispatch } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface PurgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  realmId: string;
  onPurged: (count: number) => void;
}

export const PurgeDialog = ({
  open,
  onOpenChange,
  realmId,
  onPurged,
}: PurgeDialogProps) => {
  const dispatch = useAppDispatch();
  const [olderThan, setOlderThan] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    setOlderThan("");
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setServerError(null);
    // The realm comes from the route, so a purge is always scoped and never
    // unbounded; the cutoff narrows it further.
    dispatch(
      purgeAuditLogsThunk({
        realm_id: realmId,
        ...(olderThan ? { older_than: olderThan } : {}),
      }),
    )
      .unwrap()
      .then((count) => {
        onPurged(count);
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
          <DialogTitle>Purge audit log</DialogTitle>
          <DialogDescription>
            Deleted entries are gone for good. Only this realm's entries are
            purged.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {serverError ? (
            <p role="alert" className="text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="purge-older-than">Older than</Label>
            <Input
              id="purge-older-than"
              type="date"
              value={olderThan}
              onChange={(event) => setOlderThan(event.target.value)}
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
            <Button type="submit" variant="destructive" disabled={saving}>
              {saving ? "Purging..." : "Purge entries"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
