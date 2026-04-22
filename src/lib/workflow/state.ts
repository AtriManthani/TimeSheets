import { Annotation } from "@langchain/langgraph";

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

// ─── Generation Workflow State ────────────────────────────────────────────────

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
