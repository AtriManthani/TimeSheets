import { prisma } from "@/lib/prisma";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: { profile: true },
  });
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  return !existing;
}

export async function updateProfile(userId: string, data: {
  firstName: string;
  lastName: string;
  designation: string;
  managerFirstName: string;
  managerLastName: string;
  managerEmail: string;
  managerRole: string;
  hrLeadEmail: string;
  department: string;
  specificDepartment: string;
}) {
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data, isComplete: true },
    update: { ...data, isComplete: true },
  });
}
