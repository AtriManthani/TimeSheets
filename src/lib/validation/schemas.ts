import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  title: z.string().min(2, "Title is required"),
  department: z.string().min(2, "Department is required"),
  managerId: z.string().optional(),
  phone: z.string().optional(),
  employeeNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  title: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  phone: z.string().optional(),
  employeeNumber: z.string().optional(),
  startDate: z.string().datetime().optional(),
  scheduleHours: z.number().min(1).max(80).optional(),
  managerId: z.string().optional(),
});

// ─── Timesheet Entry ──────────────────────────────────────────────────────────

export const timesheetEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  dayOfWeek: z.enum([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  ]),
  regularHours: z.number().min(0).max(24),
  overtimeHours: z.number().min(0).max(24),
  sickHours: z.number().min(0).max(24),
  vacationHours: z.number().min(0).max(24),
  personalHolidayHours: z.number().min(0).max(24),
  holidayHours: z.number().min(0).max(24),
  fmlaHours: z.number().min(0).max(24),
  compTimeEarned: z.number().min(0).max(24),
  compTimeUsed: z.number().min(0).max(24),
  parentalLeaveHours: z.number().min(0).max(24),
  otReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type TimesheetEntry = z.infer<typeof timesheetEntrySchema>;

// ─── Generated Timesheet (AI output schema) ──────────────────────────────────

export const timesheetGeneratedSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().nullable().optional(),
  entries: z.array(timesheetEntrySchema).length(7),
});

export type TimesheetGeneratedData = z.infer<typeof timesheetGeneratedSchema>;

// ─── Approval Decision ────────────────────────────────────────────────────────

export const approvalDecisionSchema = z.object({
  taskId: z.string().cuid(),
  decision: z.enum(["APPROVED", "REJECTED", "NEEDS_CORRECTION"]),
  comments: z.string().max(1000).optional(),
});

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

// ─── Interview Message ────────────────────────────────────────────────────────

export const interviewMessageSchema = z.object({
  timesheetId: z.string().cuid(),
  message: z.string().min(1).max(2000),
});

// ─── Create Timesheet ─────────────────────────────────────────────────────────

export const createTimesheetSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
