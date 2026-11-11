import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { formatEventDateRange } from "@/lib/community/format";
import { fetchPublicEventBySlug } from "@/lib/community/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string; format: string }>;
};

const FORMATS = {
  square: { width: 1080, height: 1080, label: "Square" },
  story: { width: 1080, height: 1920, label: "Story" },
  landscape: { width: 1200, height: 630, label: "Landscape" },
} as const;

type SocialFormat = keyof typeof FORMATS;

function isSocialFormat(value: string): value is SocialFormat {
  return value in FORMATS;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { slug, format } = await context.params;

  if (!isSocialFormat(format)) {
    return new Response("Unknown format", { status: 400 });
  }

  const event = await fetchPublicEventBySlug(slug);

  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const size = FORMATS[format];
  const partnerName = event.partners?.business_name || "SitGuru Partner";
  const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const imageUrl =
    event.image_hero_url ||
    event.image_original_url ||
    event.image_card_url ||
    null;

  const isStory = format === "story";
  const isSquare = format === "square";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0D5C3A",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            width={size.width}
            height={size.height}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7,19,47,0.18) 0%, rgba(13,92,58,0.55) 48%, rgba(7,19,47,0.92) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: isStory ? 72 : isSquare ? 56 : 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 18,
                backgroundColor: "#ffffff",
                color: "#0D5C3A",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              SG
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>
                SitGuru
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, opacity: 0.9 }}>
                Community Event
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                backgroundColor: "rgba(255,255,255,0.16)",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {timing.compactDate}
            </div>

            <div
              style={{
                fontSize: isStory ? 84 : isSquare ? 72 : 56,
                fontWeight: 900,
                lineHeight: 1.05,
                maxWidth: isStory ? 900 : 980,
              }}
            >
              {event.title}
            </div>

            <div style={{ fontSize: isStory ? 34 : 28, fontWeight: 700, opacity: 0.95 }}>
              Presented by {partnerName}
            </div>

            <div style={{ fontSize: isStory ? 30 : 24, fontWeight: 600, opacity: 0.9 }}>
              {timing.timeLabel}
              {cityState ? `  •  ${cityState}` : ""}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              {event.is_free ? (
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#ECFDF5",
                    color: "#065F46",
                    borderRadius: 999,
                    padding: "10px 18px",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  Free Event
                </div>
              ) : null}
              {event.pet_friendly ? (
                <div
                  style={{
                    display: "flex",
                    backgroundColor: "#ECFDF5",
                    color: "#065F46",
                    borderRadius: 999,
                    padding: "10px 18px",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  Pet Friendly
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    },
  );
}
