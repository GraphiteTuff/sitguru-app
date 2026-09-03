import { supabaseAdmin } from "@/lib/supabase/admin";

export type ReferralProgram =
  | "guru"
  | "pet_parent"
  | "ambassador"
  | "partner"
  | "other";

export type AccountedCode = {
  code: string;
  ownerName: string;
  ownerEmail: string;
  program: ReferralProgram;
  programLabel: string;
  status: string;
  visits: number;
  scans: number;
  signups: number;
  lastActivity: string | null;
  missingOwner: boolean;
  source: string;
};

export type ReferralEventRow = {
  id: string;
  code: string;
  eventType: string;
  referredName: string;
  referredEmail: string;
  referredRole: string;
  occurredAt: string | null;
};

export type SourceHealth = {
  id: string;
  label: string;
  ok: boolean;
  rowCount: number;
};

export type ReferralAccounting = {
  codes: AccountedCode[];
  events: ReferralEventRow[];
  warnings: string[];
  sourceHealth: SourceHealth[];
  totals: {
    codes: number;
    visits: number;
    scans: number;
    signups: number;
    missingOwners: number;
    unconvertedTraffic: number;
  };
};

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function searchQuery(
  params?: Record<string, string | string[] | undefined>,
) {
  const raw = params?.q;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value || "").trim();
}

export function normalizeReferralCode(value: unknown) {
  return text(value)
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, "")
    .replace(/--+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

export function programFromText(...values: unknown[]): ReferralProgram {
  const raw = values.map((value) => text(value).toLowerCase()).join(" ");
  if (raw.includes("guru")) return "guru";
  if (raw.includes("ambassador")) return "ambassador";
  if (raw.includes("partner") || raw.includes("clinic")) return "partner";
  if (
    raw.includes("pet_parent") ||
    raw.includes("pet parent") ||
    raw.includes("customer") ||
    raw.includes("petperk") ||
    raw.includes("pawperk")
  ) {
    return "pet_parent";
  }
  return "other";
}

export function programLabel(program: ReferralProgram) {
  if (program === "guru") return "Guru";
  if (program === "pet_parent") return "Pet Parent";
  if (program === "ambassador") return "Ambassador";
  if (program === "partner") return "Partner";
  return "General";
}

export function isPlaceholderEmail(value: unknown) {
  const email = text(value).toLowerCase();
  if (!email) return true;
  return (
    email.includes("indeedemail.com") ||
    email.includes("indeed_email") ||
    email.includes("_here") ||
    email === "—" ||
    email === "-"
  );
}

export function displayEmail(value: unknown) {
  const email = text(value);
  if (!email || isPlaceholderEmail(email)) return "—";
  return email;
}

function personName(...values: unknown[]) {
  return values.map((value) => text(value)).find(Boolean) || "";
}

async function safeSelect(table: string, limit = 4000) {
  try {
    const { data, error } = await supabaseAdmin.from(table).select("*").limit(limit);
    if (error) {
      return { rows: [] as AnyRow[], warning: `${table}: ${error.message}` };
    }
    return { rows: (data || []) as AnyRow[], warning: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unable to load";
    return { rows: [] as AnyRow[], warning: `${table}: ${message}` };
  }
}

function ownerFromPeople(
  code: string,
  people: Map<string, { name: string; email: string }>,
) {
  return people.get(code) || { name: "", email: "" };
}

export function filterAccounting(
  data: ReferralAccounting,
  program: ReferralProgram,
  query = "",
): ReferralAccounting {
  const needle = normalizeReferralCode(query) || text(query).toLowerCase();
  const codes = data.codes.filter((row) => {
    if (row.program !== program) return false;
    if (!needle) return true;
    const hay = `${row.code} ${row.ownerName} ${row.ownerEmail}`.toLowerCase();
    return (
      normalizeReferralCode(row.code).includes(needle) || hay.includes(needle)
    );
  });
  const codeSet = new Set(codes.map((row) => row.code));
  const events = data.events.filter((event) => codeSet.has(event.code));

  return {
    ...data,
    codes,
    events,
    totals: {
      codes: codes.length,
      visits: codes.reduce((sum, row) => sum + row.visits, 0),
      scans: codes.reduce((sum, row) => sum + row.scans, 0),
      signups: codes.reduce((sum, row) => sum + row.signups, 0),
      missingOwners: codes.filter((row) => row.missingOwner).length,
      unconvertedTraffic: codes.filter(
        (row) => row.visits + row.scans > 0 && row.signups === 0,
      ).length,
    },
  };
}

export async function loadReferralAccounting(): Promise<ReferralAccounting> {
  const [
    codesResult,
    canonicalResult,
    eventsResult,
    ambassadorsResult,
    gurusResult,
    partnersResult,
  ] = await Promise.all([
    safeSelect("referral_codes", 2500),
    safeSelect("pawperks_account_referral_codes", 5000),
    safeSelect("pawperks_referral_events", 8000),
    safeSelect("ambassadors", 800),
    safeSelect("gurus", 3000),
    safeSelect("partners", 500),
  ]);

  const people = new Map<string, { name: string; email: string }>();

  for (const row of ambassadorsResult.rows) {
    const code = normalizeReferralCode(row.referral_code);
    if (!code) continue;
    people.set(code, {
      name:
        personName(row.full_name, row.display_name, row.email) || "Ambassador",
      email: text(row.email) || text(row.login_email),
    });
  }

  for (const row of gurusResult.rows) {
    const code = normalizeReferralCode(row.referral_code);
    if (!code) continue;
    if (people.has(code)) continue;
    people.set(code, {
      name:
        personName(
          row.full_name,
          `${text(row.first_name)} ${text(row.last_name)}`.trim(),
          row.email,
        ) || "Guru",
      email: text(row.email),
    });
  }

  for (const row of partnersResult.rows) {
    const code = normalizeReferralCode(row.referral_code);
    if (!code) continue;
    people.set(code, {
      name:
        personName(row.business_name, row.contact_name, row.email) || "Partner",
      email: text(row.email),
    });
  }

  const merged = new Map<string, AccountedCode>();

  const remember = (input: {
    code: string;
    ownerName: string;
    ownerEmail: string;
    program: ReferralProgram;
    status: string;
    source: string;
  }) => {
    const code = normalizeReferralCode(input.code);
    if (!code) return;
    const person = ownerFromPeople(code, people);
    const ownerName =
      input.ownerName || person.name || "";
    const ownerEmail = isPlaceholderEmail(input.ownerEmail)
      ? person.email
      : input.ownerEmail || person.email;
    const current = merged.get(code);
    if (!current) {
      merged.set(code, {
        code,
        ownerName: ownerName || "Needs owner",
        ownerEmail: displayEmail(ownerEmail),
        program: input.program,
        programLabel: programLabel(input.program),
        status: input.status || "active",
        visits: 0,
        scans: 0,
        signups: 0,
        lastActivity: null,
        missingOwner: !ownerName || ownerName === "Needs owner",
        source: input.source,
      });
      return;
    }

    if (current.missingOwner && ownerName) {
      current.ownerName = ownerName;
      current.missingOwner = false;
    }
    if (current.ownerEmail === "—" && ownerEmail) {
      current.ownerEmail = displayEmail(ownerEmail);
    }
    if (current.program === "other" && input.program !== "other") {
      current.program = input.program;
      current.programLabel = programLabel(input.program);
    }
  };

  for (const row of codesResult.rows) {
    remember({
      code: text(row.normalized_code) || text(row.code),
      ownerName: personName(row.owner_name, row.issued_to_name),
      ownerEmail: text(row.owner_email) || text(row.issued_to_email),
      program: programFromText(row.program_type, row.owner_type),
      status: text(row.status) || "active",
      source: "referral_codes",
    });
  }

  for (const row of canonicalResult.rows) {
    remember({
      code: text(row.normalized_code) || text(row.code),
      ownerName: personName(row.owner_display_name, row.owner_name),
      ownerEmail: text(row.owner_email),
      program: programFromText(
        row.owner_type,
        row.primary_role,
        row.program_type,
        row.program_context,
      ),
      status: text(row.status) || "active",
      source: "pawperks_account_referral_codes",
    });
  }

  for (const [code, person] of people) {
    if (merged.has(code)) continue;
    remember({
      code,
      ownerName: person.name,
      ownerEmail: person.email,
      program: programFromText(
        ambassadorsResult.rows.some(
          (row) => normalizeReferralCode(row.referral_code) === code,
        )
          ? "ambassador"
          : partnersResult.rows.some(
                (row) => normalizeReferralCode(row.referral_code) === code,
              )
            ? "partner"
            : "guru",
      ),
      status: "active",
      source: "workspace",
    });
  }

  const events: ReferralEventRow[] = eventsResult.rows.map((row, index) => {
    const code = normalizeReferralCode(row.submitted_code || row.referral_code);
    const eventType = text(row.event_type) || "event";
    const occurredAt = text(row.occurred_at) || text(row.created_at) || null;

    const accounted = merged.get(code);
    if (accounted) {
      if (eventType === "link_visit") accounted.visits += 1;
      else if (eventType === "qr_scan") accounted.scans += 1;
      else if (
        eventType.includes("signup") ||
        eventType.includes("capture") ||
        eventType.includes("qualified")
      ) {
        accounted.signups += 1;
      }
      if (
        !accounted.lastActivity ||
        (occurredAt && occurredAt > accounted.lastActivity)
      ) {
        accounted.lastActivity = occurredAt;
      }
    }

    return {
      id: text(row.id) || `event-${index}`,
      code,
      eventType,
      referredName: text(row.referred_name),
      referredEmail: displayEmail(row.referred_email),
      referredRole: text(row.referred_role_at_signup) || text(row.referred_role),
      occurredAt,
    };
  });

  const codes = Array.from(merged.values()).sort((a, b) => {
    const traffic = b.visits + b.scans + b.signups - (a.visits + a.scans + a.signups);
    if (traffic) return traffic;
    return a.code.localeCompare(b.code);
  });

  const warnings = [
    codesResult.warning,
    canonicalResult.warning,
    eventsResult.warning,
    ambassadorsResult.warning,
    gurusResult.warning,
    partnersResult.warning,
  ].filter(Boolean);

  return {
    codes,
    events: events
      .filter((event) => event.code)
      .sort((a, b) => text(b.occurredAt).localeCompare(text(a.occurredAt))),
    warnings,
    sourceHealth: [
      {
        id: "referral_codes",
        label: "referral_codes",
        ok: !codesResult.warning,
        rowCount: codesResult.rows.length,
      },
      {
        id: "pawperks_account_referral_codes",
        label: "pawperks_account_referral_codes",
        ok: !canonicalResult.warning,
        rowCount: canonicalResult.rows.length,
      },
      {
        id: "pawperks_referral_events",
        label: "pawperks_referral_events",
        ok: !eventsResult.warning,
        rowCount: eventsResult.rows.length,
      },
      {
        id: "ambassadors",
        label: "ambassadors",
        ok: !ambassadorsResult.warning,
        rowCount: ambassadorsResult.rows.length,
      },
      {
        id: "gurus",
        label: "gurus",
        ok: !gurusResult.warning,
        rowCount: gurusResult.rows.length,
      },
      {
        id: "partners",
        label: "partners",
        ok: !partnersResult.warning,
        rowCount: partnersResult.rows.length,
      },
    ],
    totals: {
      codes: codes.length,
      visits: codes.reduce((sum, row) => sum + row.visits, 0),
      scans: codes.reduce((sum, row) => sum + row.scans, 0),
      signups: codes.reduce((sum, row) => sum + row.signups, 0),
      missingOwners: codes.filter((row) => row.missingOwner).length,
      unconvertedTraffic: codes.filter(
        (row) => row.visits + row.scans > 0 && row.signups === 0,
      ).length,
    },
  };
}
