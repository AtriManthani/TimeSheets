import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // ─── Work Categories ─────────────────────────────────────────────────
  await Promise.all([
    prisma.workCategory.upsert({ where: { code: "REG" }, update: {}, create: { name: "Regular Work", code: "REG", description: "Standard day-to-day work" } }),
    prisma.workCategory.upsert({ where: { code: "PRJ" }, update: {}, create: { name: "Project Work", code: "PRJ", description: "Specific project tasks" } }),
    prisma.workCategory.upsert({ where: { code: "TRAIN" }, update: {}, create: { name: "Training", code: "TRAIN", description: "Professional development" } }),
    prisma.workCategory.upsert({ where: { code: "MEET" }, update: {}, create: { name: "Meetings", code: "MEET", description: "Internal and external meetings" } }),
    prisma.workCategory.upsert({ where: { code: "ADMIN" }, update: {}, create: { name: "Administrative", code: "ADMIN", description: "Administrative tasks" } }),
  ]);

  // ─── Holidays ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.holiday.upsert({ where: { id: "holiday-mlk-2025" }, update: {}, create: { id: "holiday-mlk-2025", name: "Martin Luther King Jr. Day", date: new Date("2025-01-20"), year: 2025 } }),
    prisma.holiday.upsert({ where: { id: "holiday-pres-2025" }, update: {}, create: { id: "holiday-pres-2025", name: "Presidents' Day", date: new Date("2025-02-17"), year: 2025 } }),
    prisma.holiday.upsert({ where: { id: "holiday-mem-2025" }, update: {}, create: { id: "holiday-mem-2025", name: "Memorial Day", date: new Date("2025-05-26"), year: 2025 } }),
  ]);

  // ─── Users ────────────────────────────────────────────────────────────
  const upsertUser = async (
    email: string,
    name: string,
    password: string,
    role: UserRole,
    empNum: string,
    title: string,
    dept: string
  ) => {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash: hash(password),
        role,
        profile: {
          create: { employeeNumber: empNum, title, department: dept, scheduleHours: 40, isComplete: true },
        },
      },
    });
  };

  await upsertUser("director1@its.org", "Director One", "Director@123", UserRole.DIRECTOR, "EMP001", "Director of IT", "Information Technology");
  await upsertUser("commissioner1@its.org", "Commissioner One", "Commissioner@123", UserRole.COMMISSIONER, "EMP002", "IT Commissioner", "Information Technology");
  await upsertUser("hrlead1@its.org", "HR Lead One", "HRLead@123", UserRole.HR_LEAD, "EMP003", "HR Lead", "Human Resources");
  await upsertUser("cito1@its.org", "CITO One", "CITO@123", UserRole.CITO, "EMP004", "Chief Information Technology Officer", "Information Technology");
  await upsertUser("gwen@its.org", "Gwen Thompson", "Gwen@123", UserRole.GWEN, "EMP005", "Operations Lead", "Operations");
  const manager1 = await upsertUser("manager1@its.org", "Manager One", "Manager@123", UserRole.MANAGER, "EMP006", "IT Manager", "Information Technology");
  const employee1 = await upsertUser("employee1@its.org", "Employee One", "Employee@123", UserRole.EMPLOYEE, "EMP007", "Systems Analyst", "Information Technology");
  const employee2 = await upsertUser("employee2@its.org", "Employee Two", "Employee@123", UserRole.EMPLOYEE, "EMP008", "Network Technician", "Information Technology");
  await upsertUser("admin1@its.org", "Admin One", "Admin@123", UserRole.ADMIN, "EMP009", "System Administrator", "Information Technology");

  // ─── Manager Relationships ────────────────────────────────────────────
  await prisma.managerRelationship.upsert({
    where: { employeeId: employee1.id },
    update: {},
    create: { employeeId: employee1.id, managerId: manager1.id },
  });
  await prisma.managerRelationship.upsert({
    where: { employeeId: employee2.id },
    update: {},
    create: { employeeId: employee2.id, managerId: manager1.id },
  });

  // ─── Welcome Notifications ────────────────────────────────────────────
  for (const user of [employee1, employee2, manager1]) {
    const exists = await prisma.notification.findFirst({ where: { userId: user.id, type: "REGISTRATION_COMPLETE" } });
    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "REGISTRATION_COMPLETE",
          title: "Welcome to Timeflux",
          message: "Your account is set up. You can now start submitting timesheets.",
          relatedEntityType: "User",
          relatedEntityId: user.id,
        },
      });
    }
  }

  console.log("✅ Seed complete.\n");
  console.log("📋 Demo Accounts:");
  console.log("──────────────────────────────────────────────────────");
  console.log("Role          | Email                    | Password");
  console.log("──────────────────────────────────────────────────────");
  console.log("Employee      | employee1@its.org        | Employee@123");
  console.log("Employee      | employee2@its.org        | Employee@123");
  console.log("Manager       | manager1@its.org         | Manager@123");
  console.log("Gwen          | gwen@its.org             | Gwen@123");
  console.log("Director      | director1@its.org        | Director@123");
  console.log("Commissioner  | commissioner1@its.org    | Commissioner@123");
  console.log("HR Lead       | hrlead1@its.org          | HRLead@123");
  console.log("CITO          | cito1@its.org            | CITO@123");
  console.log("Admin         | admin1@its.org           | Admin@123");
  console.log("──────────────────────────────────────────────────────");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
