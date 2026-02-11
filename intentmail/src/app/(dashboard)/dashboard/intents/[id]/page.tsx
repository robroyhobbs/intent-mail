import { notFound } from "next/navigation";
import { requireOrganization, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { IntentForm } from "@/components/intents/intent-form";
import { EmailPreview } from "@/components/intents/email-preview";
import { generatePreviewHtml } from "@/lib/email/preview";
import { sendEmail } from "@/lib/email/client";

export const dynamic = "force-dynamic";

interface IntentPageProps {
  params: Promise<{ id: string }>;
}

export default async function IntentPage({ params }: IntentPageProps) {
  const { id } = await params;
  const org = await requireOrganization();

  const [intent, brands] = await Promise.all([
    db.intent.findFirst({
      where: { id, organizationId: org.id },
    }),
    db.brand.findMany({
      where: { organizationId: org.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!intent) {
    notFound();
  }

  async function handleGeneratePreview(
    intentId: string,
    brandId: string | null,
    sampleData: Record<string, string>,
  ): Promise<{ html: string; subject: string } | { error: string }> {
    "use server";
    const currentOrg = await requireOrganization();
    return generatePreviewHtml(
      intentId,
      brandId,
      currentOrg.id,
      sampleData,
    );
  }

  async function handleSendTestEmail(
    intentId: string,
    brandId: string | null,
    sampleData: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    "use server";
    const currentOrg = await requireOrganization();
    const user = await getCurrentUser();

    if (!user?.email) {
      return { success: false, error: "Could not determine your email address." };
    }

    if (!brandId) {
      // Try intent's brand or first brand
      const intentRecord = await db.intent.findFirst({
        where: { id: intentId, organizationId: currentOrg.id },
        select: { brandId: true },
      });
      const fallbackBrand = intentRecord?.brandId
        ?? (await db.brand.findFirst({
            where: { organizationId: currentOrg.id },
            select: { id: true },
          }))?.id;

      if (!fallbackBrand) {
        return { success: false, error: "No brand configured." };
      }
      brandId = fallbackBrand;
    }

    try {
      const result = await sendEmail({
        organizationId: currentOrg.id,
        brandId,
        intentId,
        to: user.email,
        subject: `[TEST] ${sampleData.subject ?? ""}`.trim() || undefined,
        data: {
          firstName: sampleData.firstName ?? user.firstName ?? "there",
          productName: sampleData.productName ?? "",
          ...sampleData,
        },
        tags: ["test"],
      });

      if (!result.success) {
        return { success: false, error: result.error ?? "Send failed." };
      }

      return { success: true };
    } catch {
      return { success: false, error: "An unexpected error occurred." };
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Intent</h1>
        <p className="text-muted-foreground">Update {intent.name}</p>
      </div>

      <IntentForm organizationId={org.id} intent={intent} brands={brands} />

      {/* Email Preview & Test Send */}
      <EmailPreview
        intentId={intent.id}
        brands={brands}
        defaultBrandId={intent.brandId}
        generatePreview={handleGeneratePreview}
        sendTestEmail={handleSendTestEmail}
      />
    </div>
  );
}
