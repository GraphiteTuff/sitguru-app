import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getOptionalEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

export async function GET() {
  const supabaseUrl = getOptionalEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
    "SUPABASE_URL",
    "SUPABASE_PROJECT_URL",
  ]);

  const supabaseAnonKey = getOptionalEnv([
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  ]);

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing Supabase browser upload config. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel environment variables, then redeploy.",
        checked: {
          url: [
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_PROJECT_URL",
            "SUPABASE_URL",
            "SUPABASE_PROJECT_URL",
          ],
          key: [
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "SUPABASE_PUBLISHABLE_KEY",
            "SUPABASE_ANON_KEY",
          ],
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      supabaseUrl,
      supabaseAnonKey,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}