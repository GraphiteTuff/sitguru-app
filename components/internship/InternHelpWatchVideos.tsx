import {
  INTERN_WATCH_VIDEO_GROUPS,
  INTERN_WATCH_VIDEOS,
} from "@/lib/internship/intern-glossary";
import { internHelpPath } from "@/lib/internship/intern-growth";

export default function InternHelpWatchVideos({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <section className="w-full text-left">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
        Watch first
      </p>
      <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">
        SitGuru videos for interns
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Watch these on intern Help so your SitGuru Feature posts match the product.
        SitGuru University certificates are not internship credit. Do not complete
        Pet Parent, Guru, or Ambassador logins for intern hours unless SitGuru
        assigned that work. Promote with a tracking link.
      </p>
      <p className="mt-2 text-sm font-semibold">
        <a
          href={internHelpPath("watch-sitguru")}
          className="font-black text-emerald-800 underline"
        >
          Full watch article →
        </a>
      </p>

      <div className="mt-6 space-y-8">
        {INTERN_WATCH_VIDEO_GROUPS.map((group) => {
          const videos = INTERN_WATCH_VIDEOS.filter((video) => video.group === group.id);
          return (
            <div key={group.id}>
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                {group.title}
              </h3>
              <div className={`mt-3 grid gap-4 ${compact ? "" : "sm:grid-cols-1"}`}>
                {videos.map((video) => (
                  <figure
                    key={video.id}
                    className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="bg-slate-950">
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        poster={video.poster}
                        className="aspect-video w-full bg-slate-950 object-cover"
                      >
                        <source src={video.src} type="video/mp4" />
                      </video>
                    </div>
                    <figcaption className="space-y-2 px-4 py-3">
                      <p className="text-sm font-black text-slate-950">{video.title}</p>
                      <p className="text-sm font-semibold leading-6 text-slate-600">
                        {video.watchFor}
                      </p>
                      <p className="text-sm font-semibold text-emerald-900">
                        Promote with a tracking link to{" "}
                        <a href={video.promoteHref} className="underline">
                          {video.promoteHref}
                        </a>
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
