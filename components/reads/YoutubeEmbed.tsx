"use client";

import { useState } from "react";
import { youtubeEmbedUrl, withYoutubeUtm, youtubeWatchUrl } from "@/lib/reads/youtube";
import { trackReadsEvent } from "@/lib/reads/analytics";

export default function YoutubeEmbed({
  videoId,
  title,
  contentId,
}: {
  videoId: string;
  title: string;
  contentId?: string;
}) {
  const [started, setStarted] = useState(false);
  const embed = youtubeEmbedUrl(videoId);
  const watch = withYoutubeUtm(youtubeWatchUrl(videoId), {
    content: contentId || videoId,
  });

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-slate-950 shadow-lg">
        <iframe
          title={title}
          src={embed}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onLoad={() => {
            if (!started) {
              setStarted(true);
              void trackReadsEvent({
                eventName: "video_play",
                contentId,
                contentType: "video",
                metadata: { youtubeVideoId: videoId, autoplay: false },
              });
            }
          }}
        />
      </div>
      <a
        href={watch}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-bold text-[#0D5C3A] transition hover:bg-emerald-50"
        onClick={() => {
          void trackReadsEvent({
            eventName: "youtube_click",
            contentId,
            contentType: "video",
            metadata: { youtubeVideoId: videoId, direction: "sitguru_to_youtube" },
          });
        }}
      >
        Open on YouTube
      </a>
    </div>
  );
}
