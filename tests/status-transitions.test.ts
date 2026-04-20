import { isValidTransition, VALID_TRANSITIONS } from "@/lib/constants";
import { TimesheetStatus } from "@prisma/client";

describe("Timesheet Status Transitions", () => {
  describe("isValidTransition", () => {
    test("DRAFT → IN_INTERVIEW is valid", () => {
      expect(isValidTransition("DRAFT", "IN_INTERVIEW")).toBe(true);
    });

    test("DRAFT → SUBMITTED is invalid", () => {
      expect(isValidTransition("DRAFT", "SUBMITTED")).toBe(false);
    });

    test("GENERATED → SUBMITTED is valid", () => {
      expect(isValidTransition("GENERATED", "SUBMITTED")).toBe(true);
    });

    test("SUBMITTED → UNDER_REVIEW is valid", () => {
      expect(isValidTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    });

    test("UNDER_REVIEW → MANAGER_APPROVED is valid", () => {
      expect(isValidTransition("UNDER_REVIEW", "MANAGER_APPROVED")).toBe(true);
    });

    test("UNDER_REVIEW → NEEDS_CORRECTION is valid", () => {
      expect(isValidTransition("UNDER_REVIEW", "NEEDS_CORRECTION")).toBe(true);
    });

    test("NEEDS_CORRECTION → RESUBMITTED is valid", () => {
      expect(isValidTransition("NEEDS_CORRECTION", "RESUBMITTED")).toBe(true);
    });

    test("MANAGER_APPROVED → APPROVED is valid", () => {
      expect(isValidTransition("MANAGER_APPROVED", "APPROVED")).toBe(true);
    });

    test("APPROVED → FINALIZED is valid", () => {
      expect(isValidTransition("APPROVED", "FINALIZED")).toBe(true);
    });

    test("FINALIZED → any is invalid", () => {
      const statuses = Object.keys(VALID_TRANSITIONS) as TimesheetStatus[];
      statuses.forEach((s) => {
        expect(isValidTransition("FINALIZED", s)).toBe(false);
      });
    });

    test("REJECTED → any is invalid", () => {
      const statuses = Object.keys(VALID_TRANSITIONS) as TimesheetStatus[];
      statuses.forEach((s) => {
        expect(isValidTransition("REJECTED", s)).toBe(false);
      });
    });

    test("APPROVED → DRAFT is invalid (no backward movement)", () => {
      expect(isValidTransition("APPROVED", "DRAFT")).toBe(false);
    });
  });
});
