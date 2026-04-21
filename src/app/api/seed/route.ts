import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// One-time seed endpoint — protected by SEED_SECRET env var
// After seeding, remove this file or disable SEED_SECRET
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

  await prisma.userProfile.createMany({
    data: [
      { userId: emp1.id, employeeId: "EMP001", department: "IT", jobTitle: "Software Engineer", weeklyHours: 40, managerId: mgr.id, isComplete: true },
      { userId: emp2.id, employeeId: "EMP002", department: "IT", jobTitle: "Systems Analyst", weeklyHours: 40, managerId: mgr.id, isComplete: true },
      { userId: mgr.id, employeeId: "MGR001", department: "IT", jobTitle: "IT Manager", weeklyHours: 40, isComplete: true },
      { userId: gwen.id, employeeId: "GWN001", department: "Administration", jobTitle: "Administrative Coordinator", weeklyHours: 40, isComplete: true },
      { userId: dir.id, employeeId: "DIR001", department: "Executive", jobTitle: "Director of IT", weeklyHours: 40, isComplete: true },
      { userId: comm.id, employeeId: "COM001", department: "Executive", jobTitle: "Commissioner", weeklyHours: 40, isComplete: true },
      { userId: hr.id, employeeId: "HR001", department: "Human Resources", jobTitle: "HR Lead", weeklyHours: 40, isComplete: true },
      { userId: cito.id, employeeId: "CIT001", department: "Executive", jobTitle: "Chief Information Technology Officer", weeklyHours: 40, isComplete: true },
      { userId: admin.id, employeeId: "ADM001", department: "IT", jobTitle: "System Administrator", weeklyHours: 40, isComplete: true },
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
