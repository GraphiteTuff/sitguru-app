// app/guru/success-center/page.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ResourceType = "guide" | "tip" | "policy" | "form" | "video";

type GuruSuccessResourceRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: ResourceType;
  status: "draft" | "published";
  tags: string[] | null;
  keywords: string[] | null;
  video_url: string | null;
  thumbnail_url: string | null;
  href: string | null;
  featured: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type GuruResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ResourceType;
  tags: string[];
  keywords: string[];
  href?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  featured?: boolean;
  sortOrder?: number;
};

type SearchIntent =
  | "bookings"
  | "earnings"
  | "profile"
  | "reviews"
  | "care"
  | "payments"
  | "communication"
  | "safety"
  | "training"
  | "forms"
  | "general";

const fallbackGuruResources: GuruResource[] = [
  {
    id: "profile-setup",
    title: "Create a stronger Guru profile",
    description:
      "Improve your profile photo, bio, services, service area, trust signals, care details, and review-readiness so Pet Parents feel confident booking you.",
    category: "Profile Growth",
    type: "guide",
    tags: ["Profile", "Trust", "Photos", "Bio"],
    keywords: ["profile", "bio", "photo", "photos", "about me", "trust", "reviews", "ratings", "stand out"],
    featured: true,
    sortOrder: 10,
  },
  {
    id: "reviews-trust-signals",
    title: "Reviews, ratings, and trust signals",
    description:
      "Learn how completed booking reviews work, how Pet Parents rate care, how ratings appear on public Guru profiles, and how to use feedback to grow trust.",
    category: "Reviews",
    type: "guide",
    tags: ["Reviews", "Ratings", "Trust", "Public Profile"],
    keywords: ["review", "reviews", "rating", "ratings", "stars", "feedback", "would book again", "trust", "public profile", "new guru"],
    featured: true,
    sortOrder: 12,
  },
  {
    id: "bookings-command-center",
    title: "Use the Bookings & PawReports command center",
    description:
      "Learn how to open a booking, message the Pet Parent, start or continue a PawReport, begin a live walk, add updates, and complete the care summary.",
    category: "Bookings",
    type: "guide",
    tags: ["Bookings", "PawReports", "Messages", "Live Walk"],
    keywords: ["booking", "bookings", "pawreport", "paw report", "start pawreport", "continue pawreport", "live walk", "message pet parent"],
    featured: true,
    sortOrder: 15,
  },
  {
    id: "earn-more",
    title: "Increase bookings and earnings",
    description:
      "Use availability, fast replies, repeat-client habits, smart pricing, My Calendar, and strong service quality to grow your Guru business.",
    category: "Earnings",
    type: "tip",
    tags: ["Bookings", "Profit", "Growth", "Repeat Clients"],
    keywords: ["earn", "earnings", "money", "profit", "pricing", "rate", "increase", "more bookings", "repeat clients", "grow"],
    featured: true,
    sortOrder: 20,
  },
  {
    id: "pawreport-live-walk",
    title: "PawReport Live and live walk tracking",
    description:
      "Start PawReport Live from a booking, start or pause a walk, resume when needed, end the walk, and save distance, duration, photos, notes, and care updates for the Pet Parent.",
    category: "PawReport",
    type: "guide",
    tags: ["PawReport Live", "Live Walk", "GPS", "Care Updates"],
    keywords: ["pawreport live", "live walk", "walk tracking", "gps", "start walk", "pause walk", "resume walk", "end walk", "distance", "duration", "location"],
    featured: true,
    sortOrder: 22,
  },
  {
    id: "pawreport-mastery",
    title: "SitGuru PawReport™ Mastery",
    description:
      "Learn how to start, update, and complete PawReports that reassure Pet Parents, improve reviews, and create a premium care experience.",
    category: "PawReport",
    type: "guide",
    tags: ["PawReport", "Photos", "Care Notes", "Updates"],
    keywords: ["pawreport", "paw report", "visit updates", "photos", "potty", "pee", "poop", "food", "water", "mood", "play", "medication", "care notes", "complete report"],
    featured: true,
    sortOrder: 25,
  },
  {
    id: "my-calendar-pricing",
    title: "My Calendar, pricing, and service rules",
    description:
      "Use My Calendar to manage service pricing, daily custom prices, peak-time pricing, multi-pet settings, multi-day discounts, and when you are available for care.",
    category: "Earnings",
    type: "guide",
    tags: ["My Calendar", "Pricing", "Availability", "Services"],
    keywords: ["calendar", "my calendar", "availability", "pricing", "daily price", "peak", "multi pet", "multi-day", "discount", "service rates"],
    featured: true,
    sortOrder: 28,
  },
  {
    id: "visit-checklist",
    title: "Before every visit checklist",
    description:
      "Confirm care instructions, access details, feeding, medication, emergency contacts, routines, walk expectations, and update expectations before every visit.",
    category: "Care Standards",
    type: "guide",
    tags: ["Care", "Checklist", "Visit", "Safety"],
    keywords: ["visit", "checklist", "before", "care", "feeding", "medication", "routine", "instructions", "access", "keys", "walk"],
    featured: true,
    sortOrder: 30,
  },
  {
    id: "communication",
    title: "Communicating with Pet Parents",
    description:
      "Use clear, warm, professional messages before, during, and after each booking to build trust and encourage repeat clients.",
    category: "Communication",
    type: "guide",
    tags: ["Messages", "Updates", "Trust", "Clients"],
    keywords: ["message", "messages", "communicate", "communication", "updates", "pet parent", "client", "difficult", "concern"],
    featured: true,
    sortOrder: 40,
  },
  {
    id: "sitguru-only-payments",
    title: "SitGuru-only payments and payout setup",
    description:
      "Learn how Pet Parents pay for services through SitGuru only, how Gurus set up Stripe payouts, how tips and credits are tracked, and why off-platform payments are not used for SitGuru bookings.",
    category: "Payments",
    type: "policy",
    tags: ["Payments", "Stripe", "Payouts", "Tips", "Credits"],
    keywords: ["payment", "payments", "checkout", "stripe", "payout", "tip", "tips", "credit", "promo", "gift card", "pawperks", "petperks", "off platform", "venmo", "zelle", "cash app", "paypal", "cash"],
    featured: true,
    sortOrder: 48,
  },
  {
    id: "payments",
    title: "Payments, payouts, and referral earnings",
    description:
      "Understand SitGuru-only checkout, Stripe payout setup, booking earnings, optional tips, referral rewards, pending earnings, approved commissions, and how money is tracked.",
    category: "Payments",
    type: "policy",
    tags: ["Payments", "Payouts", "Referrals", "Commissions"],
    keywords: ["payment", "payments", "payout", "paid", "commission", "referral", "referrals", "money", "pending", "approved"],
    sortOrder: 50,
  },
  {
    id: "safety",
    title: "Pet safety and emergency basics",
    description:
      "Know what to do when something feels unsafe, a pet seems sick, access fails, GPS permissions do not work, instructions are unclear, or urgent support is needed.",
    category: "Trust & Safety",
    type: "guide",
    tags: ["Safety", "Emergency", "Support", "Trust"],
    keywords: ["safe", "safety", "emergency", "urgent", "hurt", "sick", "problem", "incident", "support", "danger", "gps", "location"],
    sortOrder: 60,
  },
  {
    id: "forms",
    title: "Forms and templates",
    description:
      "A future area for visit notes, intake forms, pet routine forms, client message templates, and printable Guru documents.",
    category: "Forms",
    type: "form",
    tags: ["Forms", "Templates", "Notes", "Documents"],
    keywords: ["form", "forms", "template", "templates", "notes", "intake", "document", "printable"],
    sortOrder: 70,
  },
  {
    id: "training-videos",
    title: "Guru Training Videos",
    description:
      "A future YouTube-style library for training lessons, profile coaching, PawReport Live walkthroughs, care standards, safety tips, and earnings guidance.",
    category: "Training Videos",
    type: "video",
    tags: ["Videos", "Training", "Academy", "Lessons"],
    keywords: ["video", "videos", "training", "watch", "lesson", "academy", "youtube", "learn"],
    featured: true,
    sortOrder: 80,
  },
];

const quickSearches = [
  "How do I start a PawReport?",
  "How do I start and stop a live walk?",
  "How do reviews and ratings work?",
  "How do Pet Parents see my updates?",
  "How do I get more bookings?",
  "How do I use My Calendar and pricing?",
  "How can I improve my profile?",
  "What should I do before a visit?",
  "How do I create a great PawReport?",
  "How do payments work?",
  "How do Pet Parents pay through SitGuru only?",
  "How do I set up Stripe payouts?",
  "Can I accept Venmo, Zelle, PayPal, Cash App, or cash?",
  "How should I message a Pet Parent?",
  "What should I do in an emergency?",
  "Where will training videos go?",
];

const fallbackCategories = [
  "Bookings",
  "PawReport",
  "Earnings",
  "Profile Growth",
  "Reviews",
  "Care Standards",
  "Communication",
  "Payments",
  "Training Videos",
  "Forms",
  "Trust & Safety",
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function mapRowToResource(row: GuruSuccessResourceRow): GuruResource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.resource_type,
    tags: row.tags || [],
    keywords: row.keywords || [],
    href: row.href || undefined,
    videoUrl: row.video_url || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    featured: row.featured,
    sortOrder: row.sort_order || 0,
  };
}

function getResourceTypeLabel(type: ResourceType) {
  const labels: Record<ResourceType, string> = {
    guide: "Guide",
    tip: "Tip",
    policy: "Policy",
    form: "Form",
    video: "Video",
  };

  return labels[type];
}

function detectIntent(query: string): SearchIntent {
  const value = normalize(query);

  if (!value) return "general";

  if (/(pawreport|paw report|visit update|visit updates|photo update|potty update)/.test(value)) {
    return "care";
  }

  if (/(booking|bookings|client|clients|repeat|request|requests|calendar|availability)/.test(value)) {
    return "bookings";
  }

  if (/(earn|earning|earnings|profit|money|pricing|price|rate|payout|income|revenue)/.test(value)) {
    return "earnings";
  }

  if (/(review|reviews|rating|ratings|stars|feedback|would book again|trust signal|public review|new guru)/.test(value)) {
    return "reviews";
  }

  if (/(profile|bio|photo|photos|trust|stand out)/.test(value)) {
    return "profile";
  }

  if (/(care|visit|walk|feeding|feed|medication|medicine|routine|checklist|instructions)/.test(value)) {
    return "care";
  }

  if (/(payment|payments|paid|payout|commission|referral|pending|approved)/.test(value)) {
    return "payments";
  }

  if (/(message|messages|communicate|communication|update|updates|pet parent|difficult|concern)/.test(value)) {
    return "communication";
  }

  if (/(safe|safety|emergency|urgent|hurt|sick|incident|support|danger|problem)/.test(value)) {
    return "safety";
  }

  if (/(video|videos|training|lesson|academy|watch|learn)/.test(value)) {
    return "training";
  }

  if (/(form|forms|template|templates|note|notes|intake|document)/.test(value)) {
    return "forms";
  }

  return "general";
}

function getAssistantAnswer(query: string, matches: GuruResource[]) {
  const intent = detectIntent(query);

  const answers: Record<SearchIntent, string> = {
    bookings:
      "To manage bookings well, open the Bookings & PawReports page, select the booking, and use the command center to message the Pet Parent, start or continue PawReport Live, start a walk when needed, add updates, and complete the visit summary. To get more bookings, keep availability, pricing, profile details, and replies current.",
    earnings:
      "To increase earnings, focus on reliable availability, repeat clients, strong reviews, fast replies, smart pricing, and excellent care. Use My Calendar to manage services, daily prices, peak-time pricing, multi-pet settings, and discounts so Pet Parents see clear care options.",
    profile:
      "A strong Guru profile should quickly show who you are, where you serve, what care you provide, and why pet parents can trust you. Use a clear photo, warm bio, specific services, and details that make you feel dependable.",
    reviews:
      "Reviews are earned after completed bookings. Pet Parents can rate the care, write feedback, and mark whether they would book again. To earn stronger reviews, communicate clearly, arrive prepared, use PawReport Live, track walks when relevant, add photos and care updates, and complete a thoughtful final summary.",
    care:
      "Before every visit, confirm access instructions, feeding, medication, routines, emergency contacts, walk expectations, and PawReport expectations. During care, use PawReport Live for photos, potty updates, food, water, play, mood, medication, notes, and live walk tracking when a walk is part of the booking.",
    payments:
      "For payment questions, keep everything inside SitGuru. Pet Parents should pay through SitGuru checkout only, using the available checkout options such as card, Apple Pay, Google Pay, Link by Stripe, saved methods, credits, promo codes, gift cards, or optional tips when available. Gurus should complete Stripe payout setup and should not request cash, Venmo, Zelle, Cash App, PayPal, direct bank transfer, personal card readers, or other off-platform payments for SitGuru bookings. Check payout timing, pending versus approved earnings, referral rewards, tips, and booking history from your dashboard.",
    communication:
      "Great communication is fast, friendly, and specific. Confirm details before the visit, use PawReport Live during care, send helpful notes and photos, and stay calm and professional if a Pet Parent has a concern.",
    safety:
      "For safety or emergency issues, prioritize the pet’s wellbeing, follow the pet parent’s instructions, use emergency contacts when needed, and contact support when something feels unsafe, unclear, or urgent.",
    training:
      "Training videos will live here as a YouTube-style library with thumbnails, titles, descriptions, categories, and featured lessons. This will let Gurus learn care, profile, safety, communication, and earnings skills over time.",
    forms:
      "Forms and templates can help Gurus stay organized. Good future forms include visit notes, pet intake forms, routine checklists, message templates, and printable care documents.",
    general:
      matches.length > 0
        ? "Here are the most relevant Guru resources I found. Use the cards below to learn, improve care, build trust, and grow your earnings."
        : "I could not find an exact match yet. Try searching for bookings, earnings, profile, payments, care, safety, training videos, or forms.",
  };

  return answers[intent];
}

function getSearchScore(resource: GuruResource, query: string) {
  const value = normalize(query);

  if (!value) return resource.featured ? 8 : 4;

  const words = value.split(/\s+/).filter(Boolean);
  const haystack = normalize(
    [
      resource.title,
      resource.description,
      resource.category,
      resource.type,
      ...resource.tags,
      ...resource.keywords,
    ].join(" "),
  );

  let score = 0;

  if (haystack.includes(value)) score += 10;

  for (const word of words) {
    if (word.length < 3) continue;
    if (haystack.includes(word)) score += 2;
  }

  for (const keyword of resource.keywords) {
    const normalizedKeyword = normalize(keyword);

    if (value.includes(normalizedKeyword) || normalizedKeyword.includes(value)) {
      score += 4;
    }
  }

  if (resource.featured) score += 1;

  return score;
}

function getSuggestedNextSteps(intent: SearchIntent) {
  const base = {
    bookings: ["Update your availability", "Improve your profile", "Reply quickly to new requests"],
    earnings: ["Review your pricing", "Encourage repeat bookings", "Improve your service quality"],
    profile: ["Add a friendly profile photo", "Rewrite your bio", "Highlight your care experience"],
    reviews: ["Deliver five-star care", "Use PawReport Live well", "Politely remind Pet Parents to review completed bookings"],
    care: ["Confirm visit instructions", "Check emergency contacts", "Send a visit update"],
    payments: ["Complete Stripe payout setup", "Keep Pet Parent payments inside SitGuru", "Review payouts, tips, credits, and referral rewards"],
    communication: ["Confirm details before care", "Send friendly updates", "Use calm professional replies"],
    safety: ["Follow pet parent instructions", "Use emergency contacts", "Contact support if urgent"],
    training: ["Watch featured lessons", "Browse training categories", "Save videos for onboarding"],
    forms: ["Use visit notes", "Create intake forms", "Save message templates"],
    general: ["Search by topic", "Browse featured resources", "Open quick help questions"],
  };

  return base[intent];
}

function sortResources(resources: GuruResource[]) {
  return [...resources].sort((a, b) => {
    const featuredDifference = Number(Boolean(b.featured)) - Number(Boolean(a.featured));

    if (featuredDifference !== 0) return featuredDifference;

    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`sgsc-card ${className}`}>{children}</div>;
}

export default function GuruSuccessCenterPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [resources, setResources] = useState<GuruResource[]>(fallbackGuruResources);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceLoadError, setResourceLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPublishedResources() {
      setLoadingResources(true);
      setResourceLoadError("");

      const { data, error } = await supabase
        .from("guru_success_resources")
        .select(
          "id,title,description,category,resource_type,status,tags,keywords,video_url,thumbnail_url,href,featured,sort_order,created_at,updated_at",
        )
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setResourceLoadError("Using starter resources until the live resource library is available.");
        setResources(fallbackGuruResources);
        setLoadingResources(false);
        return;
      }

      const liveResources = ((data || []) as GuruSuccessResourceRow[]).map(mapRowToResource);

      setResources(liveResources.length > 0 ? liveResources : fallbackGuruResources);
      setLoadingResources(false);
    }

    loadPublishedResources();

    return () => {
      mounted = false;
    };
  }, []);

  const activeIntent = detectIntent(submittedQuery);

  const categories = useMemo(() => {
    const liveCategories = Array.from(new Set(resources.map((resource) => resource.category))).filter(Boolean);
    const combined = Array.from(new Set([...fallbackCategories, ...liveCategories]));

    return combined;
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!submittedQuery.trim()) {
      return sortResources(resources);
    }

    return resources
      .map((resource) => ({
        resource,
        score: getSearchScore(resource, submittedQuery),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.resource);
  }, [submittedQuery, resources]);

  const assistantAnswer = getAssistantAnswer(submittedQuery, filteredResources);
  const nextSteps = getSuggestedNextSteps(activeIntent);
  const featuredResources = useMemo(() => {
    const featured = resources.filter((resource) => resource.featured);

    return sortResources(featured.length > 0 ? featured : resources).slice(0, 6);
  }, [resources]);

  const videoResources = resources.filter((resource) => resource.type === "video").slice(0, 4);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function runSearch(value: string) {
    setQuery(value);
    setSubmittedQuery(value);
  }

  return (
    <main className="sgsc-page">
      <section className="sgsc-shell">
        <div className="sgsc-topbar">
          <div>
            <p className="sgsc-eyebrow">Guru Support</p>
            <div role="heading" aria-level={1} className="sgsc-page-title">
              Guru Success Center
            </div>
            <p className="sgsc-page-copy">
              Search answers, training videos, forms, resources, and tips to help you provide
              excellent care, grow your bookings, and earn more.
            </p>
          </div>

          <Link href="/guru/dashboard" className="sgsc-back-link">
            Back to dashboard
          </Link>
        </div>

        {resourceLoadError ? (
          <div className="sgsc-notice">{resourceLoadError}</div>
        ) : null}

        <Card className="sgsc-hero-card">
          <div className="sgsc-hero">
            <p className="sgsc-hero-kicker">Ask Guru Search</p>
            <div role="heading" aria-level={2} className="sgsc-hero-title">
              How can we help you become a better Guru today?
            </div>
            <p className="sgsc-hero-copy">
              Ask about bookings, pet care, pricing, payments, policies, training, forms,
              communication, safety, or growing as a Guru.
            </p>

            <form onSubmit={handleSubmit} className="sgsc-search-form">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask anything about becoming a better Guru..."
                className="sgsc-search-input"
              />
              <button type="submit" className="sgsc-search-button">
                Search
              </button>
            </form>

            <div className="sgsc-quick-row">
              {quickSearches.slice(0, 4).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => runSearch(item)}
                  className="sgsc-quick-pill"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="sgsc-category-strip">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => runSearch(category)}
                className="sgsc-category-button"
              >
                {category}
              </button>
            ))}
          </div>

          {submittedQuery ? (
            <div className="sgsc-answer-wrap">
              <p className="sgsc-muted-label">Search result for</p>
              <div role="heading" aria-level={3} className="sgsc-result-title">
                “{submittedQuery}”
              </div>

              <div className="sgsc-answer-box">
                <p className="sgsc-answer-label">Guru Assistant Answer</p>
                <p className="sgsc-answer-text">{assistantAnswer}</p>

                <div className="sgsc-next-steps">
                  {nextSteps.map((step) => (
                    <span key={step} className="sgsc-next-step">
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
        <Card className="sgsc-pawreport-card">
          <div className="sgsc-pawreport-hero">
            <div>
              <p className="sgsc-pawreport-kicker">Signature SitGuru Feature</p>
              <div role="heading" aria-level={2} className="sgsc-pawreport-title">
                PawReport Live + Live Walk Tracking
              </div>
              <p className="sgsc-pawreport-copy">
                PawReport Live is the Guru's care command center. It lets you start a booking update,
                track walks when walking is part of the service, add photos and care notes, and give
                Pet Parents a clear real-time view from their dashboard.
              </p>
            </div>

            <div className="sgsc-pawreport-badge">🐾 Live Care Ready</div>
          </div>

          <div className="sgsc-pawreport-layout">
            <div className="sgsc-pawreport-panel">
              <p className="sgsc-muted-label">How Gurus use it</p>
              <div className="sgsc-pawreport-steps">
                {[
                  ["1", "Open the booking", "Go to Bookings & PawReports, select the booking, and choose Start PawReport / Live Walk."],
                  ["2", "Start PawReport Live", "Start it when care begins so the Pet Parent can see that the visit is active."],
                  ["3", "Start or end walks", "Use Start Walk, Pause, Resume, and End Walk when walking is part of the service."],
                  ["4", "Add real care updates", "Log photos, pee, poop, food, water, medication, mood, play, and care notes as needed."],
                  ["5", "Complete the summary", "End with a warm final note so the PawReport is saved to booking history."],
                ].map(([number, title, copy]) => (
                  <div key={title} className="sgsc-pawreport-step">
                    <span>{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sgsc-pawreport-panel sgsc-pawreport-panel-soft">
              <p className="sgsc-muted-label">Five-star live care checklist</p>
              <div className="sgsc-pawreport-checks">
                {[
                  "Start PawReport Live when care begins",
                  "Allow location access before starting a live walk",
                  "Use Start Walk and End Walk for walk distance and duration",
                  "Upload at least one clear photo when appropriate",
                  "Record potty, food, water, medication, mood, or play updates when relevant",
                  "Write a specific final note with the pet's name and how the visit went",
                ].map((item) => (
                  <div key={item} className="sgsc-pawreport-check">
                    <span>✓</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="sgsc-pawreport-panel sgsc-pawreport-example">
              <p className="sgsc-muted-label">Example final note</p>
              <p>
                Scout had a great visit today. We completed a 22-minute walk, he went pee,
                drank fresh water, and enjoyed some playtime afterward. He seemed happy,
                comfortable, and relaxed when I left. I saved the photos and walk summary here.
              </p>
            </div>
          </div>
        </Card>

        <Card className="sgsc-pawreport-card">
          <div className="sgsc-pawreport-hero">
            <div>
              <p className="sgsc-pawreport-kicker">Reviews & Trust Signals</p>
              <div role="heading" aria-level={2} className="sgsc-pawreport-title">
                Turn completed bookings into real Guru trust.
              </div>
              <p className="sgsc-pawreport-copy">
                Reviews help Pet Parents choose care and help Gurus grow their SitGuru reputation.
                After completed bookings, Pet Parents can leave star ratings, written feedback, and
                a would-book-again signal. Your public profile should show real reviews only, or
                New Guru when no reviews have been submitted yet.
              </p>
            </div>

            <div className="sgsc-pawreport-badge">⭐ Review Ready</div>
          </div>

          <div className="sgsc-pawreport-layout">
            <div className="sgsc-pawreport-panel">
              <p className="sgsc-muted-label">How Gurus earn better reviews</p>
              <div className="sgsc-pawreport-steps">
                {[
                  ["1", "Confirm expectations", "Before care begins, confirm access, timing, feeding, medication, walking, and PawReport expectations."],
                  ["2", "Use PawReport Live", "Start the PawReport, add updates, and track walks when walking is part of the service."],
                  ["3", "Communicate clearly", "Keep messages warm, timely, specific, and professional before, during, and after care."],
                  ["4", "Complete the summary", "End with a specific final note that explains what happened and how the pet did."],
                  ["5", "Learn from feedback", "Use reviews to improve your profile, communication, timing, photos, and care routine."],
                ].map(([number, title, copy]) => (
                  <div key={title} className="sgsc-pawreport-step">
                    <span>{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sgsc-pawreport-panel sgsc-pawreport-panel-soft">
              <p className="sgsc-muted-label">What Pet Parents review</p>
              <div className="sgsc-pawreport-checks">
                {[
                  "Star rating for the completed booking",
                  "Written feedback about communication and care quality",
                  "Whether they would book again",
                  "How useful PawReport Live updates were",
                  "Whether walk tracking, photos, and notes matched expectations",
                ].map((item) => (
                  <div key={item} className="sgsc-pawreport-check">
                    <span>✓</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="sgsc-pawreport-panel sgsc-pawreport-example">
              <p className="sgsc-muted-label">Friendly review reminder</p>
              <p>
                Thank you for trusting me with Scout today. I saved the PawReport with photos,
                updates, and the final walk summary. When you have a moment, your honest review
                helps other Pet Parents choose care and helps me keep improving.
              </p>
            </div>
          </div>
        </Card>


        <Card className="sgsc-pawreport-card">
          <div className="sgsc-pawreport-hero">
            <div>
              <p className="sgsc-pawreport-kicker">SitGuru-Only Payments</p>
              <div role="heading" aria-level={2} className="sgsc-pawreport-title">
                Set up payouts and keep every SitGuru booking payment inside SitGuru.
              </div>
              <p className="sgsc-pawreport-copy">
                SitGuru connects booking records, service pricing, tips, credits, PawReports,
                reviews, support, and payout tracking. That only works correctly when Pet Parents
                pay through SitGuru checkout and Gurus use Stripe payout setup for eligible earnings.
              </p>
            </div>

            <div className="sgsc-pawreport-badge">💳 SitGuru Pay Ready</div>
          </div>

          <div className="sgsc-pawreport-layout">
            <div className="sgsc-pawreport-panel">
              <p className="sgsc-muted-label">How Pet Parents pay</p>
              <div className="sgsc-pawreport-steps">
                {[
                  ["1", "Book through SitGuru", "Pet Parents choose a Guru, service, date, pet, care location, notes, and any available pricing options inside SitGuru."],
                  ["2", "Review checkout", "The checkout summary can include service subtotal, SitGuru fees when applicable, credits, promo codes, gift cards, SitGuru credit, and optional Guru tips."],
                  ["3", "Use SitGuru checkout only", "Payment options may include credit/debit card, Apple Pay, Google Pay, Link by Stripe, saved payment methods, ACH/bank when available, PawPerks/PetPerks credits, referral credits, promo codes, gift cards, or SitGuru credit."],
                  ["4", "Track from dashboard", "Receipts, booking status, messages, PawReports, walk summaries, final care notes, and reviews stay connected to the Pet Parent dashboard."],
                ].map(([number, title, copy]) => (
                  <div key={title} className="sgsc-pawreport-step">
                    <span>{number}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sgsc-pawreport-panel sgsc-pawreport-panel-soft">
              <p className="sgsc-muted-label">Guru payout setup</p>
              <div className="sgsc-pawreport-checks">
                {[
                  "Complete Guru onboarding, profile, service area, services, pricing, and My Calendar setup",
                  "Connect Stripe payout setup before eligible booking payouts, tips, commission, or referral earnings can be sent",
                  "Keep payout account details current and watch payout status from the dashboard",
                  "Use SitGuru booking records for earnings, tips, payout status, reviews, and support questions",
                  "Contact SitGuru support if a booking total, tip, Stripe account, or payout looks incorrect",
                ].map((item) => (
                  <div key={item} className="sgsc-pawreport-check">
                    <span>✓</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="sgsc-pawreport-panel sgsc-pawreport-example">
              <p className="sgsc-muted-label">Important payment policy</p>
              <p>
                Do not ask Pet Parents to pay outside SitGuru for SitGuru bookings. That means no cash,
                Venmo, Zelle, Cash App, PayPal, direct bank transfer, personal card reader, checks, or
                other outside payment arrangements. Keeping payment inside SitGuru protects the booking
                record, receipt, support history, PawReport, reviews, credits, tips, and payout tracking.
              </p>
            </div>
          </div>
        </Card>

        <div className="sgsc-grid">
          <div className="sgsc-main-column">
            <Card>
              <div className="sgsc-card-header">
                <div>
                  <p className="sgsc-muted-label">Featured</p>
                  <div role="heading" aria-level={2} className="sgsc-section-title">
                    Start here to grow your Guru business
                  </div>
                  <p className="sgsc-section-copy">
                    These are the highest-impact areas for better care, more trust, more bookings,
                    and stronger earnings.
                  </p>
                </div>
              </div>

              <div className="sgsc-feature-grid">
                {featuredResources.map((resource) => (
                  <article key={resource.id} className="sgsc-resource-card">
                    <div className="sgsc-resource-meta">
                      <span>{resource.category}</span>
                      <span>{getResourceTypeLabel(resource.type)}</span>
                    </div>

                    <div role="heading" aria-level={3} className="sgsc-resource-title">
                      {resource.title}
                    </div>
                    <p className="sgsc-resource-copy">{resource.description}</p>

                    <div className="sgsc-tag-row">
                      {resource.tags.map((tag) => (
                        <span key={tag} className="sgsc-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </Card>

            <Card>
              <div className="sgsc-card-header sgsc-card-header-row">
                <div>
                  <p className="sgsc-muted-label">Resource Library</p>
                  <div role="heading" aria-level={2} className="sgsc-section-title">
                    Browse Guru resources
                  </div>
                </div>
                <p className="sgsc-resource-count">
                  {loadingResources ? "Loading..." : `${filteredResources.length} resources`}
                </p>
              </div>

              <div className="sgsc-list">
                {filteredResources.length > 0 ? (
                  filteredResources.map((resource) => (
                    <article key={resource.id} className="sgsc-list-item">
                      <div>
                        <div className="sgsc-resource-meta">
                          <span>{resource.category}</span>
                          <span>{getResourceTypeLabel(resource.type)}</span>
                        </div>

                        <div role="heading" aria-level={3} className="sgsc-list-title">
                          {resource.title}
                        </div>
                        <p className="sgsc-list-copy">{resource.description}</p>
                      </div>

                      {resource.href ? (
                        <Link href={resource.href} className="sgsc-open-link">
                          Open
                        </Link>
                      ) : resource.videoUrl ? (
                        <a
                          href={resource.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sgsc-open-link"
                        >
                          Watch
                        </a>
                      ) : (
                        <span className="sgsc-coming-soon">Coming soon</span>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="sgsc-empty-state">
                    No exact resource match yet. This is a good topic to add to the Guru Success
                    Center library.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <aside className="sgsc-sidebar">
            <Card>
              <p className="sgsc-muted-label">Training Library</p>
              <div role="heading" aria-level={2} className="sgsc-section-title">
                Guru Training Videos
              </div>
              <p className="sgsc-section-copy">
                This area is ready to become a YouTube-style training library with thumbnails,
                titles, categories, descriptions, and featured lessons.
              </p>

              <div className="sgsc-video-list">
                {(videoResources.length > 0
                  ? videoResources
                  : [
                      {
                        id: "video-placeholder-1",
                        title: "How to Create a Great Guru Profile",
                        description: "Training video coming soon",
                        category: "Training Videos",
                        type: "video" as const,
                        tags: [],
                        keywords: [],
                      },
                      {
                        id: "video-placeholder-2",
                        title: "How to Communicate With Pet Parents",
                        description: "Training video coming soon",
                        category: "Training Videos",
                        type: "video" as const,
                        tags: [],
                        keywords: [],
                      },
                      {
                        id: "video-placeholder-3",
                        title: "How to Increase Bookings and Repeat Clients",
                        description: "Training video coming soon",
                        category: "Training Videos",
                        type: "video" as const,
                        tags: [],
                        keywords: [],
                      },
                    ]
                ).map((resource) => (
                  <article key={resource.id} className="sgsc-video-card">
                    <div
                      className="sgsc-video-thumb"
                      style={
                        resource.thumbnailUrl
                          ? {
                              backgroundImage: `url(${resource.thumbnailUrl})`,
                            }
                          : undefined
                      }
                    >
                      {resource.thumbnailUrl ? "" : "Video Thumbnail"}
                    </div>
                    <div className="sgsc-video-body">
                      <div role="heading" aria-level={3} className="sgsc-video-title">
                        {resource.title}
                      </div>
                      <p className="sgsc-video-copy">
                        {resource.videoUrl ? "Training video available" : resource.description}
                      </p>

                      {resource.videoUrl ? (
                        <a
                          href={resource.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sgsc-video-link"
                        >
                          Watch video
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </Card>

            <Card>
              <p className="sgsc-muted-label">Popular Questions</p>
              <div role="heading" aria-level={2} className="sgsc-section-title">
                Quick help
              </div>

              <div className="sgsc-question-list">
                {quickSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => runSearch(item)}
                    className="sgsc-question-button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </section>

      <style jsx global>{`
        .sgsc-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .sgsc-page *,
        .sgsc-page *::before,
        .sgsc-page *::after {
          box-sizing: border-box;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .sgsc-shell {
          width: min(100%, 1280px);
          margin: 0 auto;
          padding: 28px 20px 48px;
        }

        .sgsc-topbar,
        .sgsc-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
        }

        .sgsc-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 26px;
          margin-bottom: 18px;
        }

        .sgsc-notice {
          margin-bottom: 18px;
          border: 1px solid #fed7aa;
          border-radius: 20px;
          background: #fff7ed;
          color: #9a3412;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 750;
        }

        .sgsc-eyebrow,
        .sgsc-muted-label,
        .sgsc-hero-kicker,
        .sgsc-answer-label {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .sgsc-eyebrow,
        .sgsc-muted-label {
          color: #059669;
        }

        .sgsc-page-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 0.98;
          font-weight: 750;
          letter-spacing: -0.045em;
        }

        .sgsc-page-copy,
        .sgsc-section-copy,
        .sgsc-resource-copy,
        .sgsc-list-copy,
        .sgsc-video-copy,
        .sgsc-answer-text {
          color: #475569;
          line-height: 1.65;
        }

        .sgsc-page-copy {
          max-width: 780px;
          margin: 12px 0 0;
          font-size: 16px;
        }

        .sgsc-back-link,
        .sgsc-open-link,
        .sgsc-coming-soon,
        .sgsc-video-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          border-radius: 999px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }

        .sgsc-back-link {
          border: 1px solid #cbd5e1;
          color: #334155;
          background: #ffffff;
        }

        .sgsc-back-link:hover {
          background: #f8fafc;
        }

        .sgsc-card {
          padding: 24px;
        }

        .sgsc-hero-card {
          overflow: hidden;
          padding: 0;
          margin-bottom: 22px;
        }

        .sgsc-hero {
          padding: 34px;
          background:
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.24), transparent 32%),
            linear-gradient(135deg, #059669 0%, #10b981 48%, #0ea5e9 100%);
        }

        .sgsc-hero-kicker,
        .sgsc-hero-title,
        .sgsc-hero-copy {
          color: #ffffff;
        }

        .sgsc-hero-title {
          max-width: 820px;
          margin-top: 10px;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 0.98;
          font-weight: 760;
          letter-spacing: -0.055em;
        }

        .sgsc-hero-copy {
          max-width: 780px;
          margin: 18px 0 0;
          font-size: 17px;
          line-height: 1.55;
        }

        .sgsc-search-form {
          display: flex;
          gap: 10px;
          margin-top: 26px;
          padding: 10px;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
        }

        .sgsc-search-input {
          width: 100%;
          min-height: 56px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 0 18px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 600;
          outline: none;
        }

        .sgsc-search-input::placeholder {
          color: #94a3b8;
        }

        .sgsc-search-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
        }

        .sgsc-search-button {
          min-width: 118px;
          border: 0;
          border-radius: 18px;
          background: #0f172a;
          color: #ffffff;
          font-size: 15px;
          font-weight: 750;
          cursor: pointer;
        }

        .sgsc-search-button:hover {
          background: #020617;
        }

        .sgsc-quick-row,
        .sgsc-category-strip,
        .sgsc-tag-row,
        .sgsc-next-steps {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .sgsc-quick-row {
          margin-top: 18px;
        }

        .sgsc-quick-pill {
          border: 1px solid rgba(255, 255, 255, 0.36);
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          border-radius: 999px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .sgsc-quick-pill:hover {
          background: rgba(255, 255, 255, 0.28);
        }

        .sgsc-category-strip {
          padding: 18px 22px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }

        .sgsc-category-button {
          border: 1px solid #dbeafe;
          background: #eff6ff;
          color: #1e3a8a;
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .sgsc-category-button:hover {
          border-color: #10b981;
          background: #ecfdf5;
          color: #047857;
        }

        .sgsc-answer-wrap {
          padding: 26px;
          background: #ffffff;
        }

        .sgsc-result-title {
          margin-top: 6px;
          color: #0f172a;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 740;
          letter-spacing: -0.035em;
        }

        .sgsc-answer-box {
          margin-top: 16px;
          padding: 20px;
          border: 1px solid #bbf7d0;
          border-radius: 24px;
          background: #ecfdf5;
        }

        .sgsc-answer-label {
          color: #047857;
        }

        .sgsc-answer-text {
          margin: 8px 0 0;
          color: #164e3b;
          font-size: 15px;
        }

        .sgsc-next-steps {
          margin-top: 14px;
        }

        .sgsc-next-step {
          display: inline-flex;
          border-radius: 999px;
          background: #ffffff;
          color: #047857;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 750;
        }

        .sgsc-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
          gap: 22px;
          align-items: start;
        }

        .sgsc-main-column,
        .sgsc-sidebar {
          display: grid;
          gap: 22px;
        }

        .sgsc-card-header {
          margin-bottom: 20px;
        }

        .sgsc-card-header-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-end;
        }

        .sgsc-section-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.12;
          font-weight: 740;
          letter-spacing: -0.035em;
        }

        .sgsc-section-copy {
          margin: 9px 0 0;
          font-size: 15px;
        }

        .sgsc-feature-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .sgsc-resource-card,
        .sgsc-list-item,
        .sgsc-video-card,
        .sgsc-question-button,
        .sgsc-empty-state {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 24px;
        }

        .sgsc-resource-card {
          padding: 18px;
        }

        .sgsc-resource-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .sgsc-resource-meta span {
          display: inline-flex;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 750;
        }

        .sgsc-resource-title,
        .sgsc-list-title,
        .sgsc-video-title {
          color: #0f172a;
          font-weight: 740;
          letter-spacing: -0.025em;
        }

        .sgsc-resource-title {
          margin-top: 16px;
          font-size: 21px;
          line-height: 1.15;
        }

        .sgsc-resource-copy {
          margin: 10px 0 0;
          font-size: 14px;
        }

        .sgsc-tag-row {
          margin-top: 14px;
        }

        .sgsc-tag {
          display: inline-flex;
          border-radius: 999px;
          background: #ffffff;
          color: #64748b;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .sgsc-resource-count {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .sgsc-list {
          display: grid;
          gap: 14px;
        }

        .sgsc-list-item {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 18px;
        }

        .sgsc-list-title {
          margin-top: 13px;
          font-size: 20px;
          line-height: 1.15;
        }

        .sgsc-list-copy {
          margin: 8px 0 0;
          font-size: 14px;
        }

        .sgsc-open-link {
          align-self: flex-start;
          background: #059669;
          color: #ffffff;
        }

        .sgsc-coming-soon {
          align-self: flex-start;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .sgsc-empty-state {
          padding: 20px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .sgsc-video-list,
        .sgsc-question-list {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .sgsc-video-card {
          overflow: hidden;
        }

        .sgsc-video-thumb {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 128px;
          background-color: #0f172a;
          background-size: cover;
          background-position: center;
          color: #ffffff;
          font-size: 13px;
          font-weight: 750;
        }

        .sgsc-video-body {
          padding: 15px;
          background: #f8fafc;
        }

        .sgsc-video-title {
          font-size: 16px;
          line-height: 1.25;
        }

        .sgsc-video-copy {
          margin: 5px 0 0;
          font-size: 13px;
        }

        .sgsc-video-link {
          margin-top: 12px;
          background: #059669;
          color: #ffffff;
          padding: 9px 13px;
          font-size: 13px;
        }

        .sgsc-question-button {
          width: 100%;
          padding: 14px 15px;
          text-align: left;
          color: #0f172a;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 700;
          cursor: pointer;
        }

        .sgsc-question-button:hover {
          border-color: #10b981;
          background: #ecfdf5;
          color: #047857;
        }



        .sgsc-pawreport-card {
          overflow: hidden;
          padding: 0;
          margin-bottom: 22px;
          border-color: #bbf7d0;
        }

        .sgsc-pawreport-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 28px;
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 54%, #eff6ff 100%);
          border-bottom: 1px solid #d1fae5;
        }

        .sgsc-pawreport-kicker {
          margin: 0;
          color: #047857;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .sgsc-pawreport-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: clamp(28px, 3.3vw, 42px);
          line-height: 1.02;
          font-weight: 800;
          letter-spacing: -0.045em;
        }

        .sgsc-pawreport-copy {
          max-width: 820px;
          margin: 12px 0 0;
          color: #475569;
          font-size: 16px;
          line-height: 1.65;
          font-weight: 600;
        }

        .sgsc-pawreport-badge {
          flex: 0 0 auto;
          border: 1px solid #86efac;
          border-radius: 999px;
          background: #ffffff;
          color: #047857;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07);
        }

        .sgsc-pawreport-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: 18px;
          padding: 24px;
        }

        .sgsc-pawreport-panel {
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #f8fafc;
          padding: 20px;
        }

        .sgsc-pawreport-panel-soft {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .sgsc-pawreport-example {
          grid-column: 1 / -1;
          background: #ffffff;
        }

        .sgsc-pawreport-example p:last-child {
          margin: 10px 0 0;
          color: #334155;
          font-size: 15px;
          line-height: 1.7;
          font-weight: 650;
        }

        .sgsc-pawreport-steps,
        .sgsc-pawreport-checks {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .sgsc-pawreport-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border-radius: 18px;
          background: #ffffff;
          padding: 14px;
          border: 1px solid #e2e8f0;
        }

        .sgsc-pawreport-step > span {
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #059669;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          flex: 0 0 auto;
        }

        .sgsc-pawreport-step strong {
          display: block;
          color: #0f172a;
          font-size: 15px;
        }

        .sgsc-pawreport-step p,
        .sgsc-pawreport-check p {
          margin: 4px 0 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
        }

        .sgsc-pawreport-check {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border-radius: 16px;
          background: #ffffff;
          padding: 12px;
          border: 1px solid #d1fae5;
        }

        .sgsc-pawreport-check span {
          display: inline-flex;
          width: 24px;
          height: 24px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #dcfce7;
          color: #047857;
          font-size: 13px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        @media (max-width: 1024px) {
          .sgsc-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .sgsc-shell {
            padding: 18px 14px 38px;
          }

          .sgsc-topbar {
            flex-direction: column;
            align-items: stretch;
            padding: 22px;
          }

          .sgsc-hero {
            padding: 26px 20px;
          }

          .sgsc-search-form {
            flex-direction: column;
          }

          .sgsc-search-button {
            min-height: 52px;
            width: 100%;
          }

          .sgsc-feature-grid {
            grid-template-columns: 1fr;
          }

          .sgsc-list-item,
          .sgsc-card-header-row {
            flex-direction: column;
            align-items: stretch;
          }

          .sgsc-open-link,
          .sgsc-coming-soon {
            align-self: stretch;
          }
        }


        @media (max-width: 760px) {
          .sgsc-pawreport-hero {
            flex-direction: column;
            padding: 22px;
          }

          .sgsc-pawreport-badge {
            width: 100%;
            justify-content: center;
            text-align: center;
          }

          .sgsc-pawreport-layout {
            grid-template-columns: 1fr;
            padding: 18px;
          }

          .sgsc-pawreport-example {
            grid-column: auto;
          }
        }

      `}</style>
    </main>
  );
}
