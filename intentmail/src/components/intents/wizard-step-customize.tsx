"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";

// =============================================================================
// VOICE / URGENCY / CTA CHIP OPTIONS
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

  const selectedBrand = brands.find((b) => b.id === data.brandId);
  const brandColor = selectedBrand?.colorPrimary || "#4598fa";

  function update<K extends keyof typeof data>(key: K, value: (typeof data)[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleTemplateChange(templateId: string) {
    const template = TEMPLATES[templateId];
    if (!template) return;

    const newSlots = template.slots.map((slot) => {
      // Preserve existing slot data if it matches
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
      // Build the payload matching the existing Intent API schema
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
        // Preserve existing fields in edit mode
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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Panel: Controls */}
      <div className="flex-1 space-y-6 lg:max-w-md">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold">
            {isEditMode ? "Edit Intent" : data.name || "New Intent"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize your email intent with visual controls
          </p>
        </div>

        {/* Name & Slug */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
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
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={data.slug}
              onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""))}
              placeholder="welcome-email"
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Input
            id="purpose"
            value={data.purpose}
            onChange={(e) => update("purpose", e.target.value)}
            placeholder="What this email achieves"
          />
        </div>

        {/* Subject */}
        <div>
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            value={data.subjectDefault}
            onChange={(e) => update("subjectDefault", e.target.value)}
            placeholder="Welcome to {{productName}}, {{firstName}}!"
          />
        </div>

        {/* Brand */}
        <div>
          <Label>Brand</Label>
          <Select
            value={data.brandId || "none"}
            onValueChange={(value) => update("brandId", value === "none" ? "" : value)}
          >
            <SelectTrigger>
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

        {/* CTA Text */}
        <div>
          <Label htmlFor="ctaText">CTA Button Text</Label>
          <Input
            id="ctaText"
            value={data.ctaText}
            onChange={(e) => update("ctaText", e.target.value)}
            placeholder="Get Started"
          />
        </div>

        {/* Template */}
        <TemplateCards
          value={data.templateId}
          onSelect={handleTemplateChange}
        />

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
