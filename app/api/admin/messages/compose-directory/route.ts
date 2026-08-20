import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, supabaseAdmin } from "@/lib/supabase/admin";

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

async function safeRows(label: string, query: PromiseLike<{ data: unknown; error: unknown }>) {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`compose-directory skipped ${label}:`, result.error);
      return [] as Record<string, unknown>[];
    }
    return Array.isArray(result.data) ? (result.data as Record<string, unknown>[]) : [];
  } catch (error) {
    console.warn(`compose-directory skipped ${label}:`, error);
    return [] as Record<string, unknown>[];
  }
}

function matchesQuery(person: DirectoryPerson, q: string) {
  if (!q) return true;
  const haystack = `${person.name} ${person.email} ${person.role} ${person.subtitle}`.toLowerCase();
  return haystack.includes(q);
}

function uniquePeople(rows: DirectoryPerson[]) {
  const map = new Map<string, DirectoryPerson>();
  for (const row of rows) {
    const key = row.id || row.email.toLowerCase();
    if (!key || map.has(key)) continue;
    map.set(key, row);
  }
  return Array.from(map.values());
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminUser(request);

    const { searchParams } = new URL(request.url);
    const q = asString(searchParams.get("q")).toLowerCase();
    const role = asString(searchParams.get("role")).toLowerCase() || "all";
    const kind = asString(searchParams.get("kind")).toLowerCase() || "recipients";
    const limit = Math.min(Number(searchParams.get("limit") || 40) || 40, 80);

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

      const ids = activeAccess
        .map((row) => asString(row.user_id))
        .filter(Boolean);

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

      const profileMap = new Map(
        profiles.map((row) => [asString(row.id), row] as const),
      );

      const senders = uniquePeople(
        activeAccess.map((row) => {
          const id = asString(row.user_id);
          const profile = profileMap.get(id) || {};
          const email =
            firstString(profile, ["email"]) || asString(row.email);
          const name = displayName(profile, email || "SitGuru Admin");
          const department = asString(row.department_key);
          const roleKey = asString(row.role_key) || "admin";

          return {
            id,
            name,
            email,
            phone: "",
            role: roleKey,
            avatarUrl: avatarOf(profile),
            subtitle: [roleKey, department].filter(Boolean).join(" · "),
          } satisfies DirectoryPerson;
        }),
      )
        .filter((person) => matchesQuery(person, q))
        .slice(0, limit);

      return NextResponse.json({
        ok: true,
        people: senders,
        brandSender: {
          id: "sitguru-support",
          name: "SitGuru Support",
          email: "support@sitguru.com",
          phone: "",
          role: "brand",
          avatarUrl: "",
          subtitle: "Official SitGuru outbound identity",
        } satisfies DirectoryPerson,
      });
    }

    const people: DirectoryPerson[] = [];

    if (role === "all" || role === "guru") {
      const gurus = await safeRows(
        "gurus",
        supabaseAdmin
          .from("gurus")
          .select(
            "id,user_id,email,display_name,full_name,phone,phone_number,avatar_url,profile_photo_url",
          )
          .limit(q ? 120 : 60),
      );

      for (const row of gurus) {
        const id = firstString(row, ["user_id", "id"]);
        const name = displayName(row, "Guru");
        const email = firstString(row, ["email"]);
        people.push({
          id,
          name,
          email,
          phone: firstString(row, ["phone", "phone_number"]),
          role: "guru",
          avatarUrl: avatarOf(row),
          subtitle: email || "Guru",
        });
      }
    }

    if (role === "all" || role === "customer" || role === "pet_parent") {
      const customers = await safeRows(
        "customers",
        supabaseAdmin
          .from("customers")
          .select(
            "id,user_id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url,profile_photo_url",
          )
          .limit(q ? 120 : 60),
      );

      for (const row of customers) {
        const id = firstString(row, ["user_id", "id"]);
        people.push({
          id,
          name: displayName(row, "Pet Parent"),
          email: firstString(row, ["email"]),
          phone: firstString(row, ["phone", "phone_number"]),
          role: "customer",
          avatarUrl: avatarOf(row),
          subtitle: firstString(row, ["email"]) || "Pet Parent",
        });
      }
    }

    if (role === "all" || role === "ambassador") {
      const ambassadors = await safeRows(
        "ambassadors",
        supabaseAdmin
          .from("ambassadors")
          .select(
            "id,user_id,email,full_name,display_name,phone,phone_number,referral_code",
          )
          .limit(q ? 120 : 60),
      );

      for (const row of ambassadors) {
        const id = firstString(row, ["user_id", "id"]);
        people.push({
          id,
          name: displayName(row, "Ambassador"),
          email: firstString(row, ["email"]),
          phone: firstString(row, ["phone", "phone_number"]),
          role: "ambassador",
          avatarUrl: "",
          subtitle:
            firstString(row, ["referral_code"]) ||
            firstString(row, ["email"]) ||
            "Ambassador",
        });
      }
    }

    if (role === "all" || role === "partner" || role === "vendor") {
      const partners = await safeRows(
        "partner_profiles",
        supabaseAdmin
          .from("profiles")
          .select(
            "id,email,full_name,display_name,name,first_name,last_name,phone,phone_number,avatar_url,profile_photo_url,role,account_type",
          )
          .or(
            "role.ilike.%partner%,role.ilike.%vendor%,account_type.ilike.%partner%,account_type.ilike.%vendor%",
          )
          .limit(80),
      );

      for (const row of partners) {
        people.push({
          id: firstString(row, ["id"]),
          name: displayName(row, "Partner"),
          email: firstString(row, ["email"]),
          phone: firstString(row, ["phone", "phone_number"]),
          role: "partner",
          avatarUrl: avatarOf(row),
          subtitle: firstString(row, ["email"]) || "Partner",
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
          .or("role.ilike.%admin%,account_type.ilike.%admin%")
          .limit(80),
      );

      for (const row of admins) {
        people.push({
          id: firstString(row, ["id"]),
          name: displayName(row, "SitGuru Admin"),
          email: firstString(row, ["email"]),
          phone: firstString(row, ["phone", "phone_number"]),
          role: "admin",
          avatarUrl: avatarOf(row),
          subtitle: firstString(row, ["email"]) || "Admin / Staff",
        });
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
          .limit(40),
      );

      for (const row of profiles) {
        const roleValue =
          firstString(row, ["role", "account_type"]).toLowerCase() || "user";
        people.push({
          id: firstString(row, ["id"]),
          name: displayName(row),
          email: firstString(row, ["email"]),
          phone: firstString(row, ["phone", "phone_number"]),
          role: roleValue.includes("guru")
            ? "guru"
            : roleValue.includes("ambassador")
              ? "ambassador"
              : roleValue.includes("admin")
                ? "admin"
                : roleValue.includes("partner") || roleValue.includes("vendor")
                  ? "partner"
                  : "customer",
          avatarUrl: avatarOf(row),
          subtitle: firstString(row, ["email"]) || roleValue,
        });
      }
    }

    const filtered = uniquePeople(people)
      .filter((person) => Boolean(person.id || person.email))
      .filter((person) => matchesQuery(person, q))
      .slice(0, limit);

    return NextResponse.json({ ok: true, people: filtered });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load compose directory.";
    const status =
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("admin")
        ? 401
        : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
