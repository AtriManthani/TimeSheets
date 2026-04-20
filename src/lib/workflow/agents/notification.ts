import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

// Abstract notification dispatcher — add email/Slack channels here later
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedEntityType: payload.relatedEntityType,
      relatedEntityId: payload.relatedEntityId,
      metadata: payload.metadata as any,
    },
  });
}

export async function sendNotifications(payloads: NotificationPayload[]): Promise<void> {
  if (payloads.length === 0) return;
  await prisma.notification.createMany({
    data: payloads.map((p) => ({
      userId: p.userId,
      type: p.type,
      title: p.title,
      message: p.message,
      relatedEntityType: p.relatedEntityType,
      relatedEntityId: p.relatedEntityId,
      metadata: p.metadata as any,
    })),
  });
}

// Pre-built notification factories
export function notifyRegistrationComplete(userId: string) {
  return {
    userId,
    type: "REGISTRATION_COMPLETE" as NotificationType,
    title: "Welcome to Timeflux",
    message: "Your account has been created. Complete your profile to start submitting timesheets.",
    relatedEntityType: "User",
    relatedEntityId: userId,
  };
}

export function notifyTimesheetSubmitted(userId: string, timesheetId: string, weekEnd: string) {
  return {
    userId,
    type: "TIMESHEET_SUBMITTED" as NotificationType,
    title: "Timesheet Submitted",
    message: `Your timesheet for the week ending ${weekEnd} has been submitted for approval.`,
    relatedEntityType: "Timesheet",
    relatedEntityId: timesheetId,
  };
}

export function notifyApprovalTaskAssigned(
  userId: string,
  timesheetId: string,
  employeeName: string,
  weekEnd: string
) {
  return {
    userId,
    type: "APPROVAL_TASK_ASSIGNED" as NotificationType,
    title: "Timesheet Awaiting Your Approval",
    message: `${employeeName}'s timesheet for the week ending ${weekEnd} requires your review.`,
    relatedEntityType: "Timesheet",
    relatedEntityId: timesheetId,
  };
}

export function notifyCorrectionRequested(
  userId: string,
  timesheetId: string,
  weekEnd: string,
  comments?: string
) {
  return {
    userId,
    type: "CORRECTION_REQUESTED" as NotificationType,
    title: "Timesheet Correction Required",
    message: `Your timesheet for the week ending ${weekEnd} has been returned for correction.${comments ? ` Comments: ${comments}` : ""}`,
    relatedEntityType: "Timesheet",
    relatedEntityId: timesheetId,
  };
}

export function notifyManagerApproved(
  userId: string,
  timesheetId: string,
  weekEnd: string,
  managerName: string
) {
  return {
    userId,
    type: "MANAGER_APPROVED" as NotificationType,
    title: "Manager Approved Your Timesheet",
    message: `${managerName} approved your timesheet for the week ending ${weekEnd}. It is now pending final approval.`,
    relatedEntityType: "Timesheet",
    relatedEntityId: timesheetId,
  };
}

export function notifyFullyApproved(userId: string, timesheetId: string, weekEnd: string) {
  return {
    userId,
    type: "TIMESHEET_APPROVED" as NotificationType,
    title: "Timesheet Fully Approved",
    message: `Your timesheet for the week ending ${weekEnd} has been fully approved and finalized.`,
    relatedEntityType: "Timesheet",
    relatedEntityId: timesheetId,
  };
}

export function notifyRejected(
  userId: string,
  timesheetId: string,
  weekEnd: string,
  comments?: string
) {
  return {
    userId,
    type: "TIMESHEET_REJECTED" as NotificationType,
    title: "Timesheet Rejected",
    message: `Your timesheet for the week ending ${weekEnd} has been rejected.${comments ? ` Reason: ${comments}` : ""}`,
    relatedEntityType: "Timesheet",
    relatedEntityId: timesheetId,
  };
}
