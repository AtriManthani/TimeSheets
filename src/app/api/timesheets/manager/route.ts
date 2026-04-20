import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTimesheetsForManager } from "@/services/timesheet.service";
import { UserRole } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== UserRole.MANAGER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const timesheets = await getTimesheetsForManager(session.user.id);
  return NextResponse.json(timesheets);
}
