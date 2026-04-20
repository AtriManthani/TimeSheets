import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { logAudit, AUDIT_ACTIONS } from "./audit";
import {
  sendNotifications,
  notifyApprovalTaskAssigned,
  notifyCorrectionRequested,
  notifyManagerApproved,
  notifyFullyApproved,
  notifyRejected,
} from "./notification";
import type { SubmissionState, ApprovalState } from "../state";
import { TimesheetStatus } from "@prisma/client";

// Called after submission — creates approval tasks for manager then Gwen (sequential)
export async function approvalRoutingAgentNode(
  state: SubmissionState
): Promise<Partial<SubmissionState>> {
  const { timesheetId, userId, managerId, gwenId } = state;

  if (!managerId) {
    return { errors: ["No manager assigned to this employee. Please update your profile."] };
  }
  if (!gwenId) {
    return { errors: ["No Gwen approver found in the system. Please contact admin."] };
  }

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: { user: true },
  });
  if (!timesheet) return { errors: ["Timesheet not found"] };

  // Supersede any open tasks from a prior submission cycle
  await prisma.approvalTask.updateMany({
    where: { timesheetId, status: { in: ["PENDING", "AWAITING_PRIOR"] } },
    data: { status: "SUPERSEDED" },
  });

  const weekEnd = formatDate(timesheet.weekEndDate);

  // Sequence 1: Manager task (active immediately)
  const managerTask = await prisma.approvalTask.create({
    data: {
      timesheetId,
      assignedTo: managerId,
      assignedRole: "MANAGER",
      sequence: 1,
      status: "PENDING",
    },
  });

  // Sequence 2: Gwen task (blocked until manager approves)
  await prisma.approvalTask.create({
    data: {
      timesheetId,
      assignedTo: gwenId,
      assignedRole: "GWEN",
      sequence: 2,
      status: "AWAITING_PRIOR",
    },
  });

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: { status: "UNDER_REVIEW", updatedBy: userId },
  });

  await sendNotifications([
    notifyApprovalTaskAssigned(managerId, timesheetId, timesheet.user.name, weekEnd),
  ]);

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.APPROVAL_TASK_CREATED,
    entityType: "ApprovalTask",
    entityId: managerTask.id,
    metadata: { timesheetId, assignedTo: managerId, sequence: 1 },
  });

  return { approvalTasksCreated: true, notificationsSent: true, auditLogged: true };
}

// Called when an approver makes a decision
export async function processApprovalDecisionNode(
  state: ApprovalState
): Promise<Partial<ApprovalState>> {
  const { timesheetId, taskId, decidedBy, decision, comments } = state;

  const task = await prisma.approvalTask.findUnique({
    where: { id: taskId },
    include: { timesheet: { include: { user: true } } },
  });

  if (!task) return { errors: ["Approval task not found"] };
  if (task.timesheetId !== timesheetId) return { errors: ["Task does not match timesheet"] };
  if (task.status !== "PENDING") return { errors: ["This approval task is no longer active"] };

  // Record the decision
  await prisma.approvalDecision.create({
    data: { taskId, decidedBy, decision, comments },
  });

  await prisma.approvalTask.update({
    where: { id: taskId },
    data: { status: "COMPLETED" },
  });

  const timesheet = task.timesheet;
  const employeeId = timesheet.userId;
  const weekEnd = formatDate(timesheet.weekEndDate);
  const notifications: ReturnType<typeof notifyApprovalTaskAssigned>[] = [];

  let newStatus: TimesheetStatus | undefined;

  if (decision === "APPROVED") {
    if (task.sequence === 1) {
      // Manager approved → activate Gwen task
      newStatus = "MANAGER_APPROVED";

      await prisma.timesheet.update({
        where: { id: timesheetId },
        data: { status: "MANAGER_APPROVED", managerApprovedAt: new Date(), updatedBy: decidedBy },
      });

      await prisma.approvalTask.updateMany({
        where: { timesheetId, sequence: 2, status: "AWAITING_PRIOR" },
        data: { status: "PENDING" },
      });

      // Fetch Gwen task to get assignedTo — no relation needed, use the field directly
      const gwenTask = await prisma.approvalTask.findFirst({
        where: { timesheetId, sequence: 2 },
        select: { assignedTo: true },
      });

      if (gwenTask) {
        notifications.push(
          notifyApprovalTaskAssigned(gwenTask.assignedTo, timesheetId, timesheet.user.name, weekEnd)
        );
      }
      notifications.push(
        notifyManagerApproved(employeeId, timesheetId, weekEnd, timesheet.user.name)
      );
    } else if (task.sequence === 2) {
      // Gwen approved → fully approved & finalized
      newStatus = "APPROVED";

      await prisma.timesheet.update({
        where: { id: timesheetId },
        data: {
          status: "APPROVED",
          gwenApprovedAt: new Date(),
          finalizedAt: new Date(),
          updatedBy: decidedBy,
        },
      });

      notifications.push(notifyFullyApproved(employeeId, timesheetId, weekEnd));
    }
  } else if (decision === "NEEDS_CORRECTION") {
    newStatus = "NEEDS_CORRECTION";

    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: "NEEDS_CORRECTION",
        correctionComments: comments,
        updatedBy: decidedBy,
      },
    });

    // Supersede any remaining tasks (e.g. Gwen task if manager is correcting)
    await prisma.approvalTask.updateMany({
      where: { timesheetId, status: { in: ["PENDING", "AWAITING_PRIOR"] } },
      data: { status: "SUPERSEDED" },
    });

    notifications.push(notifyCorrectionRequested(employeeId, timesheetId, weekEnd, comments));
  } else if (decision === "REJECTED") {
    newStatus = "REJECTED";

    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { status: "REJECTED", correctionComments: comments, updatedBy: decidedBy },
    });

    await prisma.approvalTask.updateMany({
      where: { timesheetId, status: { in: ["PENDING", "AWAITING_PRIOR"] } },
      data: { status: "SUPERSEDED" },
    });

    notifications.push(notifyRejected(employeeId, timesheetId, weekEnd, comments));
  }

  if (notifications.length > 0) {
    await sendNotifications(notifications);
  }

  await logAudit({
    actorId: decidedBy,
    action: AUDIT_ACTIONS.APPROVAL_DECISION,
    entityType: "ApprovalTask",
    entityId: taskId,
    metadata: { decision, timesheetId, comments, newStatus },
  });

  return { newStatus, notificationsSent: true, auditLogged: true };
}
