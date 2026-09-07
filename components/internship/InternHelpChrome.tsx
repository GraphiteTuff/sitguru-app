import Link from "next/link";
import type { ReactNode } from "react";
import InternHelpSearchBar from "@/components/internship/InternHelpSearchBar";
import { internGhostBtnClass } from "@/lib/internship/intern-ui";
import {
  INTERN_HELP_INBOX,
  INTERNSHIP_HELP_PATH,
  internHelpMediaSrc,
  type InternHelpArticle,
} from "@/lib/internship/intern-help";

export default function InternHelpChrome({
  article,
  children,
}: {
  article?: InternHelpArticle;
  children?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={INTERNSHIP_HELP_PATH}
          className="inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 hover:underline"
        >
          ← Back to intern Help
        </Link>
        <Link href="/intern" className={`${internGhostBtnClass} min-h-11 px-3 text-xs`}>
          Intern portal
        </Link>
      </div>

      <div className="mt-4 w-full sm:max-w-md">
        <InternHelpSearchBar variant="header" />
      </div>

      {article ? (
        <>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            {article.category}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
            {article.summary}
          </p>
        </>
      ) : null}

      <div className="mt-8 space-y-8 text-slate-800">{children}</div>

      <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-5 py-4 text-sm font-semibold text-emerald-950">
        Still stuck? Email{" "}
        <a
          href={`mailto:${INTERN_HELP_INBOX}`}
          className="font-black text-emerald-800 underline"
        >
          {INTERN_HELP_INBOX}
        </a>
        .
      </div>
    </article>
  );
}

export function InternHelpShots({ article }: { article: InternHelpArticle }) {
  if (!article.shots.length) return null;
  return (
    <div className="space-y-6">
      {article.shots.map((shot) => (
        <figure key={shot.file} className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={internHelpMediaSrc(shot.file)}
            alt={shot.alt}
            className="w-full"
          />
          <figcaption className="px-4 py-3 text-sm font-semibold text-slate-600">
            {shot.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function InternHelpExplain({ article }: { article: InternHelpArticle }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-black text-slate-950">What this is</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">{article.purpose}</p>
      </section>
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4">
        <h2 className="text-lg font-black text-emerald-950">How this helps you</h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-emerald-950">{article.contributes}</p>
      </section>
      {article.fields.length ? (
        <section>
          <h2 className="text-lg font-black text-slate-950">How to fill it out</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Each field is intern-facing. SitGuru uses it for review, your internship
            file, and the Business Growth Report — not as a university grade.
          </p>
          <ul className="mt-4 space-y-3">
            {article.fields.map((field) => (
              <li
                key={field.label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-sm font-black text-slate-950">{field.label}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {field.meaning}
                </p>
                {field.example ? <InternHelpExample example={field.example} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function InternHelpExample({ example }: { example: string }) {
  if (/^https?:\/\//i.test(example) || example.startsWith("mailto:")) {
    return (
      <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
        <a href={example} className="underline">
          {example}
        </a>
      </p>
    );
  }
  return (
    <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
      Example: {example}
    </p>
  );
}
