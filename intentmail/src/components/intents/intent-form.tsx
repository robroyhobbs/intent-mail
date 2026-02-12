"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Intent } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, X } from "lucide-react";
import { listTemplates, getTemplate } from "@/lib/email/templates/slots";
import { slugify } from "@/lib/utils";

interface IntentFormProps {
  organizationId: string;
  intent?: Intent;
  brands: { id: string; name: string }[];
}

interface SlotConfig {
  id: string;
  prompt?: string;
  static?: string;
  url?: string;
  buttonText?: string;
  maxLength?: number;
}

export function IntentForm({
  organizationId,
  intent,
  brands,
}: IntentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = listTemplates();

  const [formData, setFormData] = useState({
    name: intent?.name ?? "",
    slug: intent?.slug ?? "",
    description: intent?.description ?? "",
    brandId: intent?.brandId ?? "",
    purpose: intent?.purpose ?? "",
    tone: intent?.tone ?? "",
    urgency: intent?.urgency ?? "NONE",
    subjectDefault: intent?.subjectDefault ?? "",
    subjectVariants:
      (intent?.subjectVariants as string[] | null)?.join("\n") ?? "",
    subjectMaxLength: intent?.subjectMaxLength ?? 50,
    templateId: intent?.templateId ?? "simple",
    slots: (intent?.slots as unknown as SlotConfig[]) ?? [],
    contentGoal: intent?.contentGoal ?? "",
    contentMustInclude:
      (intent?.contentMustInclude as string[])?.join("\n") ?? "",
    contentMustNotInclude:
      (intent?.contentMustNotInclude as string[])?.join("\n") ?? "",
    ctaText: intent?.ctaText ?? "",
    ctaUrl: intent?.ctaUrl ?? "",
    ctaStyle: intent?.ctaStyle ?? "MEDIUM",
    generationEnabled: intent?.generationEnabled ?? false,
    generationConstraints:
      (intent?.generationConstraints as string[])?.join("\n") ?? "",
    isActive: intent?.isActive ?? true,
  });

  const selectedTemplate = getTemplate(formData.templateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        subjectVariants: formData.subjectVariants.split("\n").filter(Boolean),
        contentMustInclude: formData.contentMustInclude
          .split("\n")
          .filter(Boolean),
        contentMustNotInclude: formData.contentMustNotInclude
          .split("\n")
          .filter(Boolean),
        generationConstraints: formData.generationConstraints
          .split("\n")
          .filter(Boolean),
        brandId: formData.brandId || null,
      };

      const url = intent ? `/api/v1/intents/${intent.id}` : "/api/v1/intents";
      const method = intent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to save intent");
      }

      router.push("/dashboard/intents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!intent) return;
    if (!confirm("Are you sure you want to delete this intent?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/intents/${intent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete intent");
      }

      router.push("/dashboard/intents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateSlot = (
    slotId: string,
    field: string,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot,
      ),
    }));
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    updateField("name", name);
    if (!intent) {
      updateField("slug", slugify(name));
    }
  };

  // Initialize slots from template
  const initializeSlotsFromTemplate = (templateId: string) => {
    const template = getTemplate(templateId);
    if (template) {
      const slots: SlotConfig[] = template.slots.map((slot) => ({
        id: slot.id,
        prompt: slot.prompt ?? "",
        static: slot.staticContent ?? "",
        maxLength: slot.maxLength,
      }));
      updateField("slots", slots);
    }
    updateField("templateId", templateId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="subject">Subject</TabsTrigger>
          <TabsTrigger value="template">Template & Slots</TabsTrigger>
          <TabsTrigger value="content">Content Rules</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Intent Details</CardTitle>
              <CardDescription>
                Basic information about this email intent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Intent Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Welcome Email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="onboarding.welcome"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in API calls: /api/v1/emails/send with intent=&quot;
                    {formData.slug}&quot;
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Brief description of this intent"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandId">Brand</Label>
                  <Select
                    value={formData.brandId || "none"}
                    onValueChange={(value) =>
                      updateField("brandId", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific brand</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => updateField("urgency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => updateField("purpose", e.target.value)}
                  placeholder="What should this email accomplish?"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone *</Label>
                <Input
                  id="tone"
                  value={formData.tone}
                  onChange={(e) => updateField("tone", e.target.value)}
                  placeholder="Warm, excited, action-oriented"
                  required
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Tab */}
        <TabsContent value="subject">
          <Card>
            <CardHeader>
              <CardTitle>Subject Line</CardTitle>
              <CardDescription>Configure the email subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjectDefault">Default Subject *</Label>
                <Input
                  id="subjectDefault"
                  value={formData.subjectDefault}
                  onChange={(e) =>
                    updateField("subjectDefault", e.target.value)
                  }
                  placeholder="Welcome to {{productName}}, {{firstName}}!"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Supports {"{{variables}}"} for personalization
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectVariants">
                  Subject Variants (one per line)
                </Label>
                <Textarea
                  id="subjectVariants"
                  value={formData.subjectVariants}
                  onChange={(e) =>
                    updateField("subjectVariants", e.target.value)
                  }
                  placeholder={
                    "Your account is ready, {{firstName}}\nLet's get started!"
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectMaxLength">Max Length</Label>
                <Input
                  id="subjectMaxLength"
                  type="number"
                  value={formData.subjectMaxLength}
                  onChange={(e) =>
                    updateField("subjectMaxLength", parseInt(e.target.value))
                  }
                  min={20}
                  max={100}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template & Slots Tab */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Template & Slots</CardTitle>
              <CardDescription>
                Choose a template and configure content slots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((templateId) => {
                    const template = getTemplate(templateId);
                    const isSelected = formData.templateId === templateId;
                    return (
                      <div
                        key={templateId}
                        onClick={() => initializeSlotsFromTemplate(templateId)}
                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/50"
                        }`}
                      >
                        <h4 className="font-medium">{template?.name}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {template?.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {template?.slots.map((slot) => (
                            <Badge
                              key={slot.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {slot.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedTemplate && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Slot Configuration</h4>
                    {selectedTemplate.slots.map((slotDef) => {
                      const slotConfig = formData.slots.find(
                        (s) => s.id === slotDef.id,
                      );
                      return (
                        <div key={slotDef.id} className="rounded-lg border p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge>{slotDef.type}</Badge>
                            <span className="font-medium">{slotDef.id}</span>
                            {slotDef.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {slotDef.staticContent ? (
                            <div className="space-y-2">
                              <Label>Static Content</Label>
                              <Input
                                value={
                                  slotConfig?.static ?? slotDef.staticContent
                                }
                                onChange={(e) =>
                                  updateSlot(
                                    slotDef.id,
                                    "static",
                                    e.target.value,
                                  )
                                }
                                placeholder={slotDef.staticContent}
                              />
                            </div>
                          ) : slotDef.type === "cta-button" ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Button Text</Label>
                                <Input
                                  value={slotConfig?.buttonText ?? ""}
                                  onChange={(e) =>
                                    updateSlot(
                                      slotDef.id,
                                      "buttonText",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Click here"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>URL</Label>
                                <Input
                                  value={slotConfig?.url ?? ""}
                                  onChange={(e) =>
                                    updateSlot(
                                      slotDef.id,
                                      "url",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="{{dashboardUrl}}"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label>Generation Prompt</Label>
                              <Textarea
                                value={
                                  slotConfig?.prompt ?? slotDef.prompt ?? ""
                                }
                                onChange={(e) =>
                                  updateSlot(
                                    slotDef.id,
                                    "prompt",
                                    e.target.value,
                                  )
                                }
                                placeholder={slotDef.prompt}
                                rows={2}
                              />
                              {slotDef.maxLength && (
                                <p className="text-xs text-muted-foreground">
                                  Max length: {slotDef.maxLength} characters
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Rules Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Rules</CardTitle>
              <CardDescription>
                Define what should and shouldn&apos;t be in the email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contentGoal">Content Goal</Label>
                <Input
                  id="contentGoal"
                  value={formData.contentGoal}
                  onChange={(e) => updateField("contentGoal", e.target.value)}
                  placeholder="Get user to click through to dashboard"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contentMustInclude">
                    Must Include (one per line)
                  </Label>
                  <Textarea
                    id="contentMustInclude"
                    value={formData.contentMustInclude}
                    onChange={(e) =>
                      updateField("contentMustInclude", e.target.value)
                    }
                    placeholder="Confirmation they signed up&#10;Clear next step&#10;Time expectation"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentMustNotInclude">
                    Must NOT Include (one per line)
                  </Label>
                  <Textarea
                    id="contentMustNotInclude"
                    value={formData.contentMustNotInclude}
                    onChange={(e) =>
                      updateField("contentMustNotInclude", e.target.value)
                    }
                    placeholder="Feature lists&#10;Pricing information&#10;Multiple CTAs"
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">CTA Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => updateField("ctaText", e.target.value)}
                    placeholder="Get Started →"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">CTA URL</Label>
                  <Input
                    id="ctaUrl"
                    value={formData.ctaUrl}
                    onChange={(e) => updateField("ctaUrl", e.target.value)}
                    placeholder="{{dashboardUrl}}"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaStyle">CTA Style</Label>
                  <Select
                    value={formData.ctaStyle}
                    onValueChange={(value) => updateField("ctaStyle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOFT">Soft</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="STRONG">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generation">
          <Card>
            <CardHeader>
              <CardTitle>AI Generation Settings</CardTitle>
              <CardDescription>
                Configure AI-powered content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generationEnabled"
                  checked={formData.generationEnabled}
                  onChange={(e) =>
                    updateField("generationEnabled", e.target.checked)
                  }
                  className="rounded"
                />
                <Label htmlFor="generationEnabled">
                  Enable AI generation for this intent
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generationConstraints">
                  Generation Constraints (one per line)
                </Label>
                <Textarea
                  id="generationConstraints"
                  value={formData.generationConstraints}
                  onChange={(e) =>
                    updateField("generationConstraints", e.target.value)
                  }
                  placeholder={
                    "Keep it under 100 words\nOne clear action\nSound like a friend"
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {intent ? (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Intent
          </Button>
        ) : (
          <div />
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : intent
                ? "Save Changes"
                : "Create Intent"}
          </Button>
        </div>
      </div>
    </form>
  );
}
