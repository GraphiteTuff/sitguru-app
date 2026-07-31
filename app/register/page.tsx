import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Canonical onboarding alias used by Chief Treat Officer CTAs.
 * Forwards to the real signup flow with role preserved.
 */
export default async function RegisterAliasPage({
  searchParams,
}: RegisterPageProps) {
  const params = (await searchParams) || {};
  const roleRaw = params.role;
  const role = Array.isArray(roleRaw) ? roleRaw[0] : roleRaw;
  const normalized = String(role || "").toLowerCase();

  if (normalized === "guru" || normalized === "handler") {
    redirect("/signup?role=guru&next=/guru/dashboard");
  }

  if (normalized === "ambassador") {
    redirect("/programs/ambassadors/apply");
  }

  if (normalized === "parent" || normalized === "customer") {
    redirect("/signup?role=customer&next=/customer/dashboard");
  }

  redirect("/signup");
}
