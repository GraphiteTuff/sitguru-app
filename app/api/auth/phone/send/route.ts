import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { issuePhoneLoginOtp, normalizeUsPhoneE164 } from "@/lib/auth/phone-otp";

export const runtime = "nodejs";

type SendBody = {
  phone?: string;
  turnstileToken?: string;
  turnstileAction?: string;
  allowCreateUser?: boolean;
  metadata?: Record<string, string>;
};

export async function POST(request: Request) {
  let body: SendBody;

  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const phoneE164 = normalizeUsPhoneE164(String(body.phone || ""));
  if (!phoneE164) {
    return NextResponse.json(
      {
        error:
          "Enter a valid U.S. mobile number in the format (856) 555-1234.",
      },
      { status: 400 },
    );
  }

  const turnstileToken = String(body.turnstileToken || "").trim();
  const turnstileAction = String(body.turnstileAction || "").trim() || undefined;

  const turnstile = await verifyTurnstileToken({
    token: turnstileToken,
    expectedAction: turnstileAction,
  });

  if (!turnstile.success) {
    return NextResponse.json(
      {
        error:
          turnstile.message ||
          "Secure login check failed. Please refresh and try again.",
      },
      { status: 403 },
    );
  }

  const result = await issuePhoneLoginOtp({
    phoneE164,
    allowCreateUser: Boolean(body.allowCreateUser),
    metadata: body.metadata,
  });

  if (!result.ok) {
    const status = result.error.toLowerCase().includes("wait about a minute")
      ? 429
      : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    phone: result.phoneE164,
    existingUser: result.existingUser,
  });
}
