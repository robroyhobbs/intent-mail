// =============================================================================
// LIST SCHEDULED EMAILS
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiKey, hasScope } from "@/lib/api/auth";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      { status: 401 },
    );
  }

  if (!hasScope(auth, "email:send")) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "API key lacks email:send scope" } },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;

  const [emails, total] = await Promise.all([
    db.emailLog.findMany({
      where: {
        organizationId: auth.organizationId,
        status: "SCHEDULED",
      },
      orderBy: { scheduledFor: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        toEmail: true,
        subject: true,
        status: true,
        scheduledFor: true,
        brandId: true,
        intentId: true,
        createdAt: true,
      },
    }),
    db.emailLog.count({
      where: {
        organizationId: auth.organizationId,
        status: "SCHEDULED",
      },
    }),
  ]);

  return NextResponse.json({
    data: emails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
