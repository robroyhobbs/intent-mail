"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface ChipOption {
  value: string;
  label: string;
  color?: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  mode?: "single";
  label?: string;
}

export function ChipSelector({
  options,
  value,
  onChange,
  label,
}: ChipSelectorProps) {
  if (options.length === 0) return null;

  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
              style={
                isSelected && option.color
                  ? {
                      borderColor: option.color,
                      backgroundColor: `${option.color}15`,
                      color: option.color,
                    }
                  : undefined
              }
            >
              {isSelected && <Check className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
