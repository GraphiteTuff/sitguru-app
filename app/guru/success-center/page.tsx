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
  estimatedReadMinutes?: number;
  whyItMatters?: string;
  sections?: Array<{
    title: string;
    body: string;
    bullets?: string[];
  }>;
  checklist?: string[];
  script?: string;
  proTips?: string[];
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
      "Improve your photo, bio, services, service area, trust signals, care details, and booking confidence so Pet Parents feel comfortable choosing you.",
    category: "Profile Growth",
    type: "guide",
    tags: ["Profile", "Trust", "Photos", "Bio"],
    keywords: ["profile", "bio", "photo", "photos", "about me", "trust", "reviews", "ratings", "stand out", "service area", "zip code"],
    featured: true,
    sortOrder: 10,
    estimatedReadMinutes: 6,
    whyItMatters:
      "Your profile is your storefront. A clear, complete, warm profile helps Pet Parents understand who you are, where you serve, what you offer, and why they can trust you with their pet.",
    sections: [
      {
        title: "What a strong Guru profile should answer",
        body: "Pet Parents should be able to quickly understand your care style, your service area, your experience, and what makes you dependable.",
        bullets: [
          "Who you are and why you love caring for pets",
          "What city, state, ZIP code, and service area you serve",
          "Which services you offer and when you are normally available",
          "What types of pets, routines, and care situations you are comfortable with",
          "How you communicate before, during, and after care",
        ],
      },
      {
        title: "Profile photo guidance",
        body: "Use a clear, friendly photo where your face is easy to see. Avoid blurry photos, screenshots, heavy filters, group photos, or photos where Pet Parents cannot tell who the Guru is.",
      },
      {
        title: "Bio guidance",
        body: "Write like a real local person, not a resume. Mention your care experience, the pets you love working with, your reliability, and what Pet Parents can expect when they book you.",
      },
    ],
    checklist: [
      "Clear profile photo uploaded",
      "Warm bio with real care experience",
      "City, state, ZIP code, and service area completed",
      "Services and pricing reviewed",
      "Availability current in My Calendar",
      "Pet care strengths and comfort level explained",
      "Profile reviewed for spelling, warmth, and professionalism",
    ],
    script:
      "Hi, I’m a local SitGuru who believes pets should feel safe, loved, and understood while their family is away. I’m reliable, communicative, and careful with routines, feeding instructions, walks, and updates. I’ll keep you informed with clear messages and PawReports so you always know how your pet is doing.",
    proTips: [
      "Mention your local service area by name so nearby Pet Parents feel like you are truly available to them.",
      "Use specific care examples instead of saying only that you love animals.",
      "Update your profile after every few bookings as you learn what Pet Parents ask most often.",
    ],
  },
  {
    id: "earn-more",
    title: "Increase bookings and earnings",
    description:
      "Use availability, fast replies, repeat-client habits, smart pricing, My Calendar, and strong service quality to grow your Guru business.",
    category: "Earnings",
    type: "tip",
    tags: ["Bookings", "Profit", "Growth", "Repeat Clients"],
    keywords: ["earn", "earnings", "money", "profit", "pricing", "rate", "increase", "more bookings", "repeat clients", "grow", "calendar"],
    featured: true,
    sortOrder: 20,
    estimatedReadMinutes: 7,
    whyItMatters:
      "More bookings usually come from a mix of visibility, trust, availability, quick replies, strong care, and repeat-client habits. Gurus should treat their dashboard like a small business workstation.",
    sections: [
      {
        title: "Keep availability accurate",
        body: "Pet Parents are more likely to book when your calendar, service area, and services look current. Outdated availability creates friction and missed opportunities.",
        bullets: [
          "Review My Calendar weekly",
          "Block off dates you cannot work",
          "Add peak-time pricing only where it makes sense",
          "Keep service distance realistic so you can arrive on time",
        ],
      },
      {
        title: "Reply quickly and warmly",
        body: "Fast replies help Pet Parents feel heard. Even a short confirmation builds confidence while you review details.",
        bullets: [
          "Acknowledge new messages quickly",
          "Confirm dates, times, pets, access, and routine details",
          "Use a helpful tone instead of short one-word replies",
        ],
      },
      {
        title: "Earn repeat clients",
        body: "Repeat clients are built through reliability. Great PawReports, thoughtful photos, and specific final notes create confidence for the next booking.",
      },
    ],
    checklist: [
      "Calendar reviewed this week",
      "Service pricing reviewed",
      "Profile photo and bio current",
      "Messages answered promptly",
      "PawReports completed with clear updates",
      "Final notes are specific and warm",
      "Reviews monitored for improvement areas",
    ],
    script:
      "Thank you for reaching out. I’d be happy to help. I’m going to review the dates, care instructions, and your pet’s routine so I can confirm everything and make sure this is a great fit.",
    proTips: [
      "Do not price yourself so low that care quality or travel time suffers.",
      "Strong communication can matter as much as price.",
      "Repeat clients are often easier to serve and more profitable than one-time bookings.",
    ],
  },
  {
    id: "visit-checklist",
    title: "Before every visit checklist",
    description:
      "Confirm care instructions, access details, feeding, medication, emergency contacts, routines, walk expectations, and update expectations before every visit.",
    category: "Care Standards",
    type: "guide",
    tags: ["Care", "Checklist", "Visit", "Safety"],
    keywords: ["visit", "checklist", "before", "care", "feeding", "medication", "routine", "instructions", "access", "keys", "walk", "emergency"],
    featured: true,
    sortOrder: 30,
    estimatedReadMinutes: 5,
    whyItMatters:
      "Most care problems can be prevented before the visit begins. Confirming instructions protects the pet, the Pet Parent, the Guru, and the SitGuru booking record.",
    sections: [
      {
        title: "Confirm the basics",
        body: "Before you arrive, make sure the booking details are clear and that you know exactly what care is expected.",
        bullets: [
          "Date, arrival window, and expected visit length",
          "Pet names, routines, temperament, and special needs",
          "Feeding, water, medication, potty, litter, walk, and play instructions",
          "Access instructions, keys, gate codes, parking, and alarm details",
        ],
      },
      {
        title: "Confirm emergency details",
        body: "Know who to contact and what to do if something feels wrong, unsafe, or unclear.",
        bullets: [
          "Pet Parent contact information",
          "Emergency contact or nearby backup contact",
          "Veterinarian information when provided",
          "Support path for urgent SitGuru questions",
        ],
      },
    ],
    checklist: [
      "Booking date and time confirmed",
      "Access instructions confirmed",
      "Feeding and water instructions confirmed",
      "Medication instructions confirmed if applicable",
      "Walk/potty/litter routine confirmed",
      "Emergency contacts reviewed",
      "PawReport expectations confirmed",
    ],
    script:
      "Before the visit, I want to confirm a few details so I can provide the best care: access instructions, feeding or medication needs, walk or potty routine, emergency contacts, and any updates you would like included in the PawReport.",
    proTips: [
      "Never guess on medication, access, or safety instructions.",
      "Ask before the visit instead of waiting until you are at the door.",
      "Use the pet’s name in updates to make the care feel personal.",
    ],
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
    estimatedReadMinutes: 6,
    whyItMatters:
      "Pet Parents are trusting you with family. Good communication reduces anxiety, prevents misunderstandings, and turns a normal visit into a premium experience.",
    sections: [
      {
        title: "Before the booking",
        body: "Confirm the details and set expectations. Be friendly, professional, and specific.",
        bullets: ["Confirm date, time, and service", "Ask about access and routines", "Confirm how they prefer updates"],
      },
      {
        title: "During care",
        body: "Use PawReport Live and messages to show what is happening. Good updates are specific, calm, and useful.",
        bullets: ["Share photos when appropriate", "Mention food, water, potty, walks, mood, or play", "Avoid vague updates like only saying everything is fine"],
      },
      {
        title: "After the visit",
        body: "Close with a clear final note. Let the Pet Parent know how the pet did and anything they should know when they return.",
      },
    ],
    checklist: [
      "Message is warm and professional",
      "Pet names are used correctly",
      "Instructions are repeated back when needed",
      "Updates are specific and helpful",
      "Concerns are handled calmly",
      "Final summary is completed",
    ],
    script:
      "Hi, I just arrived and started the visit. I’ll follow the care instructions and send updates through the PawReport so you can see how everything is going.",
    proTips: [
      "Tone matters. Use calm, confident wording.",
      "Specific updates build more trust than generic updates.",
      "Do not argue in messages. Stay professional and move support issues to SitGuru when needed.",
    ],
  },
  {
    id: "bookings-command-center",
    title: "Use the Bookings & PawReports command center",
    description:
      "Open a booking, message the Pet Parent, start or continue a PawReport, begin a live walk, add updates, and complete the care summary.",
    category: "Bookings",
    type: "guide",
    tags: ["Bookings", "PawReports", "Messages", "Live Walk"],
    keywords: ["booking", "bookings", "pawreport", "paw report", "start pawreport", "continue pawreport", "live walk", "message pet parent"],
    featured: true,
    sortOrder: 15,
    estimatedReadMinutes: 6,
    whyItMatters:
      "The Bookings & PawReports area should work like the Guru’s daily workstation. This is where you manage the booking, care communication, visit updates, and completion summary.",
    sections: [
      {
        title: "What to do when a booking starts",
        body: "Open the booking from your dashboard or bookings page and confirm the care details before beginning the visit.",
        bullets: ["Review Pet Parent instructions", "Message if anything is unclear", "Start PawReport Live when care begins", "Start Live Walk only when walking is part of the booking"],
      },
      {
        title: "What to save during care",
        body: "Use the command center to record what matters for the visit and make the Pet Parent feel connected.",
        bullets: ["Photos", "Potty details", "Food and water", "Medication if applicable", "Mood and play", "Walk duration and distance when used"],
      },
    ],
    checklist: ["Booking opened", "Instructions reviewed", "PawReport started", "Walk tracking used if needed", "Photos and notes added", "Final summary completed"],
    script:
      "I’ve started the PawReport for this visit and will keep updates here so you have a clear record of how everything goes.",
    proTips: ["Start the PawReport when care begins, not after you leave.", "Use the final note to summarize the visit like a professional care record."],
  },
  {
    id: "pawreport-live-walk",
    title: "PawReport Live and live walk tracking",
    description:
      "Start PawReport Live from a booking, start or pause a walk, resume when needed, end the walk, and save distance, duration, photos, notes, and care updates.",
    category: "PawReport",
    type: "guide",
    tags: ["PawReport Live", "Live Walk", "GPS", "Care Updates"],
    keywords: ["pawreport live", "live walk", "walk tracking", "gps", "start walk", "pause walk", "resume walk", "end walk", "distance", "duration", "location"],
    featured: true,
    sortOrder: 22,
    estimatedReadMinutes: 7,
    whyItMatters:
      "PawReport Live is one of SitGuru’s signature trust-building features. It gives Pet Parents a clear care record and helps Gurus show the value of the care they provided.",
    sections: [
      {
        title: "How to use PawReport Live",
        body: "Start the PawReport when the visit begins. Add updates during the visit instead of trying to remember everything afterward.",
        bullets: ["Start PawReport Live", "Add photos and care notes", "Record potty, food, water, mood, medication, and play", "Complete the final summary"],
      },
      {
        title: "How to use live walk tracking",
        body: "When walking is part of the booking, allow location access and use Start Walk, Pause, Resume, and End Walk so the walk summary is saved.",
        bullets: ["Allow location access", "Start the walk when the walk begins", "Pause only when needed", "End the walk when complete", "Save the final walk summary"],
      },
    ],
    checklist: ["Location access allowed", "PawReport started", "Walk started if included", "Updates added", "Photos added", "Walk ended", "Final summary saved"],
    script:
      "I started PawReport Live and will use it for photos, care notes, and walk tracking during the visit.",
    proTips: ["Photos should be clear and appropriate.", "Walk tracking should only be used for actual walking care.", "A strong final note helps earn trust and repeat bookings."],
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
    sortOrder: 24,
    estimatedReadMinutes: 5,
    whyItMatters:
      "Reviews help Pet Parents make confident decisions. New Gurus can still build trust through a complete profile, strong communication, and excellent PawReports until reviews are earned.",
    sections: [
      {
        title: "How reviews should work",
        body: "Reviews should come from real completed SitGuru bookings. Pet Parents may leave star ratings, written feedback, and a would-book-again signal after care is complete.",
      },
      {
        title: "How to earn better reviews",
        body: "Great reviews are usually earned through reliability, warmth, communication, photos, PawReports, and careful attention to the pet’s routine.",
        bullets: ["Arrive prepared", "Follow instructions", "Use PawReport Live", "Send thoughtful updates", "Complete a specific final note"],
      },
    ],
    checklist: ["Care instructions followed", "PawReport completed", "Photos added", "Final note specific", "Professional communication used", "Feedback reviewed"],
    script:
      "Thank you for trusting me with your pet. I completed the PawReport with photos and notes from the visit. I’d be grateful for your feedback when you have a chance.",
    proTips: ["Never pressure a Pet Parent for a review.", "Use feedback as coaching.", "New Guru is better than fake or inflated ratings."],
  },
  {
    id: "sitguru-only-payments",
    title: "SitGuru-only payments and payout setup",
    description:
      "Learn how Pet Parents pay through SitGuru only, how Gurus set up Stripe payouts, how tips and credits are tracked, and why off-platform payments are not used.",
    category: "Payments",
    type: "policy",
    tags: ["Payments", "Stripe", "Payouts", "Tips", "Credits"],
    keywords: ["payment", "payments", "checkout", "stripe", "payout", "tip", "tips", "credit", "promo", "gift card", "pawperks", "petperks", "off platform", "venmo", "zelle", "cash app", "paypal", "cash"],
    featured: true,
    sortOrder: 50,
    estimatedReadMinutes: 8,
    whyItMatters:
      "Keeping payment inside SitGuru protects the booking record, receipt, support history, PawReport, reviews, credits, tips, referral tracking, and payout tracking.",
    sections: [
      {
        title: "How Pet Parents should pay",
        body: "Pet Parents should pay for SitGuru bookings through SitGuru checkout only. Available checkout options may include card, Apple Pay, Google Pay, Link by Stripe, saved payment methods, credits, promo codes, gift cards, and optional tips when available.",
      },
      {
        title: "What Gurus should not accept for SitGuru bookings",
        body: "Gurus should not request or accept off-platform payment for SitGuru bookings.",
        bullets: ["Cash", "Venmo", "Zelle", "Cash App", "PayPal", "Checks", "Direct bank transfer", "Personal card reader", "Any outside payment arrangement"],
      },
      {
        title: "Payout setup",
        body: "Gurus should complete Stripe payout setup so eligible booking payouts, tips, referral earnings, or commissions can be tracked and paid correctly.",
      },
    ],
    checklist: ["Stripe payout setup completed", "Booking paid through SitGuru", "No off-platform payment requested", "Tips tracked through SitGuru", "Payout status reviewed", "Support contacted if something looks wrong"],
    script:
      "For everyone’s protection, SitGuru bookings and payments stay inside SitGuru. Please use the SitGuru checkout link so the booking, receipt, PawReport, support record, and payout tracking stay connected.",
    proTips: ["Do not move a SitGuru booking to private payment.", "Keep all booking-related payment questions inside SitGuru support.", "Use the dashboard as your earnings record."],
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
    estimatedReadMinutes: 6,
    whyItMatters:
      "Safety comes before convenience. Gurus should act quickly, communicate clearly, and avoid guessing when a pet, home, or access situation feels unsafe or unclear.",
    sections: [
      {
        title: "When something feels wrong",
        body: "Pause and prioritize the pet’s wellbeing. If there is an immediate emergency, follow the emergency instructions provided by the Pet Parent and contact the appropriate emergency help.",
      },
      {
        title: "Common safety situations",
        body: "Use clear judgment and contact the Pet Parent or SitGuru support when needed.",
        bullets: ["Pet appears sick or injured", "Pet escapes or cannot be located", "Access instructions fail", "Home or area feels unsafe", "Medication instructions are unclear", "GPS/location permissions do not work"],
      },
    ],
    checklist: ["Pet safety prioritized", "Pet Parent contacted when needed", "Emergency contact used when needed", "Support contacted for urgent platform issues", "Incident details documented", "Final update written clearly"],
    script:
      "I want to make sure I handle this correctly. I’m seeing an issue with [brief issue]. I’m going to follow the care instructions, keep the pet safe, and contact support if needed.",
    proTips: ["Never guess with medication.", "Do not enter a location that feels unsafe.", "Document what happened calmly and factually."],
  },
  {
    id: "forms",
    title: "Forms and templates",
    description:
      "A practical area for visit notes, intake forms, pet routine forms, client message templates, and printable Guru documents.",
    category: "Forms",
    type: "form",
    tags: ["Forms", "Templates", "Notes", "Documents"],
    keywords: ["form", "forms", "template", "templates", "notes", "intake", "document", "printable"],
    sortOrder: 70,
    estimatedReadMinutes: 4,
    whyItMatters:
      "Templates help Gurus stay consistent, professional, and organized. They also help new Gurus learn what information matters before and during care.",
    sections: [
      {
        title: "Useful future templates",
        body: "The Guru Success Center can grow into a practical library of copy-ready forms and message templates.",
        bullets: ["Pre-visit confirmation message", "Pet routine intake form", "Medication confirmation checklist", "Drop-in visit notes", "Dog walk summary", "Post-visit thank you message"],
      },
    ],
    checklist: ["Use templates as a starting point", "Personalize messages", "Confirm details before care", "Save important notes in the booking record"],
    script:
      "Hi, I’m confirming your pet’s care routine for the upcoming booking. Please let me know if anything changed with feeding, medication, access, walks, or emergency contacts.",
    proTips: ["Templates should sound human, not robotic.", "Always personalize with the pet’s name.", "Do not use templates to replace careful reading of instructions."],
  },
  {
    id: "training-videos",
    title: "Guru Training Videos",
    description:
      "A YouTube-style training library for profile coaching, PawReport Live walkthroughs, care standards, safety tips, communication, and earnings guidance.",
    category: "Training Videos",
    type: "video",
    tags: ["Videos", "Training", "Academy", "Lessons"],
    keywords: ["video", "videos", "training", "watch", "lesson", "academy", "youtube", "learn"],
    featured: true,
    sortOrder: 80,
    estimatedReadMinutes: 3,
    whyItMatters:
      "Training videos make onboarding easier and help Gurus improve without needing one-on-one coaching for every topic.",
    sections: [
      {
        title: "Recommended video tracks",
        body: "This section is ready for future embedded or linked videos.",
        bullets: ["Profile setup", "Getting your first booking", "Using PawReport Live", "Live walk tracking", "Communication with Pet Parents", "Payment and payout setup", "Safety and emergency basics"],
      },
    ],
    checklist: ["Add thumbnail", "Add video link", "Add category", "Feature important onboarding videos", "Keep titles clear and searchable"],
    script: "Training video coming soon.",
    proTips: ["Keep videos short and practical.", "Use real SitGuru workflows.", "Add videos for the questions Gurus ask most often."],
  },
];

const quickSearches = [
  "How do I start a PawReport?",
  "How do I start and stop a live walk?",
  "How do reviews and ratings work?",
  "How do I get more bookings?",
  "How do I use My Calendar and pricing?",
  "How can I improve my profile?",
  "What should I do before a visit?",
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
  const fallback = fallbackGuruResources.find((resource) => resource.id === row.id);

  return {
    ...fallback,
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.resource_type,
    tags: row.tags || fallback?.tags || [],
    keywords: row.keywords || fallback?.keywords || [],
    href: row.href || fallback?.href,
    videoUrl: row.video_url || fallback?.videoUrl,
    thumbnailUrl: row.thumbnail_url || fallback?.thumbnailUrl,
    featured: row.featured,
    sortOrder: row.sort_order || fallback?.sortOrder || 0,
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
  if (/(pawreport|paw report|visit update|visit updates|photo update|potty update|live walk|walk tracking|gps)/.test(value)) return "care";
  if (/(booking|bookings|client|clients|repeat|request|requests|calendar|availability)/.test(value)) return "bookings";
  if (/(earn|earning|earnings|profit|money|pricing|price|rate|payout|income|revenue)/.test(value)) return "earnings";
  if (/(review|reviews|rating|ratings|stars|feedback|would book again|trust signal|public review|new guru)/.test(value)) return "reviews";
  if (/(profile|bio|photo|photos|trust|stand out|service area|zip)/.test(value)) return "profile";
  if (/(care|visit|walk|feeding|feed|medication|medicine|routine|checklist|instructions)/.test(value)) return "care";
  if (/(payment|payments|paid|payout|commission|referral|pending|approved|stripe|venmo|zelle|cash app|paypal|cash)/.test(value)) return "payments";
  if (/(message|messages|communicate|communication|update|updates|pet parent|difficult|concern)/.test(value)) return "communication";
  if (/(safe|safety|emergency|urgent|hurt|sick|incident|support|danger|problem)/.test(value)) return "safety";
  if (/(video|videos|training|lesson|academy|watch|learn)/.test(value)) return "training";
  if (/(form|forms|template|templates|note|notes|intake|document)/.test(value)) return "forms";

  return "general";
}

function getAssistantAnswer(query: string, matches: GuruResource[]) {
  const intent = detectIntent(query);

  const answers: Record<SearchIntent, string> = {
    bookings:
      "Open the booking from Bookings & PawReports, review care details, message the Pet Parent if anything is unclear, start PawReport Live when care begins, use live walk tracking when a walk is included, and complete the final care summary. To get more bookings, keep your profile, service area, pricing, and calendar current.",
    earnings:
      "To increase earnings, focus on reliable availability, strong profile trust, fast replies, repeat clients, smart pricing, great PawReports, and high-quality care. Treat your Guru dashboard like a business workstation, not just a profile page.",
    profile:
      "A stronger Guru profile should clearly show who you are, where you serve, what services you offer, why Pet Parents can trust you, and how you communicate during care. Your profile photo, bio, service area, services, pricing, and calendar all work together to help Pet Parents book confidently.",
    reviews:
      "Reviews should come from completed SitGuru bookings. Pet Parents can rate care, write feedback, and indicate whether they would book again. The best way to earn stronger reviews is to confirm instructions, communicate clearly, use PawReport Live, add helpful photos, and complete a thoughtful final summary.",
    care:
      "Before every visit, confirm access, feeding, medication, routines, emergency contacts, walk expectations, and PawReport expectations. During care, use PawReport Live for photos, notes, potty, food, water, mood, play, medication, and live walk tracking when walking is included.",
    payments:
      "Keep all SitGuru booking payments inside SitGuru. Pet Parents should pay through SitGuru checkout only. Gurus should complete Stripe payout setup and should not request cash, Venmo, Zelle, Cash App, PayPal, direct bank transfer, personal card readers, checks, or other off-platform payments for SitGuru bookings.",
    communication:
      "Great communication is fast, warm, specific, and professional. Confirm details before care, send useful PawReport updates during care, and close with a final summary that explains how the pet did and anything the Pet Parent should know.",
    safety:
      "For safety or emergency issues, prioritize the pet’s wellbeing, follow the Pet Parent’s instructions, contact emergency contacts when needed, and contact SitGuru support when something feels unsafe, unclear, or urgent. Do not guess with medication, access, or safety concerns.",
    training:
      "Guru Training Videos can live here as a YouTube-style library with thumbnails, categories, descriptions, featured lessons, and links. Good first topics are profile setup, bookings, PawReport Live, live walk tracking, communication, payments, and safety.",
    forms:
      "Forms and templates help Gurus stay organized and consistent. Useful templates include pre-visit confirmations, pet intake forms, medication checklists, drop-in notes, dog walk summaries, and post-visit thank-you messages.",
    general:
      matches.length > 0
        ? "Here are the most relevant Guru resources. Open any resource card below to see the full guide, checklist, message template, and pro tips."
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
      resource.whyItMatters || "",
      ...(resource.sections || []).map((section) => `${section.title} ${section.body} ${(section.bullets || []).join(" ")}`),
      ...(resource.checklist || []),
      resource.script || "",
      ...(resource.proTips || []),
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
    bookings: ["Open Bookings & PawReports", "Confirm care details", "Complete the final summary"],
    earnings: ["Update availability", "Review pricing", "Build repeat-client habits"],
    profile: ["Add a clear photo", "Complete service area", "Rewrite your bio"],
    reviews: ["Use PawReport Live", "Send helpful updates", "Close with a strong final note"],
    care: ["Confirm instructions", "Check emergency contacts", "Start PawReport Live"],
    payments: ["Use SitGuru checkout only", "Complete Stripe setup", "Do not accept outside payment"],
    communication: ["Confirm details", "Send specific updates", "Stay warm and professional"],
    safety: ["Prioritize pet safety", "Contact the Pet Parent", "Contact support if urgent"],
    training: ["Add featured videos", "Organize by topic", "Link videos to Guru workflows"],
    forms: ["Use message templates", "Confirm routines", "Save notes in the booking"],
    general: ["Search by topic", "Open a guide", "Use the checklist"],
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
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`sgsc-card ${className}`}>
      {children}
    </div>
  );
}

function ResourceDetail({ resource }: { resource: GuruResource }) {
  return (
    <div className="sgsc-detail">
      <div className="sgsc-detail-intro">
        <div>
          <p className="sgsc-muted-label">Full Guru guide</p>
          <div role="heading" aria-level={3} className="sgsc-detail-title">
            {resource.title}
          </div>
          <p className="sgsc-detail-copy">{resource.whyItMatters || resource.description}</p>
        </div>
        <div className="sgsc-read-time">{resource.estimatedReadMinutes || 4} min read</div>
      </div>

      {resource.sections?.length ? (
        <div className="sgsc-detail-sections">
          {resource.sections.map((section) => (
            <section key={section.title} className="sgsc-detail-section">
              <div role="heading" aria-level={4} className="sgsc-detail-section-title">
                {section.title}
              </div>
              <p>{section.body}</p>
              {section.bullets?.length ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      ) : null}

      <div className="sgsc-detail-grid">
        {resource.checklist?.length ? (
          <section className="sgsc-detail-panel">
            <div role="heading" aria-level={4} className="sgsc-detail-panel-title">
              Guru checklist
            </div>
            <div className="sgsc-check-list">
              {resource.checklist.map((item) => (
                <div key={item} className="sgsc-check-item">
                  <span>✓</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {resource.proTips?.length ? (
          <section className="sgsc-detail-panel sgsc-detail-panel-soft">
            <div role="heading" aria-level={4} className="sgsc-detail-panel-title">
              Pro tips
            </div>
            <div className="sgsc-tip-list">
              {resource.proTips.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {resource.script ? (
        <section className="sgsc-script-box">
          <p className="sgsc-muted-label">Copy-ready message</p>
          <p>{resource.script}</p>
        </section>
      ) : null}
    </div>
  );
}

export default function GuruSuccessCenterPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [resources, setResources] = useState<GuruResource[]>(fallbackGuruResources);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceLoadError, setResourceLoadError] = useState("");
  const [activeResourceId, setActiveResourceId] = useState(fallbackGuruResources[0]?.id || "");

  useEffect(() => {
    let mounted = true;

    async function loadPublishedResources() {
      setLoadingResources(true);
      setResourceLoadError("");

      const { data, error } = await supabase
        .from("guru_success_resources")
        .select("id,title,description,category,resource_type,status,tags,keywords,video_url,thumbnail_url,href,featured,sort_order,created_at,updated_at")
        .eq("status", "published")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setResourceLoadError("Using built-in Guru Success Center resources until the live library is available.");
        setResources(fallbackGuruResources);
        setLoadingResources(false);
        return;
      }

      const liveResources = ((data || []) as GuruSuccessResourceRow[]).map(mapRowToResource);
      const nextResources = liveResources.length > 0 ? liveResources : fallbackGuruResources;

      setResources(nextResources);
      setActiveResourceId((current) => (nextResources.some((resource) => resource.id === current) ? current : nextResources[0]?.id || ""));
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
    return Array.from(new Set([...fallbackCategories, ...liveCategories]));
  }, [resources]);

  const filteredResources = useMemo(() => {
    if (!submittedQuery.trim()) return sortResources(resources);

    return resources
      .map((resource) => ({ resource, score: getSearchScore(resource, submittedQuery) }))
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

  const activeResource = useMemo(() => {
    return resources.find((resource) => resource.id === activeResourceId) || filteredResources[0] || resources[0];
  }, [activeResourceId, filteredResources, resources]);

  const videoResources = resources.filter((resource) => resource.type === "video").slice(0, 4);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function runSearch(value: string) {
    setQuery(value);
    setSubmittedQuery(value);
  }

  function openResource(resource: GuruResource) {
    setActiveResourceId(resource.id);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById("guru-resource-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
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
              Search answers, training, forms, resources, checklists, message templates, and tips to help Gurus provide excellent care, grow bookings, and earn more through SitGuru.
            </p>
          </div>

          <Link href="/guru/dashboard" className="sgsc-back-link">
            Back to dashboard
          </Link>
        </div>

        {resourceLoadError ? <div className="sgsc-notice">{resourceLoadError}</div> : null}

        <Card className="sgsc-hero-card">
          <div className="sgsc-hero">
            <p className="sgsc-hero-kicker">Ask Guru Search</p>
            <div role="heading" aria-level={2} className="sgsc-hero-title">
              How can we help you become a better Guru today?
            </div>
            <p className="sgsc-hero-copy">
              Ask about bookings, pet care, pricing, payments, policies, PawReport Live, live walks, communication, safety, reviews, or growing your Guru business.
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
                <button key={item} type="button" onClick={() => runSearch(item)} className="sgsc-quick-pill">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="sgsc-category-strip">
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => runSearch(category)} className="sgsc-category-button">
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
                PawReport Live is the Guru care command center. It helps Gurus start booking updates, track walks when walking is part of the service, add photos and care notes, and give Pet Parents a clear view from their dashboard.
              </p>
            </div>
            <div className="sgsc-pawreport-badge">🐾 Live Care Ready</div>
          </div>

          <div className="sgsc-pawreport-layout">
            <div className="sgsc-pawreport-panel">
              <p className="sgsc-muted-label">How Gurus use it</p>
              <div className="sgsc-pawreport-steps">
                {[
                  ["1", "Open the booking", "Go to Bookings & PawReports, select the booking, and review care instructions."],
                  ["2", "Start PawReport Live", "Start it when care begins so the Pet Parent sees the visit is active."],
                  ["3", "Track walks when included", "Use Start Walk, Pause, Resume, and End Walk when walking is part of the service."],
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
                Scout had a great visit today. We completed a 22-minute walk, he went pee, drank fresh water, and enjoyed some playtime afterward. He seemed happy, comfortable, and relaxed when I left. I saved the photos and walk summary here.
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
                    These are the highest-impact areas for better care, stronger trust, more bookings, and better earnings.
                  </p>
                </div>
              </div>

              <div className="sgsc-feature-grid">
                {featuredResources.map((resource) => (
                  <button key={resource.id} type="button" onClick={() => openResource(resource)} className="sgsc-resource-card">
                    <div className="sgsc-resource-meta">
                      <span>{resource.category}</span>
                      <span>{getResourceTypeLabel(resource.type)}</span>
                    </div>
                    <div role="heading" aria-level={3} className="sgsc-resource-title">
                      {resource.title}
                    </div>
                    <p className="sgsc-resource-copy">{resource.description}</p>
                    <div className="sgsc-tag-row">
                      {resource.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="sgsc-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
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
                <p className="sgsc-resource-count">{loadingResources ? "Loading..." : `${filteredResources.length} resources`}</p>
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

                      <button type="button" onClick={() => openResource(resource)} className="sgsc-open-link">
                        Open guide
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="sgsc-empty-state">No exact resource match yet. This is a good topic to add to the Guru Success Center library.</div>
                )}
              </div>
            </Card>

            {activeResource ? (
              <Card id="guru-resource-detail" className="sgsc-detail-card">
                <ResourceDetail resource={activeResource} />
              </Card>
            ) : null}
          </div>

          <aside className="sgsc-sidebar">
            <Card>
              <p className="sgsc-muted-label">Training Library</p>
              <div role="heading" aria-level={2} className="sgsc-section-title">
                Guru Training Videos
              </div>
              <p className="sgsc-section-copy">
                Ready for a YouTube-style training library with thumbnails, titles, categories, descriptions, and featured lessons.
              </p>

              <div className="sgsc-video-list">
                {(videoResources.length > 0
                  ? videoResources
                  : [
                      { id: "video-placeholder-1", title: "How to Create a Great Guru Profile", description: "Training video coming soon", category: "Training Videos", type: "video" as const, tags: [], keywords: [] },
                      { id: "video-placeholder-2", title: "How to Use PawReport Live", description: "Training video coming soon", category: "Training Videos", type: "video" as const, tags: [], keywords: [] },
                      { id: "video-placeholder-3", title: "How to Increase Bookings and Repeat Clients", description: "Training video coming soon", category: "Training Videos", type: "video" as const, tags: [], keywords: [] },
                    ]
                ).map((resource) => (
                  <article key={resource.id} className="sgsc-video-card">
                    <div className="sgsc-video-thumb" style={resource.thumbnailUrl ? { backgroundImage: `url(${resource.thumbnailUrl})` } : undefined}>
                      {resource.thumbnailUrl ? "" : "Video Thumbnail"}
                    </div>
                    <div className="sgsc-video-body">
                      <div role="heading" aria-level={3} className="sgsc-video-title">
                        {resource.title}
                      </div>
                      <p className="sgsc-video-copy">{resource.videoUrl ? "Training video available" : resource.description}</p>
                      {resource.videoUrl ? (
                        <a href={resource.videoUrl} target="_blank" rel="noreferrer" className="sgsc-video-link">
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
                  <button key={item} type="button" onClick={() => runSearch(item)} className="sgsc-question-button">
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
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .sgsc-page *,
        .sgsc-page *::before,
        .sgsc-page *::after {
          box-sizing: border-box;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
          font-weight: 800;
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
          font-weight: 800;
          letter-spacing: -0.045em;
        }

        .sgsc-page-copy,
        .sgsc-section-copy,
        .sgsc-resource-copy,
        .sgsc-list-copy,
        .sgsc-video-copy,
        .sgsc-answer-text,
        .sgsc-detail-copy {
          color: #475569;
          line-height: 1.65;
        }

        .sgsc-page-copy {
          max-width: 820px;
          margin: 12px 0 0;
          font-size: 16px;
        }

        .sgsc-back-link,
        .sgsc-open-link,
        .sgsc-video-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          border-radius: 999px;
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 800;
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
          background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.24), transparent 32%), linear-gradient(135deg, #059669 0%, #10b981 48%, #0ea5e9 100%);
        }

        .sgsc-hero-kicker,
        .sgsc-hero-title,
        .sgsc-hero-copy {
          color: #ffffff;
        }

        .sgsc-hero-title {
          max-width: 860px;
          margin-top: 10px;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 0.98;
          font-weight: 820;
          letter-spacing: -0.055em;
        }

        .sgsc-hero-copy {
          max-width: 820px;
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
          font-weight: 650;
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
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .sgsc-pawreport-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: clamp(28px, 3.3vw, 42px);
          line-height: 1.02;
          font-weight: 850;
          letter-spacing: -0.045em;
        }

        .sgsc-pawreport-copy {
          max-width: 820px;
          margin: 12px 0 0;
          color: #475569;
          font-size: 16px;
          line-height: 1.65;
          font-weight: 650;
        }

        .sgsc-pawreport-badge {
          flex: 0 0 auto;
          border: 1px solid #86efac;
          border-radius: 999px;
          background: #ffffff;
          color: #047857;
          padding: 11px 14px;
          font-size: 13px;
          font-weight: 900;
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
          font-weight: 700;
        }

        .sgsc-pawreport-steps,
        .sgsc-pawreport-checks {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .sgsc-pawreport-step,
        .sgsc-pawreport-check {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border-radius: 18px;
          background: #ffffff;
          padding: 14px;
          border: 1px solid #e2e8f0;
        }

        .sgsc-pawreport-step > span,
        .sgsc-pawreport-check span {
          display: inline-flex;
          width: 30px;
          height: 30px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #059669;
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .sgsc-pawreport-check span {
          width: 24px;
          height: 24px;
          background: #dcfce7;
          color: #047857;
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
          font-weight: 650;
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
          font-weight: 820;
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
          width: 100%;
          padding: 18px;
          text-align: left;
          cursor: pointer;
        }

        .sgsc-resource-card:hover,
        .sgsc-list-item:hover {
          border-color: #10b981;
          background: #f0fdf4;
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
          font-weight: 800;
        }

        .sgsc-resource-title,
        .sgsc-list-title,
        .sgsc-video-title {
          color: #0f172a;
          font-weight: 820;
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
          font-weight: 750;
        }

        .sgsc-resource-count {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          font-weight: 800;
        }

        .sgsc-list,
        .sgsc-video-list,
        .sgsc-question-list {
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
          border: 0;
          background: #059669;
          color: #ffffff;
          cursor: pointer;
        }

        .sgsc-empty-state {
          padding: 20px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .sgsc-detail-card {
          scroll-margin-top: 18px;
        }

        .sgsc-detail-intro {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          padding-bottom: 18px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sgsc-detail-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: clamp(26px, 3.2vw, 38px);
          line-height: 1.05;
          font-weight: 850;
          letter-spacing: -0.045em;
        }

        .sgsc-detail-copy {
          max-width: 820px;
          margin: 12px 0 0;
          font-size: 15px;
          font-weight: 650;
        }

        .sgsc-read-time {
          white-space: nowrap;
          border: 1px solid #d1fae5;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          padding: 10px 13px;
          font-size: 12px;
          font-weight: 900;
        }

        .sgsc-detail-sections {
          display: grid;
          gap: 16px;
          margin-top: 20px;
        }

        .sgsc-detail-section {
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          background: #f8fafc;
          padding: 18px;
        }

        .sgsc-detail-section-title,
        .sgsc-detail-panel-title {
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -0.025em;
        }

        .sgsc-detail-section p,
        .sgsc-script-box p:last-child,
        .sgsc-tip-list p {
          margin: 9px 0 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.65;
          font-weight: 650;
        }

        .sgsc-detail-section ul {
          margin: 12px 0 0;
          padding-left: 20px;
          color: #334155;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 650;
        }

        .sgsc-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .sgsc-detail-panel,
        .sgsc-script-box {
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          background: #ffffff;
          padding: 18px;
        }

        .sgsc-detail-panel-soft {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .sgsc-check-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .sgsc-check-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          border-radius: 16px;
          background: #f8fafc;
          padding: 11px;
        }

        .sgsc-check-item span {
          display: inline-flex;
          width: 23px;
          height: 23px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #dcfce7;
          color: #047857;
          font-size: 12px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .sgsc-check-item p {
          margin: 2px 0 0;
          color: #334155;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .sgsc-script-box {
          margin-top: 18px;
          background: #ecfdf5;
          border-color: #bbf7d0;
        }

        .sgsc-video-list,
        .sgsc-question-list {
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
          font-weight: 800;
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
          font-weight: 800;
          cursor: pointer;
        }

        .sgsc-question-button:hover {
          border-color: #10b981;
          background: #ecfdf5;
          color: #047857;
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

          .sgsc-topbar,
          .sgsc-pawreport-hero,
          .sgsc-detail-intro {
            flex-direction: column;
            align-items: stretch;
          }

          .sgsc-topbar {
            padding: 22px;
          }

          .sgsc-hero {
            padding: 26px 20px;
          }

          .sgsc-search-form,
          .sgsc-list-item,
          .sgsc-card-header-row {
            flex-direction: column;
            align-items: stretch;
          }

          .sgsc-search-button {
            min-height: 52px;
            width: 100%;
          }

          .sgsc-feature-grid,
          .sgsc-pawreport-layout,
          .sgsc-detail-grid {
            grid-template-columns: 1fr;
          }

          .sgsc-open-link,
          .sgsc-back-link,
          .sgsc-pawreport-badge,
          .sgsc-read-time {
            align-self: stretch;
            justify-content: center;
            text-align: center;
          }

          .sgsc-pawreport-hero {
            padding: 22px;
          }

          .sgsc-pawreport-layout {
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
