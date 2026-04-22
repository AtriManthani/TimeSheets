import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import twilio from "twilio";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "");
}

function getTwilio() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function createOtp(userId: string, channel: "email" | "sms"): Promise<string> {
  // Invalidate any prior unused OTPs for this user/type
  await prisma.otpCode.updateMany({
    where: { userId, type: "REGISTER", usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateCode();
  const hash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpCode.create({
    data: { userId, code: hash, type: "REGISTER", channel, expiresAt },
  });

  return code;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: "Timeflux <noreply@timeflux.app>",
    to: email,
    subject: "Your Timeflux verification code",
    html: `
      <div style="font-family:sans-serif;max-width:400px">
        <h2>Verify your account</h2>
        <p>Your 4-digit verification code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.5rem;padding:1rem;background:#f3f4f6;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#6b7280;font-size:0.875rem">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const client = getTwilio();
  await client.messages.create({
    body: `Your Timeflux verification code is: ${code}. Expires in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}

export async function verifyOtp(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId,
      type: "REGISTER",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { success: false, error: "No valid OTP found. Please request a new code." };
  }

  const match = await bcrypt.compare(code, otpRecord.code);
  if (!match) {
    return { success: false, error: "Invalid verification code." };
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}
