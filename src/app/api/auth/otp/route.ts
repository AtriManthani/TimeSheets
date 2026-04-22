export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/services/otp.service";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "userId and code are required" }, { status: 400 });
    }

    const result = await verifyOtp(userId, String(code).trim());
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Activate the user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[otp-verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
