import { Button } from "@/shared/ui/button";

interface PagerProps {
  total: number;
  limit: number;
  offset: number;
  onPrevious: () => void;
  onNext: () => void;
}

/** "Showing X–Y of Z" footer shared by every list page. */
export const Pager = ({ total, limit, offset, onPrevious, onNext }: PagerProps) => {
  if (total === 0) {
    return null;
  }
  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between gap-4 border-t px-6 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset <= 0}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={offset + limit >= total}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
