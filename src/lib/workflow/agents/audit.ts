import { prisma } from "@/lib/prisma";

export interface AuditEntry {
  actorId?: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: entry.actorId,
      actorEmail: entry.actorEmail,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata as any,
      ipAddress: entry.ipAddress,
    },
  });
}

export async function logAuditBatch(entries: AuditEntry[]): Promise<void> {
  await prisma.auditLog.createMany({
    data: entries.map((e) => ({
      actorId: e.actorId,
      actorEmail: e.actorEmail,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      metadata: e.metadata as any,
      ipAddress: e.ipAddress,
    })),
  });
}

// Audit action constants
export const AUDIT_ACTIONS = {
  USER_REGISTERED: "USER_REGISTERED",
  USER_LOGIN: "USER_LOGIN",
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED",
  TIMESHEET_CREATED: "TIMESHEET_CREATED",
  INTERVIEW_STARTED: "INTERVIEW_STARTED",
  INTERVIEW_MESSAGE: "INTERVIEW_MESSAGE",
  INTERVIEW_COMPLETED: "INTERVIEW_COMPLETED",
  TIMESHEET_GENERATED: "TIMESHEET_GENERATED",
  TIMESHEET_SUBMITTED: "TIMESHEET_SUBMITTED",
  APPROVAL_TASK_CREATED: "APPROVAL_TASK_CREATED",
  APPROVAL_DECISION: "APPROVAL_DECISION",
  CORRECTION_REQUESTED: "CORRECTION_REQUESTED",
  TIMESHEET_RESUBMITTED: "TIMESHEET_RESUBMITTED",
  TIMESHEET_APPROVED: "TIMESHEET_APPROVED",
  TIMESHEET_REJECTED: "TIMESHEET_REJECTED",
  TIMESHEET_FINALIZED: "TIMESHEET_FINALIZED",
  VERSION_SNAPSHOT: "VERSION_SNAPSHOT",
  STATUS_CHANGED: "STATUS_CHANGED",
} as const;
