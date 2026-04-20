import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/schemas";
import { createUser } from "@/services/user.service";
import { runRegistrationWorkflow } from "@/lib/workflow";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, title, department, managerId, phone, employeeNumber } =
      parsed.data;

    const user = await createUser({ name, email, password });

    // Run registration workflow (profile + validation + notification + audit)
    const result = await runRegistrationWorkflow({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: UserRole.EMPLOYEE,
      profileData: { title, department, phone, employeeNumber },
      managerId,
      errors: [],
      isValid: false,
      notificationsSent: false,
      auditLogged: false,
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      profileComplete: result.isValid,
      warnings: result.errors,
    });
  } catch (err: any) {
    if (err.message === "EMAIL_TAKEN") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
