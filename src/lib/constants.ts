import { TimesheetStatus, UserRole } from "@prisma/client";

export const STATUS_LABELS: Record<TimesheetStatus, string> = {
  DRAFT: "Draft",
  IN_INTERVIEW: "In Progress",
  GENERATED: "Generated",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  NEEDS_CORRECTION: "Needs Correction",
  RESUBMITTED: "Resubmitted",
  MANAGER_APPROVED: "Manager Approved",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FINALIZED: "Finalized",
};

export const STATUS_COLORS: Record<TimesheetStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  IN_INTERVIEW: "bg-blue-100 text-blue-700",
  GENERATED: "bg-indigo-100 text-indigo-700",
  SUBMITTED: "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
  NEEDS_CORRECTION: "bg-red-100 text-red-700",
  RESUBMITTED: "bg-purple-100 text-purple-700",
  MANAGER_APPROVED: "bg-teal-100 text-teal-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-200 text-red-800",
  FINALIZED: "bg-green-200 text-green-800",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  GWEN: "Gwen",
  DIRECTOR: "Director",
  COMMISSIONER: "Commissioner",
  HR_LEAD: "HR Lead",
  CITO: "CITO",
  ADMIN: "Admin",
};

// Valid status transitions enforced server-side
export const VALID_TRANSITIONS: Partial<Record<TimesheetStatus, TimesheetStatus[]>> = {
  DRAFT: ["IN_INTERVIEW"],
  IN_INTERVIEW: ["GENERATED", "DRAFT"],
  GENERATED: ["SUBMITTED", "IN_INTERVIEW"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["MANAGER_APPROVED", "NEEDS_CORRECTION", "REJECTED"],
  NEEDS_CORRECTION: ["RESUBMITTED"],
  RESUBMITTED: ["UNDER_REVIEW", "NEEDS_CORRECTION", "REJECTED"],
  MANAGER_APPROVED: ["APPROVED", "NEEDS_CORRECTION", "REJECTED"],
  APPROVED: ["FINALIZED"],
  REJECTED: [],
  FINALIZED: [],
};

export function isValidTransition(from: TimesheetStatus, to: TimesheetStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const MAX_DAILY_HOURS = 24;
export const MAX_WEEKLY_HOURS = 80;
export const STANDARD_DAILY_HOURS = 8;
export const STANDARD_WEEKLY_HOURS = 40;
