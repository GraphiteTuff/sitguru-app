/**
 * Staging-only integration QA for Ambassador referral acquisition.
 *
 * Refuses production. Does not create customers, bookings, or charges
 * unless SITGURU_QA_ENV is staging, development, or test and the Supabase
 * project is not production.
 *
 *   SITGURU_QA_ENV=staging \
 *   SITGURU_QA_BASE_URL=http://127.0.0.1:3000 \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/test-ambassador-referral.ts
 *
 * Optional: SITGURU_QA_GURU_ID, SITGURU_QA_EMAIL_DOMAIN, STRIPE_SECRET_KEY (sk_test_ only).
 */

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assessAmbassadorReferralQaEnvironment } from "./ambassador-referral-qa-guard";

const CODE_A = "QAAMBASSADOR1";
const CODE_B = "QAAMBASSADOR2";
const INVALID_CODE = "NOTREAL-QA-CODE";
const MARKER = "qa:ambassador-referral";

type ResultLabel =
  | "PASS"
  | "FAIL"
  | "NOT TESTED"
  | "BLOCKED — SAFE STAGING ENVIRONMENT REQUIRED";

type StepResult = {
  name: string;
  level: "INTEGRATION" | "HTTP" | "NOT TESTED";
  result: ResultLabel;
  detail: string;
};

const results: StepResult[] = [];

function record(
  name: string,
  level: StepResult["level"],
  result: ResultLabel,
  detail: string,
) {
  results.push({ name, level, result, detail });
  const mark = result === "PASS" ? "PASS" : result;
  console.log(`${mark}  [${level}]  ${name} — ${detail}`);
}

function env(name: string) {
  return String(process.env[name] || "").trim();
}

type Created = {
  runId: string;
  startedAt: string;
  userIds: string[];
  ambassadorIds: string[];
  referralCodeIds: string[];
  fixtureCodeIds: string[];
  petIds: string[];
  bookingIds: string[];
  guruIds: string[];
  guruUserIds: string[];
};

function emptyCreated(): Created {
  return {
    runId: randomBytes(4).toString("hex"),
    startedAt: new Date().toISOString(),
    userIds: [],
    ambassadorIds: [],
    referralCodeIds: [],
    fixtureCodeIds: [],
    petIds: [],
    bookingIds: [],
    guruIds: [],
    guruUserIds: [],
  };
}

function emailFor(created: Created, label: string) {
  const domain = env("SITGURU_QA_EMAIL_DOMAIN") || "example.com";
  return `qa+ambassador-referral-${created.runId}-${label}@${domain}`;
}

function password() {
  return `Qa-${randomBytes(18).toString("base64url")}`;
}

type CookieJar = Map<string, string>;

function readSetCookies(response: Response) {
  const jar: CookieJar = new Map();
  const lines =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const line of lines) {
    const pair = line.split(";")[0] || "";
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    jar.set(pair.slice(0, eq).trim(), decodeURIComponent(pair.slice(eq + 1).trim()));
  }
  return jar;
}

function mergeCookies(base: CookieJar, next: CookieJar) {
  const merged = new Map(base);
  for (const [key, value] of next) merged.set(key, value);
  return merged;
}

function cookieHeader(jar: CookieJar) {
  return [...jar.entries()].map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("; ");
}

function codeFromJar(jar: CookieJar) {
  return String(jar.get("sitguru_ambassador_code") || "").toUpperCase();
}

function capturedFromJar(jar: CookieJar) {
  return jar.get("sitguru_ambassador_captured_at") || "";
}

async function openReferral(baseUrl: string, code: string, jar?: CookieJar) {
  const response = await fetch(`${baseUrl}/r/${encodeURIComponent(code)}`, {
    redirect: "manual",
    headers: {
      cookie: jar ? cookieHeader(jar) : "",
      "user-agent": "SitGuru-Ambassador-QA/1.0",
    },
  });
  const html = await response.text();
  const tracked = await fetch(`${baseUrl}/api/ambassador/track-click`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: jar ? cookieHeader(jar) : "",
      "user-agent": "SitGuru-Ambassador-QA/1.0",
      "x-forwarded-for": "203.0.113.10",
    },
    body: JSON.stringify({
      ref: code,
      landingPath: `/r/${code}`,
      ipAddress: "198.51.100.99",
      userAgent: "forged-client",
    }),
  });
  const trackBody = (await tracked.json().catch(() => null)) as {
    ok?: boolean;
    ambassadorId?: string;
    capturedAt?: string;
    captureMac?: string;
  } | null;
  const next = mergeCookies(jar || new Map(), readSetCookies(tracked));
  return { response, html, jar: next, tracked, trackBody };
}

async function signUpUser(
  supabaseUrl: string,
  anonKey: string,
  admin: SupabaseClient,
  email: string,
  userPassword: string,
) {
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signed = await anon.auth.signUp({ email, password: userPassword });
  const userId = signed.data.user?.id || "";
  if (!userId) {
    throw new Error(signed.error?.message || "Signup did not return a user.");
  }
  if (!signed.data.session) {
    const confirmed = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (confirmed.error) throw confirmed.error;
  }
  const session = await anon.auth.signInWithPassword({
    email,
    password: userPassword,
  });
  if (session.error || !session.data.session) {
    throw new Error(session.error?.message || "QA user could not sign in.");
  }
  return {
    userId,
    accessToken: session.data.session.access_token,
    createdAt: signed.data.user?.created_at || session.data.user?.created_at || "",
  };
}

async function provision(input: {
  baseUrl: string;
  accessToken: string;
  userId: string;
  email: string;
  jar?: CookieJar;
  bodyCode?: string;
}) {
  const response = await fetch(`${input.baseUrl}/api/auth/provision-signup`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.accessToken}`,
      cookie: input.jar ? cookieHeader(input.jar) : "",
    },
    body: JSON.stringify({
      userId: input.userId,
      intent: "pet_parent",
      fullName: "QA Ambassador Referral",
      email: input.email,
      referralCode: input.bodyCode || "",
      ambassadorReferralCode: input.bodyCode || "",
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    appliedReferral?: { applied?: boolean; status?: string; code?: string | null };
    error?: string;
  } | null;
  return { response, body, cookies: readSetCookies(response) };
}

async function acquisitionsFor(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from("ambassador_referrals")
    .select("id, referral_code, referred_user_id, booking_id, ambassador_id")
    .eq("referred_user_id", userId);
  if (error) throw error;
  return data || [];
}

async function ensureAmbassador(
  admin: SupabaseClient,
  created: Created,
  code: string,
  ownerUserId?: string,
) {
  const { data: existing, error } = await admin
    .from("ambassadors")
    .select("id, user_id, referral_code")
    .eq("referral_code", code)
    .maybeSingle();
  if (error) throw error;
  if (existing?.id) {
    const { data: codeRow } = await admin
      .from("referral_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (codeRow?.id) created.fixtureCodeIds.push(String(codeRow.id));
    return { ambassadorId: String(existing.id), createdNow: false };
  }

  const { data: ambassador, error: insertError } = await admin
    .from("ambassadors")
    .insert({
      referral_code: code,
      display_name: `QA ${code}`,
      full_name: `QA ${code}`,
      email: emailFor(created, code.toLowerCase()),
      status: "active",
      ambassador_type: "community_ambassador",
      user_id: ownerUserId || null,
      notes: `${MARKER}:${created.runId}`,
      is_archived: false,
    })
    .select("id")
    .single();
  if (insertError || !ambassador?.id) {
    throw insertError || new Error(`Could not create ${code}`);
  }
  created.ambassadorIds.push(String(ambassador.id));

  const { data: referral, error: codeError } = await admin
    .from("referral_codes")
    .insert({
      code,
      slug: code.toLowerCase(),
      status: "active",
      owner_type: "ambassador",
      campaign_type: "ambassador",
      ambassador_id: ambassador.id,
      owner_user_id: ownerUserId || null,
      notes: `${MARKER}:${created.runId}`,
    })
    .select("id")
    .single();
  if (codeError || !referral?.id) throw codeError || new Error(`Could not create code ${code}`);
  created.referralCodeIds.push(String(referral.id));
  created.fixtureCodeIds.push(String(referral.id));
  return { ambassadorId: String(ambassador.id), createdNow: true };
}

async function createBooking(input: {
  baseUrl: string;
  accessToken: string;
  guruId: string;
  petId: string;
  petName: string;
  bodyCode?: string;
}) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const response = await fetch(`${input.baseUrl}/api/bookings/create`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({
      guruId: input.guruId,
      petId: input.petId,
      petName: input.petName,
      requestedDate: tomorrow,
      serviceType: "Drop-In Visit",
      servicePrice: 25,
      referralCode: input.bodyCode || "",
      ambassadorReferralCode: input.bodyCode || "",
    }),
  });
  const body = (await response.json().catch(() => null)) as {
    bookingId?: string;
    error?: string;
  } | null;
  return { response, body };
}

async function cleanup(admin: SupabaseClient, created: Created) {
  const userIds = [...new Set(created.userIds)];
  const bookingIds = [...new Set(created.bookingIds)];
  if (bookingIds.length) {
    await admin.from("referral_commissions").delete().in("booking_id", bookingIds);
    await admin.from("bookings").delete().in("id", bookingIds);
  }
  if (userIds.length) {
    await admin.from("ambassador_referrals").delete().in("referred_user_id", userIds);
    await admin.from("pets").delete().in("id", created.petIds);
    await admin.from("referral_events").delete().in("referred_user_id", userIds);
  }
  if (created.fixtureCodeIds.length) {
    await admin
      .from("referral_clicks")
      .delete()
      .in("referral_code_id", created.fixtureCodeIds)
      .gte("created_at", created.startedAt);
  }
  if (created.guruIds.length) {
    await admin.from("gurus").delete().in("id", created.guruIds);
  }
  if (created.referralCodeIds.length) {
    await admin.from("referral_codes").delete().in("id", created.referralCodeIds);
  }
  if (created.ambassadorIds.length) {
    await admin.from("ambassadors").delete().in("id", created.ambassadorIds);
  }
  for (const userId of [...userIds, ...created.guruUserIds]) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
  }
}

async function main() {
  const decision = assessAmbassadorReferralQaEnvironment({
    qaEnv: env("SITGURU_QA_ENV"),
    supabaseUrl: env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL"),
    anonKey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY"),
    baseUrl: env("SITGURU_QA_BASE_URL"),
    stripeSecretKey: env("STRIPE_SECRET_KEY"),
    emailDomain: env("SITGURU_QA_EMAIL_DOMAIN") || "example.com",
  });

  if (!decision.ok) {
    console.error("BLOCKED — SAFE STAGING ENVIRONMENT REQUIRED");
    for (const reason of decision.reasons) console.error(`- ${reason}`);
    process.exit(2);
  }

  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL") || env("SUPABASE_URL");
  const baseUrl = env("SITGURU_QA_BASE_URL").replace(/\/$/, "");
  const admin = createClient(supabaseUrl, env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const created = emptyCreated();

  try {
    await ensureAmbassador(admin, created, CODE_A);
    await ensureAmbassador(admin, created, CODE_B);

    const first = await openReferral(baseUrl, CODE_A);
    const firstCode = codeFromJar(first.jar);
    const firstCaptured = capturedFromJar(first.jar);
    record(
      "Public referral page",
      "HTTP",
      first.response.status === 200 &&
        first.tracked.ok &&
        firstCode === CODE_A &&
        Boolean(firstCaptured) &&
        !first.trackBody?.ambassadorId
        ? "PASS"
        : "FAIL",
      `page ${first.response.status}; click ${first.tracked.status}; pending code ${firstCode || "missing"}`,
    );

    const parent = await signUpUser(
      supabaseUrl,
      anonKey,
      admin,
      emailFor(created, "new"),
      password(),
    );
    created.userIds.push(parent.userId);
    const locked = await provision({
      baseUrl,
      accessToken: parent.accessToken,
      userId: parent.userId,
      email: emailFor(created, "new"),
      jar: first.jar,
    });
    const rows = await acquisitionsFor(admin, parent.userId);
    const cleared = locked.cookies.get("sitguru_ambassador_code") === "";
    record(
      "New email acquisition",
      "INTEGRATION",
      rows.length === 1 &&
        String(rows[0]?.referral_code || "").toUpperCase() === CODE_A &&
        rows[0]?.referred_user_id === parent.userId &&
        !rows[0]?.booking_id
        ? "PASS"
        : "FAIL",
      `rows ${rows.length}; status ${locked.body?.appliedReferral?.status || "none"}; cookies cleared ${cleared}`,
    );

    const existingPassword = password();
    const existing = await signUpUser(
      supabaseUrl,
      anonKey,
      admin,
      emailFor(created, "existing"),
      existingPassword,
    );
    created.userIds.push(existing.userId);
    const existingVisit = await openReferral(baseUrl, CODE_A);
    const existingProvision = await provision({
      baseUrl,
      accessToken: existing.accessToken,
      userId: existing.userId,
      email: emailFor(created, "existing"),
      jar: existingVisit.jar,
    });
    const existingRows = await acquisitionsFor(admin, existing.userId);
    record(
      "Existing email user",
      "INTEGRATION",
      existingRows.length === 0 &&
        existingProvision.body?.appliedReferral?.status === "existing_account" &&
        !existingProvision.cookies.has("sitguru_ambassador_code")
        ? "PASS"
        : "FAIL",
      `rows ${existingRows.length}; status ${existingProvision.body?.appliedReferral?.status || "none"}; pending seal kept ${!existingProvision.cookies.has("sitguru_ambassador_code")}`,
    );

    const pendingA = await openReferral(baseUrl, CODE_A);
    const pendingB = await openReferral(baseUrl, CODE_B, pendingA.jar);
    const t1 = capturedFromJar(pendingA.jar);
    const t2 = capturedFromJar(pendingB.jar);
    const replaced = await signUpUser(
      supabaseUrl,
      anonKey,
      admin,
      emailFor(created, "second"),
      password(),
    );
    created.userIds.push(replaced.userId);
    await provision({
      baseUrl,
      accessToken: replaced.accessToken,
      userId: replaced.userId,
      email: emailFor(created, "second"),
      jar: pendingB.jar,
      bodyCode: CODE_A,
    });
    const replacedRows = await acquisitionsFor(admin, replaced.userId);
    record(
      "Second referral before signup",
      "INTEGRATION",
      codeFromJar(pendingB.jar) === CODE_B &&
        t2 > t1 &&
        replacedRows.length === 1 &&
        String(replacedRows[0]?.referral_code || "").toUpperCase() === CODE_B
        ? "PASS"
        : "FAIL",
      `pending ${codeFromJar(pendingB.jar)}; rows ${replacedRows.length}`,
    );

    const invalid = await openReferral(baseUrl, INVALID_CODE, pendingA.jar);
    record(
      "Invalid referral",
      "HTTP",
      codeFromJar(invalid.jar) === CODE_A &&
        capturedFromJar(invalid.jar) === capturedFromJar(pendingA.jar) &&
        invalid.response.status < 500
        ? "PASS"
        : "FAIL",
      `status ${invalid.response.status}; pending ${codeFromJar(invalid.jar) || "missing"}`,
    );

    const selfPassword = password();
    const selfUser = await signUpUser(
      supabaseUrl,
      anonKey,
      admin,
      emailFor(created, "self"),
      selfPassword,
    );
    created.userIds.push(selfUser.userId);
    const selfCode = `QASELF${created.runId}`.toUpperCase().slice(0, 32);
    await ensureAmbassador(admin, created, selfCode, selfUser.userId);
    const selfVisit = await openReferral(baseUrl, selfCode);
    const selfProvision = await provision({
      baseUrl,
      accessToken: selfUser.accessToken,
      userId: selfUser.userId,
      email: emailFor(created, "self"),
      jar: selfVisit.jar,
    });
    const selfRows = await acquisitionsFor(admin, selfUser.userId);
    record(
      "Self-referral",
      "INTEGRATION",
      selfRows.length === 0 &&
        selfProvision.body?.appliedReferral?.status === "self_referral"
        ? "PASS"
        : "FAIL",
      `rows ${selfRows.length}; status ${selfProvision.body?.appliedReferral?.status || "none"}`,
    );

    const later = await openReferral(baseUrl, CODE_B);
    const laterProvision = await provision({
      baseUrl,
      accessToken: parent.accessToken,
      userId: parent.userId,
      email: emailFor(created, "new"),
      jar: later.jar,
      bodyCode: CODE_B,
    });
    const still = await acquisitionsFor(admin, parent.userId);
    record(
      "Second referral after acquisition",
      "INTEGRATION",
      still.length === 1 &&
        String(still[0]?.referral_code || "").toUpperCase() === CODE_A &&
        laterProvision.body?.appliedReferral?.status === "already_locked"
        ? "PASS"
        : "FAIL",
      `rows ${still.length}; status ${laterProvision.body?.appliedReferral?.status || "none"}`,
    );

    const raceUser = await signUpUser(
      supabaseUrl,
      anonKey,
      admin,
      emailFor(created, "race"),
      password(),
    );
    created.userIds.push(raceUser.userId);
    const raceVisit = await openReferral(baseUrl, CODE_A);
    const [raceOne, raceTwo] = await Promise.all([
      provision({
        baseUrl,
        accessToken: raceUser.accessToken,
        userId: raceUser.userId,
        email: emailFor(created, "race"),
        jar: raceVisit.jar,
      }),
      provision({
        baseUrl,
        accessToken: raceUser.accessToken,
        userId: raceUser.userId,
        email: emailFor(created, "race"),
        jar: raceVisit.jar,
      }),
    ]);
    const raceRows = await acquisitionsFor(admin, raceUser.userId);
    record(
      "Concurrent acquisition",
      "INTEGRATION",
      raceRows.length === 1 ? "PASS" : "FAIL",
      `rows ${raceRows.length}; statuses ${raceOne.body?.appliedReferral?.status || "none"}/${raceTwo.body?.appliedReferral?.status || "none"}`,
    );

    const shared = await signUpUser(
      supabaseUrl,
      anonKey,
      admin,
      emailFor(created, "shared"),
      password(),
    );
    created.userIds.push(shared.userId);
    const sharedVisit = await openReferral(baseUrl, CODE_B);
    const sharedProvision = await provision({
      baseUrl,
      accessToken: shared.accessToken,
      userId: shared.userId,
      email: emailFor(created, "shared"),
      jar: sharedVisit.jar,
    });
    const sharedRows = await acquisitionsFor(admin, shared.userId);
    const parentAfterShare = await acquisitionsFor(admin, parent.userId);
    record(
      "Shared browser second user",
      "INTEGRATION",
      sharedRows.length === 0 &&
        parentAfterShare.length === 1 &&
        String(parentAfterShare[0]?.referral_code || "").toUpperCase() === CODE_A
        ? "PASS"
        : "FAIL",
      `second user rows ${sharedRows.length}; status ${sharedProvision.body?.appliedReferral?.status || "none"}`,
    );

    const guruId = env("SITGURU_QA_GURU_ID");
    if (!guruId) {
      record(
        "Booking A",
        "NOT TESTED",
        "NOT TESTED",
        "Set SITGURU_QA_GURU_ID to an existing staging Guru.",
      );
      record("Checkout tampering", "NOT TESTED", "NOT TESTED", "Booking route was not called.");
      record("Booking B", "NOT TESTED", "NOT TESTED", "Booking route was not called.");
      record(
        "Legacy commission side effect",
        "NOT TESTED",
        "NOT TESTED",
        "No staging booking was completed.",
      );
    } else {
      const petName = `QA Pet ${created.runId}`;
      const pet = await admin
        .from("pets")
        .insert({
          name: petName,
          owner_id: parent.userId,
          notes: `${MARKER}:${created.runId}`,
        })
        .select("id")
        .single();
      if (pet.error || !pet.data?.id) throw pet.error || new Error("Pet fixture failed.");
      created.petIds.push(String(pet.data.id));
      const bookingA = await createBooking({
        baseUrl,
        accessToken: parent.accessToken,
        guruId,
        petId: String(pet.data.id),
        petName,
        bodyCode: CODE_B,
      });
      const bookingAId = String(bookingA.body?.bookingId || "");
      if (bookingAId) created.bookingIds.push(bookingAId);
      const afterA = await acquisitionsFor(admin, parent.userId);
      record(
        "Booking A",
        "INTEGRATION",
        bookingA.response.ok && afterA[0]?.booking_id === bookingAId
          ? "PASS"
          : "FAIL",
        `booking status ${bookingA.response.status}`,
      );
      record(
        "Checkout tampering",
        "INTEGRATION",
        String(afterA[0]?.referral_code || "").toUpperCase() === CODE_A
          ? "PASS"
          : "FAIL",
        "Request body carried the other code.",
      );
      const bookingB = await createBooking({
        baseUrl,
        accessToken: parent.accessToken,
        guruId,
        petId: String(pet.data.id),
        petName,
        bodyCode: CODE_B,
      });
      const bookingBId = String(bookingB.body?.bookingId || "");
      if (bookingBId) created.bookingIds.push(bookingBId);
      const afterB = await acquisitionsFor(admin, parent.userId);
      record(
        "Booking B",
        "INTEGRATION",
        bookingB.response.ok &&
          afterB.length === 1 &&
          afterB[0]?.booking_id === bookingAId &&
          bookingBId !== bookingAId
          ? "PASS"
          : "FAIL",
        `booking status ${bookingB.response.status}`,
      );
      const commissions = bookingAId
        ? await admin
            .from("referral_commissions")
            .select("id")
            .eq("booking_id", bookingAId)
        : { data: [], error: null };
      record(
        "Legacy commission side effect",
        "INTEGRATION",
        !commissions.error && (commissions.data || []).length === 0
          ? "PASS"
          : "FAIL",
        "Pending booking was checked. Completed-booking trigger was not run.",
      );
    }

    record("Qualification lifecycle", "NOT TESTED", "NOT TESTED", "Stripe test payment and completion were not executed.");
    record("Canceled booking", "NOT TESTED", "NOT TESTED", "No staging booking was canceled.");
    record("Refunded booking", "NOT TESTED", "NOT TESTED", "No Stripe test refund was executed.");
    record(
      "Partial refund",
      "NOT TESTED",
      "NOT TESTED",
      "Policy is covered by the unit test. No staging partial refund was executed.",
    );
    record("Google new account", "NOT TESTED", "NOT TESTED", "Interactive Google OAuth is not available here.");
    record("Google existing account", "NOT TESTED", "NOT TESTED", "Interactive Google OAuth is not available here.");
    record("Apple new account", "NOT TESTED", "NOT TESTED", "Apple Sign-In is not available here.");
    record("Apple existing account", "NOT TESTED", "NOT TESTED", "Apple Sign-In is not available here.");
    record("Expo device", "NOT TESTED", "NOT TESTED", "No device or simulator ran this harness.");

    const failed = results.some((item) => item.result === "FAIL");
    process.exitCode = failed ? 1 : 0;
  } catch (error) {
    record(
      "Harness",
      "INTEGRATION",
      "FAIL",
      error instanceof Error ? error.message : "Harness failed.",
    );
    process.exitCode = 1;
  } finally {
    await cleanup(admin, created).catch((error) => {
      console.error(
        "Cleanup failed:",
        error instanceof Error ? error.message : "unknown cleanup error",
      );
      process.exitCode = 1;
    });
  }
}

const invokedDirectly = process.argv[1]?.includes("test-ambassador-referral");
if (invokedDirectly) {
  main();
}

export { main };
