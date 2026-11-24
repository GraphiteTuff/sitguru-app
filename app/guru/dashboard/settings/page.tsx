import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CircleDollarSign,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import GuruPageHero from "@/components/guru/GuruPageHero";

const SECTIONS = [
  {
    title: "My Profile",
    description: "Update your Guru identity, photos and public information.",
    href: "/guru/dashboard/profile",
    icon: UserRound,
    action: "Edit profile",
  },
  {
    title: "Availability",
    description: "Manage your calendar, blackout dates and booking preferences.",
    href: "/guru/dashboard/availability",
    icon: CalendarDays,
    action: "Manage calendar",
  },
  {
    title: "Services & Pricing",
    description: "Choose the services and rates offered to Pet Parents.",
    href: "/guru/dashboard/pricing",
    icon: CircleDollarSign,
    action: "Manage pricing",
  },
  {
    title: "Payments & Payouts",
    description: "Review earnings and configure available payout methods.",
    href: "/guru/dashboard/earnings",
    icon: ShieldCheck,
    action: "View earnings",
  },
  {
    title: "Messages",
    description: "Open your Pet Parent conversations and support messages.",
    href: "/guru/dashboard/messages",
    icon: MessageCircle,
    action: "Open inbox",
  },
  {
    title: "Help & Notifications",
    description: "Visit Guru Success Center for account and notification guidance.",
    href: "/guru/success-center",
    icon: Bell,
    action: "Get help",
  },
];

export default function GuruDashboardSettingsPage() {
  return (
    <main className="min-h-[70svh] bg-[#F7FFFB] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <GuruPageHero
          eyebrow="MANAGE YOUR GURU BUSINESS"
          title="Guru Settings & Tools"
          description="Your most useful Guru account and business controls in one easy place. Each option opens the existing working page."
          action={{ href: "/guru/dashboard/profile", label: "My Profile" }}
        />
        <nav aria-label="Guru settings categories" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map(({ title, description, href, icon: Icon, action }) => (
            <Link
              key={href}
              href={href}
              className="group flex min-h-[185px] flex-col justify-between rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-300"
            >
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p>
              </div>
              <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#0D5C3A]">{action}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
