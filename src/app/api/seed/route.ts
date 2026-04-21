export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// One-time seed endpoint — protected by SEED_SECRET env var
export async function POST(req: Request) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.count();
  if (existing > 0) {
    return NextResponse.json({ message: "Already seeded", count: existing });
  }

  const hash = (p: string) => bcrypt.hash(p, 12);

  const [emp1, emp2, mgr, gwen, dir, comm, hr, cito, admin] = await Promise.all([
    prisma.user.create({ data: { email: "employee1@its.org", name: "Alice Johnson", passwordHash: await hash("Employee@123"), role: "EMPLOYEE" } }),
    prisma.user.create({ data: { email: "employee2@its.org", name: "Bob Williams", passwordHash: await hash("Employee@123"), role: "EMPLOYEE" } }),
    prisma.user.create({ data: { email: "manager1@its.org", name: "Carol Davis", passwordHash: await hash("Manager@123"), role: "MANAGER" } }),
    prisma.user.create({ data: { email: "gwen@its.org", name: "Gwen Thompson", passwordHash: await hash("Gwen@123"), role: "GWEN" } }),
    prisma.user.create({ data: { email: "director1@its.org", name: "David Martinez", passwordHash: await hash("Director@123"), role: "DIRECTOR" } }),
    prisma.user.create({ data: { email: "commissioner1@its.org", name: "Emma Wilson", passwordHash: await hash("Commissioner@123"), role: "COMMISSIONER" } }),
    prisma.user.create({ data: { email: "hrlead1@its.org", name: "Frank Brown", passwordHash: await hash("HRLead@123"), role: "HR_LEAD" } }),
    prisma.user.create({ data: { email: "cito1@its.org", name: "Grace Lee", passwordHash: await hash("CITO@123"), role: "CITO" } }),
    prisma.user.create({ data: { email: "admin1@its.org", name: "Henry Taylor", passwordHash: await hash("Admin@123"), role: "ADMIN" } }),
  ]);

  // Create profiles (matching actual schema fields)
  await Promise.all([
    prisma.userProfile.create({ data: { userId: emp1.id, employeeNumber: "EMP001", title: "Software Engineer", department: "IT", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: emp2.id, employeeNumber: "EMP002", title: "Systems Analyst", department: "IT", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: mgr.id, employeeNumber: "MGR001", title: "IT Manager", department: "IT", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: gwen.id, employeeNumber: "GWN001", title: "Administrative Coordinator", department: "Administration", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: dir.id, employeeNumber: "DIR001", title: "Director of IT", department: "Executive", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: comm.id, employeeNumber: "COM001", title: "Commissioner", department: "Executive", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: hr.id, employeeNumber: "HR001", title: "HR Lead", department: "Human Resources", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: cito.id, employeeNumber: "CIT001", title: "Chief Information Technology Officer", department: "Executive", scheduleHours: 40, isComplete: true } }),
    prisma.userProfile.create({ data: { userId: admin.id, employeeNumber: "ADM001", title: "System Administrator", department: "IT", scheduleHours: 40, isComplete: true } }),
  ]);

  // Manager relationships
  await prisma.managerRelationship.createMany({
    data: [
      { employeeId: emp1.id, managerId: mgr.id },
      { employeeId: emp2.id, managerId: mgr.id },
    ],
  });

  await prisma.workCategory.createMany({
    data: [
      { code: "REG", name: "Regular Hours", description: "Standard working hours" },
      { code: "OT", name: "Overtime", description: "Hours beyond regular schedule" },
      { code: "VAC", name: "Vacation Leave", description: "Annual vacation leave" },
      { code: "SICK", name: "Sick Leave", description: "Medical/sick leave" },
      { code: "HOL", name: "Public Holiday", description: "Official public holidays" },
    ],
  });

  return NextResponse.json({
    message: "Seeded successfully",
    users: [emp1.email, emp2.email, mgr.email, gwen.email, dir.email, comm.email, hr.email, cito.email, admin.email],
  });
}
