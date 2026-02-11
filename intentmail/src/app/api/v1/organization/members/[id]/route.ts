// =============================================================================
// ORGANIZATION MEMBER MANAGEMENT
// Update role or remove member
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

async function getCallerMember(orgId: string, userId: string) {
  return db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { role, organizationId } = body as { role?: string; organizationId?: string };

    if (!role || !organizationId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "role and organizationId required" } },
        { status: 400 },
      );
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Invalid role" } },
        { status: 400 },
      );
    }

    // Check caller is OWNER or ADMIN
    const caller = await getCallerMember(organizationId, userId);
    if (!caller || (caller.role !== "OWNER" && caller.role !== "ADMIN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      );
    }

    // Find target member
    const target = await db.organizationMember.findFirst({
      where: { id, organizationId },
    });

    if (!target) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 },
      );
    }

    // Cannot change OWNER role
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Cannot change owner role" } },
        { status: 403 },
      );
    }

    // ADMIN cannot change other ADMINs
    if (caller.role === "ADMIN" && target.role === "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admins cannot change other admins" } },
        { status: 403 },
      );
    }

    const updated = await db.organizationMember.update({
      where: { id },
      data: { role: role as "ADMIN" | "MEMBER" },
    });

    return NextResponse.json({ data: { id: updated.id, role: updated.role } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update member" } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { organizationId } = body as { organizationId?: string };

    if (!organizationId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "organizationId required" } },
        { status: 400 },
      );
    }

    // Check caller is OWNER or ADMIN
    const caller = await getCallerMember(organizationId, userId);
    if (!caller || (caller.role !== "OWNER" && caller.role !== "ADMIN")) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      );
    }

    // Find target member
    const target = await db.organizationMember.findFirst({
      where: { id, organizationId },
    });

    if (!target) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 },
      );
    }

    // Cannot remove OWNER
    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Cannot remove organization owner" } },
        { status: 403 },
      );
    }

    // Cannot remove self via this endpoint
    if (target.userId === userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Cannot remove yourself" } },
        { status: 403 },
      );
    }

    // ADMIN cannot remove other ADMINs
    if (caller.role === "ADMIN" && target.role === "ADMIN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admins cannot remove other admins" } },
        { status: 403 },
      );
    }

    await db.organizationMember.delete({ where: { id } });

    return NextResponse.json({ data: { removed: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to remove member" } },
      { status: 500 },
    );
  }
}
