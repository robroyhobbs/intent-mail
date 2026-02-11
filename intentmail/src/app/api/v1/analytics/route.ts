// =============================================================================
// ANALYTICS API ENDPOINT
// Returns email performance metrics for the authenticated organization
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, hasScope } from "@/lib/api/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      { status: 401 },
    );
  }

  if (!hasScope(auth, "analytics:read")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient scope" } },
      { status: 403 },
    );
  }

  try {
    const orgId = auth.organizationId;

    // Parse optional date range from query params
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const createdAt = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

    const where = { organizationId: orgId, ...(createdAt && { createdAt }) };

    const [sent, delivered, opened, clicked, bounced, complained, failed] =
      await Promise.all([
        db.emailLog.count({
          where: { ...where, status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] } },
        }),
        db.emailLog.count({
          where: { ...where, status: { in: ["DELIVERED", "OPENED", "CLICKED"] } },
        }),
        db.emailLog.count({
          where: { ...where, status: { in: ["OPENED", "CLICKED"] } },
        }),
        db.emailLog.count({
          where: { ...where, status: "CLICKED" },
        }),
        db.emailLog.count({
          where: { ...where, status: "BOUNCED" },
        }),
        db.emailLog.count({
          where: { ...where, status: "COMPLAINED" },
        }),
        db.emailLog.count({
          where: { ...where, status: "FAILED" },
        }),
      ]);

    const deliveryRate = sent > 0 ? Number(((delivered / sent) * 100).toFixed(2)) : 0;
    const openRate = delivered > 0 ? Number(((opened / delivered) * 100).toFixed(2)) : 0;
    const clickRate = opened > 0 ? Number(((clicked / opened) * 100).toFixed(2)) : 0;
    const bounceRate = sent > 0 ? Number(((bounced / sent) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      data: {
        totals: { sent, delivered, opened, clicked, bounced, complained, failed },
        rates: { deliveryRate, openRate, clickRate, bounceRate },
        period: {
          from: from ?? null,
          to: to ?? null,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch analytics" } },
      { status: 500 },
    );
  }
}
