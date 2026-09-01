import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { formatEventDateRange } from "@/lib/community/format";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";
import { fetchPublicEventBySlug } from "@/lib/community/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string; format: string }>;
};

const FORMATS = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 630 },
} as const;

type SocialFormat = keyof typeof FORMATS;

function isSocialFormat(value: string): value is SocialFormat {
  return value in FORMATS;
}

async function localPngDataUri(publicPath: string) {
  try {
    const file = join(process.cwd(), "public", publicPath);
    const buf = await readFile(file);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function remoteImageDataUri(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "SitGuruEvents/1.0" },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;
    const mime = response.headers.get("content-type") || "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.byteLength < 32 || buf.byteLength > 6_000_000) return null;
    return `data:${mime.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function RsvpPills({ size }: { size: "lg" | "sm" }) {
  const fontSize = size === "lg" ? 26 : 22;
  const pad = size === "lg" ? "12px 22px" : "10px 18px";
  const pills = [
    { label: "Yes", bg: "#0D5C3A", color: "#ffffff" },
    { label: "Maybe", bg: "#D97706", color: "#ffffff" },
    { label: "No", bg: "#E2E8F0", color: "#334155" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          display: "flex",
          fontSize: size === "lg" ? 24 : 20,
          fontWeight: 800,
          color: "#0F172A",
        }}
      >
        Attending?
      </div>
      {pills.map((pill) => (
        <div
          key={pill.label}
          style={{
            display: "flex",
            backgroundColor: pill.bg,
            color: pill.color,
            borderRadius: 999,
            padding: pad,
            fontSize,
            fontWeight: 800,
          }}
        >
          {pill.label}
        </div>
      ))}
    </div>
  );
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
  const discovery = isGoogleDiscoveryEvent(event);
  const partnerName = event.partners?.business_name?.trim() || "";
  const showHost = Boolean(partnerName) && !/^pet event$/i.test(partnerName);
  const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);
  const cityState = [event.city, event.state].filter(Boolean).join(", ");
  const venue = event.venue_name?.trim() || "";
  const place = [venue, cityState].filter(Boolean).join(" · ");
  const photo =
    (await remoteImageDataUri(
      event.image_hero_url ||
        event.image_original_url ||
        event.image_card_url ||
        null,
    )) || null;
  const logoMark =
    (await localPngDataUri("apple-touch-icon.png")) ||
    (await localPngDataUri("images/sitguru-logo-mark.png"));

  const isStory = format === "story";
  const isSquare = format === "square";
  const isLandscape = format === "landscape";
  const shotWidth = isLandscape ? 430 : isStory ? 900 : 860;
  const shotHeight = isLandscape ? 430 : isStory ? 900 : 620;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#F4FBF7",
          color: "#0F172A",
          fontFamily: "sans-serif",
          padding: isStory ? 56 : isSquare ? 48 : 36,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: isLandscape ? 20 : 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {logoMark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoMark}
                alt=""
                width={isLandscape ? 92 : 110}
                height={isLandscape ? 92 : 110}
                style={{
                  width: isLandscape ? 92 : 110,
                  height: isLandscape ? 92 : 110,
                  borderRadius: 28,
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 92,
                  height: 92,
                  borderRadius: 28,
                  backgroundColor: "#0D5C3A",
                  color: "#ffffff",
                  fontSize: 36,
                  fontWeight: 900,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                SG
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: isLandscape ? 44 : 52, fontWeight: 900, lineHeight: 1 }}>
                <div style={{ color: "#0D5C3A" }}>Sit</div>
                <div style={{ color: "#0A2540" }}>Guru</div>
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 4,
                  fontSize: isLandscape ? 22 : 26,
                  fontWeight: 800,
                  color: "#0D5C3A",
                  letterSpacing: 0.4,
                }}
              >
                SitGuru Events
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: "#0D5C3A",
              color: "#ffffff",
              borderRadius: 999,
              padding: isLandscape ? "12px 20px" : "14px 24px",
              fontSize: isLandscape ? 20 : 24,
              fontWeight: 800,
            }}
          >
            sitguru.com
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: isLandscape ? "row" : "column",
            gap: isLandscape ? 28 : 24,
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              position: "relative",
              width: shotWidth,
              height: shotHeight,
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: "#0D5C3A",
              border: "6px solid #ffffff",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
              flexShrink: 0,
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                width={shotWidth}
                height={shotHeight}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 42,
                  fontWeight: 900,
                }}
              >
                Pet Event
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                justifyContent: "center",
                backgroundColor: "rgba(10, 22, 40, 0.78)",
                color: "#ffffff",
                fontSize: isLandscape ? 28 : 36,
                fontWeight: 800,
                padding: isLandscape ? "14px 16px" : "18px 20px",
              }}
            >
              {timing.timeLabel}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
              gap: isLandscape ? 14 : 16,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: isStory ? 64 : isSquare ? 52 : 42,
                fontWeight: 900,
                lineHeight: 1.08,
                color: "#0F172A",
              }}
            >
              {event.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: isLandscape ? 24 : 28,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              {[timing.compactDate, timing.timeLabel].filter(Boolean).join(" · ")}
            </div>
            {place ? (
              <div
                style={{
                  display: "flex",
                  fontSize: isLandscape ? 22 : 26,
                  fontWeight: 700,
                  color: "#475569",
                }}
              >
                {place}
              </div>
            ) : null}
            {showHost && !discovery ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#0D5C3A",
                }}
              >
                Presented by {partnerName}
              </div>
            ) : null}
            <RsvpPills size={isLandscape ? "sm" : "lg"} />
            <div
              style={{
                display: "flex",
                fontSize: isLandscape ? 22 : 26,
                fontWeight: 800,
                color: "#E85D04",
              }}
            >
              www.sitguru.com/events
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      },
    },
  );
}
