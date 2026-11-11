import Link from "next/link";
import type { ReadsContentDetail, ReadsTeamPick } from "@/lib/reads/types";

function contentHref(pick: ReadsTeamPick) {
  const type = pick.content?.content_type;
  const slug = pick.content?.slug;
  if (!type || !slug) return "/reads/team-picks";
  const map: Record<string, string> = {
    book: "books",
    magazine: "magazines",
    podcast: "podcasts",
    video: "videos",
    author: "authors",
    expert: "authors",
  };
  return `/reads/${map[type] || "books"}/${slug}`;
}

export default function TeamPickCard({ pick }: { pick: ReadsTeamPick }) {
  const member = pick.team_member;
  const content = pick.content as ReadsContentDetail | undefined;
  const initial = (member?.full_name || "?").slice(0, 1).toUpperCase();

  return (
    <article className="flex h-full flex-col rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-[0_10px_30px_rgba(13,92,58,0.06)]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0D5C3A] text-lg font-black text-white"
          aria-hidden
        >
          {initial}
        </div>
        <div>
          <p className="font-black text-[#163127]">{member?.full_name}</p>
          <p className="text-xs font-semibold text-slate-500">
            {member?.role_label}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-700">
        {pick.recommendation_type.replaceAll("_", " ")}
      </p>
      <h3 className="mt-1 text-lg font-black text-[#163127]">
        {content?.title || "Recommendation"}
      </h3>
      {content?.content_type ? (
        <p className="mt-1 text-sm font-semibold capitalize text-slate-600">
          {content.content_type}
          {content.book?.author_name
            ? ` · ${content.book.author_name}`
            : content.podcast?.guest_name
              ? ` · ${content.podcast.guest_name}`
              : ""}
        </p>
      ) : null}

      <blockquote className="mt-4 flex-1 rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-slate-700">
        “{pick.quote}”
      </blockquote>

      <Link
        href={contentHref(pick)}
        className="mt-4 inline-flex rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#09462C]"
      >
        View recommendation
      </Link>
    </article>
  );
}
