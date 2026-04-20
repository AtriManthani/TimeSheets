import { StateGraph, END, START } from "@langchain/langgraph";
import { GenerationStateAnnotation } from "../state";
import { structuringAgentNode } from "../agents/structuring";
import { complianceAgentNode } from "../agents/compliance";
import { prisma } from "@/lib/prisma";
import { calculateTotalHours } from "@/lib/utils";
import { logAudit, AUDIT_ACTIONS } from "../agents/audit";
import type { TimesheetGeneratedData } from "@/lib/validation/schemas";

async function persistTimesheetNode(
  state: typeof GenerationStateAnnotation.State
): Promise<Partial<typeof GenerationStateAnnotation.State>> {
  const { timesheetId, userId, structuredData, complianceResult } = state;

  if (!structuredData || !complianceResult?.isValid) {
    return {
      generationComplete: false,
      errors: complianceResult?.errors ?? ["Invalid structured data"],
    };
  }

  const data = structuredData as unknown as TimesheetGeneratedData;

  // Delete existing entries and recreate
  await prisma.timesheetEntry.deleteMany({ where: { timesheetId } });

  let totalRegular = 0;
  let totalOvertime = 0;

  const entries = data.entries.map((entry) => {
    const total = calculateTotalHours(entry);
    totalRegular += entry.regularHours;
    totalOvertime += entry.overtimeHours;
    return {
      timesheetId,
      date: new Date(entry.date),
      dayOfWeek: entry.dayOfWeek,
      regularHours: entry.regularHours,
      overtimeHours: entry.overtimeHours,
      sickHours: entry.sickHours,
      vacationHours: entry.vacationHours,
      personalHolidayHours: entry.personalHolidayHours,
      holidayHours: entry.holidayHours,
      fmlaHours: entry.fmlaHours,
      compTimeEarned: entry.compTimeEarned,
      compTimeUsed: entry.compTimeUsed,
      parentalLeaveHours: entry.parentalLeaveHours,
      otReason: entry.otReason ?? null,
      notes: entry.notes ?? null,
      totalHours: total,
    };
  });

  await prisma.timesheetEntry.createMany({ data: entries });

  const totalHours = totalRegular + totalOvertime;

  await prisma.timesheet.update({
    where: { id: timesheetId },
    data: {
      status: "GENERATED",
      weekStartDate: new Date(data.weekStartDate),
      weekEndDate: new Date(data.weekEndDate),
      notes: data.notes ?? null,
      totalHours,
      regularHours: totalRegular,
      overtimeHours: totalOvertime,
      updatedBy: userId,
    },
  });

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.TIMESHEET_GENERATED,
    entityType: "Timesheet",
    entityId: timesheetId,
    metadata: { totalHours, warnings: complianceResult.warnings },
  });

  return { generationComplete: true };
}

function routeAfterCompliance(state: typeof GenerationStateAnnotation.State) {
  if (!state.structuredData) return "failed";
  if (!state.complianceResult?.isValid) return "failed";
  return "persist";
}

const graph = new StateGraph(GenerationStateAnnotation)
  .addNode("structuring", structuringAgentNode)
  .addNode("compliance", complianceAgentNode)
  .addNode("persist", persistTimesheetNode)
  .addEdge(START, "structuring")
  .addEdge("structuring", "compliance")
  .addConditionalEdges("compliance", routeAfterCompliance, {
    persist: "persist",
    failed: END,
  })
  .addEdge("persist", END);

export const generationGraph = graph.compile();

export async function runGenerationWorkflow(
  input: typeof GenerationStateAnnotation.State
) {
  return generationGraph.invoke(input);
}
