export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserWithRelations } from "@/services/user.service";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validation/schemas";
import { logAudit, AUDIT_ACTIONS } from "@/lib/workflow/agents/audit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserWithRelations(session.user.id);
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { managerId, startDate, ...profileFields } = parsed.data;

  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {
      ...profileFields,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      updatedBy: session.user.id,
    },
    create: {
      userId: session.user.id,
      ...profileFields,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      createdBy: session.user.id,
    },
  });

  if (managerId) {
    await prisma.managerRelationship.upsert({
      where: { employeeId: session.user.id },
      update: { managerId, isActive: true },
      create: { employeeId: session.user.id, managerId },
    });
  }

  await logAudit({
    actorId: session.user.id,
    action: AUDIT_ACTIONS.USER_PROFILE_UPDATED,
    entityType: "UserProfile",
    entityId: session.user.id,
  });

  return NextResponse.json({ success: true });
}
