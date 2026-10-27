import Link from "next/link";
import {
  GrowthCard,
  GrowthPageFrame,
} from "@/components/admin/growth/GrowthPageFrame";

export const dynamic = "force-dynamic";

export default function AdminHelpDirectoryPage() {
  return (
    <GrowthPageFrame
      kicker="Admin Help"
      title="Help Center"
      detail="Shared Help architecture for Manager, Intern, and Admin experiences."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Manager",
            href: "/admin/help/manager",
            detail: "Home, Growth, My Team, Time, Payments, Messaging, Onboarding",
          },
          {
            title: "Intern",
            href: "/intern/help",
            detail: "Hours, Assignments, Weekly Check-In, Final Project, Feedback",
          },
          {
            title: "Admin",
            href: "/admin/hr/people",
            detail: "People, Access, Time Approval, Payments, View-As, Audit",
          },
        ].map((card) => (
          <GrowthCard key={card.title}>
            <h2 className="text-xl font-black text-slate-950">{card.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{card.detail}</p>
            <Link
              href={card.href}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-emerald-900"
            >
              Open
            </Link>
          </GrowthCard>
        ))}
      </div>
    </GrowthPageFrame>
  );
}
