"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

function formatPhoneDisplay(value: string) {
  const digits = normalizePhone(value).slice(0, 10);
  if (digits.length !== 10) return asTrimmedString(value);
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const role = asTrimmedString(profile?.role).toLowerCase();
  if (!role.includes("admin")) {
    redirect("/admin/login");
  }

  return user;
}

async function findExistingGuruId(params: {
  email: string;
  userId?: string;
}) {
  if (params.userId) {
    const { data } = await supabaseAdmin
      .from("gurus")
      .select("id")
      .or(`id.eq.${params.userId},user_id.eq.${params.userId},profile_id.eq.${params.userId}`)
      .limit(1)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  if (params.email) {
    const { data } = await supabaseAdmin
      .from("gurus")
      .select("id")
      .ilike("email", params.email)
      .limit(1)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }

  return "";
}

async function ensureAuthUser(params: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const password = `SitGuru-${crypto.randomUUID().slice(0, 8)}!`;
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: params.email,
    password,
    email_confirm: true,
    phone: params.phone || undefined,
    user_metadata: {
      full_name: params.fullName,
      display_name: params.fullName,
      role: "guru",
      source: "admin_gurus_new",
    },
  });

  if (data.user?.id) {
    return { userId: data.user.id, created: true };
  }

  const message = (error?.message || "").toLowerCase();
  if (message.includes("already") || message.includes("registered")) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", params.email)
      .maybeSingle();

    if (profile?.id) {
      return { userId: String(profile.id), created: false };
    }
  }

  throw new Error(error?.message || "Unable to create Guru login.");
}

export async function createAdminGuruAction(formData: FormData) {
  await requireAdminSession();

  const firstName = asTrimmedString(formData.get("firstName"));
  const lastName = asTrimmedString(formData.get("lastName"));
  const email = normalizeEmail(asTrimmedString(formData.get("email")));
  const phoneRaw = asTrimmedString(formData.get("phone"));
  const phone = formatPhoneDisplay(phoneRaw);
  const city = asTrimmedString(formData.get("city"));
  const state = asTrimmedString(formData.get("state")).toUpperCase();
  const zip = asTrimmedString(formData.get("zip")).replace(/\D/g, "").slice(0, 5);
  const notes = asTrimmedString(formData.get("notes"));
  const createLogin = asTrimmedString(formData.get("createLogin")) === "on";

  if (!firstName || !lastName) {
    redirect("/admin/gurus/new?error=missing_name");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/admin/gurus/new?error=invalid_email");
  }

  const fullName = `${firstName} ${lastName}`.trim();
  const now = new Date().toISOString();

  try {
    const existingByEmail = await findExistingGuruId({ email });
    if (existingByEmail) {
      redirect(
        `/admin/gurus/${encodeURIComponent(existingByEmail)}?notice=existing_guru`,
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .ilike("email", email)
      .maybeSingle();

    let userId = asTrimmedString(existingProfile?.id);

    if (!userId) {
      if (!createLogin) {
        redirect("/admin/gurus/new?error=login_required");
      }

      const authResult = await ensureAuthUser({
        email,
        fullName,
        phone: normalizePhone(phoneRaw),
      });
      userId = authResult.userId;
    }

    if (!userId) {
      throw new Error("Unable to resolve a SitGuru user id for this Guru.");
    }

    const profilePayload: Record<string, unknown> = {
      id: userId,
      email,
      role: "guru",
      account_status: "active",
      full_name: fullName,
      display_name: fullName,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      service_city: city || null,
      service_state: state || null,
      service_zip: zip || null,
      updated_at: now,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      // Retry without optional columns that may not exist.
      const { error: profileFallbackError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            email,
            role: "guru",
            full_name: fullName,
            display_name: fullName,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            updated_at: now,
          },
          { onConflict: "id" },
        );

      if (profileFallbackError) {
        throw new Error(profileFallbackError.message);
      }
    }

    await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: userId,
        role: "guru",
        updated_at: now,
      },
      { onConflict: "user_id,role" },
    );

    const baseSlug = slugify(fullName) || slugify(email.split("@")[0] || "guru");
    const slug = `${baseSlug}-${userId.slice(0, 6)}`;

    const guruPayload: Record<string, unknown> = {
      id: userId,
      user_id: userId,
      profile_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: fullName,
      full_name: fullName,
      phone: phone || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      service_city: city || null,
      service_state: state || null,
      service_zip: zip || null,
      slug,
      status: "new",
      application_status: "new",
      source: "admin_manual",
      notes: notes || null,
      created_at: now,
      updated_at: now,
    };

    let guruId = "";

    const { data: insertedGuru, error: guruError } = await supabaseAdmin
      .from("gurus")
      .insert(guruPayload)
      .select("id")
      .single();

    if (guruError || !insertedGuru?.id) {
      const fallbackPayload = {
        id: userId,
        user_id: userId,
        email,
        display_name: fullName,
        full_name: fullName,
        phone: phone || null,
        status: "new",
        application_status: "new",
        source: "admin_manual",
        created_at: now,
        updated_at: now,
      };

      const { data: fallbackGuru, error: fallbackError } = await supabaseAdmin
        .from("gurus")
        .insert(fallbackPayload)
        .select("id")
        .single();

      if (fallbackError || !fallbackGuru?.id) {
        throw new Error(
          fallbackError?.message ||
            guruError?.message ||
            "Unable to create Guru workspace.",
        );
      }

      guruId = String(fallbackGuru.id);
    } else {
      guruId = String(insertedGuru.id);
    }

    revalidatePath("/admin/gurus");
    revalidatePath(`/admin/gurus/${guruId}`);
    redirect(`/admin/gurus/${encodeURIComponent(guruId)}?compose_success=created`);
  } catch (error) {
    // Next.js redirect() throws; rethrow those.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest || "").startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("createAdminGuruAction failed:", error);
    const message =
      error instanceof Error ? error.message : "Unable to create Guru.";
    redirect(
      `/admin/gurus/new?error=${encodeURIComponent(message.slice(0, 160))}`,
    );
  }
}

/**
 * Merge a duplicate Guru into a canonical Guru account.
 * - Updates canonical display name (proper casing)
 * - Copies missing phone/email from duplicate into canonical when blank
 * - Hides duplicate from public + admin queues via account_merge_aliases
 * - Does not delete auth users or booking history
 */
export async function mergeDuplicateGuruAction(formData: FormData) {
  await requireAdminSession();

  const canonicalUserId = asTrimmedString(formData.get("canonicalUserId"));
  const duplicateUserId = asTrimmedString(formData.get("duplicateUserId"));
  const displayNameRaw = asTrimmedString(formData.get("displayName"));
  const displayName = displayNameRaw || "Guru";

  if (!canonicalUserId || !duplicateUserId) {
    redirect("/admin/gurus?queue=duplicates&error=missing_merge_ids");
  }

  if (canonicalUserId === duplicateUserId) {
    redirect("/admin/gurus?queue=duplicates&error=same_merge_ids");
  }

  const now = new Date().toISOString();
  const parts = displayName.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || displayName;
  const lastName = parts.slice(1).join(" ") || "";

  try {
    const [{ data: canonicalProfile }, { data: duplicateProfile }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select(
            "id, email, phone, phone_number, contact_email, avatar_url, profile_photo_url, photo_url",
          )
          .eq("id", canonicalUserId)
          .maybeSingle(),
        supabaseAdmin
          .from("profiles")
          .select(
            "id, email, phone, phone_number, contact_email, avatar_url, profile_photo_url, photo_url",
          )
          .eq("id", duplicateUserId)
          .maybeSingle(),
      ]);

    const pickFirst = (...values: unknown[]) => {
      for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return null;
    };

    const mergedPhone = pickFirst(
      canonicalProfile?.phone,
      canonicalProfile?.phone_number,
      duplicateProfile?.phone,
      duplicateProfile?.phone_number,
    );
    const mergedEmail = pickFirst(
      canonicalProfile?.email,
      duplicateProfile?.email,
    );
    const mergedContactEmail = pickFirst(
      canonicalProfile?.contact_email,
      duplicateProfile?.contact_email,
    );
    const mergedAvatar = pickFirst(
      canonicalProfile?.avatar_url,
      canonicalProfile?.profile_photo_url,
      canonicalProfile?.photo_url,
      duplicateProfile?.avatar_url,
      duplicateProfile?.profile_photo_url,
      duplicateProfile?.photo_url,
    );

    const profilePatch: Record<string, unknown> = {
      full_name: displayName,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName || null,
      updated_at: now,
    };
    if (mergedPhone) {
      profilePatch.phone = mergedPhone;
      profilePatch.phone_number = mergedPhone;
    }
    if (mergedEmail) profilePatch.email = mergedEmail;
    if (mergedContactEmail) profilePatch.contact_email = mergedContactEmail;
    if (mergedAvatar) {
      profilePatch.avatar_url = mergedAvatar;
      profilePatch.profile_photo_url = mergedAvatar;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(profilePatch)
      .eq("id", canonicalUserId);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const [{ data: canonicalGurus }, { data: duplicateGurus }] =
      await Promise.all([
        supabaseAdmin
          .from("gurus")
          .select(
            "id, email, phone, phone_number, contact_email, stripe_account_id, stripe_connect_status, charges_enabled, payouts_enabled, avatar_url, profile_photo_url",
          )
          .or(
            `id.eq.${canonicalUserId},user_id.eq.${canonicalUserId},profile_id.eq.${canonicalUserId}`,
          ),
        supabaseAdmin
          .from("gurus")
          .select(
            "id, email, phone, phone_number, contact_email, stripe_account_id, stripe_connect_status, charges_enabled, payouts_enabled, avatar_url, profile_photo_url, notes",
          )
          .or(
            `id.eq.${duplicateUserId},user_id.eq.${duplicateUserId},profile_id.eq.${duplicateUserId}`,
          ),
      ]);

    const duplicateGuru = (duplicateGurus || [])[0] as
      | Record<string, unknown>
      | undefined;
    const canonicalGuru = (canonicalGurus || [])[0] as
      | Record<string, unknown>
      | undefined;

    const guruPhone = pickFirst(
      canonicalGuru?.phone,
      canonicalGuru?.phone_number,
      duplicateGuru?.phone,
      duplicateGuru?.phone_number,
      mergedPhone,
    );
    const guruEmail = pickFirst(
      canonicalGuru?.email,
      duplicateGuru?.email,
      mergedEmail,
    );
    const guruContact = pickFirst(
      canonicalGuru?.contact_email,
      duplicateGuru?.contact_email,
      mergedContactEmail,
    );
    const guruAvatar = pickFirst(
      canonicalGuru?.avatar_url,
      canonicalGuru?.profile_photo_url,
      duplicateGuru?.avatar_url,
      duplicateGuru?.profile_photo_url,
      mergedAvatar,
    );
    // Prefer existing Stripe account on canonical; otherwise adopt from duplicate.
    const stripeAccountId = pickFirst(
      canonicalGuru?.stripe_account_id,
      duplicateGuru?.stripe_account_id,
    );

    const guruPatch: Record<string, unknown> = {
      full_name: displayName,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName || null,
      updated_at: now,
    };
    if (guruPhone) {
      guruPatch.phone = guruPhone;
      guruPatch.phone_number = guruPhone;
    }
    if (guruEmail) guruPatch.email = guruEmail;
    if (guruContact) guruPatch.contact_email = guruContact;
    if (guruAvatar) {
      guruPatch.avatar_url = guruAvatar;
      guruPatch.profile_photo_url = guruAvatar;
    }
    if (stripeAccountId && !canonicalGuru?.stripe_account_id) {
      guruPatch.stripe_account_id = stripeAccountId;
      if (duplicateGuru?.stripe_connect_status) {
        guruPatch.stripe_connect_status = duplicateGuru.stripe_connect_status;
      }
      if (typeof duplicateGuru?.charges_enabled === "boolean") {
        guruPatch.charges_enabled = duplicateGuru.charges_enabled;
      }
      if (typeof duplicateGuru?.payouts_enabled === "boolean") {
        guruPatch.payouts_enabled = duplicateGuru.payouts_enabled;
      }
    }

    await supabaseAdmin
      .from("gurus")
      .update(guruPatch)
      .or(
        `id.eq.${canonicalUserId},user_id.eq.${canonicalUserId},profile_id.eq.${canonicalUserId}`,
      );

    await supabaseAdmin
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
          asTrimmedString(duplicateGuru?.notes),
          `Merged into canonical ${displayName} ${canonicalUserId} on ${now}`,
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .or(
        `id.eq.${duplicateUserId},user_id.eq.${duplicateUserId},profile_id.eq.${duplicateUserId}`,
      );

    await supabaseAdmin
      .from("profiles")
      .update({
        account_status: "merged_duplicate",
        display_name: `${displayName} (merged)`,
        updated_at: now,
      })
      .eq("id", duplicateUserId);

    const { error: aliasError } = await supabaseAdmin
      .from("account_merge_aliases")
      .insert({
        duplicate_user_id: duplicateUserId,
        canonical_user_id: canonicalUserId,
        status: "active",
      });

    if (aliasError) {
      const message = (aliasError.message || "").toLowerCase();
      if (!message.includes("duplicate") && !message.includes("unique")) {
        const { error: upsertError } = await supabaseAdmin
          .from("account_merge_aliases")
          .upsert(
            {
              duplicate_user_id: duplicateUserId,
              canonical_user_id: canonicalUserId,
              status: "active",
            },
            { onConflict: "duplicate_user_id" },
          );
        if (upsertError) {
          throw new Error(upsertError.message);
        }
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/gurus");
    revalidatePath(`/admin/gurus/${canonicalUserId}`);
    redirect(
      `/admin/gurus/${encodeURIComponent(canonicalUserId)}?notice=merged_duplicate`,
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest || "").startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("mergeDuplicateGuruAction failed:", error);
    const message =
      error instanceof Error ? error.message : "Unable to merge Guru accounts.";
    redirect(
      `/admin/gurus?queue=duplicates&error=${encodeURIComponent(message.slice(0, 160))}`,
    );
  }
}
