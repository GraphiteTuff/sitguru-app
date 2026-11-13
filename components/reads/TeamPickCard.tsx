import Image from "next/image";
import Link from "next/link";
import type {
  ReadsContentDetail,
  ReadsTeamMember,
  ReadsTeamPick,
} from "@/lib/reads/types";
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

function Avatar({
  member,
  sizeClass,
}: {
  member?: ReadsTeamMember | null;
  sizeClass: string;
}) {
  const avatar = readsTeamAvatar({
    slug: member?.slug,
    avatar_url: member?.avatar_url,
    full_name: member?.full_name,
  });
  const firstName = readsTeamFirstName(member?.full_name);
  const initial = firstName.slice(0, 1).toUpperCase() || "?";

  return (
    <div className={`relative overflow-hidden rounded-full bg-[#0D5C3A] ${sizeClass}`}>
      {avatar ? (
        <Image src={avatar} alt="" fill className="object-cover" sizes="64px" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg font-black text-white">
          {initial}
        </span>
      )}
    </div>
  );
}

export function TeamPickPlaceholderCard({
  member,
  facing = false,
  compact = false,
}: {
  member: ReadsTeamMember;
  facing?: boolean;
  compact?: boolean;
}) {
  const firstName = readsTeamFirstName(member.full_name);
  const title = facing ? readsTeamPickLabel(member.full_name) : member.full_name;

  if (compact) {
    return (
      <div className="flex flex-col items-center text-center opacity-90">
        <span className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-dashed border-emerald-200 shadow-[0_8px_20px_rgba(15,39,68,0.08)]">
          <Avatar member={member} sizeClass="h-16 w-16" />
        </span>
        <span className="mt-2 text-sm font-black text-[#163127]">{firstName}</span>
        <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Coming soon
        </span>
      </div>
    );
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-dashed border-emerald-200 bg-white/80 shadow-[0_10px_30px_rgba(13,92,58,0.04)]">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <Avatar member={member} sizeClass="h-12 w-12" />
        <div className="min-w-0">
          <p className="font-black text-[#163127]">{title}</p>
          <p className="text-xs font-semibold text-slate-500">
            {facing ? "Pick coming soon" : member.role_label}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="flex aspect-[3/4] max-h-48 items-center justify-center rounded-2xl border border-dashed border-emerald-100 bg-[#F4F7FB]">
          <p className="px-4 text-center text-sm font-bold text-slate-500">
            {firstName}&apos;s recommendation will land here after review.
          </p>
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Placeholder for {firstName}&apos;s Team Pick — staff curated and approved
          before it goes live.
        </p>
      </div>
    </article>
  );
}

export default function TeamPickCard({
  pick,
  member,
  facing = false,
  compact = false,
}: {
  pick?: ReadsTeamPick | null;
  member?: ReadsTeamMember | null;
  /** Public facing pages: first name only + “Jason's Pick” labels. */
  facing?: boolean;
  compact?: boolean;
}) {
  const resolvedMember = member || pick?.team_member || null;
  if (!pick && resolvedMember) {
    return (
      <TeamPickPlaceholderCard
        member={resolvedMember}
        facing={facing}
        compact={compact}
      />
    );
  }
  if (!pick) return null;

  const content = pick.content as ReadsContentDetail | undefined;
  const firstName = readsTeamFirstName(resolvedMember?.full_name);
  const title = facing
    ? readsTeamPickLabel(resolvedMember?.full_name)
    : resolvedMember?.full_name || "Team pick";
  const image = cover(content);

  if (compact) {
    return (
      <Link
        href={contentHref(pick)}
        className="group flex flex-col items-center text-center"
      >
        <span className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-[0_8px_20px_rgba(15,39,68,0.12)] ring-2 ring-[#0D5C3A]/15">
          <Avatar member={resolvedMember} sizeClass="h-16 w-16" />
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
        <Avatar member={resolvedMember} sizeClass="h-12 w-12" />
        <div className="min-w-0">
          <p className="font-black text-[#163127]">{title}</p>
          {facing ? (
            <p className="text-xs font-semibold capitalize text-slate-500">
              {content?.content_type || "Recommendation"}
            </p>
          ) : (
            <p className="text-xs font-semibold text-slate-500">
              {resolvedMember?.role_label}
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
        ) : content?.why_recommended ? (
          <p className="mt-3 flex-1 rounded-2xl bg-[#f7f4ee] px-4 py-3 text-sm leading-6 text-slate-700">
            {content.why_recommended}
          </p>
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
