"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

function normalizeAccountType(value: string) {
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
    return "Guru";
  }

  if (
    normalized === "pet owner" ||
    normalized === "owner" ||
    normalized === "customer" ||
    normalized === "customers"
  ) {
    return "Pet Owner";
  }

  if (normalized === "admin" || normalized === "admins") {
    return "Admin";
  }

  return value.trim() || "Pet Owner";
}

export async function signup(formData: FormData) {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const accountType = normalizeAccountType(String(formData.get("accountType") || "Pet Owner"));

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
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

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}