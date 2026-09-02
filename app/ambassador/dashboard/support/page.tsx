import Link from "next/link";
import {
  GraduationCap,
  Headphones,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

const helpCards = [
  {
    title: "Message SitGuru HQ",
    detail: "Open your Ambassador inbox with Support already selected.",
    href: "/ambassador/dashboard/messages?support=admin&role=ambassador",
    icon: MessageCircle,
    cta: "Open messages",
  },
  {
    title: "Email support",
    detail: "Write support@sitguru.com if you need a paper trail or attachments.",
    href: "mailto:support@sitguru.com",
    icon: Mail,
    cta: "Email support",
  },
  {
    title: "Training",
    detail: "Replay Academy steps, brand rules, and certification.",
    href: "/ambassador/dashboard/training",
    icon: GraduationCap,
    cta: "Open training",
  },
];

export default function AmbassadorSupportPage() {
  return (
    <main className="px-3 py-6 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0D5C3A] text-white">
              <Headphones size={22} />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                Ambassador Support
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                We stay with you while you grow the pack.
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Ask SitGuru HQ about referrals, training, payouts, leads, or
                Command Center. You stay signed in.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {helpCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <Icon size={18} />
                </span>
                <h2 className="mt-3 text-lg font-black text-slate-950">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {card.detail}
                </p>
                <p className="mt-3 text-sm font-black text-emerald-800">
                  {card.cta} →
                </p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
            <p className="text-sm font-semibold leading-6 text-slate-700">
              Founder and multi-role accounts keep the same login across Pet
              Parent, Guru, Ambassador, and Admin. Use the avatar in the header
              to switch.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
