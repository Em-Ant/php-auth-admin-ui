import { useState } from "react";
import {
  createKeysThunk,
  createRealmThunk,
  deleteRealmThunk,
  updateRealmThunk,
} from "@/entities/realms";
import type { Realm } from "@/shared/api/contract";
import { useAppDispatch } from "@/shared/lib";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  newRealmFormValues,
  RealmForm,
  type RealmFormValues,
  realmToFormValues,
} from "./RealmForm";

const errorMessage = (error: unknown) =>
  (error as { message?: string })?.message ?? "Something went wrong.";

interface CreateRealmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export const CreateRealmDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CreateRealmDialogProps) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    onOpenChange(false);
  };

  const handleGenerateKeys = () => dispatch(createKeysThunk()).unwrap();

  const handleSubmit = async (values: RealmFormValues) => {
    setSaving(true);
    setServerError(null);
    try {
      await dispatch(createRealmThunk(values)).unwrap();
      onCreated();
      close();
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create realm</DialogTitle>
        </DialogHeader>
        <RealmForm
          key="new-realm"
          initial={newRealmFormValues()}
          submitLabel="Create realm"
          saving={saving}
          serverError={serverError}
          onGenerateKeys={handleGenerateKeys}
          onCancel={close}
          onSubmit={(values) => void handleSubmit(values)}
        />
      </DialogContent>
    </Dialog>
  );
};

interface EditRealmDialogProps {
  realm: Realm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const EditRealmDialog = ({
  realm,
  open,
  onOpenChange,
  onSaved,
}: EditRealmDialogProps) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    onOpenChange(false);
  };

  const handleGenerateKeys = () => dispatch(createKeysThunk()).unwrap();

  const handleSubmit = async (values: RealmFormValues) => {
    setSaving(true);
    setServerError(null);
    try {
      await dispatch(
        updateRealmThunk({ id: realm.id, input: values }),
      ).unwrap();
      onSaved();
      close();
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit realm</DialogTitle>
        </DialogHeader>
        <RealmForm
          key={realm.id}
          initial={realmToFormValues(realm)}
          submitLabel="Save changes"
          saving={saving}
          serverError={serverError}
          onGenerateKeys={handleGenerateKeys}
          onCancel={close}
          onSubmit={(values) => void handleSubmit(values)}
        />
      </DialogContent>
    </Dialog>
  );
};

interface DeleteRealmDialogProps {
  realm: Realm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export const DeleteRealmDialog = ({
  realm,
  open,
  onOpenChange,
  onDeleted,
}: DeleteRealmDialogProps) => {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const close = () => {
    setServerError(null);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    setServerError(null);
    try {
      await dispatch(deleteRealmThunk(realm.id)).unwrap();
      onDeleted();
      close();
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete realm &ldquo;{realm.name}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The realm is deleted permanently. Delete its clients and users first
            — a realm that still has either cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {serverError ? (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={saving}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={saving}
              onClick={(event) => {
                // Keep the dialog open so the guard message stays visible.
                event.preventDefault();
                void handleDelete();
              }}
            >
              {saving ? "Deleting…" : "Delete realm"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
