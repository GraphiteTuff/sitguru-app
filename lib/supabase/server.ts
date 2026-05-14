import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function getSupabaseAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

function makeSessionCookieOptions(options: CookieOptions): CookieOptions {
  const sessionOptions = {
    ...options,
    path: options.path || "/",
    sameSite: options.sameSite || "lax",
  } as CookieOptions & {
    expires?: Date;
    maxAge?: number;
  };

  /**
   * Keep removal cookies working.
   * Supabase uses maxAge: 0 or an expired date when signing out.
   */
  if (typeof sessionOptions.maxAge === "number" && sessionOptions.maxAge <= 0) {
    return sessionOptions;
  }

  /**
   * Remove long-lived persistence.
   * Without maxAge/expires, the browser treats this as a session cookie.
   */
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;

  return sessionOptions;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, makeSessionCookieOptions(options));
            });
          } catch {
            /**
             * This can happen from a Server Component where setting cookies
             * is not allowed. Middleware/Route Handlers will still refresh cookies.
             */
          }
        },
      },
    },
  );
}