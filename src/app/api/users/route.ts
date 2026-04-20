import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listUsers } from "@/services/user.service";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const users = await listUsers(session.user.role);
    return NextResponse.json(users);
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
