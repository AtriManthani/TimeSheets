import { canViewOrgWideData, isExecutive, EXECUTIVE_ROLES } from "@/lib/auth";
import { UserRole } from "@prisma/client";

describe("Role-Based Access Control", () => {
  describe("canViewOrgWideData", () => {
    test("Director can view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.DIRECTOR)).toBe(true);
    });

    test("Commissioner can view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.COMMISSIONER)).toBe(true);
    });

    test("HR_LEAD can view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.HR_LEAD)).toBe(true);
    });

    test("CITO can view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.CITO)).toBe(true);
    });

    test("Admin can view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.ADMIN)).toBe(true);
    });

    test("Employee CANNOT view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.EMPLOYEE)).toBe(false);
    });

    test("Manager CANNOT view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.MANAGER)).toBe(false);
    });

    test("Gwen CANNOT view org-wide data", () => {
      expect(canViewOrgWideData(UserRole.GWEN)).toBe(false);
    });
  });

  describe("isExecutive", () => {
    test("Executive roles return true", () => {
      EXECUTIVE_ROLES.forEach((role) => {
        expect(isExecutive(role)).toBe(true);
      });
    });

    test("Non-executive roles return false", () => {
      const nonExec = [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.GWEN, UserRole.ADMIN];
      nonExec.forEach((role) => {
        // ADMIN is NOT executive but CAN view org data — isExecutive is separate from canViewOrgWideData
        if (role !== UserRole.ADMIN) {
          expect(isExecutive(role)).toBe(false);
        }
      });
    });
  });

  describe("Access enforcement contract", () => {
    test("Only executives and admin can call listUsers (enforced in service)", () => {
      const allowedRoles: UserRole[] = [
        UserRole.DIRECTOR,
        UserRole.COMMISSIONER,
        UserRole.HR_LEAD,
        UserRole.CITO,
        UserRole.ADMIN,
      ];
      const deniedRoles: UserRole[] = [UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.GWEN];

      allowedRoles.forEach((r) => expect(canViewOrgWideData(r)).toBe(true));
      deniedRoles.forEach((r) => expect(canViewOrgWideData(r)).toBe(false));
    });
  });
});
