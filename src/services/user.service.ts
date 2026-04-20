import { prisma } from "@/lib/prisma";
import { canViewOrgWideData } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true, managerOf: { include: { manager: true } } },
  });
}

export async function getUserWithRelations(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      profile: true,
      managerOf: {
        include: { manager: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role ?? UserRole.EMPLOYEE,
    },
  });
}

// Server-side enforced: org-wide data only visible to executives/admin
export async function listUsers(requestingUserRole: UserRole) {
  if (!canViewOrgWideData(requestingUserRole)) {
    throw new Error("FORBIDDEN");
  }
  return prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      profile: true,
      managerOf: { include: { manager: { select: { id: true, name: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDirectReports(managerId: string) {
  return prisma.user.findMany({
    where: {
      managerOf: { managerId, isActive: true },
    },
    include: { profile: true },
  });
}

export async function getManagersForSelect() {
  return prisma.user.findMany({
    where: {
      role: { in: [UserRole.MANAGER, UserRole.DIRECTOR, UserRole.CITO] },
      isActive: true,
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function getGwenUser() {
  return prisma.user.findFirst({
    where: { role: UserRole.GWEN, isActive: true },
    select: { id: true, name: true, email: true },
  });
}
