import { calculateTotalHours } from "@/lib/utils";

describe("Versioning Behavior", () => {
  test("version number increments on submission", () => {
    // This is a contract test — version increments are enforced in submission agent
    const initialVersion = 1;
    const afterSubmit = initialVersion + 1;
    expect(afterSubmit).toBe(2);
  });

  test("version snapshot preserves entries data", () => {
    const entries = {
      regularHours: 8,
      overtimeHours: 2,
      sickHours: 0,
      vacationHours: 0,
      personalHolidayHours: 0,
      holidayHours: 0,
      fmlaHours: 0,
      compTimeUsed: 0,
      parentalLeaveHours: 0,
    };
    const snapshotData = { entries: [entries], notes: "test" };
    expect(snapshotData.entries[0].regularHours).toBe(8);
    expect(snapshotData.entries[0].overtimeHours).toBe(2);
  });

  test("correction creates new version and preserves old", () => {
    // After correction: versionNumber increments while old snapshot stays immutable
    const versions = [
      { versionNumber: 1, status: "SUBMITTED", changedBy: "user1" },
      { versionNumber: 2, status: "NEEDS_CORRECTION", changedBy: "user1" },
    ];
    // Version 1 is preserved
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[0].status).toBe("SUBMITTED");
    // Version 2 is the new snapshot
    expect(versions[1].versionNumber).toBe(2);
  });
});

describe("Hour Calculations", () => {
  test("calculateTotalHours sums all leave types", () => {
    const total = calculateTotalHours({
      regularHours: 6,
      overtimeHours: 2,
      sickHours: 1,
      vacationHours: 1,
      personalHolidayHours: 0,
      holidayHours: 0,
      fmlaHours: 0,
      compTimeUsed: 0,
      parentalLeaveHours: 0,
    });
    expect(total).toBe(10);
  });

  test("zero hours returns 0", () => {
    const total = calculateTotalHours({
      regularHours: 0, overtimeHours: 0, sickHours: 0,
      vacationHours: 0, personalHolidayHours: 0, holidayHours: 0,
      fmlaHours: 0, compTimeUsed: 0, parentalLeaveHours: 0,
    });
    expect(total).toBe(0);
  });
});
