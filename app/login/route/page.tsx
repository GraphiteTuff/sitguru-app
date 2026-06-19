// app/customer/login/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LoginSearchParams = Record<string, string | string[] | undefined>;

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginMode(value: string | string[] | undefined) {
  const mode = getFirstParam(value)?.trim().toLowerCase();

  if (mode === "email" || mode === "password") {
    return "email";
  }

  return "phone";
}

export default async function CustomerLoginRedirectPage({
  searchParams,
}: {
  searchParams?: LoginSearchParams | Promise<LoginSearchParams>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    redirect("/login/route?preferred=pet_parent");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  params.set("role", "pet_parent");
  params.set("mode", getLoginMode(resolvedSearchParams.mode));

  const errorMessage =
    getFirstParam(resolvedSearchParams.error) ||
    getFirstParam(resolvedSearchParams.message) ||
    getFirstParam(resolvedSearchParams.auth_error);

  if (errorMessage) {
    params.set("error", errorMessage);
  }

  redirect(`/login?${params.toString()}`);
}