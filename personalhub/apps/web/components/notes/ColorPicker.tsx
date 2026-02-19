"use client";

import { cn } from "@/lib/utils";

const colors = [
  "#ffffff",
  "#fef3c7",
  "#fde2e4",
  "#dbeafe",
  "#dcfce7",
  "#ede9fe",
  "#fae8ff",
  "#e5e7eb",
];

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-8 w-8 rounded-full border",
            disabled && "cursor-not-allowed opacity-50",
            value === color && "ring-2 ring-primary ring-offset-2",
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          disabled={disabled}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
