import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTimesheetVersions } from "@/services/timesheet.service";
import { getTimesheetById } from "@/services/timesheet.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Access check via existing service (throws FORBIDDEN if not allowed)
    await getTimesheetById(params.id, session.user.id, session.user.role);
    const versions = await getTimesheetVersions(params.id);
    return NextResponse.json(versions);
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
