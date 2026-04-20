import { callAIWithRetry, parseJsonFromAI } from "@/lib/ai/anthropic";
import { buildCompliancePrompt } from "@/lib/ai/prompts";
import { MAX_DAILY_HOURS, MAX_WEEKLY_HOURS } from "@/lib/constants";
import type { GenerationState } from "../state";
import type { TimesheetGeneratedData } from "@/lib/validation/schemas";

export async function complianceAgentNode(
  state: GenerationState
): Promise<Partial<GenerationState>> {
  const { structuredData } = state;

  if (!structuredData) {
    return {
      complianceResult: { isValid: false, warnings: [], errors: ["No structured data to validate"] },
    };
  }

  // Fast deterministic checks first (no AI needed for these)
  const data = structuredData as unknown as TimesheetGeneratedData;
  const errors: string[] = [];
  const warnings: string[] = [];

  let totalHours = 0;
  for (const entry of data.entries) {
    const dayTotal =
      entry.regularHours +
      entry.overtimeHours +
      entry.sickHours +
      entry.vacationHours +
      entry.personalHolidayHours +
      entry.holidayHours +
      entry.fmlaHours +
      entry.compTimeUsed +
      entry.parentalLeaveHours;

    totalHours += dayTotal;

    if (dayTotal > MAX_DAILY_HOURS) {
      errors.push(`${entry.dayOfWeek} exceeds 24 hours (${dayTotal}h)`);
    }
    if (entry.overtimeHours > 0 && !entry.otReason) {
      errors.push(`${entry.dayOfWeek} has overtime hours but no OT reason provided`);
    }
    if (
      (entry.dayOfWeek === "Saturday" || entry.dayOfWeek === "Sunday") &&
      entry.regularHours > 0
    ) {
      warnings.push(`${entry.dayOfWeek} has regular hours — please confirm this is correct`);
    }
  }

  if (totalHours > MAX_WEEKLY_HOURS) {
    errors.push(`Total weekly hours (${totalHours}) exceed 80 hours`);
  }
  if (totalHours === 0) {
    errors.push("Timesheet shows 0 total hours — at least one hour must be recorded");
  }

  const isValid = errors.length === 0;

  return {
    complianceResult: { isValid, warnings, errors },
  };
}
