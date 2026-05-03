import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  HeartHandshake,
  ImageIcon,
  Mail,
  Megaphone,
  Newspaper,
  PawPrint,
  PlayCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, unknown>;

type SafeAdminQueryResponse = {
  data: unknown;
  error: unknown;
};

type PressItem = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  type: "article" | "story" | "video" | "photo" | "announcement" | "quote";
  href: string;
  imageUrl: string;
  source: string;
  publishedAt: string | null;
  isFeatured: boolean;
};

const fallbackPressItems: PressItem[] = [
  {
    id: "fallback-community-programs",
    title: "SitGuru Programs Create New Pathways Into Trusted Pet Care",
    eyebrow: "Community Story",
    description:
      "SitGuru is building welcoming pathways for military-connected applicants, students, recent graduates, summer workers, and community workforce participants to train, grow, and become trusted Gurus.",
    type: "story",
    href: "/programs",
    imageUrl: "/images/homepage/sitguru-dog-walking-hero.jpg",
    source: "SitGuru",
    publishedAt: null,
    isFeatured: true,
  },
  {
    id: "fallback-quality-care",
    title: "Quality Care Starts With Trust, Safety, and Strong Guru Readiness",
    eyebrow: "Care Quality",
    description:
      "SitGuru focuses on trusted local care, clearer Guru profiles, background checks, service readiness, and a warm experience for pet parents choosing care.",
    type: "announcement",
    href: "/about",
    imageUrl: "/images/homepage/sitguru-dog-walking-hero.jpg",
    source: "SitGuru",
    publishedAt: null,
    isFeatured: true,
  },
  {
    id: "fallback-partner-network",
    title: "SitGuru Partner Network Supports Local Growth and Community Reach",
    eyebrow: "Partner News",
    description:
      "Local partners, national partners, affiliates, ambassadors, workforce programs, schools, and community organizations can help SitGuru reach more pet families and future Gurus.",
    type: "article",
    href: "/partners",
    imageUrl: "/images/homepage/sitguru-dog-walking-hero.jpg",
    source: "SitGuru",
    publishedAt: null,
    isFeatured: false,
  },
];

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "yes", "1", "featured", "published"].includes(
      value.trim().toLowerCase(),
    );
  }

  return false;
}

function getText(row: AnyRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return fallback;
}

function getPressType(value: string): PressItem["type"] {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("video")) return "video";
  if (normalized.includes("photo") || normalized.includes("image")) {
    return "photo";
  }
  if (normalized.includes("story")) return "story";
  if (normalized.includes("announcement") || normalized.includes("news")) {
    return "announcement";
  }
  if (normalized.includes("quote") || normalized.includes("testimonial")) {
    return "quote";
  }

  return "article";
}

function formatDate(value?: string | null) {
  if (!value) return "Coming soon";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Coming soon";

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTypeIcon(type: PressItem["type"]) {
  if (type === "video") return <PlayCircle size={18} />;
  if (type === "photo") return <ImageIcon size={18} />;
  if (type === "story") return <HeartHandshake size={18} />;
  if (type === "announcement") return <Megaphone size={18} />;
  if (type === "quote") return <Quote size={18} />;
  return <Newspaper size={18} />;
}

function getTypeLabel(type: PressItem["type"]) {
  if (type === "video") return "Video";
  if (type === "photo") return "Photo";
  if (type === "story") return "Story";
  if (type === "announcement") return "Announcement";
  if (type === "quote") return "Quote";
  return "Article";
}

async function safeAdminQuery(
  query: PromiseLike<SafeAdminQueryResponse>,
  label: string,
): Promise<SafeAdminQueryResponse> {
  try {
    const result = await query;

    if (result.error) {
      console.warn(`Press query skipped for ${label}:`, result.error);
      return { data: [], error: null };
    }

    return result;
  } catch (error) {
    console.warn(`Press query skipped for ${label}:`, error);
    return { data: [], error: null };
  }
}

function mapPressRow(row: AnyRow, index: number): PressItem {
  const type = getPressType(
    getText(row, ["type", "content_type", "press_type", "category"], "article"),
  );

  return {
    id:
      getText(row, ["id", "slug", "press_id"], `press-item-${index}`) ||
      `press-item-${index}`,
    title: getText(row, ["title", "headline", "name"], "SitGuru Press Update"),
    eyebrow: getText(
      row,
      ["eyebrow", "category", "press_category", "label"],
      getTypeLabel(type),
    ),
    description: getText(
      row,
      ["description", "summary", "excerpt", "body", "content", "notes"],
      "Positive SitGuru press, story, update, or media item.",
    ),
    type,
    href:
      getText(row, ["href", "url", "link", "external_url", "article_url"]) ||
      "/press",
    imageUrl:
      getText(row, [
        "image_url",
        "photo_url",
        "thumbnail_url",
        "cover_image_url",
        "media_url",
      ]) || "/images/homepage/sitguru-dog-walking-hero.jpg",
    source: getText(row, ["source", "publisher", "publication"], "SitGuru"),
    publishedAt:
      getText(row, [
        "published_at",
        "publish_date",
        "date",
        "created_at",
        "updated_at",
      ]) || null,
    isFeatured:
      asBoolean(row.is_featured) ||
      asBoolean(row.featured) ||
      asBoolean(row.is_pinned),
  };
}

async function getPressItems() {
  const [pressItemsResult, pressStoriesResult, mediaKitResult] =
    await Promise.all([
      safeAdminQuery(
        supabaseAdmin
          .from("press_items")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(100),
        "press_items",
      ),
      safeAdminQuery(
        supabaseAdmin
          .from("press_stories")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        "press_stories",
      ),
      safeAdminQuery(
        supabaseAdmin
          .from("media_kit")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        "media_kit",
      ),
    ]);

  const rows = [
    ...(((pressItemsResult.data || []) as AnyRow[]).filter(Boolean)),
    ...(((pressStoriesResult.data || []) as AnyRow[]).filter(Boolean)),
    ...(((mediaKitResult.data || []) as AnyRow[]).filter(Boolean)),
  ];

  const mappedRows = rows.map(mapPressRow);

  return mappedRows.length ? mappedRows : fallbackPressItems;
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function PressCard({ item }: { item: PressItem }) {
  const isExternal =
    item.href.startsWith("http://") || item.href.startsWith("https://");

  return (
    <article className="group overflow-hidden rounded-[32px] border border-[#e3ece5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
      <div className="relative h-64 overflow-hidden bg-green-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-black text-green-900 shadow-sm backdrop-blur">
            {getTypeIcon(item.type)}
            {getTypeLabel(item.type)}
          </span>

          {item.isFeatured ? (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900 shadow-sm">
              Featured
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
          {item.eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-green-950">
          {item.title}
        </h2>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {item.description}
        </p>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#edf3ee] pt-4">
          <div>
            <p className="text-xs font-black text-slate-900">{item.source}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatDate(item.publishedAt)}
            </p>
          </div>

          <Link
            href={item.href}
            className="inline-flex items-center gap-2 rounded-2xl bg-green-800 px-4 py-2.5 text-sm font-black text-white transition hover:bg-green-900"
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noreferrer" : undefined}
          >
            View
            {isExternal ? <ExternalLink size={15} /> : <ArrowRight size={15} />}
          </Link>
        </div>
      </div>
    </article>
  );
}

function MediaTypeCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>

      <h3 className="text-lg font-black text-slate-950">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-green-800">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function PressPage() {
  const pressItems = await getPressItems();
  const featuredItems = pressItems.filter((item) => item.isFeatured);
  const visibleFeatured = featuredItems.length
    ? featuredItems.slice(0, 2)
    : pressItems.slice(0, 2);

  const remainingItems = pressItems.filter(
    (item) => !visibleFeatured.some((featured) => featured.id === item.id),
  );

  return (
    <main className="min-h-screen bg-[#f9faf5]">
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              <Newspaper size={15} />
              SitGuru Press
            </div>

            <h1 className="max-w-5xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Positive stories, quality care, and community impact.
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/85">
              Follow SitGuru news, stories, videos, photos, articles, care
              quality updates, program highlights, and community impact as we
              grow a trusted pet care marketplace.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-green-950 shadow-xl shadow-black/20 transition hover:bg-green-50"
              >
                Contact Press
                <Mail size={18} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                View Programs
                <HeartHandshake size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Articles
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Stories
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Videos
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Pictures
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Quality care
              </span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[28px] bg-white p-6 text-slate-950">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <Sparkles size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Press Focus
                  </p>
                  <h2 className="text-2xl font-black text-green-950">
                    Reputation through trust.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Trusted pet care and better customer confidence",
                  "Guru training, readiness, and service quality",
                  "Military, Student, and Community program pathways",
                  "Local stories, partnerships, photos, videos, and positive care moments",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-sm font-bold text-slate-600"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={17}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/contact"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Send Press Inquiry
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MediaTypeCard
            icon={<Newspaper size={22} />}
            title="Articles"
            description="Add published stories, blog posts, company updates, market news, and positive press mentions."
          />
          <MediaTypeCard
            icon={<HeartHandshake size={22} />}
            title="Stories"
            description="Highlight pet parent stories, Guru stories, partner stories, program wins, and local impact."
          />
          <MediaTypeCard
            icon={<PlayCircle size={22} />}
            title="Videos"
            description="Feature interviews, care moments, launch clips, program explainers, and community videos."
          />
          <MediaTypeCard
            icon={<Camera size={22} />}
            title="Pictures"
            description="Showcase pet care photos, Guru moments, events, partnerships, program photos, and brand images."
          />
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Reputation and Quality Care
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Press should strengthen SitGuru’s trust story.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                Use this page to share positive information that helps pet
                parents, Gurus, partners, investors, and communities understand
                SitGuru’s mission, quality care standards, safety focus, and
                community value.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Great press topics"
                items={[
                  "Quality pet care",
                  "Trust and safety",
                  "Guru readiness",
                  "Customer confidence",
                  "Community workforce pathways",
                ]}
              />

              <InfoList
                title="Content to add"
                items={[
                  "Articles",
                  "Stories",
                  "Videos",
                  "Photos",
                  "Founder updates",
                  "Partner announcements",
                ]}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Featured Press
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
              SitGuru highlights and positive stories.
            </h2>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
              Add press items in Supabase through `press_items`,
              `press_stories`, or `media_kit`. Articles, videos, photos, and
              stories can appear here automatically.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {visibleFeatured.map((item) => (
              <PressCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Press Library
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
              Articles, stories, videos, pictures, and updates.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {remainingItems.length ? (
              remainingItems.map((item) => (
                <PressCard key={item.id} item={item} />
              ))
            ) : (
              fallbackPressItems.map((item) => (
                <PressCard key={item.id} item={item} />
              ))
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-[#e3ece5] bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Media Kit
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Share SitGuru’s story clearly.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                This page can support press kits, founder bios, care quality
                information, brand photos, program details, downloadable
                resources, and story ideas for media and partners.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Request Media Kit
                  <Download size={17} />
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  About SitGuru
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Media assets"
                items={[
                  "Brand images",
                  "Logo files",
                  "Founder photos",
                  "Care photos",
                  "Program photos",
                ]}
              />
              <InfoList
                title="Story ideas"
                items={[
                  "Trusted pet care marketplace",
                  "Guru graduation pathways",
                  "Community hiring programs",
                  "Partner network growth",
                  "Quality care standards",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-green-100 bg-green-950 p-6 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Press and Media Inquiries
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Want to feature SitGuru?
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-white/75">
                Contact SitGuru for press stories, media requests, interviews,
                launch coverage, community program information, partner
                announcements, and positive care stories.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
              >
                Contact Press
                <Mail size={17} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                View Programs
                <HeartHandshake size={17} />
              </Link>
            </div>
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">
            Supabase coordination:
          </span>{" "}
          this page safely reads `press_items`, `press_stories`, and
          `media_kit` when those tables exist. Add rows with fields like
          `title`, `description`, `type`, `image_url`, `href`, `source`,
          `published_at`, and `is_featured` to show articles, stories, videos,
          photos, and media resources.
        </div>
      </div>
    </main>
  );
}