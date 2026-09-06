import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";
import { internPortalDestination, internSafeNext } from "@/lib/internship/intern-growth";
import { internPrimaryBtnClass } from "@/lib/internship/intern-ui";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { findInternByAccount, getInternOnboarding } from "@/lib/internship/queries";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const error = first(params.error);
  const nextPath = internSafeNext(first(params.next));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const intern = await findInternByAccount({
      userId: user.id,
      email: user.email,
    });
    if (intern) {
      const ack = await getInternOnboarding(intern.id);
      redirect(internPortalDestination(nextPath, internOnboardingComplete(ack)));
    }
    const admin = await getAdminIdentity();
    if (admin?.canAccessAdmin) redirect("/admin/internship/portal");
    if (isFounderPersonalMarketplaceEmail(user.email)) redirect("/intern");

    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
            Internship Program
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Intern portal access
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {error ||
              "This SitGuru account is not assigned as an intern. SitGuru has to add you to the internship program first."}
          </p>
          <Link
            href="/customer/dashboard"
            className={`mt-6 ${internPrimaryBtnClass}`}
          >
            Back to SitGuru
          </Link>
        </div>
      </main>
    );
  }

  const login = new URLSearchParams({
    role: "intern",
    next: nextPath,
  });
  if (error) login.set("error", error);
  redirect(`/login?${login.toString()}`);
}
