export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callPowerAutomate } from "@/lib/powerautomate";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { signatureData } = await req.json();
  if (!signatureData) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: params.id },
    include: {
      entries: { orderBy: { date: "asc" } },
      user: { include: { profile: true } },
    },
  });

  if (!timesheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (timesheet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["GENERATED", "SIGNED"].includes(timesheet.status)) {
    return NextResponse.json(
      { error: `Cannot submit a timesheet with status: ${timesheet.status}` },
      { status: 400 }
    );
  }

  if (!timesheet.user.profile) {
    return NextResponse.json({ error: "Profile must be complete before submitting" }, { status: 400 });
  }

  const submittedAt = new Date();

  await prisma.timesheet.update({
    where: { id: params.id },
    data: { signatureData, status: "SUBMITTED", submittedAt },
  });

  try {
    await callPowerAutomate(
      { ...timesheet, signatureData, submittedAt },
      { username: session.user.username },
      timesheet.user.profile
    );
  } catch (err) {
    console.error("[submit] Power Automate webhook failed:", err);
    // Don't fail the submission — webhook failure is non-blocking
  }

  return NextResponse.json({ success: true });
}
