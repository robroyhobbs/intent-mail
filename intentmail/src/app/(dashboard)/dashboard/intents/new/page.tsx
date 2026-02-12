import { requireOrganization } from "@/lib/auth";
import { db } from "@/lib/db";
import { IntentWizard } from "@/components/intents/intent-wizard";

export const dynamic = "force-dynamic";

export default async function NewIntentPage() {
  const org = await requireOrganization();

  const brands = await db.brand.findMany({
    where: { organizationId: org.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, colorPrimary: true, voiceTone: true },
  });

  return <IntentWizard brands={brands} />;
}
