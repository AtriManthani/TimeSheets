export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createOtp, sendOtpEmail, sendOtpSms } from "@/services/otp.service";

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username may only contain lowercase letters, numbers, and underscores"),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^\+1\d{10}$/, "Phone must be a US number in E.164 format (+1XXXXXXXXXX)")
    .optional()
    .or(z.literal("")),
  otpChannel: z.enum(["email", "sms"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { username, password, email, phone, otpChannel } = parsed.data;

    if (otpChannel === "email" && !email) {
      return NextResponse.json({ error: "Email is required for email OTP" }, { status: 400 });
    }
    if (otpChannel === "sms" && !phone) {
      return NextResponse.json({ error: "Phone is required for SMS OTP" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          ...(email ? [{ email: email.toLowerCase() }] : []),
        ],
      },
    });

    if (existing) {
      const field = existing.username === username.toLowerCase() ? "username" : "email";
      return NextResponse.json({ error: `That ${field} is already taken` }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        passwordHash,
        isActive: false, // activated after OTP verification
      },
    });

    const code = await createOtp(user.id, otpChannel);

    if (otpChannel === "email") {
      await sendOtpEmail(email!, code);
    } else {
      await sendOtpSms(phone!, code);
    }

    return NextResponse.json({ success: true, userId: user.id, otpChannel });
  } catch (err: any) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
