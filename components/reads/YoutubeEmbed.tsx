"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import {
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
  withYoutubeUtm,
  youtubeWatchUrl,
} from "@/lib/reads/youtube";
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
  const [playing, setPlaying] = useState(false);
  const embed = youtubeEmbedUrl(videoId);
  const watch = withYoutubeUtm(youtubeWatchUrl(videoId), {
    content: contentId || videoId,
  });
  const poster = youtubeThumbnailUrl(videoId);

  function startPlayback() {
    setPlaying(true);
    void trackReadsEvent({
      eventName: "video_play",
      contentId,
      contentType: "video",
      metadata: {
        youtubeVideoId: videoId,
        autoplay: false,
        trigger: "user_play",
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-slate-950 shadow-lg">
        {playing ? (
          <iframe
            title={title}
            src={`${embed}&autoplay=1`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={startPlayback}
            className="group absolute inset-0 flex items-center justify-center"
            aria-label={`Play ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
            />
            <span className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0D5C3A] text-white shadow-lg">
              <Play className="ml-1 h-7 w-7 fill-white" aria-hidden />
            </span>
          </button>
        )}
      </div>
      <a
        href={watch}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#0D5C3A] transition hover:bg-emerald-50"
        onClick={() => {
          void trackReadsEvent({
            eventName: "youtube_click",
            contentId,
            contentType: "video",
            metadata: {
              youtubeVideoId: videoId,
              direction: "sitguru_to_youtube",
            },
          });
        }}
      >
        Open on YouTube
      </a>
    </div>
  );
}
