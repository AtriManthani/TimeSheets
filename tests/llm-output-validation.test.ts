import { timesheetGeneratedSchema, type TimesheetGeneratedData } from "@/lib/validation/schemas";
import { parseJsonFromAI } from "@/lib/ai/anthropic";

describe("LLM Output Validation", () => {
  const validData: TimesheetGeneratedData = {
    weekStartDate: "2025-02-17",
    weekEndDate: "2025-02-23",
    notes: null,
    entries: [
      { date: "2025-02-17", dayOfWeek: "Monday", regularHours: 8, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
      { date: "2025-02-18", dayOfWeek: "Tuesday", regularHours: 8, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
      { date: "2025-02-19", dayOfWeek: "Wednesday", regularHours: 8, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
      { date: "2025-02-20", dayOfWeek: "Thursday", regularHours: 8, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
      { date: "2025-02-21", dayOfWeek: "Friday", regularHours: 8, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
      { date: "2025-02-22", dayOfWeek: "Saturday", regularHours: 0, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
      { date: "2025-02-23", dayOfWeek: "Sunday", regularHours: 0, overtimeHours: 0, sickHours: 0, vacationHours: 0, personalHolidayHours: 0, holidayHours: 0, fmlaHours: 0, compTimeEarned: 0, compTimeUsed: 0, parentalLeaveHours: 0 },
    ],
  };

  test("valid AI output passes schema validation", () => {
    const result = timesheetGeneratedSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test("missing entries fails validation", () => {
    const bad = { ...validData, entries: validData.entries.slice(0, 5) };
    const result = timesheetGeneratedSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  test("invalid date format fails validation", () => {
    const bad = { ...validData, weekStartDate: "17-02-2025" };
    const result = timesheetGeneratedSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  test("negative hours fails validation", () => {
    const badEntries = [...validData.entries];
    badEntries[0] = { ...badEntries[0], regularHours: -1 };
    const bad = { ...validData, entries: badEntries };
    const result = timesheetGeneratedSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  test("hours exceeding 24 per day fails", () => {
    const badEntries = [...validData.entries];
    badEntries[0] = { ...badEntries[0], regularHours: 25 };
    const bad = { ...validData, entries: badEntries };
    const result = timesheetGeneratedSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  describe("parseJsonFromAI", () => {
    test("parses JSON from markdown code block", () => {
      const text = '```json\n{"key": "value"}\n```';
      expect(parseJsonFromAI(text)).toEqual({ key: "value" });
    });

    test("parses raw JSON", () => {
      const text = '{"key": "value"}';
      expect(parseJsonFromAI(text)).toEqual({ key: "value" });
    });

    test("returns null for non-JSON text", () => {
      expect(parseJsonFromAI("This is just text with no JSON.")).toBeNull();
    });

    test("returns null for malformed JSON", () => {
      expect(parseJsonFromAI("```json\n{bad json}\n```")).toBeNull();
    });
  });
});
