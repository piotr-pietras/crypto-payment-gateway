"use client";

import { useState } from "react";
import { CopyPasteIcon } from "../icons/CopyPasteIcon";

type Props = {
  label?: string;
  showPaste?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
} & Omit<
  React.ComponentPropsWithoutRef<"input">,
  "className" | "value" | "onChange" | "defaultValue"
>;

export default function Input({
  label,
  showPaste,
  value: valueProp,
  onChange,
  defaultValue = "",
  ...props
}: Props) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setValue(text);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-body text-text-primary">{label}</label>
      )}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          {...props}
        />
        {showPaste && (
          <button
            type="button"
            onClick={handlePaste}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-caption text-text-secondary"
          >
            <CopyPasteIcon />
            Paste
          </button>
        )}
      </div>
    </div>
  );
}

