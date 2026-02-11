// =============================================================================
// RFC 8058 One-Click Unsubscribe Endpoint
// POST /api/v1/unsubscribe - One-click (email clients send automatically)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  verifyUnsubscribeToken,
  recordUnsubscribe,
} from "@/lib/email/unsubscribe";

export async function POST(request: NextRequest) {
  try {
    // Token can come from query string or form body
    let token: string | null =
      request.nextUrl.searchParams.get("token");

    if (!token) {
      // RFC 8058: email clients may send as form-encoded body
      try {
        const formData = await request.text();
        const params = new URLSearchParams(formData);
        token = params.get("token");
      } catch {
        // Body parsing failed
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Missing token" } },
        { status: 400 },
      );
    }

    const data = verifyUnsubscribeToken(token);
    if (!data) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid token" } },
        { status: 400 },
      );
    }

    try {
      await recordUnsubscribe(data.orgId, data.brandId, data.email, "one-click");
    } catch {
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to process unsubscribe" } },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process unsubscribe" } },
      { status: 500 },
    );
  }
}
