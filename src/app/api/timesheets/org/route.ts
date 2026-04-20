import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewOrgWideData } from "@/lib/auth";
import { getOrgTimesheets } from "@/services/timesheet.service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canViewOrgWideData(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const timesheets = await getOrgTimesheets();
  return NextResponse.json(timesheets);
}
