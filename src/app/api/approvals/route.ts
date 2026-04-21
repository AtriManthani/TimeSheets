export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPendingTasksForUser } from "@/services/approval.service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await getPendingTasksForUser(session.user.id, session.user.role);
  return NextResponse.json(tasks);
}
