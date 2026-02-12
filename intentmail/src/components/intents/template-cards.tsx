"use client";

import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/email/templates/slots";
import { Check, LayoutTemplate } from "lucide-react";

interface TemplateCardsProps {
  value: string;
  onSelect: (templateId: string) => void;
}

export function TemplateCards({ value, onSelect }: TemplateCardsProps) {
  const templates = Object.values(TEMPLATES);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">Template</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isSelected = value === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                "relative flex flex-col items-start rounded-lg border p-3 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-background hover:border-primary/50",
              )}
            >
              {isSelected && (
                <div className="absolute right-2 top-2">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
              <LayoutTemplate className="mb-1.5 h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium leading-tight">
                {template.name}
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {template.slots.length} slots
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
