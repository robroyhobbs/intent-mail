"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WizardStepDescribe } from "./wizard-step-describe";
import { WizardStepCustomize } from "./wizard-step-customize";
import {
  getDefaultIntent,
  type GeneratedIntent,
} from "@/lib/ai/generate-intent";

interface Brand {
  id: string;
  name: string;
  colorPrimary: string;
  voiceTone: string;
}

interface ExistingIntent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  purpose: string;
  tone: string;
  urgency: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  subjectDefault: string;
  subjectVariants: unknown;
  subjectMaxLength: number;
  templateId: string;
  slots: unknown;
  contentGoal: string | null;
  contentMustInclude: unknown;
  contentMustNotInclude: unknown;
  ctaText: string | null;
  ctaUrl: string | null;
  ctaStyle: "SOFT" | "MEDIUM" | "STRONG";
  brandId: string | null;
  generationEnabled: boolean;
  generationConstraints: unknown;
  isActive: boolean;
}

interface IntentWizardProps {
  brands: Brand[];
  intent?: ExistingIntent;
}

function intentToFormData(
  intent: ExistingIntent,
): GeneratedIntent & { brandId: string; description: string } {
  return {
    name: intent.name,
    slug: intent.slug,
    purpose: intent.purpose,
    tone: intent.tone,
    urgency: intent.urgency,
    subjectDefault: intent.subjectDefault,
    subjectVariants: (intent.subjectVariants as string[]) || [],
    templateId: intent.templateId,
    slots: (intent.slots as GeneratedIntent["slots"]) || [],
    contentGoal: intent.contentGoal || "",
    contentMustInclude: (intent.contentMustInclude as string[]) || [],
    contentMustNotInclude: (intent.contentMustNotInclude as string[]) || [],
    ctaText: intent.ctaText || "Get Started",
    ctaUrl: intent.ctaUrl || "",
    ctaStyle: intent.ctaStyle,
    brandId: intent.brandId || "",
    description: intent.description || "",
  };
}

export function IntentWizard({ brands, intent }: IntentWizardProps) {
  const router = useRouter();
  const isEditMode = !!intent;

  const [step, setStep] = useState<1 | 2>(isEditMode ? 2 : 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<
    (GeneratedIntent & { brandId: string; description: string }) | null
  >(isEditMode && intent ? intentToFormData(intent) : null);

  const handleGenerate = useCallback(
    async (description: string) => {
      setIsGenerating(true);
      try {
        const response = await fetch("/api/v1/intents/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        });

        let generated: GeneratedIntent;
        if (response.ok) {
          const json = await response.json();
          generated = json.data;
        } else {
          generated = getDefaultIntent(description);
        }

        setFormData({
          ...generated,
          brandId: brands.length > 0 ? brands[0].id : "",
          description,
        });
        setStep(2);
      } catch {
        const generated = getDefaultIntent(description);
        setFormData({
          ...generated,
          brandId: brands.length > 0 ? brands[0].id : "",
          description,
        });
        setStep(2);
      } finally {
        setIsGenerating(false);
      }
    },
    [brands],
  );

  const handleSave = useCallback(
    async (data: Record<string, unknown>) => {
      const url = isEditMode
        ? `/api/v1/intents/${intent!.id}`
        : "/api/v1/intents";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error?.message || "Failed to save intent");
      }

      router.push("/dashboard/intents");
      router.refresh();
    },
    [isEditMode, intent, router],
  );

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {step === 1 && (
        <WizardStepDescribe
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}
      {step === 2 && formData && (
        <WizardStepCustomize
          initialData={formData}
          brands={brands}
          onSave={handleSave}
          onBack={isEditMode ? undefined : handleBack}
          isEditMode={isEditMode}
          existingIntent={intent}
        />
      )}

      {/* Step Indicator */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            step === 1 ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
        <div
          className={`h-2 w-2 rounded-full ${
            step === 2 ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
        <span className="ml-2 text-xs text-muted-foreground">
          Step {step} of 2
        </span>
      </div>
    </div>
  );
}
