import { useState } from "react";
import { purgeAuditLogsThunk } from "@/entities/audit-logs";
import { selectRealmsItems } from "@/entities/realms";
import { useAppDispatch, useAppSelector } from "@/shared/lib";
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
import { EntitySelect } from "@/widgets/entity-select";

interface PurgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurged: (count: number) => void;
}

export const PurgeDialog = ({
  open,
  onOpenChange,
  onPurged,
}: PurgeDialogProps) => {
  const dispatch = useAppDispatch();
  const realms = useAppSelector(selectRealmsItems);
  const [realmId, setRealmId] = useState("");
  const [olderThan, setOlderThan] = useState("");
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    setRealmId("");
    setOlderThan("");
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!realmId && !olderThan) {
      setServerError(
        "Set a realm, a cutoff date, or both — a purge can never be unbounded.",
      );
      return;
    }
    setSaving(true);
    setServerError(null);
    dispatch(
      purgeAuditLogsThunk({
        ...(realmId ? { realm_id: realmId } : {}),
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
            Deleted entries are gone for good. The purge refuses to run without
            at least one guard below.
          </DialogDescription>
        </DialogHeader>
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
            options={realms.map((realm) => ({
              id: realm.id,
              name: realm.name,
            }))}
            allLabel="Any realm"
          />
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
              {saving ? "Purging…" : "Purge entries"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
