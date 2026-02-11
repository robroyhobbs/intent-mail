import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // Test 1: Auth
    const { userId, orgId } = await auth();
    results.auth = { userId: userId ? "present" : null, orgId };

    if (!orgId) {
      return NextResponse.json({ ...results, error: "No orgId from auth()" });
    }

    // Test 2: Find org
    const org = await db.organization.findUnique({
      where: { clerkId: orgId },
    });
    results.org = org ? { id: org.id, name: org.name, plan: org.plan } : null;

    if (!org) {
      return NextResponse.json({ ...results, error: "Org not found for clerkId: " + orgId });
    }

    // Test 3: Dashboard queries
    const [brandCount, intentCount, providerCount, domainCount] =
      await Promise.all([
        db.brand.count({ where: { organizationId: org.id } }),
        db.intent.count({ where: { organizationId: org.id } }),
        db.emailProvider.count({ where: { organizationId: org.id, isActive: true } }),
        db.domain.count({ where: { organizationId: org.id, status: "VERIFIED" } }),
      ]);
    results.counts = { brandCount, intentCount, providerCount, domainCount };

    // Test 4: Intent list query
    const intents = await db.intent.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        brand: { select: { name: true, colorPrimary: true } },
        _count: { select: { emailLogs: true } },
      },
    });
    results.intents = intents.map((i) => ({
      name: i.name,
      slug: i.slug,
      brand: i.brand,
      emailCount: i._count.emailLogs,
      urgency: i.urgency,
      svType: typeof i.subjectVariants,
      svIsArray: Array.isArray(i.subjectVariants),
    }));

    // Test 5: Recent emails
    const recentEmails = await db.emailLog.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        intent: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });
    results.recentEmails = recentEmails.length;

    results.status = "ALL OK";
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { ...results, error: message, stack },
      { status: 500 },
    );
  }
}
