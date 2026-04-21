export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getManagersForSelect } from "@/services/user.service";

export async function GET() {
  const managers = await getManagersForSelect();
  return NextResponse.json(managers);
}
