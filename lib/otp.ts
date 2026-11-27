import crypto from "node:crypto";

export const ORDER_OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const ORDER_OTP_MAX_ATTEMPTS = 5;

function getOtpSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXTAUTH_SECRET must be configured in production for OTP signing."
    );
  }

  return "nakibo-order-otp-dev-secret";
}

export function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtpCode(
  normalizedPhone: string,
  email: string,
  code: string
): string {
  const payload = `${normalizedPhone.trim()}:${email.trim().toLowerCase()}:${code.trim()}`;
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(payload)
    .digest("hex");
}

export function verifyOtpHash(
  normalizedPhone: string,
  email: string,
  code: string,
  expectedHash: string
): boolean {
  if (!/^\d{6}$/.test(code.trim()) || !expectedHash) {
    return false;
  }

  const candidate = hashOtpCode(normalizedPhone, email, code);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(expectedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}
