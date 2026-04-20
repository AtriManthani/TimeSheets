import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { logAudit, AUDIT_ACTIONS } from "./audit";
import { sendNotifications, notifyTimesheetSubmitted } from "./notification";
import type { SubmissionState } from "../state";

export async function submissionAgentNode(
  state: SubmissionState
): Promise<Partial<SubmissionState>> {
  const { timesheetId, userId } = state;

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: timesheetId },
    include: { entries: true, user: true },
  });

  if (!timesheet) {
    return { errors: ["Timesheet not found"] };
  }

  if (!["GENERATED", "NEEDS_CORRECTION"].includes(timesheet.status)) {
    return { errors: [`Timesheet in status ${timesheet.status} cannot be submitted`] };
  }

  // Create version snapshot before status change
  await prisma.timesheetVersion.create({
    data: {
      timesheetId,
      versionNumber: timesheet.currentVersion,
      status: timesheet.status,
      snapshotData: {
        entries: timesheet.entries,
        notes: timesheet.notes,
        totalHours: timesheet.totalHours,
        regularHours: timesheet.regularHours,
        overtimeHours: timesheet.overtimeHours,
      } as any,
      changedBy: userId,
      changeReason: "Submitted for approval",
    },
  });

  const newVersion = timesheet.currentVersion + 1;
  const newStatus =
    timesheet.status === "NEEDS_CORRECTION" ? "RESUBMITTED" : "SUBMITTED";

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      status: newStatus,
      currentVersion: newVersion,
      submittedAt: new Date(),
      updatedBy: userId,
    },
  });

  await logAudit({
    actorId: userId,
    action:
      newStatus === "RESUBMITTED"
        ? AUDIT_ACTIONS.TIMESHEET_RESUBMITTED
        : AUDIT_ACTIONS.TIMESHEET_SUBMITTED,
    entityType: "Timesheet",
    entityId: timesheetId,
    metadata: { status: newStatus, version: newVersion },
  });

  const weekEnd = formatDate(timesheet.weekEndDate);

  await sendNotifications([
    notifyTimesheetSubmitted(userId, timesheetId, weekEnd),
  ]);

  return {
    versionCreated: true,
    notificationsSent: false, // approval notifications sent by routing agent
    auditLogged: true,
  };
}
