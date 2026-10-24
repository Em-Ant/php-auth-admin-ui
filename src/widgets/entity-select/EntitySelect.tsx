import { useId } from "react";
import { Label } from "@/shared/ui/label";

export interface EntityOption {
  id: string;
  name: string;
}

interface EntitySelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: EntityOption[];
  /** Shown as the empty choice, e.g. "All realms". Omit for required selects. */
  allLabel?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * One labeled dropdown for every id/name choice (realm, client, user, role
 * filters and form fields). A native select keeps it accessible and trivially
 * testable; the options always come from the owning slice.
 */
export const EntitySelect = ({
  label,
  value,
  onChange,
  options,
  allLabel,
  placeholder,
  disabled,
}: EntitySelectProps) => {
  // Unique per instance: the same label appears in filters and in dialogs.
  const id = `${useId()}-entity-select`;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30"
      >
        {allLabel !== undefined ? <option value="">{allLabel}</option> : null}
        {placeholder !== undefined && value === "" ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};
