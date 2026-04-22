import { callAIWithRetry, parseJsonFromAI } from "@/lib/ai/anthropic";
import { STRUCTURING_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { timesheetGeneratedSchema } from "@/lib/validation/schemas";
import type { GenerationState } from "../state";

export async function structuringAgentNode(
  state: GenerationState
): Promise<Partial<GenerationState>> {
  const { rawConversation } = state;

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
    return {
      structuredData: null,
      errors: ["AI could not produce valid structured output. Please retry."],
    };
  }

  const validation = timesheetGeneratedSchema.safeParse(parsed);
  if (!validation.success) {
    return {
      structuredData: null,
      errors: ["Generated timesheet failed schema validation. Please retry."],
    };
  }

  return { structuredData: validation.data as unknown as Record<string, unknown> };
}
