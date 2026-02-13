"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipSelector } from "./chip-selector";
import { TemplateCards } from "./template-cards";
import { LivePreview } from "./live-preview";
import { TEMPLATES } from "@/lib/email/templates/slots";
import type { GeneratedIntent } from "@/lib/ai/generate-intent";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Save,
  Sparkles,
} from "lucide-react";

// =============================================================================
// CHIP OPTIONS (used in fine-tune section)
// =============================================================================

const VOICE_OPTIONS = [
  { value: "Warm, professional, helpful", label: "Friendly SaaS" },
  { value: "Formal, authoritative, clear", label: "Enterprise Formal" },
  { value: "Casual, energetic, conversational", label: "Startup Casual" },
  { value: "Direct, confident, action-oriented", label: "Bold & Direct" },
  { value: "Empathetic, patient, reassuring", label: "Caring Support" },
];

const URGENCY_OPTIONS = [
  { value: "NONE", label: "None", color: "#6b7280" },
  { value: "LOW", label: "Low", color: "#3b82f6" },
  { value: "MEDIUM", label: "Medium", color: "#f59e0b" },
  { value: "HIGH", label: "High", color: "#ef4444" },
];

const CTA_STYLE_OPTIONS = [
  { value: "SOFT", label: "Soft" },
  { value: "MEDIUM", label: "Medium" },
  { value: "STRONG", label: "Strong" },
];

// Map voice value to friendly label
function getVoiceLabel(tone: string): string {
  return VOICE_OPTIONS.find((o) => o.value === tone)?.label ?? tone;
}

// =============================================================================
// TYPES
// =============================================================================

interface Brand {
  id: string;
  name: string;
  colorPrimary: string;
  voiceTone: string;
}

interface ExistingIntent {
  id: string;
  generationEnabled: boolean;
  generationConstraints: unknown;
  isActive: boolean;
  subjectMaxLength: number;
  description: string | null;
}

interface WizardStepCustomizeProps {
  initialData: GeneratedIntent & { brandId: string; description: string };
  brands: Brand[];
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onBack?: () => void;
  isEditMode: boolean;
  existingIntent?: ExistingIntent;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WizardStepCustomize({
  initialData,
  brands,
  onSave,
  onBack,
  isEditMode,
  existingIntent,
}: WizardStepCustomizeProps) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFineTune, setShowFineTune] = useState(isEditMode);

  const selectedBrand = brands.find((b) => b.id === data.brandId);
  const brandColor = selectedBrand?.colorPrimary || "#4598fa";

  function update<K extends keyof typeof data>(key: K, value: (typeof data)[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleTemplateChange(templateId: string) {
    const template = TEMPLATES[templateId];
    if (!template) return;

    const newSlots = template.slots.map((slot) => {
      const existing = data.slots.find((s) => s.id === slot.id);
      return existing || {
        id: slot.id,
        prompt: slot.prompt ?? "",
        static: slot.staticContent ?? "",
        maxLength: slot.maxLength,
      };
    });

    setData((prev) => ({ ...prev, templateId, slots: newSlots }));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        brandId: data.brandId || null,
        purpose: data.purpose,
        tone: data.tone,
        urgency: data.urgency,
        subjectDefault: data.subjectDefault,
        subjectVariants: data.subjectVariants,
        subjectMaxLength: existingIntent?.subjectMaxLength ?? 50,
        templateId: data.templateId,
        slots: data.slots,
        contentGoal: data.contentGoal || undefined,
        contentMustInclude: data.contentMustInclude,
        contentMustNotInclude: data.contentMustNotInclude,
        ctaText: data.ctaText || undefined,
        ctaUrl: data.ctaUrl || undefined,
        ctaStyle: data.ctaStyle,
        ...(isEditMode && existingIntent
          ? {
              generationEnabled: existingIntent.generationEnabled,
              generationConstraints: existingIntent.generationConstraints,
              isActive: existingIntent.isActive,
            }
          : {}),
      };

      await onSave(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  const templateName = TEMPLATES[data.templateId]?.name ?? data.templateId;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Panel: Summary + Fine-tune */}
      <div className="flex-1 space-y-5 lg:max-w-md">
        {/* AI Summary Card */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isEditMode ? "Edit Intent" : "AI Generated"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isEditMode ? "Modify your intent below" : "Review and save, or fine-tune details"}
              </p>
            </div>
          </div>

          {/* Name - editable */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Name
            </label>
            <Input
              value={data.name}
              onChange={(e) => {
                const name = e.target.value;
                const slug = name
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .replace(/-+/g, "-");
                setData((prev) => ({ ...prev, name, slug }));
              }}
              placeholder="Welcome Email"
              className="h-9"
            />
          </div>

          {/* Subject - editable */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Subject Line
            </label>
            <Input
              value={data.subjectDefault}
              onChange={(e) => update("subjectDefault", e.target.value)}
              placeholder="Welcome to {{productName}}, {{firstName}}!"
              className="h-9"
            />
          </div>

          {/* AI-chosen settings - read-only summary chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {getVoiceLabel(data.tone)}
            </span>
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {data.urgency === "NONE" ? "No urgency" : `${data.urgency} urgency`}
            </span>
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {templateName}
            </span>
            {data.ctaText && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                CTA: {data.ctaText}
              </span>
            )}
            {selectedBrand && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: selectedBrand.colorPrimary }}
                />
                {selectedBrand.name}
              </span>
            )}
          </div>
        </div>

        {/* Fine-tune toggle */}
        <button
          type="button"
          onClick={() => setShowFineTune(!showFineTune)}
          className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          Fine-tune details
          {showFineTune ? (
            <ChevronUp className="ml-auto h-4 w-4" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4" />
          )}
        </button>

        {/* Fine-tune section (collapsed by default for new, open for edit) */}
        {showFineTune && (
          <div className="space-y-4 rounded-lg border border-dashed border-border/60 p-4">
            {/* Brand */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Brand</label>
              <Select
                value={data.brandId || "none"}
                onValueChange={(value) => update("brandId", value === "none" ? "" : value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific brand</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: brand.colorPrimary }}
                        />
                        {brand.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Purpose</label>
              <Input
                value={data.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                placeholder="What this email achieves"
                className="h-9"
              />
            </div>

            {/* CTA Text */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">CTA Button Text</label>
              <Input
                value={data.ctaText}
                onChange={(e) => update("ctaText", e.target.value)}
                placeholder="Get Started"
                className="h-9"
              />
            </div>

            {/* Voice */}
            <ChipSelector
              label="Voice"
              options={VOICE_OPTIONS}
              value={data.tone}
              onChange={(value) => update("tone", value)}
            />

            {/* Urgency */}
            <ChipSelector
              label="Urgency"
              options={URGENCY_OPTIONS}
              value={data.urgency}
              onChange={(value) => update("urgency", value as typeof data.urgency)}
            />

            {/* CTA Style */}
            <ChipSelector
              label="CTA Style"
              options={CTA_STYLE_OPTIONS}
              value={data.ctaStyle}
              onChange={(value) => update("ctaStyle", value as typeof data.ctaStyle)}
            />

            {/* Template */}
            <TemplateCards
              value={data.templateId}
              onSelect={handleTemplateChange}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          {onBack && (
            <Button variant="outline" onClick={onBack} disabled={isSaving}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !data.name || !data.slug || !data.purpose || !data.subjectDefault}
            className="flex-1"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {isEditMode ? "Save Changes" : "Create Intent"}
          </Button>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div className="flex-1 lg:sticky lg:top-6 lg:self-start">
        <LivePreview
          templateId={data.templateId}
          slots={data.slots}
          subjectDefault={data.subjectDefault}
          subjectVariants={data.subjectVariants}
          ctaText={data.ctaText}
          ctaStyle={data.ctaStyle}
          brandColor={brandColor}
          intentName={data.name}
        />
      </div>
    </div>
  );
}
