import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTimesheetSchema } from "@/lib/validation/schemas";
import { createTimesheet, getTimesheetsForUser } from "@/services/timesheet.service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timesheets = await getTimesheetsForUser(session.user.id);
  return NextResponse.json(timesheets);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createTimesheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createTimesheet(
      session.user.id,
      new Date(parsed.data.weekStartDate),
      new Date(parsed.data.weekEndDate)
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err.message === "DUPLICATE_TIMESHEET") {
      return NextResponse.json({ error: "A timesheet for this week already exists" }, { status: 409 });
    }
    console.error("[timesheets POST]", err);
    return NextResponse.json({ error: "Failed to create timesheet" }, { status: 500 });
  }
}
