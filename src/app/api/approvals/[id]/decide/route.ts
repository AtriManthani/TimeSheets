export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { approvalDecisionSchema } from "@/lib/validation/schemas";
import { runApprovalWorkflow } from "@/lib/workflow";
import { getTaskById } from "@/services/approval.service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = approvalDecisionSchema.safeParse({ ...body, taskId: params.id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await getTaskById(params.id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Enforce: only the assigned approver can act on this task
  if (task.assignedTo !== session.user.id) {
    return NextResponse.json({ error: "Forbidden: not your task" }, { status: 403 });
  }
  if (task.status !== "PENDING") {
    return NextResponse.json({ error: "Task is no longer pending" }, { status: 400 });
  }

  const result = await runApprovalWorkflow({
    timesheetId: task.timesheetId,
    taskId: params.id,
    decidedBy: session.user.id,
    decidedByRole: session.user.role,
    decision: parsed.data.decision,
    comments: parsed.data.comments,
    newStatus: undefined,
    nextTaskCreated: false,
    notificationsSent: false,
    auditLogged: false,
    errors: [],
  });

  if (result.errors && result.errors.length > 0) {
    return NextResponse.json({ error: result.errors[0] }, { status: 400 });
  }

  return NextResponse.json({ success: true, newStatus: result.newStatus });
}
