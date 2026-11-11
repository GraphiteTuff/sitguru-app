import Link from "next/link";
import { BookOpen } from "lucide-react";

/** Soft CTA — uses existing partner/community paths; no fake mailing list API. */
export default function ReadsNewsletterCta() {
  return (
    <section
      data-brand-green
      className="public-dark-section mt-12 overflow-hidden rounded-[1.75rem] bg-[#163127] px-6 py-8 !text-white shadow-[0_20px_50px_rgba(22,49,39,0.25)] sm:px-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
            <BookOpen className="h-5 w-5 text-[#E86A17]" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] !text-[#F6C39A]">
              Stay in the loop
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight !text-white">
              Get the latest pet reads
            </h2>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 !text-white/80">
              Follow Team Picks and partner with SitGuru for publication,
              podcast, and author features — community picks publish only after
              review.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reads/team-picks"
            className="rounded-full bg-[#E86A17] px-5 py-2.5 text-sm font-black !text-white transition hover:bg-[#cf5c12]"
          >
            See Team Picks
          </Link>
          <Link
            href="/reads/partner"
            className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-black !text-white transition hover:bg-white/15"
          >
            Partner with SitGuru
          </Link>
        </div>
      </div>
    </section>
  );
}
