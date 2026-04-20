import { callAIWithRetry, parseJsonFromAI } from "@/lib/ai/anthropic";
import { STRUCTURING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { timesheetGeneratedSchema } from "@/lib/validation/schemas";
import { logAudit, AUDIT_ACTIONS } from "./audit";
import type { GenerationState } from "../state";

export async function structuringAgentNode(
  state: GenerationState
): Promise<Partial<GenerationState>> {
  const { timesheetId, userId, rawConversation } = state;

  const conversationText = rawConversation
    .map((m) => `${m.role === "user" ? "Employee" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const aiResult = await callAIWithRetry(
    STRUCTURING_SYSTEM_PROMPT,
    [{ role: "user", content: conversationText }],
    2048
  );

  const parsed = parseJsonFromAI<Record<string, unknown>>(aiResult.content);

  if (!parsed) {
    await logAudit({
      actorId: userId,
      action: AUDIT_ACTIONS.TIMESHEET_GENERATED,
      entityType: "Timesheet",
      entityId: timesheetId,
      metadata: { error: "AI output could not be parsed" },
    });
    return {
      structuredData: null,
      errors: ["AI could not produce valid structured output. Please retry."],
    };
  }

  // Schema validation — never trust AI output blindly
  const validation = timesheetGeneratedSchema.safeParse(parsed);
  if (!validation.success) {
    await logAudit({
      actorId: userId,
      action: AUDIT_ACTIONS.TIMESHEET_GENERATED,
      entityType: "Timesheet",
      entityId: timesheetId,
      metadata: { error: "Schema validation failed", issues: validation.error.issues },
    });
    return {
      structuredData: null,
      errors: ["Generated timesheet failed schema validation. Please retry."],
    };
  }

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.TIMESHEET_GENERATED,
    entityType: "Timesheet",
    entityId: timesheetId,
    metadata: { weekStart: validation.data.weekStartDate },
  });

  return { structuredData: validation.data as unknown as Record<string, unknown> };
}
