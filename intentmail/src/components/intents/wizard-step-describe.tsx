"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";

const QUICK_START_CHIPS = [
  { label: "Welcome", description: "Welcome email for new signups" },
  { label: "Receipt", description: "Purchase receipt or confirmation" },
  { label: "Password Reset", description: "Password reset instructions" },
  { label: "Trial Expiring", description: "Trial expiration reminder" },
  { label: "Invoice", description: "Invoice or billing notification" },
];

interface WizardStepDescribeProps {
  onGenerate: (description: string) => Promise<void>;
  isGenerating: boolean;
}

export function WizardStepDescribe({
  onGenerate,
  isGenerating,
}: WizardStepDescribeProps) {
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  const canSubmit = description.trim().length > 0 && !isGenerating;

  async function handleSubmit() {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onGenerate(description.trim());
    } finally {
      submittingRef.current = false;
    }
  }

  function handleChipClick(chip: { label: string; description: string }) {
    setDescription(chip.description);
    // Auto-submit after setting description
    if (!isGenerating && !submittingRef.current) {
      submittingRef.current = true;
      onGenerate(chip.description).finally(() => {
        submittingRef.current = false;
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8 text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            What kind of email do you want to send?
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe it in one sentence. AI will fill in the details.
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Welcome email for new trial signups..."
            className="h-12 text-base"
            disabled={isGenerating}
            maxLength={500}
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="h-12 px-6"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Go
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating your intent...</span>
          </div>
        )}

        {/* Quick Start Chips */}
        {!isGenerating && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Or start from a template:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_START_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
