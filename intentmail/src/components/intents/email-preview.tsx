"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Send, RefreshCw, Monitor, Smartphone } from "lucide-react";

interface EmailPreviewProps {
  intentId: string;
  brands: { id: string; name: string }[];
  defaultBrandId: string | null;
  generatePreview: (
    intentId: string,
    brandId: string | null,
    sampleData: Record<string, string>,
  ) => Promise<{ html: string; subject: string } | { error: string }>;
  sendTestEmail: (
    intentId: string,
    brandId: string | null,
    sampleData: Record<string, string>,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function EmailPreview({
  intentId,
  brands,
  defaultBrandId,
  generatePreview,
  sendTestEmail,
}: EmailPreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [brandId, setBrandId] = useState(defaultBrandId ?? "");
  const [firstName, setFirstName] = useState("Alice");
  const [productName, setProductName] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [isPreviewing, startPreviewTransition] = useTransition();
  const [isSending, startSendTransition] = useTransition();

  function handleGeneratePreview() {
    setPreviewError(null);
    startPreviewTransition(async () => {
      const sampleData: Record<string, string> = { firstName };
      if (productName) sampleData.productName = productName;

      const result = await generatePreview(
        intentId,
        brandId || null,
        sampleData,
      );

      if ("error" in result) {
        setPreviewError(result.error);
        setPreviewHtml(null);
        setPreviewSubject(null);
      } else {
        setPreviewHtml(result.html);
        setPreviewSubject(result.subject);
        setPreviewError(null);
      }
    });
  }

  function handleSendTest() {
    setSendStatus(null);
    startSendTransition(async () => {
      const sampleData: Record<string, string> = { firstName };
      if (productName) sampleData.productName = productName;

      const result = await sendTestEmail(
        intentId,
        brandId || null,
        sampleData,
      );

      if (result.success) {
        setSendStatus({
          type: "success",
          message: "Test email sent to your inbox.",
        });
      } else {
        setSendStatus({
          type: "error",
          message: result.error ?? "Failed to send test email.",
        });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Email Preview
        </CardTitle>
        <CardDescription>
          Preview the rendered email and send a test to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="preview-brand">Brand</Label>
            <Select value={brandId} onValueChange={setBrandId}>
              <SelectTrigger id="preview-brand">
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preview-firstname">First Name</Label>
            <Input
              id="preview-firstname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Alice"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preview-product">Product Name</Label>
            <Input
              id="preview-product"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="(uses brand name)"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleGeneratePreview}
              disabled={isPreviewing || !brandId}
              className="flex-1"
            >
              {isPreviewing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Preview
            </Button>
          </div>
        </div>

        {/* Error */}
        {previewError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {previewError}
          </div>
        )}

        {/* Preview */}
        {previewHtml && (
          <div className="space-y-3">
            {/* Subject line */}
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase">
                Subject
              </p>
              <p className="font-medium">{previewSubject}</p>
            </div>

            {/* View mode toggle + Send test */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-md border p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("desktop")}
                  className={`rounded px-2 py-1 text-xs ${viewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("mobile")}
                  className={`rounded px-2 py-1 text-xs ${viewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTest}
                disabled={isSending}
              >
                {isSending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Test Email
              </Button>
            </div>

            {/* Send status */}
            {sendStatus && (
              <div
                className={`rounded-md border p-3 text-sm ${
                  sendStatus.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-destructive/50 bg-destructive/10 text-destructive"
                }`}
              >
                {sendStatus.message}
              </div>
            )}

            {/* iframe */}
            <div
              className={`mx-auto rounded-md border bg-white transition-all ${
                viewMode === "mobile" ? "max-w-[375px]" : "w-full"
              }`}
            >
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="h-[600px] w-full rounded-md"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!previewHtml && !previewError && (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
            <Eye className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Select a brand and click Preview to see the rendered email.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
