-- Timeflux simplified schema migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/zbrfcdpxprcxzntmtgqq/sql/new

-- Drop old tables (order matters for FK constraints)
DROP TABLE IF EXISTS "TimesheetVersion" CASCADE;
DROP TABLE IF EXISTS "ApprovalDecision" CASCADE;
DROP TABLE IF EXISTS "ApprovalTask" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Holiday" CASCADE;
DROP TABLE IF EXISTS "WorkCategory" CASCADE;
DROP TABLE IF EXISTS "ManagerRelationship" CASCADE;
DROP TABLE IF EXISTS "TimesheetInterviewSession" CASCADE;
DROP TABLE IF EXISTS "TimesheetEntry" CASCADE;
DROP TABLE IF EXISTS "Timesheet" CASCADE;
DROP TABLE IF EXISTS "UserProfile" CASCADE;
DROP TABLE IF EXISTS "OtpCode" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "TimesheetStatus" CASCADE;

-- User
CREATE TABLE "User" (
  "id"           TEXT        NOT NULL PRIMARY KEY,
  "username"     TEXT        NOT NULL UNIQUE,
  "email"        TEXT        UNIQUE,
  "phone"        TEXT,
  "passwordHash" TEXT        NOT NULL,
  "isActive"     BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OtpCode
CREATE TABLE "OtpCode" (
  "id"        TEXT        NOT NULL PRIMARY KEY,
  "userId"    TEXT        NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "code"      TEXT        NOT NULL,
  "type"      TEXT        NOT NULL,
  "channel"   TEXT        NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UserProfile
CREATE TABLE "UserProfile" (
  "id"                 TEXT        NOT NULL PRIMARY KEY,
  "userId"             TEXT        NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "firstName"          TEXT        NOT NULL,
  "lastName"           TEXT        NOT NULL,
  "designation"        TEXT        NOT NULL,
  "managerFirstName"   TEXT        NOT NULL,
  "managerLastName"    TEXT        NOT NULL,
  "managerEmail"       TEXT        NOT NULL,
  "managerRole"        TEXT        NOT NULL,
  "hrLeadEmail"        TEXT        NOT NULL,
  "department"         TEXT        NOT NULL,
  "specificDepartment" TEXT        NOT NULL,
  "isComplete"         BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Timesheet
CREATE TABLE "Timesheet" (
  "id"            TEXT        NOT NULL PRIMARY KEY,
  "userId"        TEXT        NOT NULL REFERENCES "User"("id"),
  "weekStartDate" DATE        NOT NULL,
  "weekEndDate"   DATE        NOT NULL,
  "month"         INTEGER     NOT NULL,
  "year"          INTEGER     NOT NULL,
  "status"        TEXT        NOT NULL DEFAULT 'DRAFT',
  "totalHours"    FLOAT       NOT NULL DEFAULT 0,
  "regularHours"  FLOAT       NOT NULL DEFAULT 0,
  "overtimeHours" FLOAT       NOT NULL DEFAULT 0,
  "notes"         TEXT,
  "signatureData" TEXT,
  "submittedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "weekStartDate")
);

-- TimesheetEntry
CREATE TABLE "TimesheetEntry" (
  "id"                   TEXT        NOT NULL PRIMARY KEY,
  "timesheetId"          TEXT        NOT NULL REFERENCES "Timesheet"("id") ON DELETE CASCADE,
  "date"                 DATE        NOT NULL,
  "dayOfWeek"            TEXT        NOT NULL,
  "regularHours"         FLOAT       NOT NULL DEFAULT 0,
  "overtimeHours"        FLOAT       NOT NULL DEFAULT 0,
  "sickHours"            FLOAT       NOT NULL DEFAULT 0,
  "vacationHours"        FLOAT       NOT NULL DEFAULT 0,
  "personalHolidayHours" FLOAT       NOT NULL DEFAULT 0,
  "holidayHours"         FLOAT       NOT NULL DEFAULT 0,
  "fmlaHours"            FLOAT       NOT NULL DEFAULT 0,
  "compTimeEarned"       FLOAT       NOT NULL DEFAULT 0,
  "compTimeUsed"         FLOAT       NOT NULL DEFAULT 0,
  "parentalLeaveHours"   FLOAT       NOT NULL DEFAULT 0,
  "preParlLeaveHours"    FLOAT       NOT NULL DEFAULT 0,
  "otReason"             TEXT,
  "notes"                TEXT,
  "totalHours"           FLOAT       NOT NULL DEFAULT 0,
  "createdAt"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TimesheetInterviewSession
CREATE TABLE "TimesheetInterviewSession" (
  "id"            TEXT        NOT NULL PRIMARY KEY,
  "timesheetId"   TEXT        NOT NULL UNIQUE REFERENCES "Timesheet"("id") ON DELETE CASCADE,
  "userId"        TEXT        NOT NULL,
  "messages"      JSONB       NOT NULL DEFAULT '[]',
  "currentStep"   TEXT        NOT NULL DEFAULT 'START',
  "collectedData" JSONB       NOT NULL DEFAULT '{}',
  "isComplete"    BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
