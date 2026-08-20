import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DirectoryPerson = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  subtitle: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }
  return "";
}

function displayName(row: Record<string, unknown>, fallback = "SitGuru User") {
  const first = firstString(row, ["first_name", "firstName"]);
  const last = firstString(row, ["last_name", "lastName"]);
  const combined = `${first} ${last}`.trim();
  return (
    firstString(row, [
      "full_name",
      "display_name",
      "name",
      "business_name",
    ]) ||
    combined ||
    firstString(row, ["email"]) ||
    fallback
  );
}

function avatarOf(row: Record<string, unknown>) {
  return firstString(row, [
    "avatar_url",
    "profile_photo_url",
    "photo_url",
    "image_url",
  ]);
}

async function safeRows(
  label: string,
  query: PromiseLike<{ data: unknown; error: unknown }>,
) {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`compose-directory skipped ${label}:`, result.error);
      return [] as Record<string, unknown>[];
    }
    return Array.isArray(result.data)
      ? (result.data as Record<string, unknown>[])
      : [];
  } catch (error) {
    console.warn(`compose-directory skipped ${label}:`, error);
    return [] as Record<string, unknown>[];
  }
}

function matchesQuery(person: DirectoryPerson, q: string) {
  if (!q) return true;
  const haystack =
    `${person.name} ${person.email} ${person.role} ${person.subtitle}`.toLowerCase();
  return haystack.includes(q);
}

function uniquePeople(rows: DirectoryPerson[]) {
  const map = new Map<string, DirectoryPerson>();
  for (const row of rows) {
    const key = (row.id || row.email).toLowerCase();
    if (!key || map.has(key)) continue;
    map.set(key, row);
  }
  return Array.from(map.values());
}

function toPerson(
  row: Record<string, unknown>,
  role: string,
  fallbackName: string,
): DirectoryPerson | null {
  const id = firstString(row, ["user_id", "profile_id", "id", "owner_user_id"]);
  const email = firstString(row, ["email"]);
  if (!id && !email) return null;

  return {
    id: id || email.toLowerCase(),
    name: displayName(row, fallbackName),
    email,
    phone: firstString(row, ["phone", "phone_number", "mobile_phone"]),
    role,
    avatarUrl: avatarOf(row),
    subtitle: email || fallbackName,
  };
}

async function requireCookieAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, status: 401, error: "Not signed in as admin." };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_status, email, full_name, display_name, name")
    .eq("id", user.id)
    .maybeSingle();

  const role = asString((profile as { role?: string } | null)?.role).toLowerCase();
  if (profile && role && role !== "admin" && !role.includes("admin")) {
    return { ok: false as const, status: 403, error: "Admin access required." };
  }

  return {
    ok: true as const,
    user,
    profile: (profile || null) as Record<string, unknown> | null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCookieAdmin();
    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, error: auth.error },
        { status: auth.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = asString(searchParams.get("q")).toLowerCase();
    const role = asString(searchParams.get("role")).toLowerCase() || "all";
    const kind = asString(searchParams.get("kind")).toLowerCase() || "recipients";
    const limit = Math.min(Number(searchParams.get("limit") || 40) || 40, 80);

    const brandSender: DirectoryPerson = {
      id: "sitguru-support",
      name: "SitGuru Support",
      email: "support@sitguru.com",
      phone: "",
      role: "brand",
      avatarUrl: "",
      subtitle: "Official SitGuru outbound identity",
    };

    if (kind === "senders") {
      const accessRows = await safeRows(
        "admin_user_access",
        supabaseAdmin
          .from("admin_user_access")
          .select("user_id,email,role_key,department_key,is_active")
          .limit(200),
      );

      const activeAccess = accessRows.filter((row) => {
        const active = row.is_active;
        if (active === undefined || active === null) return true;
        if (typeof active === "boolean") return active;
        return !["false", "0", "no"].includes(String(active).toLowerCase());
      });

      const ids = Array.from(
        new Set(
          [
            auth.user.id,
            ...activeAccess.map((row) => asString(row.user_id)),
          ].filter(Boolean),
        ),
      );

      const profiles = ids.length
        ? await safeRows(
            "sender_profiles",
            supabaseAdmin
              .from("profiles")
              .select(
                "id,email,full_name,display_name,name,first_name,last_name,avatar_url,profile_photo_url,role,account_type",
              )
              .in("id", ids)
              .limit(200),
          )
        : [];

      const adminProfiles = await safeRows(
        "admin_profiles_fallback",
        supabaseAdmin
          .from("profiles")
          .select(
            "id,email,full_name,display_name,name,first_name,last_name,avatar_url,profile_photo_url,role,account_type",
          )
          .or("role.eq.admin,role.ilike.%admin%")
          .limit(80),
      );

      const profileMap = new Map<string, Record<string, unknown>>();
      for (const row of [...profiles, ...adminProfiles]) {
        const id = asString(row.id);
        if (id) profileMap.set(id, row);
      }

      // Always include the signed-in admin.
      if (auth.profile) {
        profileMap.set(auth.user.id, {
          ...auth.profile,
          id: auth.user.id,
          email: firstString(auth.profile, ["email"]) || auth.user.email || "",
        });
      } else {
        profileMap.set(auth.user.id, {
          id: auth.user.id,
          email: auth.user.email || "",
          full_name: auth.user.email || "SitGuru Admin",
          role: "admin",
        });
      }

      const senders = uniquePeople(
        Array.from(profileMap.values()).map((profile) => {
          const id = asString(profile.id);
          const email = firstString(profile, ["email"]) || auth.user.email || "";
          const access = activeAccess.find(
            (row) => asString(row.user_id) === id,
          );
          return {
            id,
            name: displayName(profile, email || "SitGuru Admin"),
            email,
            phone: "",
            role: "admin",
            avatarUrl: avatarOf(profile),
            subtitle: [
              "SitGuru Admin",
              asString(access?.department_key),
              email,
            ]
              .filter(Boolean)
              .join(" · "),
          } satisfies DirectoryPerson;
        }),
      )
        .filter((person) => matchesQuery(person, q))
        .slice(0, limit);

      return NextResponse.json({
        ok: true,
        people: senders,
        brandSender,
      });
    }

    const people: DirectoryPerson[] = [];

    if (role === "all" || role === "guru") {
      // Use live-safe columns only (unknown columns empty the whole query).
      const gurus = await safeRows(
        "gurus",
        supabaseAdmin
          .from("gurus")
          .select(
            "id,user_id,profile_id,email,display_name,full_name,name,phone,phone_number,avatar_url",
          )
          .limit(q ? 200 : 100),
      );

      for (const row of gurus) {
        const person = toPerson(row, "guru", "Guru");
        if (person) people.push(person);
      }

      if (people.filter((p) => p.role === "guru").length === 0) {
        const guruProfiles = await safeRows(
          "guru_profiles",
          supabaseAdmin
            .from("profiles")
            .select(
              "id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url,profile_photo_url,role,account_type",
            )
            .or("role.eq.guru,role.ilike.%guru%,account_type.ilike.%guru%")
            .limit(100),
        );
        for (const row of guruProfiles) {
          const person = toPerson(row, "guru", "Guru");
          if (person) people.push(person);
        }
      }
    }

    if (role === "all" || role === "customer" || role === "pet_parent") {
      const customers = await safeRows(
        "customers",
        supabaseAdmin
          .from("customers")
          .select(
            "id,user_id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url",
          )
          .limit(q ? 200 : 100),
      );

      for (const row of customers) {
        const person = toPerson(row, "customer", "Pet Parent");
        if (person) people.push(person);
      }

      if (people.filter((p) => p.role === "customer").length === 0) {
        const parentProfiles = await safeRows(
          "customer_profiles",
          supabaseAdmin
            .from("profiles")
            .select(
              "id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url,profile_photo_url,role,account_type",
            )
            .or(
              "role.eq.customer,role.ilike.%customer%,role.ilike.%pet_parent%,account_type.ilike.%customer%",
            )
            .limit(100),
        );
        for (const row of parentProfiles) {
          const person = toPerson(row, "customer", "Pet Parent");
          if (person) people.push(person);
        }
      }
    }

    if (role === "all" || role === "ambassador") {
      const ambassadors = await safeRows(
        "ambassadors",
        supabaseAdmin
          .from("ambassadors")
          .select("id,user_id,email,full_name,display_name,phone,referral_code")
          .limit(q ? 200 : 100),
      );

      for (const row of ambassadors) {
        const person = toPerson(row, "ambassador", "Ambassador");
        if (person) {
          people.push({
            ...person,
            subtitle:
              firstString(row, ["referral_code"]) ||
              person.email ||
              "Ambassador",
          });
        }
      }
    }

    if (role === "all" || role === "partner" || role === "vendor") {
      const partners = await safeRows(
        "partners",
        supabaseAdmin
          .from("partners")
          .select("id,owner_user_id,business_name,contact_name,email,status")
          .limit(100),
      );

      for (const row of partners) {
        const id = firstString(row, ["owner_user_id", "id"]);
        const email = firstString(row, ["email"]);
        if (!id && !email) continue;
        people.push({
          id: id || email.toLowerCase(),
          name:
            firstString(row, ["business_name", "contact_name"]) ||
            email ||
            "Partner",
          email,
          phone: "",
          role: "partner",
          avatarUrl: "",
          subtitle: email || "Partner",
        });
      }
    }

    if (role === "all" || role === "admin") {
      const admins = await safeRows(
        "admin_profiles",
        supabaseAdmin
          .from("profiles")
          .select(
            "id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url,profile_photo_url,role,account_type",
          )
          .or("role.eq.admin,role.ilike.%admin%")
          .limit(80),
      );

      for (const row of admins) {
        const person = toPerson(row, "admin", "SitGuru Admin");
        if (person) people.push(person);
      }
    }

    if (q) {
      const profiles = await safeRows(
        "profile_search",
        supabaseAdmin
          .from("profiles")
          .select(
            "id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url,profile_photo_url,role,account_type",
          )
          .or(
            `email.ilike.%${q}%,full_name.ilike.%${q}%,display_name.ilike.%${q}%,name.ilike.%${q}%`,
          )
          .limit(60),
      );

      for (const row of profiles) {
        const roleValue =
          firstString(row, ["role", "account_type"]).toLowerCase() || "user";
        const mappedRole = roleValue.includes("guru")
          ? "guru"
          : roleValue.includes("ambassador")
            ? "ambassador"
            : roleValue.includes("admin")
              ? "admin"
              : roleValue.includes("partner") || roleValue.includes("vendor")
                ? "partner"
                : "customer";
        const person = toPerson(row, mappedRole, displayName(row));
        if (person) people.push(person);
      }
    }

    const filtered = uniquePeople(people)
      .filter((person) => Boolean(person.id || person.email))
      .filter((person) => matchesQuery(person, q))
      .slice(0, limit);

    return NextResponse.json({ ok: true, people: filtered });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load compose directory.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
