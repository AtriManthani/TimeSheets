import { prisma } from "@/lib/prisma";
import { canViewOrgWideData } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function getAuditLogs(
  requestingRole: UserRole,
  filters?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    limit?: number;
  }
) {
  if (!canViewOrgWideData(requestingRole)) throw new Error("FORBIDDEN");

  return prisma.auditLog.findMany({
    where: {
      ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      ...(filters?.entityId ? { entityId: filters.entityId } : {}),
      ...(filters?.actorId ? { actorId: filters.actorId } : {}),
    },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 100,
  });
}

export async function getEntityAuditTrail(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}
