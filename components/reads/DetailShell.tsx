import Link from "next/link";
import DisclosureBadge from "@/components/reads/DisclosureBadge";
import RelatedRail from "@/components/reads/RelatedRail";
import ServiceCtas from "@/components/reads/ServiceCtas";
import TrackPageView from "@/components/reads/TrackPageView";
import YoutubeEmbed from "@/components/reads/YoutubeEmbed";
import type { ReadsContentDetail } from "@/lib/reads/types";

export default function DetailShell({
  item,
  backHref,
  backLabel,
  eventName,
  children,
}: {
  item: ReadsContentDetail;
  backHref: string;
  backLabel: string;
  eventName:
    | "content_view"
    | "book_view"
    | "magazine_view"
    | "podcast_view"
    | "video_play"
    | "author_view";
  children?: React.ReactNode;
}) {
  const videoId = item.video?.youtube_video_id || item.podcast?.youtube_video_id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView
        eventName={eventName === "video_play" ? "content_view" : eventName}
        contentId={item.id}
        contentType={item.content_type}
      />

      <Link
        href={backHref}
        className="text-sm font-bold text-[#0D5C3A] underline-offset-4 hover:underline"
      >
        ← {backLabel}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article>
          <DisclosureBadge label={item.disclosure_label} />
          <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {item.content_type}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-[#163127]">
            {item.title}
          </h1>
          {item.subtitle ? (
            <p className="mt-2 text-lg font-semibold text-slate-600">
              {item.subtitle}
            </p>
          ) : null}

          {videoId ? (
            <div className="mt-6">
              <YoutubeEmbed
                videoId={videoId}
                title={item.title}
                contentId={item.id}
              />
            </div>
          ) : null}

          {children}

          {item.editorial_summary || item.description ? (
            <div className="mt-6 space-y-3 text-sm leading-7 text-slate-700">
              <h2 className="text-xl font-black text-[#163127]">
                SitGuru editorial summary
              </h2>
              <p>{item.editorial_summary || item.description}</p>
            </div>
          ) : null}

          {item.why_recommended ? (
            <div className="mt-6 rounded-[1.5rem] bg-[#f7f4ee] p-5 text-sm font-semibold leading-7 text-slate-700">
              <h2 className="text-lg font-black text-[#163127]">
                Why SitGuru recommends it
              </h2>
              <p className="mt-2">{item.why_recommended}</p>
            </div>
          ) : null}

          {item.affiliate_disclosure ? (
            <p className="mt-4 text-xs font-semibold text-slate-500">
              {item.affiliate_disclosure}
            </p>
          ) : null}

          {item.topics?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {item.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/reads/topics/${topic.slug}`}
                  className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800"
                >
                  {topic.name}
                </Link>
              ))}
            </div>
          ) : null}

          <RelatedRail items={item.related || []} />
          <ServiceCtas source={`reads_${item.content_type}`} />
        </article>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
              Details
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {item.book?.author_name ? (
                <Row label="Author" value={item.book.author_name} />
              ) : null}
              {item.book?.publisher ? (
                <Row label="Publisher" value={item.book.publisher} />
              ) : null}
              {item.book?.publication_date ? (
                <Row label="Published" value={item.book.publication_date} />
              ) : null}
              {item.book?.isbn ? <Row label="ISBN" value={item.book.isbn} /> : null}
              {item.publication?.publication_name ? (
                <Row
                  label="Publication"
                  value={item.publication.publication_name}
                />
              ) : null}
              {item.publication?.issue_label ? (
                <Row label="Issue" value={item.publication.issue_label} />
              ) : null}
              {item.podcast?.show_name ? (
                <Row label="Show" value={item.podcast.show_name} />
              ) : null}
              {item.podcast?.guest_name ? (
                <Row label="Guest" value={item.podcast.guest_name} />
              ) : null}
              {item.person?.credentials ? (
                <Row label="Credentials" value={item.person.credentials} />
              ) : null}
              {item.person?.organization ? (
                <Row label="Organization" value={item.person.organization} />
              ) : null}
              {item.audience?.length ? (
                <Row
                  label="Audience"
                  value={item.audience.join(", ").replaceAll("_", " ")}
                />
              ) : null}
            </dl>

            {item.external_url || item.book?.purchase_url ? (
              <a
                href={item.book?.purchase_url || item.external_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-[#0D5C3A]"
              >
                Official / purchase link
              </a>
            ) : null}
          </div>

          {item.team_picks?.length ? (
            <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Team recommendations
              </h2>
              <ul className="mt-3 space-y-3">
                {item.team_picks.map((pick) => (
                  <li key={pick.id} className="text-sm text-slate-700">
                    <p className="font-black text-[#163127]">
                      {pick.team_member?.full_name}
                    </p>
                    <p className="mt-1 leading-6">“{pick.quote}”</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="text-right font-bold text-[#163127]">{value}</dd>
    </div>
  );
}
