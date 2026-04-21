export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runSubmissionWorkflow } from "@/lib/workflow";
import { getGwenUser } from "@/services/user.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: params.id },
    include: { user: { include: { managerOf: true } } },
  });

  if (!timesheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (timesheet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["GENERATED", "NEEDS_CORRECTION"].includes(timesheet.status)) {
    return NextResponse.json(
      { error: `Cannot submit a timesheet with status: ${timesheet.status}` },
      { status: 400 }
    );
  }

  const managerId = timesheet.user.managerOf?.managerId;
  const gwen = await getGwenUser();

  const result = await runSubmissionWorkflow({
    timesheetId: params.id,
    userId: session.user.id,
    managerId: managerId ?? undefined,
    gwenId: gwen?.id ?? undefined,
    versionCreated: false,
    approvalTasksCreated: false,
    notificationsSent: false,
    auditLogged: false,
    errors: [],
  });

  if (result.errors && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0] }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
