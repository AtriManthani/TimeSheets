import { Annotation } from "@langchain/langgraph";
import { TimesheetStatus, UserRole } from "@prisma/client";

// ─── Registration Workflow State ──────────────────────────────────────────────

export const RegistrationStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  email: Annotation<string>(),
  name: Annotation<string>(),
  role: Annotation<UserRole>(),
  profileData: Annotation<{
    employeeNumber?: string;
    title?: string;
    department?: string;
    phone?: string;
    startDate?: string;
    scheduleHours?: number;
  }>(),
  managerId: Annotation<string | undefined>(),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  isValid: Annotation<boolean>(),
  notificationsSent: Annotation<boolean>(),
  auditLogged: Annotation<boolean>(),
});

export type RegistrationState = typeof RegistrationStateAnnotation.State;

// ─── Interview Workflow State ─────────────────────────────────────────────────

export const InterviewStateAnnotation = Annotation.Root({
  timesheetId: Annotation<string>(),
  userId: Annotation<string>(),
  sessionId: Annotation<string>(),
  messages: Annotation<Array<{ role: "user" | "assistant"; content: string }>>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  currentStep: Annotation<string>(),
  collectedData: Annotation<Record<string, unknown>>(),
  userMessage: Annotation<string>(),
  aiResponse: Annotation<string>(),
  isComplete: Annotation<boolean>(),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
});

export type InterviewState = typeof InterviewStateAnnotation.State;

// ─── Generation Workflow State ─────────────────────────────────────────────────

export const GenerationStateAnnotation = Annotation.Root({
  timesheetId: Annotation<string>(),
  userId: Annotation<string>(),
  sessionId: Annotation<string>(),
  rawConversation: Annotation<Array<{ role: "user" | "assistant"; content: string }>>(),
  structuredData: Annotation<Record<string, unknown> | null>(),
  complianceResult: Annotation<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } | null>(),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  generationComplete: Annotation<boolean>(),
});

export type GenerationState = typeof GenerationStateAnnotation.State;

// ─── Submission Workflow State ────────────────────────────────────────────────

export const SubmissionStateAnnotation = Annotation.Root({
  timesheetId: Annotation<string>(),
  userId: Annotation<string>(),
  managerId: Annotation<string | undefined>(),
  gwenId: Annotation<string | undefined>(),
  versionCreated: Annotation<boolean>(),
  approvalTasksCreated: Annotation<boolean>(),
  notificationsSent: Annotation<boolean>(),
  auditLogged: Annotation<boolean>(),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
});

export type SubmissionState = typeof SubmissionStateAnnotation.State;

// ─── Approval Workflow State ──────────────────────────────────────────────────

export const ApprovalStateAnnotation = Annotation.Root({
  timesheetId: Annotation<string>(),
  taskId: Annotation<string>(),
  decidedBy: Annotation<string>(),
  decidedByRole: Annotation<UserRole>(),
  decision: Annotation<"APPROVED" | "REJECTED" | "NEEDS_CORRECTION">(),
  comments: Annotation<string | undefined>(),
  newStatus: Annotation<TimesheetStatus | undefined>(),
  nextTaskCreated: Annotation<boolean>(),
  notificationsSent: Annotation<boolean>(),
  auditLogged: Annotation<boolean>(),
  errors: Annotation<string[]>({ reducer: (a, b) => [...a, ...b], default: () => [] }),
});

export type ApprovalState = typeof ApprovalStateAnnotation.State;
