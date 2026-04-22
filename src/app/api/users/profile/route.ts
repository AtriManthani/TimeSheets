export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  designation: z.string().min(1),
  managerFirstName: z.string().min(1),
  managerLastName: z.string().min(1),
  managerEmail: z.string().email(),
  managerRole: z.string().min(1),
  hrLeadEmail: z.string().email(),
  department: z.string().min(1),
  specificDepartment: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data, isComplete: true },
    update: { ...parsed.data, isComplete: true },
  });

  return NextResponse.json({ success: true });
}
