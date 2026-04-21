-- Timeflux database migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/zbrfcdpxprcxzntmtgqq/sql/new

-- Enums
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE','MANAGER','GWEN','DIRECTOR','COMMISSIONER','HR_LEAD','CITO','ADMIN');
CREATE TYPE "TimesheetStatus" AS ENUM ('DRAFT','IN_INTERVIEW','GENERATED','SUBMITTED','UNDER_REVIEW','NEEDS_CORRECTION','RESUBMITTED','MANAGER_APPROVED','APPROVED','REJECTED','FINALIZED');
CREATE TYPE "ApprovalDecisionType" AS ENUM ('APPROVED','REJECTED','NEEDS_CORRECTION');
CREATE TYPE "NotificationType" AS ENUM ('REGISTRATION_COMPLETE','PROFILE_INCOMPLETE','TIMESHEET_DRAFT_GENERATED','TIMESHEET_SUBMITTED','CORRECTION_REQUESTED','TIMESHEET_APPROVED','TIMESHEET_REJECTED','GWEN_APPROVED','MANAGER_APPROVED','APPROVAL_TASK_ASSIGNED','RESUBMISSION_RECEIVED','GENERAL');

-- NextAuth tables
CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

-- User
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "employeeNumber" TEXT,
  "title" TEXT,
  "department" TEXT,
  "phone" TEXT,
  "startDate" TIMESTAMP(3),
  "scheduleHours" DOUBLE PRECISION NOT NULL DEFAULT 40,
  "isComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ManagerRelationship" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "managerId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManagerRelationship_pkey" PRIMARY KEY ("id")
);

-- Reference data
CREATE TABLE "WorkCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "year" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- Timesheets
CREATE TABLE "Timesheet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekStartDate" DATE NOT NULL,
  "weekEndDate" DATE NOT NULL,
  "status" "TimesheetStatus" NOT NULL DEFAULT 'DRAFT',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "managerApprovedAt" TIMESTAMP(3),
  "gwenApprovedAt" TIMESTAMP(3),
  "finalizedAt" TIMESTAMP(3),
  "correctionComments" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  "updatedBy" TEXT,
  CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimesheetEntry" (
  "id" TEXT NOT NULL,
  "timesheetId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  "regularHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sickHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vacationHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "personalHolidayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "holidayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fmlaHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "compTimeEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "compTimeUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "parentalLeaveHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "preParlLeaveHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "categoryId" TEXT,
  "otReason" TEXT,
  "notes" TEXT,
  "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimesheetEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimesheetVersion" (
  "id" TEXT NOT NULL,
  "timesheetId" TEXT NOT NULL,
  "versionNumber" INTEGER NOT NULL,
  "status" "TimesheetStatus" NOT NULL,
  "snapshotData" JSONB NOT NULL,
  "changedBy" TEXT NOT NULL,
  "changeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimesheetVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TimesheetInterviewSession" (
  "id" TEXT NOT NULL,
  "timesheetId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "messages" JSONB NOT NULL DEFAULT '[]',
  "currentStep" TEXT NOT NULL DEFAULT 'WEEK_DATES',
  "collectedData" JSONB NOT NULL DEFAULT '{}',
  "isComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TimesheetInterviewSession_pkey" PRIMARY KEY ("id")
);

-- Approval
CREATE TABLE "ApprovalTask" (
  "id" TEXT NOT NULL,
  "timesheetId" TEXT NOT NULL,
  "assignedTo" TEXT NOT NULL,
  "assignedRole" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalDecision" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "decision" "ApprovalDecisionType" NOT NULL,
  "comments" TEXT,
  "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- Notification & Audit
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorEmail" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider","providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier","token");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "UserProfile_employeeNumber_key" ON "UserProfile"("employeeNumber");
CREATE UNIQUE INDEX "ManagerRelationship_employeeId_key" ON "ManagerRelationship"("employeeId");
CREATE UNIQUE INDEX "WorkCategory_name_key" ON "WorkCategory"("name");
CREATE UNIQUE INDEX "WorkCategory_code_key" ON "WorkCategory"("code");
CREATE UNIQUE INDEX "Timesheet_userId_weekStartDate_key" ON "Timesheet"("userId","weekStartDate");
CREATE UNIQUE INDEX "TimesheetInterviewSession_timesheetId_key" ON "TimesheetInterviewSession"("timesheetId");

-- Prisma migrations table
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "ManagerRelationship" ADD CONSTRAINT "ManagerRelationship_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id");
ALTER TABLE "ManagerRelationship" ADD CONSTRAINT "ManagerRelationship_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id");
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id");
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE;
ALTER TABLE "TimesheetEntry" ADD CONSTRAINT "TimesheetEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WorkCategory"("id");
ALTER TABLE "TimesheetVersion" ADD CONSTRAINT "TimesheetVersion_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE;
ALTER TABLE "TimesheetInterviewSession" ADD CONSTRAINT "TimesheetInterviewSession_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id") ON DELETE CASCADE;
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet"("id");
ALTER TABLE "ApprovalTask" ADD CONSTRAINT "ApprovalTask_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id");
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ApprovalTask"("id");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id");
