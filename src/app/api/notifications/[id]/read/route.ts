import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { markNotificationRead } from "@/services/notification.service";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await markNotificationRead(params.id, session.user.id);
  return NextResponse.json({ success: true });
}
