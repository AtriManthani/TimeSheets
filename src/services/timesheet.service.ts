import { prisma } from "@/lib/prisma";
import { canViewOrgWideData } from "@/lib/auth";
import { isValidTransition } from "@/lib/constants";
import { TimesheetStatus, UserRole } from "@prisma/client";
import { logAudit, AUDIT_ACTIONS } from "@/lib/workflow/agents/audit";

// ─── Access-controlled timesheet queries ─────────────────────────────────────

export async function getTimesheetById(id: string, requestingUserId: string, requestingRole: UserRole) {
  const timesheet = await prisma.timesheet.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      entries: { orderBy: { date: "asc" } },
      versions: { orderBy: { versionNumber: "desc" } },
      approvalTasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          decisions: true,
        },
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!timesheet) return null;

  // Access enforcement
  if (canViewOrgWideData(requestingRole)) return timesheet;
  if (timesheet.userId === requestingUserId) return timesheet;

  if (requestingRole === UserRole.MANAGER) {
    const isDirectReport = await prisma.managerRelationship.findFirst({
      where: { managerId: requestingUserId, employeeId: timesheet.userId, isActive: true },
    });
    if (isDirectReport) return timesheet;
  }

  if (requestingRole === UserRole.GWEN) {
    const hasTask = timesheet.approvalTasks.some((t) => t.assignedTo === requestingUserId);
    if (hasTask) return timesheet;
  }

  throw new Error("FORBIDDEN");
}

export async function getTimesheetsForUser(userId: string) {
  return prisma.timesheet.findMany({
    where: { userId },
    include: { entries: true },
    orderBy: { weekStartDate: "desc" },
  });
}

export async function getTimesheetsForManager(managerId: string) {
  const directReports = await prisma.managerRelationship.findMany({
    where: { managerId, isActive: true },
    select: { employeeId: true },
  });
  const employeeIds = directReports.map((r) => r.employeeId);

  return prisma.timesheet.findMany({
    where: { userId: { in: employeeIds } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvalTasks: { where: { assignedTo: managerId } },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getTimesheetsForGwen(gwenId: string) {
  return prisma.timesheet.findMany({
    where: {
      approvalTasks: { some: { assignedTo: gwenId } },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvalTasks: { where: { assignedTo: gwenId } },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getOrgTimesheets() {
  return prisma.timesheet.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

// ─── Timesheet creation ───────────────────────────────────────────────────────

export async function createTimesheet(userId: string, weekStartDate: Date, weekEndDate: Date) {
  const existing = await prisma.timesheet.findUnique({
    where: { userId_weekStartDate: { userId, weekStartDate } },
  });
  if (existing) throw new Error("DUPLICATE_TIMESHEET");

  const timesheet = await prisma.timesheet.create({
    data: {
      userId,
      weekStartDate,
      weekEndDate,
      status: "IN_INTERVIEW",
      createdBy: userId,
    },
  });

  const session = await prisma.timesheetInterviewSession.create({
    data: {
      timesheetId: timesheet.id,
      userId,
      messages: [],
      currentStep: "WEEK_DATES",
      collectedData: {},
    },
  });

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.TIMESHEET_CREATED,
    entityType: "Timesheet",
    entityId: timesheet.id,
    metadata: { weekStartDate, weekEndDate },
  });

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.INTERVIEW_STARTED,
    entityType: "TimesheetInterviewSession",
    entityId: session.id,
    metadata: { timesheetId: timesheet.id },
  });

  return { timesheet, session };
}

export async function getInterviewSession(timesheetId: string) {
  return prisma.timesheetInterviewSession.findUnique({ where: { timesheetId } });
}

// ─── Version history ──────────────────────────────────────────────────────────

export async function getTimesheetVersions(timesheetId: string) {
  return prisma.timesheetVersion.findMany({
    where: { timesheetId },
    orderBy: { versionNumber: "desc" },
  });
}
