import Link from "next/link";
import type { ReactNode } from "react";
import InternHeroBanner from "@/components/internship/InternHeroBanner";
import { DESK_STAT, DESK_UI } from "@/lib/portal/desk-ui";

export type InternStatCard = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  linkLabel?: string;
  tone: keyof typeof DESK_STAT;
  icon: ReactNode;
  progress?: number;
};

export function InternStatRow({ cards }: { cards: InternStatCard[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const tone = DESK_STAT[card.tone];
        return (
          <article key={card.label} className={`rounded-2xl border p-4 shadow-sm ${tone.wrap}`}>
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tone.iconWrap}`}>
                {card.icon}
              </span>
              <div className="min-w-0">
                <p className={`text-2xl font-black leading-none ${tone.value}`}>{card.value}</p>
                <p className="mt-1 text-xs font-bold text-[#0F2744]">{card.label}</p>
              </div>
            </div>
            {card.detail ? (
              <p className="mt-2 text-sm font-medium text-slate-600">{card.detail}</p>
            ) : null}
            {typeof card.progress === "number" ? (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-current opacity-70"
                    style={{ width: `${Math.min(100, card.progress)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ${tone.value}`}>{card.progress}%</span>
              </div>
            ) : null}
            {card.href ? (
              <Link href={card.href} className={`mt-3 inline-flex text-sm font-bold ${DESK_UI.link}`}>
                {card.linkLabel || "Open →"}
              </Link>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export default function InternSectionScaffold({
  title,
  subtitle,
  overlay,
  icon,
  stats,
  children,
}: {
  title: string;
  subtitle: string;
  overlay?: string;
  icon?: ReactNode;
  stats?: InternStatCard[];
  children: ReactNode;
}) {
  return (
    <div className="space-y-5 pb-28 xl:pb-6">
      <InternHeroBanner title={title} subtitle={subtitle} overlay={overlay} icon={icon} />
      {stats?.length ? <InternStatRow cards={stats} /> : null}
      {children}
    </div>
  );
}
