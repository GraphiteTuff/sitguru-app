// components/help/HelpArticleChrome.tsx
import Link from "next/link";
import type { ReactNode } from "react";

export type HelpJumpLink = {
  href: string;
  label: string;
};

type HelpArticleChromeProps = {
  eyebrow: string;
  title: string;
  summary: string;
  backHref?: string;
  backLabel?: string;
  jumps?: HelpJumpLink[];
  children: ReactNode;
};

export default function HelpArticleChrome({
  eyebrow,
  title,
  summary,
  backHref = "/help",
  backLabel = "Back to Help Center",
  jumps = [],
  children,
}: HelpArticleChromeProps) {
  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href={backHref}
        className="inline-flex text-sm font-bold text-emerald-800 hover:underline"
      >
        ← {backLabel}
      </Link>

      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
        {summary}
      </p>

      {jumps.length > 0 ? (
        <nav
          aria-label="On this page"
          className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <span className="w-full px-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Quick jump
          </span>
          {jumps.map((jump) => (
            <a
              key={jump.href}
              href={jump.href}
              className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
            >
              {jump.label}
            </a>
          ))}
        </nav>
      ) : null}

      <div className="mt-8 space-y-8 text-slate-800">{children}</div>

      <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4 text-sm font-semibold text-emerald-950">
        Still stuck?{" "}
        <a
          href="mailto:support@sitguru.com"
          className="font-black text-emerald-800 underline"
        >
          Email support@sitguru.com
        </a>{" "}
        or return to the{" "}
        <Link href="/help" className="font-black text-emerald-800 underline">
          Help Center search
        </Link>
        .
      </div>
    </article>
  );
}
