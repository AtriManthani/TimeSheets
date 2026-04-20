import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function getPendingTasksForUser(userId: string, role: UserRole) {
  return prisma.approvalTask.findMany({
    where: {
      assignedTo: userId,
      status: "PENDING",
    },
    include: {
      timesheet: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          entries: true,
        },
      },
      decisions: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTaskById(taskId: string) {
  return prisma.approvalTask.findUnique({
    where: { id: taskId },
    include: {
      timesheet: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          entries: { orderBy: { date: "asc" } },
          versions: { orderBy: { versionNumber: "desc" } },
        },
      },
      decisions: { include: { task: true } },
    },
  });
}
