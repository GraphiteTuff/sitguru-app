import { NextResponse } from "next/server";
import {
  normalizeUsPhoneE164,
  verifyPhoneLoginOtp,
} from "@/lib/auth/phone-otp";

export const runtime = "nodejs";

type VerifyBody = {
  phone?: string;
  code?: string;
};

export async function POST(request: Request) {
  let body: VerifyBody;

  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const phoneE164 = normalizeUsPhoneE164(String(body.phone || ""));
  if (!phoneE164) {
    return NextResponse.json(
      { error: "Please send a SitGuru code first." },
      { status: 400 },
    );
  }

  const result = await verifyPhoneLoginOtp({
    phoneE164,
    code: String(body.code || ""),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    session: {
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
      expires_in: result.session.expires_in,
      expires_at: result.session.expires_at,
    },
    user: {
      id: result.userId,
      email: result.session.user?.email || null,
      phone: result.session.user?.phone || phoneE164,
    },
  });
}
