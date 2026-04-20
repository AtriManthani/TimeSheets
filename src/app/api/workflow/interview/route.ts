import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { interviewMessageSchema } from "@/lib/validation/schemas";
import { runInterviewTurn } from "@/lib/workflow";
import { prisma } from "@/lib/prisma";
import { safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = interviewMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { timesheetId, message } = parsed.data;

  // Verify ownership
  const timesheet = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!timesheet) return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  if (timesheet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!["IN_INTERVIEW", "DRAFT"].includes(timesheet.status)) {
    return NextResponse.json(
      { error: "Timesheet is not in interview mode" },
      { status: 400 }
    );
  }

  const interviewSession = await prisma.timesheetInterviewSession.findUnique({
    where: { timesheetId },
  });
  if (!interviewSession) {
    return NextResponse.json({ error: "Interview session not found" }, { status: 404 });
  }

  const messages = safeJson<Array<{ role: "user" | "assistant"; content: string }>>(
    interviewSession.messages,
    []
  );

  const result = await runInterviewTurn({
    timesheetId,
    userId: session.user.id,
    sessionId: interviewSession.id,
    messages,
    currentStep: interviewSession.currentStep,
    collectedData: safeJson<Record<string, unknown>>(interviewSession.collectedData, {}),
    userMessage: message,
    aiResponse: "",
    isComplete: false,
    errors: [],
  });

  return NextResponse.json({
    response: result.aiResponse,
    isComplete: result.isComplete,
    currentStep: result.currentStep,
    errors: result.errors,
  });
}

// GET — load existing session
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timesheetId = searchParams.get("timesheetId");
  if (!timesheetId) return NextResponse.json({ error: "timesheetId required" }, { status: 400 });

  const timesheet = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!timesheet || timesheet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interviewSession = await prisma.timesheetInterviewSession.findUnique({
    where: { timesheetId },
  });

  return NextResponse.json({
    session: interviewSession,
    messages: safeJson<Array<{ role: "user" | "assistant"; content: string }>>(
      interviewSession?.messages,
      []
    ),
    isComplete: interviewSession?.isComplete ?? false,
  });
}
