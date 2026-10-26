import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { loadStaffHelpContext } from "@/lib/staff-time/help-context";
import {
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

/** Role-aware Manager Help using live authorized Time/Payment state. */
export default async function ManagerHelpPage() {
  const actor = await getAdminIdentity();
  if (!actor) redirect("/admin/login?next=/admin/help/manager");

  const context = await loadStaffHelpContext({
    userId: actor.id,
    email: actor.email,
  });

  return (
    <GrowthPageFrame
      kicker="Help"
      title="Manager Help"
      detail="Contextual answers use your current authorized SitGuru state — not stale screenshots."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Topics</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-emerald-900">
            {[
              ["Home", "/admin/growth"],
              ["Growth", "/admin/growth"],
              ["My Team", "/intern/manage"],
              ["Time", "/admin/growth/my-time"],
              ["Payments", "/admin/growth/payments"],
              ["Messaging", "/admin/messages"],
              ["Onboarding", "/admin/hr"],
              ["Documents", "/admin/hr"],
              ["Profile", "/admin/profile"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="inline-flex min-h-10 items-center">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </GrowthCard>

        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Live answers</h2>
          {context ? (
            <div className="mt-3 space-y-3">
              {context.answers.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-emerald-100 bg-[#FAF6EE] p-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                    {item.question}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-slate-600">
              Open My Time once to activate your engagement, then Help can personalize
              payment and hour answers.
            </p>
          )}
        </GrowthCard>
      </div>
    </GrowthPageFrame>
  );
}
