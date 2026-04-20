import { callAIWithRetry, parseJsonFromAI } from "@/lib/ai/anthropic";
import { buildInterviewPrompt } from "@/lib/ai/prompts";
import { prisma } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit";
import type { InterviewState } from "../state";

export async function interviewAgentNode(state: InterviewState): Promise<Partial<InterviewState>> {
  const { userId, sessionId, messages, currentStep, collectedData, userMessage } = state;

  const updatedMessages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...messages,
    { role: "user", content: userMessage },
  ];

  const systemPrompt = buildInterviewPrompt(currentStep, collectedData);

  const aiResult = await callAIWithRetry(
    systemPrompt,
    updatedMessages.map((m) => ({ role: m.role, content: m.content })),
    1024
  );

  const aiResponse = aiResult.content;

  // Check if AI signals completion — look for the JSON completion signal
  const completionSignal = parseJsonFromAI<{
    status: string;
    data: Record<string, unknown>;
  }>(aiResponse);

  const isComplete =
    completionSignal?.status === "COMPLETE" && !!completionSignal?.data;

  // Build assistant reply: if complete, show a friendly summary message, not the raw JSON
  const assistantReply = isComplete
    ? "Thank you! I have all the information I need. Please click **Generate Timesheet** to create your draft."
    : aiResponse;

  const finalMessages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...updatedMessages,
    { role: "assistant", content: assistantReply },
  ];

  const newCollectedData = isComplete
    ? { ...collectedData, ...completionSignal!.data }
    : collectedData;

  const newStep = isComplete ? "COMPLETE" : currentStep;

  // Persist session — do NOT change timesheet.status here.
  // The timesheet stays IN_INTERVIEW until the user explicitly triggers generation.
  await prisma.timesheetInterviewSession.update({
    where: { id: sessionId },
    data: {
      messages: finalMessages as any,
      currentStep: newStep,
      collectedData: newCollectedData as any,
      isComplete,
    },
  });

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.INTERVIEW_MESSAGE,
    entityType: "TimesheetInterviewSession",
    entityId: sessionId,
    metadata: { isComplete, step: currentStep },
  });

  return {
    messages: finalMessages,
    aiResponse: assistantReply,
    isComplete,
    collectedData: newCollectedData,
    currentStep: newStep,
  };
}
