import { prisma } from "@/lib/prisma";

export async function getTimesheetById(id: string, requestingUserId: string) {
  const timesheet = await prisma.timesheet.findUnique({
    where: { id },
    include: {
      entries: { orderBy: { date: "asc" } },
      session: true,
      user: { include: { profile: true } },
    },
  });

  if (!timesheet) return null;
  if (timesheet.userId !== requestingUserId) throw new Error("FORBIDDEN");

  return timesheet;
}

export async function getTimesheetsForUser(
  userId: string,
  filters?: { month?: number; year?: number; from?: Date; to?: Date }
) {
  const where: any = { userId };

  if (filters?.month) where.month = filters.month;
  if (filters?.year) where.year = filters.year;
  if (filters?.from || filters?.to) {
    where.weekStartDate = {};
    if (filters.from) where.weekStartDate.gte = filters.from;
    if (filters.to) where.weekStartDate.lte = filters.to;
  }

  return prisma.timesheet.findMany({
    where,
    include: { entries: true },
    orderBy: { weekStartDate: "desc" },
  });
}

export async function createTimesheet(userId: string, weekStartDate: Date, weekEndDate: Date) {
  const existing = await prisma.timesheet.findUnique({
    where: { userId_weekStartDate: { userId, weekStartDate } },
  });
  if (existing) throw new Error("DUPLICATE_TIMESHEET");

  const month = weekStartDate.getMonth() + 1;
  const year = weekStartDate.getFullYear();

  const timesheet = await prisma.timesheet.create({
    data: { userId, weekStartDate, weekEndDate, month, year, status: "IN_INTERVIEW" },
  });

  await prisma.timesheetInterviewSession.create({
    data: {
      timesheetId: timesheet.id,
      userId,
      messages: [],
      currentStep: "WEEK_DATES",
      collectedData: {},
    },
  });

  return timesheet;
}

export async function getInterviewSession(timesheetId: string) {
  return prisma.timesheetInterviewSession.findUnique({ where: { timesheetId } });
}
