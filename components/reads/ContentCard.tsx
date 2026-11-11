import Image from "next/image";
import Link from "next/link";
import DisclosureBadge from "@/components/reads/DisclosureBadge";
import type { ReadsContentDetail } from "@/lib/reads/types";

function hrefFor(item: ReadsContentDetail) {
  const map: Record<string, string> = {
    book: "books",
    magazine: "magazines",
    publication: "magazines",
    podcast: "podcasts",
    video: "videos",
    author: "authors",
    expert: "authors",
  };
  return `/reads/${map[item.content_type] || "books"}/${item.slug}`;
}

function cover(item: ReadsContentDetail) {
  return (
    item.image_url ||
    item.thumbnail_url ||
    item.book?.cover_image_url ||
    item.podcast?.episode_artwork_url ||
    item.publication?.logo_url ||
    item.person?.headshot_url ||
    null
  );
}

export default function ContentCard({
  item,
  compact = false,
}: {
  item: ReadsContentDetail;
  compact?: boolean;
}) {
  const image = cover(item);
  const meta =
    item.book?.author_name ||
    item.podcast?.guest_name ||
    item.publication?.publication_name ||
    item.person?.credentials ||
    item.content_type;

  const mediaClass = compact
    ? "aspect-[4/3]"
    : "aspect-[3/4] sm:aspect-[4/5]";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-[0_10px_30px_rgba(13,92,58,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(13,92,58,0.12)]">
      <Link href={hrefFor(item)} className="block">
        <div
          className={`relative overflow-hidden bg-gradient-to-br from-emerald-50 to-orange-50 ${mediaClass}`}
        >
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 80vw, 280px"
            />
          ) : (
            <div className="flex h-full items-end p-4">
              <p className="text-sm font-black text-[#0D5C3A]">{item.title}</p>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <DisclosureBadge label={item.disclosure_label} />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {item.content_type}
        </p>
        <h3 className="text-lg font-black leading-snug text-[#163127]">
          <Link href={hrefFor(item)} className="hover:text-[#0D5C3A]">
            {item.title}
          </Link>
        </h3>
        {meta ? (
          <p className="text-sm font-semibold text-slate-600">{meta}</p>
        ) : null}
        {item.editorial_summary || item.description ? (
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
            {item.editorial_summary || item.description}
          </p>
        ) : null}
        <div className="mt-auto pt-2">
          <Link
            href={hrefFor(item)}
            className="inline-flex text-sm font-black text-[#0D5C3A] underline-offset-4 hover:underline"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
