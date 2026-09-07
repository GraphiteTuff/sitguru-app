import { internHelpPath, INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";

export { INTERNSHIP_HELP_PATH };

export const INTERN_GUIDE_PRINT_PATH = internHelpPath("print");
export const INTERN_GUIDE_WORD_HREF = `${INTERNSHIP_HELP_PATH}/export?format=word`;

export const INTERN_HELP_INBOX = "intern@sitguru.com";

export type InternHelpCategory =
  | "Getting started"
  | "Weekly work"
  | "Report & metrics"
  | "Intern toolkit"
  | "Growth workplace";

export type InternHelpShot = {
  file: string;
  alt: string;
  caption: string;
};

export type InternHelpArticle = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  category: InternHelpCategory;
  tags: string[];
  keywords: string[];
  steps: string[];
  shots: InternHelpShot[];
  note?: string;
};

export const INTERN_HELP_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Login, onboarding, Home, and Your page.",
    category: "Getting started" as InternHelpCategory,
  },
  {
    id: "weekly-work",
    title: "Weekly work",
    description: "Check-in, Calendar, tasks, social posts, and campaigns.",
    category: "Weekly work" as InternHelpCategory,
  },
  {
    id: "report-metrics",
    title: "Report & metrics",
    description: "Hours, Business Growth Report, and numbers SitGuru checks.",
    category: "Report & metrics" as InternHelpCategory,
  },
  {
    id: "toolkit",
    title: "Intern toolkit",
    description: "Brand kit, tracking links, snapshot, events, and social.",
    category: "Intern toolkit" as InternHelpCategory,
  },
  {
    id: "growth",
    title: "Growth workplace",
    description: "Create posts, campaigns, media, and tracking links.",
    category: "Growth workplace" as InternHelpCategory,
  },
] as const;

function article(
  slug: string,
  fields: Omit<InternHelpArticle, "slug" | "href">,
): InternHelpArticle {
  return { slug, href: internHelpPath(slug), ...fields };
}

export const INTERN_HELP_ARTICLES: InternHelpArticle[] = [
  article("student-guide", {
    title: "Intern Portal student user guide",
    summary:
      "Picture walkthrough of every student area, in the order you use them. Match the screenshots to your portal.",
    category: "Getting started",
    tags: ["guide", "walkthrough", "screenshots", "help", "pdf", "word"],
    keywords: [
      "user guide",
      "student guide",
      "how to",
      "intern portal",
      "syllabus",
      "spring 2027",
      "print pdf",
      "word",
      "download",
    ],
    steps: [
      "Search this Help hub for the screen you are on.",
      "Open the matching article and follow the steps next to the screenshot.",
      "Print PDF for the illustrated guide, or download Word if your school wants a document copy.",
      "Green buttons send, save, or submit. Only press them on your account when the work is ready.",
    ],
    shots: [
      {
        file: "assets/syllabus-cover.jpg",
        alt: "SitGuru Spring 2027 Social Media & Community Growth Internship syllabus cover",
        caption: "Spring 2027 internship. SitGuru runs the program. Your school counts credits and hours.",
      },
    ],
    note: "Screenshots in Help come from a SitGuru training intern login. Your name, school, and numbers will be yours. Print PDF saves the illustrated walkthrough. Download Word for a .docx copy with the same screenshots.",
  }),
  article("login", {
    title: "Log in to the intern portal",
    summary: "Open sitguru.com/intern with the intern login SitGuru assigned to you.",
    category: "Getting started",
    tags: ["login", "password", "account"],
    keywords: ["sign in", "sitguru.com/intern", "assigned intern", "roommate"],
    steps: [
      "Go to https://www.sitguru.com/intern.",
      "Sign in with the intern login SitGuru gave you. Do not share it.",
      "If this SitGuru account is not assigned as an intern, email intern@sitguru.com and wait. You cannot skip that step.",
    ],
    shots: [],
  }),
  article("onboarding", {
    title: "Complete intern onboarding",
    summary:
      "Four steps unlock the portal: access rules, electronic signature, print-sign-upload, then submit.",
    category: "Getting started",
    tags: ["onboarding", "signature", "confidential"],
    keywords: [
      "access rules",
      "wet ink",
      "print",
      "upload",
      "email on file",
      "confidentiality",
      "intern agreement",
    ],
    steps: [
      "Read the intern-safe access rules and confirm them.",
      "Read the intern agreement and sign electronically with your legal name.",
      "Print the page or photograph a signed printout, then upload the PDF or photo.",
      "Submit. Confirmation is emailed to your email on file. Then open the intern portal.",
    ],
    shots: [
      {
        file: "26-onboarding.png",
        alt: "Intern onboarding with four steps: access rules, electronic signature, print sign upload, and submit",
        caption: "The portal stays locked until all four steps are done.",
      },
    ],
    note: "The printed copy is SitGuru policy as an extra record — not because the law requires a wet signature. Email confirmation goes to your email on file.",
  }),
  article("home", {
    title: "Use Home each week",
    summary:
      "Home shows your school, this week’s focus, tappable summary tiles, live totals, toolkit, and Growth workplace.",
    category: "Getting started",
    tags: ["home", "dashboard", "week"],
    keywords: ["welcome", "tasks to do", "this week", "live totals", "summary tiles"],
    steps: [
      "Read this week’s focus at the top of Home.",
      "Tap This week, Open work, Metrics, or Social to jump to that work.",
      "Use the green bar: Home, Calendar, Work, Report, Metrics.",
    ],
    shots: [
      {
        file: "01-home-welcome.png",
        alt: "Intern Home welcome with school card and week focus",
        caption: "Your first name, school, and this week’s focus appear here.",
      },
      {
        file: "02-home-summary-kpis.png",
        alt: "Home summary tiles and live SitGuru results",
        caption: "Live totals are market numbers — no customer names.",
      },
      {
        file: "03-home-workplace-toolkit.png",
        alt: "Growth workplace card and intern toolkit on Home",
        caption: "Open Growth workplace or tap a toolkit card.",
      },
    ],
  }),
  article("your-page", {
    title: "Edit Your page",
    summary:
      "Preferred name, photo, headline, and student contact live under Your page. School and hours stay on the academic card.",
    category: "Getting started",
    tags: ["profile", "photo", "your page"],
    keywords: ["preferred name", "linkedin", "headline", "student email", "page color"],
    steps: [
      "Tap Your page in the header, or Edit your page on Home.",
      "Update preferred name, full name, phone, student ID, student email, headline, about, LinkedIn, page color, and photo.",
      "Tap Save your page. School, program, and hours stay on the academic card.",
    ],
    shots: [],
    note: "Keep phone numbers and student email in the form. Do not put other people’s personal information in captions or class screenshots.",
  }),
  article("weekly-checkin", {
    title: "Send your weekly check-in",
    summary:
      "Tell SitGuru what you finished this week. That writing goes into your Business Growth Report.",
    category: "Weekly work",
    tags: ["check-in", "weekly", "report"],
    keywords: [
      "send this week",
      "contribution",
      "market analysis",
      "what didn’t work",
      "your number",
    ],
    steps: [
      "On Home, open This week’s check-in.",
      "Choose which part of your report this week helped.",
      "Write what you added, finished, learned from the numbers, what did not work, and what’s next.",
      "Add Your number if SitGuru can check it, then tap Send this week to SitGuru.",
    ],
    shots: [
      {
        file: "04-home-checkin.png",
        alt: "Weekly check-in form on Home",
        caption: "Be specific — this goes in your report.",
      },
      {
        file: "05-home-checkin-submit.png",
        alt: "Send this week to SitGuru button",
        caption: "Only send when the week’s story is true and complete.",
      },
    ],
  }),
  article("calendar", {
    title: "Read the intern calendar",
    summary: "Dots on a date mean a task, check-in, or milestone is scheduled.",
    category: "Weekly work",
    tags: ["calendar", "milestone", "due date"],
    keywords: ["program confirmation", "up next", "month"],
    steps: [
      "Open Calendar from the green bar.",
      "Tap a dotted day to see what is due.",
      "Do the work on Work, log hours on Report, and send the weekly story from Home.",
    ],
    shots: [
      {
        file: "06-calendar.png",
        alt: "Intern calendar month view with milestone dots",
        caption: "Month view. Tap a dotted day.",
      },
      {
        file: "07-calendar-milestone.png",
        alt: "Calendar day opened on a program milestone",
        caption: "A milestone opened from the calendar.",
      },
    ],
  }),
  article("work-tasks", {
    title: "Finish and send a task",
    summary: "Attach proof, add a work link, and send the task to SitGuru for review.",
    category: "Weekly work",
    tags: ["tasks", "submit", "attachments"],
    keywords: [
      "send to sitguru for review",
      "supporting files",
      "link to completed work",
      "todo",
    ],
    steps: [
      "Open Work → Tasks and tap the assignment.",
      "Attach PDFs, slides, screenshots, or drafts that prove the work.",
      "Paste a Link to completed work if you have one.",
      "Write what SitGuru should review, then tap Send to SitGuru for review.",
    ],
    shots: [
      {
        file: "08-work-tasks.png",
        alt: "Work tab showing assigned intern tasks",
        caption: "Work → Tasks. Status starts as to-do until you send it.",
      },
      {
        file: "09-work-task-submit.png",
        alt: "Task submit form with supporting files",
        caption: "Attach proof, then send. Do not send an empty task.",
      },
    ],
  }),
  article("work-social", {
    title: "Log a social post",
    summary: "Log every SitGuru post you draft or publish. Tag @SitGuruOfficial.",
    category: "Weekly work",
    tags: ["social", "instagram", "tiktok"],
    keywords: ["caption", "published link", "canva", "capcut", "@sitguruofficial"],
    steps: [
      "Open Work → Social, or the Social media toolkit card.",
      "Add a title, platform, draft or published link, and caption notes.",
      "Tag @SitGuruOfficial. Never put a customer name or email in a caption.",
      "Bookings stay on SitGuru.",
    ],
    shots: [
      {
        file: "10-work-social.png",
        alt: "Work social tab with Log a social post form",
        caption: "Log the post even if you designed it in Canva or CapCut.",
      },
    ],
  }),
  article("work-campaigns", {
    title: "Create a tracking campaign",
    summary:
      "Name the campaign before you post. SitGuru only counts growth from that tracking link.",
    category: "Weekly work",
    tags: ["campaigns", "utm", "tracking"],
    keywords: ["new campaign", "utm_source", "referral code", "bare homepage"],
    steps: [
      "Open Work → Campaigns or Growth workplace → Campaigns.",
      "Name the campaign and save it before you post.",
      "Copy the tracking link. Never send people to a bare SitGuru homepage.",
    ],
    shots: [
      {
        file: "11-work-campaigns.png",
        alt: "Work campaigns tab with New campaign form",
        caption: "Create the campaign, then copy the tracking link.",
      },
    ],
  }),
  article("report-hours", {
    title: "Log hours on Report",
    summary:
      "Hours are not a separate Work screen. Enter Hours this week on Report and save them to your Business Growth Report.",
    category: "Report & metrics",
    tags: ["hours", "report", "credits"],
    keywords: [
      "hours this week",
      "save to your report",
      "business growth report",
      "percent done",
    ],
    steps: [
      "Open Report from the green bar.",
      "Enter Hours this week.",
      "Tap Save to your report. Your school still counts credits and hours.",
    ],
    shots: [
      {
        file: "12-report.png",
        alt: "Business Growth Report overview",
        caption: "Percent complete rises as SitGuru accepts weekly work.",
      },
      {
        file: "13-report-hours.png",
        alt: "Hours this week field on Report",
        caption: "Hours field on Report.",
      },
      {
        file: "14-report-hours-submit.png",
        alt: "Save to your report button",
        caption: "Save hours into the report.",
      },
    ],
  }),
  article("metrics", {
    title: "Send a number for SitGuru to check",
    summary:
      "Your own counts stay pending until SitGuru verifies them from an approved source.",
    category: "Report & metrics",
    tags: ["metrics", "kpi", "letter"],
    keywords: [
      "waiting",
      "sitguru checked",
      "letter",
      "attribution",
      "ga4",
      "tracking link",
    ],
    steps: [
      "Open Metrics.",
      "Send a number for SitGuru to check. Name it, enter the value, and pick an approved source.",
      "Status stays Waiting until SitGuru confirms it. A letter like I is SitGuru’s snapshot — not your university grade.",
    ],
    shots: [
      {
        file: "15-metrics-letters.png",
        alt: "Metrics letter board and live totals",
        caption: "SitGuru checks these against their own data.",
      },
      {
        file: "16-metrics-submit.png",
        alt: "Send a number for SitGuru to check form",
        caption: "Guessing does not count.",
      },
    ],
    note: "No growth result is counted as attributable unless SitGuru can reasonably verify it through platform analytics, campaign tracking, referral codes, CRM records, or another approved source.",
  }),
  article("toolkit-brand", {
    title: "Use the brand kit",
    summary: "Logo, brand green #0D5C3A, and @SitGuruOfficial. White type on green.",
    category: "Intern toolkit",
    tags: ["brand", "logo", "green"],
    keywords: ["#0d5c3a", "rogue", "university logo", "mix-blend"],
    steps: [
      "On Home, tap Brand kit.",
      "Copy brand green #0D5C3A. Use white type on that green — never dark text.",
      "Tag @SitGuruOfficial. Do not use a university logo unless SitGuru recorded permission.",
    ],
    shots: [
      {
        file: "18-tool-brand.png",
        alt: "Brand kit intern tool with logo and green swatch",
        caption: "Copy the green. Tag the official handle.",
      },
    ],
  }),
  article("toolkit-tracking", {
    title: "Copy a tracking link before you post",
    summary: "SitGuru only counts growth from your unique link.",
    category: "Intern toolkit",
    tags: ["tracking", "utm", "link"],
    keywords: ["utm_campaign", "spring27_growth", "save tracking link", "copy"],
    steps: [
      "Tap Tracking links on Home.",
      "Create a campaign name, then save.",
      "Copy the unique link after it appears. Use it in every post for that campaign.",
    ],
    shots: [
      {
        file: "22-tool-tracking.png",
        alt: "Tracking links intern tool",
        caption: "Create the link before you post.",
      },
    ],
  }),
  article("toolkit-snapshot", {
    title: "Read your market snapshot",
    summary: "Market totals only — no names, emails, or payouts.",
    category: "Intern toolkit",
    tags: ["snapshot", "market", "kpis"],
    keywords: ["greater philadelphia", "checked numbers", "find care"],
    steps: [
      "Tap Market snapshot on Home.",
      "Use the totals SitGuru has checked. Pending numbers wait on SitGuru.",
    ],
    shots: [
      {
        file: "23-tool-snapshot.png",
        alt: "Market snapshot intern tool",
        caption: "Checked numbers appear after SitGuru confirms them.",
      },
    ],
  }),
  article("toolkit-events", {
    title: "Share public pet events",
    summary: "Promote public SitGuru pet events. Always use a tracking link.",
    category: "Intern toolkit",
    tags: ["events", "community"],
    keywords: ["open event", "copy", "public events"],
    steps: [
      "Tap Events to share on Home.",
      "Open the event or copy the public details.",
      "Share with a tracking link. Do not add private emails or street addresses that are not already on the public card.",
    ],
    shots: [
      {
        file: "24-tool-events.png",
        alt: "Events to share intern tool",
        caption: "Public listings only.",
      },
    ],
  }),
  article("toolkit-social", {
    title: "Draft social from the toolkit",
    summary: "Same job as Work → Social, with official account shortcuts.",
    category: "Intern toolkit",
    tags: ["social", "draft"],
    keywords: ["facebook", "instagram", "tiktok", "youtube", "log a social post"],
    steps: [
      "Tap Social media on Home.",
      "Draft here, tag @SitGuruOfficial, then log the live link.",
      "SitGuru posts from official accounts unless they give you a channel.",
    ],
    shots: [
      {
        file: "25-tool-social.png",
        alt: "Social media intern tool",
        caption: "Draft, tag, then log the published link.",
      },
    ],
  }),
  article("growth-home", {
    title: "Open Growth workplace",
    summary:
      "Write posts, tracking links, and campaigns here. SitGuru approves drafts before they go live.",
    category: "Growth workplace",
    tags: ["growth", "workplace"],
    keywords: ["create a post", "megaphone", "not admin hq", "bottom bar"],
    steps: [
      "Tap Growth workplace in the header or Open workplace on Home.",
      "Use the bottom bar: Home, Campaigns, Create (+), Media, More.",
      "Do not publish until SitGuru approves. You do not get Admin HQ, passwords, or Pet Parent personal information.",
    ],
    shots: [
      {
        file: "19-growth-home.png",
        alt: "Growth workplace home with weekly KPIs",
        caption: "On-the-project training for the SitGuru Market Growth Project.",
      },
    ],
  }),
  article("growth-create", {
    title: "Create a Growth workplace post",
    summary:
      "Pick a post type, write the caption, save, copy the tracking link, then publish in Meta or TikTok after SitGuru approves.",
    category: "Growth workplace",
    tags: ["create", "caption", "guru spotlight"],
    keywords: ["pawperks", "event", "pet parent", "destination", "canva"],
    steps: [
      "Open Create and pick a type (Guru Spotlight, Event, Partner, PawPerks, Pet Parent, SitGuru Feature, or General Post).",
      "Fill title, channel, market, caption, destination, and date.",
      "Save, copy the tracking link, then publish in Canva / CapCut / Meta / TikTok only after SitGuru approves.",
    ],
    shots: [
      {
        file: "20-growth-create.png",
        alt: "Growth workplace Create a post screen",
        caption: "Choose a post type, then fill the form.",
      },
    ],
  }),
  article("growth-campaigns", {
    title: "Copy Growth workplace campaign links",
    summary: "Every real post gets a tracking link. Never send people to a bare homepage.",
    category: "Growth workplace",
    tags: ["campaigns", "links"],
    keywords: ["new campaign", "copy tracking", "ready to share"],
    steps: [
      "Open Campaigns in Growth workplace.",
      "Create a Guru or Pet Parent post to get a link.",
      "Copy that link into the live post.",
    ],
    shots: [
      {
        file: "21-growth-campaigns.png",
        alt: "Growth workplace Campaigns empty state",
        caption: "Create a post to get a tracking link.",
      },
    ],
  }),
  article("growth-media", {
    title: "Save Canva and CapCut links in Media",
    summary:
      "Drop creative links here. SitGuru does not publish to Instagram for you.",
    category: "Growth workplace",
    tags: ["media", "canva", "capcut"],
    keywords: ["save asset", "reel", "drive link", "needs review"],
    steps: [
      "Open Media in Growth workplace.",
      "Add a title, Canva / CapCut / Drive link, type, and what it is for.",
      "Save the asset, then wait for SitGuru review before treating it as live. You still post in Meta and TikTok after approval.",
    ],
    shots: [
      {
        file: "27-growth-media.png",
        alt: "Growth workplace Media tab",
        caption: "Save the asset, then wait for SitGuru review.",
      },
    ],
  }),
  article("intern-safe-rules", {
    title: "Intern-safe rules",
    summary:
      "Stay in the intern portal. No Admin HQ, no customer names, no unapproved AI, no publishing before SitGuru says yes.",
    category: "Getting started",
    tags: ["rules", "privacy", "ai"],
    keywords: [
      "admin hq",
      "passwords",
      "chatgpt",
      "pii",
      "portfolio",
      "university logo",
      "credentials",
      "competing marketplace",
    ],
    steps: [
      "Use only the intern portal and Growth workplace.",
      "Do not share this login. Report a lost device to SitGuru right away.",
      "Do not drop SitGuru confidential information into unapproved AI or chatbots.",
      "Keep customer names and emails out of drafts, class slides, and portfolios.",
      "Do not count a result as yours until SitGuru verifies it.",
      "Drafts wait for SitGuru. A cleaned-up portfolio version needs written approval.",
      "Do not use SitGuru confidential information to build or help a competing pet care marketplace. Working in pet care is still allowed.",
      "When the internship ends, return or delete SitGuru credentials and internal data.",
    ],
    shots: [],
  }),
];

export function internHelpArticle(slug: string | null | undefined) {
  const id = String(slug || "").trim();
  return INTERN_HELP_ARTICLES.find((article) => article.slug === id) || null;
}

export function internHelpByCategory(category: InternHelpCategory) {
  return INTERN_HELP_ARTICLES.filter((article) => article.category === category);
}

export function searchInternHelpArticles(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return INTERN_HELP_ARTICLES;
  const parts = q.split(/\s+/).filter(Boolean);
  return INTERN_HELP_ARTICLES.filter((article) => {
    const haystack = [
      article.title,
      article.summary,
      article.category,
      ...article.tags,
      ...article.keywords,
      ...article.steps,
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) return true;
    return parts.every((part) => haystack.includes(part));
  });
}

export function internHelpMediaSrc(file: string) {
  const clean = String(file || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return internHelpPath(`media/${clean.startsWith("assets/") ? clean : `screenshots/${clean}`}`);
}

export function internHelpMediaAllowed(relativePath: string) {
  const clean = String(relativePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  if (!clean || clean.includes("..") || clean.includes("your-page")) return false;
  if (clean === "assets/syllabus-cover.jpg") return true;
  return /^screenshots\/[0-9]{2}-[a-z0-9-]+\.png$/.test(clean);
}
