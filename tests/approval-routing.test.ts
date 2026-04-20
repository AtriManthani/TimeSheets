import { isValidTransition } from "@/lib/constants";

describe("Approval Routing Logic", () => {
  test("Sequential approval: manager must approve before Gwen", () => {
    // After submission: SUBMITTED → UNDER_REVIEW
    expect(isValidTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);

    // After manager approval: UNDER_REVIEW → MANAGER_APPROVED
    expect(isValidTransition("UNDER_REVIEW", "MANAGER_APPROVED")).toBe(true);

    // After Gwen approval: MANAGER_APPROVED → APPROVED
    expect(isValidTransition("MANAGER_APPROVED", "APPROVED")).toBe(true);

    // Gwen cannot directly approve from UNDER_REVIEW (wrong sequence)
    // This is enforced at DB level via task.sequence
    expect(isValidTransition("UNDER_REVIEW", "APPROVED")).toBe(false);
  });

  test("Correction from manager sends back to employee", () => {
    expect(isValidTransition("UNDER_REVIEW", "NEEDS_CORRECTION")).toBe(true);
    expect(isValidTransition("NEEDS_CORRECTION", "RESUBMITTED")).toBe(true);
    expect(isValidTransition("RESUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  test("Correction from Gwen (MANAGER_APPROVED stage) sends back to employee", () => {
    expect(isValidTransition("MANAGER_APPROVED", "NEEDS_CORRECTION")).toBe(true);
    expect(isValidTransition("NEEDS_CORRECTION", "RESUBMITTED")).toBe(true);
  });

  test("Rejection is terminal", () => {
    expect(isValidTransition("UNDER_REVIEW", "REJECTED")).toBe(true);
    // No further transitions from REJECTED
    const allStatuses = [
      "DRAFT", "IN_INTERVIEW", "GENERATED", "SUBMITTED", "UNDER_REVIEW",
      "NEEDS_CORRECTION", "RESUBMITTED", "MANAGER_APPROVED", "APPROVED",
      "REJECTED", "FINALIZED",
    ] as const;
    allStatuses.forEach((s) => {
      expect(isValidTransition("REJECTED", s)).toBe(false);
    });
  });

  test("Finalized is terminal", () => {
    const allStatuses = [
      "DRAFT", "IN_INTERVIEW", "GENERATED", "SUBMITTED", "UNDER_REVIEW",
      "NEEDS_CORRECTION", "RESUBMITTED", "MANAGER_APPROVED", "APPROVED",
      "REJECTED", "FINALIZED",
    ] as const;
    allStatuses.forEach((s) => {
      expect(isValidTransition("FINALIZED", s)).toBe(false);
    });
  });
});
