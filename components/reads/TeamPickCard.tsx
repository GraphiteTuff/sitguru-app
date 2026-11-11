import Image from "next/image";
import Link from "next/link";
import type { ReadsContentDetail, ReadsTeamPick } from "@/lib/reads/types";
import {
  readsTeamAvatar,
  readsTeamFirstName,
  readsTeamPickLabel,
} from "@/lib/reads/team";

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

function cover(content?: ReadsContentDetail) {
  if (!content) return null;
  return (
    content.image_url ||
    content.thumbnail_url ||
    content.book?.cover_image_url ||
    content.podcast?.episode_artwork_url ||
    content.publication?.logo_url ||
    content.person?.headshot_url ||
    null
  );
}

export default function TeamPickCard({
  pick,
  facing = false,
  compact = false,
}: {
  pick: ReadsTeamPick;
  /** Public facing pages: first name only + “Jason's Pick” labels. */
  facing?: boolean;
  compact?: boolean;
}) {
  const member = pick.team_member;
  const content = pick.content as ReadsContentDetail | undefined;
  const avatar = readsTeamAvatar({
    slug: member?.slug,
    avatar_url: member?.avatar_url,
    full_name: member?.full_name,
  });
  const firstName = readsTeamFirstName(member?.full_name);
  const title = facing
    ? readsTeamPickLabel(member?.full_name)
    : member?.full_name || "Team pick";
  const image = cover(content);
  const initial = firstName.slice(0, 1).toUpperCase();

  if (compact) {
    return (
      <Link
        href={contentHref(pick)}
        className="group flex flex-col items-center text-center"
      >
        <span className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-[0_8px_20px_rgba(15,39,68,0.12)] ring-2 ring-[#0D5C3A]/15">
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-[#0D5C3A] text-lg font-black text-white">
              {initial}
            </span>
          )}
        </span>
        <span className="mt-2 text-sm font-black text-[#163127]">{firstName}</span>
        {content?.title ? (
          <span className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">
            {content.title}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-[0_10px_30px_rgba(13,92,58,0.06)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#0D5C3A]">
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" sizes="48px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-black text-white">
              {initial}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-black text-[#163127]">{title}</p>
          {facing ? (
            <p className="text-xs font-semibold capitalize text-slate-500">
              {content?.content_type || "Recommendation"}
            </p>
          ) : (
            <p className="text-xs font-semibold text-slate-500">
              {member?.role_label}
            </p>
          )}
        </div>
      </div>

      {image ? (
        <div className="relative mx-5 mt-4 aspect-[3/4] overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 240px"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-lg font-black text-[#163127]">
          {content?.title || "Recommendation"}
        </h3>
        {pick.quote ? (
          <blockquote className="mt-3 flex-1 rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-slate-700">
            “{pick.quote}”
          </blockquote>
        ) : null}
        <Link
          href={contentHref(pick)}
          className="mt-4 inline-flex rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#09462C]"
        >
          View recommendation
        </Link>
      </div>
    </article>
  );
}
