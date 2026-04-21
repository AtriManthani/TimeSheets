export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runGenerationWorkflow } from "@/lib/workflow";
import { safeJson } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { timesheetId } = body;
  if (!timesheetId) return NextResponse.json({ error: "timesheetId required" }, { status: 400 });

  const timesheet = await prisma.timesheet.findUnique({ where: { id: timesheetId } });
  if (!timesheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (timesheet.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interviewSession = await prisma.timesheetInterviewSession.findUnique({
    where: { timesheetId },
  });

  if (!interviewSession?.isComplete) {
    return NextResponse.json({ error: "Interview not complete" }, { status: 400 });
  }

  const messages = safeJson<Array<{ role: "user" | "assistant"; content: string }>>(
    interviewSession.messages,
    []
  );

  const result = await runGenerationWorkflow({
    timesheetId,
    userId: session.user.id,
    sessionId: interviewSession.id,
    rawConversation: messages,
    structuredData: null,
    complianceResult: null,
    errors: [],
    generationComplete: false,
  });

  if (!result.generationComplete) {
    return NextResponse.json(
      {
        error: "Generation failed",
        details: result.errors,
        complianceErrors: result.complianceResult?.errors,
        complianceWarnings: result.complianceResult?.warnings,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    success: true,
    warnings: result.complianceResult?.warnings ?? [],
  });
}
