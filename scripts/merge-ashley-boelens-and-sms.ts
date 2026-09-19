/**
 * Merge Ashley Boelens duplicate Guru accounts, then send a friendly SMS.
 *
 * Canonical (KEEP): photo + Apple Private Relay email account (higher completion)
 * Duplicate (RETIRE): phone-only / initials avatar account
 *
 * Copies phone (16166900889) onto the canonical profile/guru, hides the
 * duplicate via account_merge_aliases, and texts Ashley about finishing Stripe.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... \
 *   TWILIO_FROM_NUMBER=... \
 *     npx tsx scripts/merge-ashley-boelens-and-sms.ts
 *
 * Optional dry run:
 *   DRY_RUN=1 npx tsx scripts/merge-ashley-boelens-and-sms.ts
 */

import { createClient } from "@supabase/supabase-js";

const CANONICAL_EMAIL = "8psrn7wt5v@privaterelay.appleid.com";
const SHARED_PHONE_DIGITS = "6166900889";
const DISPLAY_NAME = "Ashley Boelens";
const FIRST_NAME = "Ashley";
const LAST_NAME = "Boelens";

const WELCOME_SMS = `Hi Ashley! This is Jason from SitGuru — welcome to the pack! 🐾 Your Guru profile looks great. When you have a minute, please finish your Stripe payout setup so we can get you ready for bookings. Reply anytime if you need a hand — happy to help. — Jason`;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function digits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function phoneMatches(value: unknown) {
  const raw = digits(value);
  const normalized =
    raw.length === 11 && raw.startsWith("1") ? raw.slice(1) : raw;
  return (
    normalized === SHARED_PHONE_DIGITS || raw.endsWith(SHARED_PHONE_DIGITS)
  );
}

function normalizeUsPhone(phone: string) {
  const raw = digits(phone);
  if (raw.length === 10) return `+1${raw}`;
  if (raw.length === 11 && raw.startsWith("1")) return `+${raw}`;
  return "";
}

function pickFirst(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function hasPhoto(row: Record<string, unknown>) {
  return Boolean(
    pickFirst(
      row.avatar_url,
      row.profile_photo_url,
      row.photo_url,
      row.image_url,
    ),
  );
}

async function findGurusForUser(
  admin: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data, error } = await admin
    .from("gurus")
    .select("*")
    .or(`id.eq.${userId},user_id.eq.${userId},profile_id.eq.${userId}`);

  if (error) throw new Error(`gurus lookup failed: ${error.message}`);
  return (data || []) as Array<Record<string, unknown>>;
}

async function sendTwilioSms(to: string, body: string) {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const fromNumber =
    process.env.TWILIO_FROM_NUMBER?.trim() ||
    process.env.TWILIO_PHONE_NUMBER?.trim() ||
    process.env.TWILIO_FROM_PHONE_NUMBER?.trim() ||
    "";

  if (!messagingServiceSid && !fromNumber) {
    throw new Error(
      "Need TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER to send SMS.",
    );
  }

  const params = new URLSearchParams();
  params.set("To", to);
  params.set("Body", body);
  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else {
    params.set("From", normalizeUsPhone(fromNumber) || fromNumber);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
      accountSid,
    )}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      `Twilio SMS failed (${response.status}): ${JSON.stringify(payload)}`,
    );
  }

  return {
    sid: String(payload.sid || ""),
    status: String(payload.status || ""),
    to: String(payload.to || to),
  };
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();

  const { data: emailProfiles, error: emailError } = await admin
    .from("profiles")
    .select("*")
    .ilike("email", CANONICAL_EMAIL)
    .limit(10);

  if (emailError) {
    throw new Error(`email profile lookup failed: ${emailError.message}`);
  }

  const { data: nameProfiles } = await admin
    .from("profiles")
    .select("*")
    .or(
      `full_name.ilike.%ashley%boelens%,display_name.ilike.%ashley%boelens%,full_name.ilike.%Ashley%Boelens%`,
    )
    .limit(30);

  const { data: phoneProfiles } = await admin
    .from("profiles")
    .select("*")
    .or(
      `phone.ilike.%6166900889%,phone.ilike.%616-690-0889%,phone_number.ilike.%6166900889%`,
    )
    .limit(20);

  const candidates = new Map<string, Record<string, unknown>>();
  for (const row of [
    ...(emailProfiles || []),
    ...(nameProfiles || []),
    ...(phoneProfiles || []),
  ] as Array<Record<string, unknown>>) {
    const id = String(row.id || "");
    if (id) candidates.set(id, row);
  }

  const rows = Array.from(candidates.values()).filter((row) => {
    const name = String(row.full_name || row.display_name || "").toLowerCase();
    const email = String(row.email || "").toLowerCase();
    return (
      name.includes("boelens") ||
      email.includes("privaterelay.appleid.com") ||
      phoneMatches(row.phone) ||
      phoneMatches(row.phone_number)
    );
  });

  console.log(
    "Ashley candidates:",
    rows.map((r) => ({
      id: r.id,
      email: r.email,
      phone: r.phone || r.phone_number,
      name: r.full_name || r.display_name,
      photo: hasPhoto(r),
      status: r.account_status,
    })),
  );

  if (rows.length < 2) {
    // Maybe one already merged — still try SMS if we have phone
    const survivor =
      rows.find((r) => String(r.email || "").toLowerCase() === CANONICAL_EMAIL) ||
      rows[0];
    if (!survivor) {
      throw new Error("Could not find Ashley Boelens profiles.");
    }
    console.log("Only one Ashley profile found; skipping merge, sending SMS.");
    const phone =
      pickFirst(survivor.phone, survivor.phone_number) ||
      `+1${SHARED_PHONE_DIGITS}`;
    const to = normalizeUsPhone(phone) || `+1${SHARED_PHONE_DIGITS}`;
    if (dryRun) {
      console.log("DRY_RUN SMS to", to, WELCOME_SMS);
      return;
    }
    const sms = await sendTwilioSms(to, WELCOME_SMS);
    console.log("SMS sent:", sms);
    return;
  }

  // Canonical = photo + relay email preferred; otherwise highest signal
  const byScore = [...rows].sort((a, b) => {
    const score = (row: Record<string, unknown>) => {
      let s = 0;
      if (String(row.email || "").toLowerCase() === CANONICAL_EMAIL) s += 50;
      if (hasPhoto(row)) s += 40;
      if (phoneMatches(row.phone) || phoneMatches(row.phone_number)) s += 5;
      if (String(row.account_status || "").includes("merged")) s -= 100;
      return s;
    };
    return score(b) - score(a);
  });

  const canonical = byScore[0];
  const duplicate = byScore.find(
    (row) =>
      String(row.id) !== String(canonical.id) &&
      !String(row.account_status || "").includes("merged"),
  );

  if (!canonical?.id || !duplicate?.id) {
    throw new Error("Could not resolve both Ashley Boelens profiles.");
  }

  const canonicalId = String(canonical.id);
  const duplicateId = String(duplicate.id);

  console.log("Keeping canonical:", {
    id: canonicalId,
    email: canonical.email,
    phone: canonical.phone || canonical.phone_number,
    photo: hasPhoto(canonical),
  });
  console.log("Retiring duplicate:", {
    id: duplicateId,
    email: duplicate.email,
    phone: duplicate.phone || duplicate.phone_number,
    photo: hasPhoto(duplicate),
  });

  const mergedPhone =
    pickFirst(
      canonical.phone,
      canonical.phone_number,
      duplicate.phone,
      duplicate.phone_number,
    ) || `+1${SHARED_PHONE_DIGITS}`;

  const mergedEmail =
    pickFirst(canonical.email, duplicate.email) || CANONICAL_EMAIL;

  if (dryRun) {
    console.log("DRY_RUN would merge phone/email onto canonical and hide duplicate.");
    console.log("DRY_RUN SMS:", normalizeUsPhone(mergedPhone), WELCOME_SMS);
    return;
  }

  // 1) Enrich canonical profile
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: DISPLAY_NAME,
      display_name: DISPLAY_NAME,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      email: mergedEmail,
      phone: mergedPhone,
      phone_number: mergedPhone,
      updated_at: now,
    })
    .eq("id", canonicalId);

  if (profileError) {
    throw new Error(`Failed updating canonical profile: ${profileError.message}`);
  }

  // 2) Enrich canonical gurus
  const canonicalGurus = await findGurusForUser(admin, canonicalId);
  for (const guru of canonicalGurus) {
    const guruId = String(guru.id);
    const stripeAccountId = pickFirst(
      guru.stripe_account_id,
      ...(await findGurusForUser(admin, duplicateId)).map(
        (g) => g.stripe_account_id,
      ),
    );

    const patch: Record<string, unknown> = {
      full_name: DISPLAY_NAME,
      display_name: DISPLAY_NAME,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      name: DISPLAY_NAME,
      email: mergedEmail,
      phone: mergedPhone,
      phone_number: mergedPhone,
      updated_at: now,
    };
    if (stripeAccountId && !guru.stripe_account_id) {
      patch.stripe_account_id = stripeAccountId;
    }

    const { error: guruError } = await admin
      .from("gurus")
      .update(patch)
      .eq("id", guruId);

    if (guruError) {
      console.warn(`Guru update warning for ${guruId}:`, guruError.message);
      await admin
        .from("gurus")
        .update({
          full_name: DISPLAY_NAME,
          display_name: DISPLAY_NAME,
          email: mergedEmail,
          phone: mergedPhone,
          updated_at: now,
        })
        .eq("id", guruId);
    }
  }

  // 3) Soft-hide duplicate guru rows
  const duplicateGurus = await findGurusForUser(admin, duplicateId);
  for (const guru of duplicateGurus) {
    const guruId = String(guru.id);
    await admin
      .from("gurus")
      .update({
        is_public: false,
        is_public_visible: false,
        is_accepting_bookings: false,
        accepting_bookings: false,
        public_status: "hidden",
        status: "merged_duplicate",
        application_status: "merged_duplicate",
        updated_at: now,
        notes: [
          String(guru.notes || "").trim(),
          `Merged into canonical Ashley Boelens ${canonicalId} on ${now}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", guruId);
  }

  // 4) Mark duplicate profile
  await admin
    .from("profiles")
    .update({
      account_status: "merged_duplicate",
      full_name: DISPLAY_NAME,
      display_name: `${DISPLAY_NAME} (merged)`,
      updated_at: now,
    })
    .eq("id", duplicateId);

  // 5) Alias so admin queue hides the duplicate
  const { error: aliasError } = await admin.from("account_merge_aliases").upsert(
    {
      duplicate_user_id: duplicateId,
      canonical_user_id: canonicalId,
      status: "active",
      reason: "shared_real_name_ashley_boelens_photo_keep",
      merged_at: now,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "duplicate_user_id" },
  );

  if (aliasError) {
    const { error: insertError } = await admin
      .from("account_merge_aliases")
      .insert({
        duplicate_user_id: duplicateId,
        canonical_user_id: canonicalId,
        status: "active",
      });
    if (insertError) {
      throw new Error(
        `account_merge_aliases write failed: ${aliasError.message} / ${insertError.message}`,
      );
    }
  }

  // 6) Friendly SMS about Stripe
  const to = normalizeUsPhone(mergedPhone) || `+1${SHARED_PHONE_DIGITS}`;
  const sms = await sendTwilioSms(to, WELCOME_SMS);

  console.log("Merge complete.");
  console.log("Canonical:", canonicalId, mergedEmail, mergedPhone);
  console.log("Duplicate retired:", duplicateId);
  console.log("SMS sent:", sms);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
