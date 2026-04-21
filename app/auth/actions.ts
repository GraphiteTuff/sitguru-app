"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type AppRole = "pet_owner" | "guru" | "admin";

function normalizeAccountType(value: string): AppRole {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "provider" ||
    normalized === "providers" ||
    normalized === "sitter" ||
    normalized === "sitters" ||
    normalized === "walker" ||
    normalized === "walkers" ||
    normalized === "caretaker" ||
    normalized === "caretakers" ||
    normalized === "guru" ||
    normalized === "gurus"
  ) {
    return "guru";
  }

  if (normalized === "admin" || normalized === "admins") {
    return "admin";
  }

  return "pet_owner";
}

function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

function getRedirectPathFromRoles(roles: string[]): string {
  const normalizedRoles = roles.map(normalizeRole);

  if (
    normalizedRoles.includes("guru") ||
    normalizedRoles.includes("sitter") ||
    normalizedRoles.includes("provider") ||
    normalizedRoles.includes("walker") ||
    normalizedRoles.includes("caretaker")
  ) {
    return "/guru/dashboard";
  }

  if (normalizedRoles.includes("admin")) {
    return "/admin";
  }

  return "/customer/dashboard";
}

function getLoginPageFromNext(next: string): string {
  if (next.startsWith("/guru")) return "/guru/login";
  if (next.startsWith("/admin")) return "/admin/login";
  if (next.startsWith("/customer")) return "/customer/login";
  return "/customer/login";
}

function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function getSafeNextPath(value: FormDataEntryValue | null, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (!isSafeInternalPath(raw)) return fallback;
  return raw;
}

function redirectWithError(loginPage: string, message: string): never {
  redirect(`${loginPage}?error=${encodeURIComponent(message)}`);
}

export async function signup(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : "";

  const accountType = normalizeAccountType(
    String(formData.get("accountType") || "pet_owner")
  );

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required");
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        account_type: accountType,
      },
    },
  });

  if (signUpError || !signUpData.user) {
    redirect(
      `/signup?error=${encodeURIComponent(
        signUpError?.message || "Signup failed"
      )}`
    );
  }

  const userId = signUpData.user.id;

  const profilePayload = {
    id: userId,
    email,
    full_name: [firstName, lastName].filter(Boolean).join(" ").trim() || email,
    role:
      accountType === "guru"
        ? "sitter"
        : accountType === "admin"
          ? "admin"
          : "pet_owner",
    bio: null,
    city: null,
    price: null,
    avatar_url: null,
    state: null,
    state_code: null,
    has_seen_welcome_confetti: false,
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Account created, but profile setup failed. " + profileError.message
      )}`
    );
  }

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: userId,
        role: accountType,
      },
      { onConflict: "user_id,role" }
    );

  if (roleError) {
    redirect(
      `/signup?error=${encodeURIComponent(
        "Account created, but role setup failed. " + roleError.message
      )}`
    );
  }

  if (accountType === "guru") {
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ").trim() || "New Guru";

    const { error: guruError } = await supabase.from("gurus").upsert(
      {
        user_id: userId,
        display_name: displayName,
        bio: null,
        hourly_rate: 0,
        city: null,
        state: null,
      },
      { onConflict: "user_id" }
    );

    if (guruError) {
      redirect(
        `/signup?error=${encodeURIComponent(
          "Account created, but Guru profile setup failed. " + guruError.message
        )}`
      );
    }
  }

  revalidatePath("/", "layout");
  redirect(getRedirectPathFromRoles([accountType]));
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? String(formData.get("password"))
      : "";

  const next = getSafeNextPath(formData.get("next"), "/customer/dashboard");
  const fallbackLoginPage = getLoginPageFromNext(next);

  if (!email || !password) {
    redirectWithError(fallbackLoginPage, "Email and password are required");
  }

  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    redirectWithError(fallbackLoginPage, signInError.message);
  }

  revalidatePath("/", "layout");

  if (next && isSafeInternalPath(next)) {
    redirect(next);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirectWithError(fallbackLoginPage, "Unable to load user");
  }

  const userId = user.id;
  const roleSet = new Set<string>();

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  for (const row of roleRows || []) {
    if (typeof row.role === "string" && row.role.trim()) {
      roleSet.add(normalizeRole(row.role));
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role && typeof profile.role === "string") {
    roleSet.add(normalizeRole(profile.role));
  }

  const { data: guruRow } = await supabase
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (guruRow?.id) {
    roleSet.add("guru");
  }

  redirect(getRedirectPathFromRoles([...roleSet]));
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/customer/login");
}