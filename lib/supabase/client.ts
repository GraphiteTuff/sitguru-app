import { createBrowserClient } from "@supabase/ssr";

function getOptionalEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getRequiredEnv(names: string[]): string {
  const value = getOptionalEnv(names);

  if (!value) {
    throw new Error(`Missing Supabase browser environment variable. Checked: ${names.join(", ")}.`);
  }

  return value;
}

function getSessionStorage() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.sessionStorage;
}

export function createClient() {
  const supabaseUrl = getRequiredEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
  ]);

  const supabaseAnonKey = getRequiredEnv([
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]);

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: getSessionStorage(),
      storageKey: "sitguru-session",
    },
  });
}

export const supabase = createClient();