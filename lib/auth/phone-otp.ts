import { createHash, randomInt, timingSafeEqual } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/services/twilio";

export type PhoneOtpMetadata = {
  role?: string;
  account_type?: string;
  signup_method?: string;
  signup_role?: string;
  source?: string;
  preferred_workspace?: string;
};

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeUsPhoneE164(value: string) {
  const digits = digitsOnly(value);
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.trim().startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return "";
}

export function phoneDigitsFromE164(phoneE164: string) {
  return digitsOnly(phoneE164);
}

export function hashPhoneOtpCode(phoneE164: string, code: string) {
  return createHash("sha256")
    .update(`${phoneE164}:${code}`)
    .digest("hex");
}

export function generatePhoneOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function codesMatch(expectedHash: string, candidateHash: string) {
  const left = Buffer.from(expectedHash);
  const right = Buffer.from(candidateHash);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function lookupAuthUserByPhone(phoneE164: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("lookup_auth_user_by_phone", {
    p_phone: phoneE164,
  });

  if (error) {
    throw new Error(error.message || "Unable to look up phone account.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) return null;

  return {
    id: String(row.id),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
  };
}

function syntheticEmailForPhone(phoneE164: string) {
  const digits = phoneDigitsFromE164(phoneE164);
  return `phone.${digits}@users.sitguru.internal`;
}

async function ensureSessionEmail(userId: string, email: string | null, phoneE164: string) {
  if (email && !email.endsWith("@users.sitguru.internal")) {
    return email;
  }

  const nextEmail = email || syntheticEmailForPhone(phoneE164);
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: nextEmail,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message || "Unable to prepare phone login session.");
  }

  return nextEmail;
}

export async function createSessionTokensForUser(params: {
  userId: string;
  email: string | null;
  phoneE164: string;
}) {
  const admin = createSupabaseAdminClient();
  const email = await ensureSessionEmail(
    params.userId,
    params.email,
    params.phoneE164,
  );

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    throw new Error(
      error?.message || "SitGuru could not create a phone login session.",
    );
  }

  const { data: verified, error: verifyError } = await admin.auth.verifyOtp({
    type: "email",
    token_hash: data.properties.hashed_token,
  });

  if (verifyError || !verified.session) {
    throw new Error(
      verifyError?.message || "SitGuru could not finish phone login.",
    );
  }

  return {
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
    expires_in: verified.session.expires_in,
    expires_at: verified.session.expires_at,
    user: verified.user,
  };
}

export async function sendPhoneLoginSms(phoneE164: string, code: string) {
  const body = `SitGuru code: ${code}. Use this newest code to continue. Do not share it.`;
  const result = await sendSms(phoneE164, body);

  if (!result.ok) {
    return {
      ok: false as const,
      error:
        result.error ||
        "SitGuru could not deliver the text message. Please try again in a minute.",
      sid: result.sid || null,
    };
  }

  return {
    ok: true as const,
    sid: result.sid || null,
    status: result.status || null,
  };
}

export async function issuePhoneLoginOtp(params: {
  phoneE164: string;
  allowCreateUser: boolean;
  metadata?: PhoneOtpMetadata;
}) {
  const admin = createSupabaseAdminClient();
  const phoneDigits = phoneDigitsFromE164(params.phoneE164);
  const existing = await lookupAuthUserByPhone(params.phoneE164);

  if (!existing && !params.allowCreateUser) {
    return {
      ok: false as const,
      error:
        "We couldn’t find a SitGuru account with that phone number. Use Become a Pet Parent, Become a Guru, or Become an Ambassador to create one.",
    };
  }

  const recentCutoff = new Date(Date.now() - 55_000).toISOString();
  const { data: recent } = await admin
    .from("phone_login_otps")
    .select("id, created_at")
    .eq("phone_digits", phoneDigits)
    .is("consumed_at", null)
    .gte("created_at", recentCutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent?.id) {
    return {
      ok: false as const,
      error: "Please wait about a minute before requesting another SitGuru code.",
    };
  }

  const code = generatePhoneOtpCode();
  const codeHash = hashPhoneOtpCode(params.phoneE164, code);
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();

  const { error: insertError } = await admin.from("phone_login_otps").insert({
    phone_e164: params.phoneE164,
    phone_digits: phoneDigits,
    code_hash: codeHash,
    user_id: existing?.id || null,
    allow_create_user: params.allowCreateUser,
    metadata: params.metadata || {},
    expires_at: expiresAt,
  });

  if (insertError) {
    return {
      ok: false as const,
      error: insertError.message || "Unable to create SitGuru login code.",
    };
  }

  const sms = await sendPhoneLoginSms(params.phoneE164, code);
  if (!sms.ok) {
    return {
      ok: false as const,
      error: sms.error,
    };
  }

  return {
    ok: true as const,
    phoneE164: params.phoneE164,
    existingUser: Boolean(existing),
    sid: sms.sid,
  };
}

export async function verifyPhoneLoginOtp(params: {
  phoneE164: string;
  code: string;
}) {
  const admin = createSupabaseAdminClient();
  const phoneDigits = phoneDigitsFromE164(params.phoneE164);
  const cleanCode = digitsOnly(params.code).slice(0, 6);

  if (cleanCode.length !== 6) {
    return {
      ok: false as const,
      error: "Enter the 6-digit SitGuru code from your text message.",
    };
  }

  const { data: row, error } = await admin
    .from("phone_login_otps")
    .select(
      "id, code_hash, user_id, allow_create_user, metadata, attempts, max_attempts, expires_at, consumed_at",
    )
    .eq("phone_digits", phoneDigits)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) {
    return {
      ok: false as const,
      error:
        "No active SitGuru code found. Request a new code and try again.",
    };
  }

  if (row.consumed_at) {
    return {
      ok: false as const,
      error: "That SitGuru code was already used. Request a new code.",
    };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return {
      ok: false as const,
      error: "That SitGuru code expired. Request a new code and try again.",
    };
  }

  if (row.attempts >= row.max_attempts) {
    return {
      ok: false as const,
      error:
        "Too many incorrect attempts. Request a new SitGuru code and try again.",
    };
  }

  const candidateHash = hashPhoneOtpCode(params.phoneE164, cleanCode);
  const matched = codesMatch(String(row.code_hash), candidateHash);

  if (!matched) {
    await admin
      .from("phone_login_otps")
      .update({ attempts: Number(row.attempts || 0) + 1 })
      .eq("id", row.id);

    return {
      ok: false as const,
      error:
        "That SitGuru code did not work. Please check the latest text message and try again.",
    };
  }

  await admin
    .from("phone_login_otps")
    .update({
      consumed_at: new Date().toISOString(),
      attempts: Number(row.attempts || 0) + 1,
    })
    .eq("id", row.id);

  let userId = row.user_id ? String(row.user_id) : null;
  let email: string | null = null;

  if (userId) {
    const existing = await lookupAuthUserByPhone(params.phoneE164);
    email = existing?.email || null;
  } else if (row.allow_create_user) {
    const metadata =
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as PhoneOtpMetadata)
        : {};

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        phone: params.phoneE164,
        phone_confirm: true,
        email: syntheticEmailForPhone(params.phoneE164),
        email_confirm: true,
        user_metadata: {
          ...metadata,
          signup_method: metadata.signup_method || "phone",
        },
      });

    if (createError || !created.user) {
      return {
        ok: false as const,
        error:
          createError?.message ||
          "SitGuru could not create your account from this phone number.",
      };
    }

    userId = created.user.id;
    email = created.user.email || syntheticEmailForPhone(params.phoneE164);
  } else {
    return {
      ok: false as const,
      error:
        "We couldn’t find a SitGuru account with that phone number. Use Become a Pet Parent, Become a Guru, or Become an Ambassador to create one.",
    };
  }

  const session = await createSessionTokensForUser({
    userId,
    email,
    phoneE164: params.phoneE164,
  });

  return {
    ok: true as const,
    session,
    userId,
  };
}
