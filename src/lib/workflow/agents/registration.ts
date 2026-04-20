import { prisma } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit";
import { sendNotification, notifyRegistrationComplete } from "./notification";
import type { RegistrationState } from "../state";

export async function registrationAgentNode(
  state: RegistrationState
): Promise<Partial<RegistrationState>> {
  const { userId, managerId, profileData } = state;

  // Upsert profile
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      ...profileData,
      startDate: profileData.startDate ? new Date(profileData.startDate) : undefined,
      isComplete: isProfileComplete(profileData),
      updatedBy: userId,
    },
    create: {
      userId,
      ...profileData,
      startDate: profileData.startDate ? new Date(profileData.startDate) : undefined,
      isComplete: isProfileComplete(profileData),
      createdBy: userId,
    },
  });

  // Set manager relationship if provided
  if (managerId) {
    await prisma.managerRelationship.upsert({
      where: { employeeId: userId },
      update: { managerId, isActive: true },
      create: { employeeId: userId, managerId },
    });
  }

  await logAudit({
    actorId: userId,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    entityType: "User",
    entityId: userId,
    metadata: { department: profileData.department },
  });

  return {};
}

export async function profileValidationAgentNode(
  state: RegistrationState
): Promise<Partial<RegistrationState>> {
  const { userId, profileData, managerId } = state;
  const errors: string[] = [];

  if (!profileData.title) errors.push("Job title is required");
  if (!profileData.department) errors.push("Department is required");
  if (!managerId) errors.push("Reporting manager is required");

  const isValid = errors.length === 0;

  if (isValid) {
    await prisma.userProfile.update({
      where: { userId },
      data: { isComplete: true },
    });

    await sendNotification(notifyRegistrationComplete(userId));
  }

  return { isValid, errors };
}

function isProfileComplete(profileData: RegistrationState["profileData"]): boolean {
  return !!(profileData.title && profileData.department);
}
