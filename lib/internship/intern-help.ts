import { internHelpPath, INTERNSHIP_HELP_PATH } from "@/lib/internship/intern-growth";
import {
  INTERN_AI_COMPANIONS,
  INTERN_GLOSSARY,
  INTERN_PAYMENTS_INTERN_SAFE,
  INTERN_SITGURU_FEATURES,
  INTERN_UNIVERSITY_PATHS,
  INTERN_VENDOR_EVENTS,
  INTERN_WATCH_VIDEOS,
} from "@/lib/internship/intern-glossary";

export { INTERNSHIP_HELP_PATH };

export const INTERN_GUIDE_PRINT_PATH = internHelpPath("print");
export const INTERN_GUIDE_WORD_HREF = `${INTERNSHIP_HELP_PATH}/export?format=word`;

export const INTERN_HELP_INBOX = "intern@sitguru.com";

export const INTERN_HELP_FILES = [
  {
    id: "best-pa-nj-vendor-events" as const,
    filename: "best-pa-nj-vendor-events.docx",
    title: "PA & NJ vendor events",
  },
  {
    id: "stripe-setup" as const,
    filename: "stripe-setup.docx",
    title: "Stripe setup packet",
  },
];

export function internHelpFileHref(filename: string) {
  return internHelpPath(`files/${filename}`);
}

export function internHelpFileAllowed(filename: string) {
  return INTERN_HELP_FILES.some((file) => file.filename === filename);
}

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

export type InternHelpField = {
  label: string;
  meaning: string;
  example?: string;
};

export type InternHelpArticle = {
  slug: string;
  href: string;
  title: string;
  summary: string;
  purpose: string;
  contributes: string;
  category: InternHelpCategory;
  tags: string[];
  keywords: string[];
  fields: InternHelpField[];
  steps: string[];
  tips: string[];
  shots: InternHelpShot[];
  note?: string;
};

export const INTERN_HELP_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started",
    description:
      "Watch SitGuru videos, learn definitions, then log in, onboard, and use Home and Your page.",
    category: "Getting started" as InternHelpCategory,
  },
  {
    id: "weekly-work",
    title: "Weekly work",
    description: "How weekly check-in, Calendar, tasks, social, and campaigns feed your report.",
    category: "Weekly work" as InternHelpCategory,
  },
  {
    id: "report-metrics",
    title: "Report & metrics",
    description: "Hours, the Business Growth Report, and numbers SitGuru can actually verify.",
    category: "Report & metrics" as InternHelpCategory,
  },
  {
    id: "toolkit",
    title: "Intern toolkit",
    description:
      "Brand, tracking links, market totals, public events, PA/NJ vendor research, and social.",
    category: "Intern toolkit" as InternHelpCategory,
  },
  {
    id: "growth",
    title: "Growth workplace",
    description: "Create posts, campaigns, and media, then wait for SitGuru before anything goes live.",
    category: "Growth workplace" as InternHelpCategory,
  },
] as const;

function article(
  slug: string,
  fields: Omit<InternHelpArticle, "slug" | "href" | "fields" | "tips"> &
    Partial<Pick<InternHelpArticle, "fields" | "tips">>,
): InternHelpArticle {
  return {
    ...fields,
    slug,
    href: internHelpPath(slug),
    fields: fields.fields || [],
    tips: fields.tips || [],
  };
}

export const INTERN_HELP_ARTICLES: InternHelpArticle[] = [
  article("student-guide", {
    title: "Intern Portal student user guide",
    summary:
      "The full picture walkthrough of every student area. Use Help when you need the meaning of a field; print PDF or Word when your school wants a copy.",
    purpose:
      "This internship is the SitGuru Market Growth Project. The portal is where you do the work, SitGuru reviews it, and your Business Growth Report is assembled. Help articles explain what each screen is for — not only which button to tap.",
    contributes:
      "Your weekly check-ins, tasks, posts, campaigns, hours, and verified numbers become the report, a reusable playbook for SitGuru, and (if SitGuru approves a sanitized version) a portfolio case study. Your school still owns credit and hour counting. SitGuru letters are an employer snapshot, not a university grade.",
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
      "Watch the SitGuru videos on intern Help before you write SitGuru Feature posts.",
      "Print PDF for the illustrated guide, or download Word if your school wants a document copy.",
      "Green buttons send, save, or submit. Only press them on your account when the work is ready.",
    ],
    tips: [
      "Search for the field name on screen (Hours this week, Your number, Contribution to your report) if you are stuck on what to type.",
      "Training screenshots use a practice intern. Your name, school, and numbers will be yours.",
      "SitGuru University certificates are not internship credit.",
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
  article("watch-sitguru", {
    title: "Watch SitGuru videos",
    summary:
      "Official SitGuru product and University videos. Watch them here, then promote with a tracking link. University certificates are not internship credit.",
    purpose:
      "These are approved SitGuru videos so intern SitGuru Feature posts match the product: From Chaos to Clarity, Trusted Pet Care, Ambassador promo, Pet Parent Academy, Guru Opportunity, and Ambassador Academy. Watching is orientation. It does not replace weekly check-ins, campaigns, or verified numbers.",
    contributes:
      "Watching lets you write accurate Find Care, PawReport, PawPerks, Pet Events, Ambassador, and Guru copy. Log honest hours if SitGuru counted watch-time as intern work. Do not count video views as a verified growth metric.",
    category: "Getting started",
    tags: ["videos", "sitguru feature", "university"],
    keywords: [
      "watch",
      "video",
      "chaos to clarity",
      "trusted pet care",
      "ambassador promo",
      "pet parent masterclass",
      "guru opportunity",
      "playbook",
      "sitguru university",
      "pawreport",
      "trusted local pet care",
    ],
    fields: INTERN_WATCH_VIDEOS.map((video) => ({
      label: video.title,
      meaning: video.watchFor,
      example: video.promoteHref,
    })),
    steps: [
      "Watch SitGuru product videos first (Chaos to Clarity, Trusted Pet Care, Trusted Local Pet Care, Ambassador promo).",
      "Watch the Academy videos for the audience you are writing to: Pet Parent, Guru, or Ambassador.",
      "Create a tracking link, then log a SitGuru Feature draft in Growth workplace.",
      "Wait for SitGuru approval before anything goes live.",
    ],
    tips: [
      "SitGuru companions (Rogue, Taco, Scout, Delilah) are approved SitGuru tools. ChatGPT is not for credentials, PII, or unpublished analytics.",
      "If your login also has Ambassador, use Switch to Intern for credit-bearing intern work.",
    ],
    shots: [],
    note: "Interns do not complete Pet Parent, Guru, or Ambassador Academy logins for intern hours unless SitGuru assigned that work.",
  }),
  article("definitions", {
    title: "Definitions",
    summary:
      "Intern-portal words, SitGuru Features, report dropdown sections, official socials, Events, PawPerks, and SitGuru AI.",
    purpose:
      "After Contents in the student guide comes Definitions. This article is the same glossary: what the word means, how it helps your internship, and how to fill the matching field.",
    contributes:
      "Using the same words as SitGuru (Campaign, tracking link, Market Analysis, SitGuru Feature) is how your week files into the Business Growth Report instead of a loose note.",
    category: "Getting started",
    tags: ["definitions", "glossary", "campaign"],
    keywords: [
      "definitions",
      "campaign",
      "tracking link",
      "which part of your report",
      "market analysis",
      "pawreport",
      "pawperks",
      "events",
      "rogue",
      "delilah",
      "sitguru feature",
    ],
    fields: INTERN_GLOSSARY,
    steps: [
      "Search this article for the field on your screen.",
      "Pick the closest Contribution to your report value. SitGuru can move it later.",
      "Put official destinations behind your tracking link.",
    ],
    tips: [
      "Official handle is @SitGuruOfficial on Facebook, Instagram, TikTok, X, and YouTube.",
      "Interns do not log into Pet Parent PawPerks. Promote it with a tracking link.",
    ],
    shots: [],
  }),
  article("sitguru-features", {
    title: "SitGuru Features to promote",
    summary:
      "Find Care, PawReport, PawPerks, Pet Events, SitGuru AI, University, and official videos — the Growth workplace SitGuru Feature post type.",
    purpose:
      "A SitGuru Feature post is a product story, not a random caption. Interns send people to Find Care, PawReport explainers, Events, PawPerks, Ambassadors, or Become a Guru with a tracking link. Bookings stay on SitGuru.",
    contributes:
      "Logged SitGuru Feature posts with tracking can feed Content System, Campaign System, Pet Parent Growth, Guru Growth, or Partner Growth — whichever dropdown fits.",
    category: "Getting started",
    tags: ["sitguru feature", "product", "pawreport"],
    keywords: ["find care", "pawreport", "pawperks", "pet events", "sitguru feature", "ai companions"],
    fields: [...INTERN_SITGURU_FEATURES, ...INTERN_AI_COMPANIONS],
    steps: [
      "Watch the matching video on intern Help.",
      "Open Create in Growth workplace and pick SitGuru Feature.",
      "Set Destination to your tracking link, not a bare homepage.",
      "Tag @SitGuruOfficial. Wait for SitGuru before publishing.",
    ],
    tips: [
      "PawReport is live care on a booking. Interns promote it; they do not run Guru live walks.",
      "PawPerks is a Pet Parent destination after sign-in. Interns do not use a Pet Parent login.",
    ],
    shots: [],
  }),
  article("sitguru-university", {
    title: "SitGuru University (not internship credit)",
    summary:
      "Pet Parent, Guru, and Ambassador Academies. Watch the videos. Example certificates are platform training, not school credit.",
    purpose:
      "SitGuru University is SitGuru’s onboarding and professional development program. It is not an accredited school and does not award degrees or internship credit. Interns watch so they can promote Certified Pet Parent, Certified Guru, and Certified Ambassador paths accurately.",
    contributes:
      "University-aware intern copy supports Audience Strategy and Guru / Pet Parent / Partner Growth. Completing an Academy login is not intern report evidence unless SitGuru assigned it.",
    category: "Getting started",
    tags: ["university", "academy", "certificate"],
    keywords: [
      "sitguru university",
      "pet parent academy",
      "guru academy",
      "ambassador academy",
      "certified",
      "badge",
    ],
    fields: INTERN_UNIVERSITY_PATHS,
    steps: [
      "Watch the Academy videos on intern Help.",
      "Promote the matching public path with a tracking link.",
      "Do not treat a University certificate as internship or university credit.",
    ],
    tips: [
      "If your SitGuru login also has Ambassador, use Switch to Intern for intern hours.",
      "Guru Academy is optional for a Certified Guru badge and is not required to become bookable.",
    ],
    shots: [
      {
        file: "assets/sitguru-university-guide.jpg",
        alt: "SitGuru University guide to Pet Parent, Guru, and Ambassador paths",
        caption: "Three paths. Interns watch and promote. Certificates are not internship credit.",
      },
      {
        file: "assets/pet-parent-academy-certificate.jpg",
        alt: "Example SitGuru University Pet Parent Academy certificate",
        caption: "Example Pet Parent Academy certificate — platform training, not school credit.",
      },
      {
        file: "assets/guru-academy-certificate.jpg",
        alt: "Example SitGuru University Guru Academy certificate",
        caption: "Example Guru Academy certificate — not required to become bookable.",
      },
      {
        file: "assets/ambassador-academy-certificate.jpg",
        alt: "Example SitGuru University Ambassador Academy certificate",
        caption: "Example Ambassador Academy certificate — not intern internship pay.",
      },
      {
        file: "assets/guru-certified-badge.png",
        alt: "Guru Certified badge",
        caption: "Certified Guru badge example. Interns do not award badges.",
      },
    ],
    note: "SitGuru University is not an accredited educational institution.",
  }),
  article("login", {
    title: "Log in to the intern portal",
    summary:
      "sitguru.com/intern is your student workplace. It is not Admin HQ and not a public Guru listing.",
    purpose:
      "The intern login is the account SitGuru assigned to this internship. It opens only the intern portal, Help, and Growth workplace. That boundary keeps Pet Parent records, passwords, and payments off your screen.",
    contributes:
      "Using only this login protects you and SitGuru. Sharing it, or using a roommate’s device while you stay signed in, can leak internship files and get portal access revoked.",
    category: "Getting started",
    tags: ["login", "password", "account"],
    keywords: ["sign in", "sitguru.com/intern", "assigned intern", "roommate"],
    steps: [
      "Go to https://www.sitguru.com/intern.",
      "Sign in with the intern login SitGuru gave you. Do not share it.",
      "If this SitGuru account is not assigned as an intern, email intern@sitguru.com and wait. You cannot skip that step.",
    ],
    tips: [
      "If you see that this account is not assigned as an intern, do not try Admin HQ or another SitGuru product to “get in.” Email intern@sitguru.com.",
      "Bookmark https://www.sitguru.com/intern so you do not land on the public site login by mistake.",
    ],
    shots: [],
  }),
  article("onboarding", {
    title: "Complete intern onboarding",
    summary:
      "Four steps unlock Home, Work, Report, Metrics, and Growth workplace: access rules, intern agreement, print-sign-upload, then submit.",
    purpose:
      "Onboarding is the intern agreement and access rules — separate from the syllabus your school receives. The syllabus explains the educational program. The agreement covers confidentiality, internship work product, credentials, and limited post-internship duties. SitGuru policy also keeps a printed wet-ink copy as an extra record.",
    contributes:
      "Until onboarding is fully executed, the portal stays locked so you cannot see intern tools or Growth workplace. Completing it is how you get to the work that fills your Business Growth Report. Confirmation goes to your email on file, not a personal SitGuru HQ address on the submit screen.",
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
    fields: [
      {
        label: "Access rules",
        meaning:
          "The intern-safe duties for this login: stay in the intern portal, no unapproved AI, no customer names in drafts, return credentials when you finish.",
        example: "Read every line, then check that you understand them.",
      },
      {
        label: "Intern agreement",
        meaning:
          "Confidentiality, intellectual property, credentials, limited non-solicitation, and the limited information-use clause. It is not a traditional non-compete and it is not the syllabus.",
        example: "Type your legal name exactly as it appears on your intern record.",
      },
      {
        label: "Print, sign, upload",
        meaning:
          "SitGuru’s extra paper record of the same agreement. Pennsylvania already allows electronic signatures; the wet-ink page is SitGuru policy.",
        example: "Print the page or photograph a signed printout, then upload a PDF or photo under 10MB.",
      },
    ],
    tips: [
      "If the typed name does not match your intern record, the electronic signature will not save.",
      "Email confirmation goes to the intern email and student email on file.",
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
      "Home is the weekly dashboard: school card, this week’s focus, jump tiles, live market totals, toolkit, and Growth workplace.",
    purpose:
      "Home answers “what should I do this week?” without dumping Admin analytics. The academic card is your school, program, term, and hours. Live totals are SitGuru market numbers with no customer names. Toolkit cards are shortcuts, not extra jobs.",
    contributes:
      "This is where you start the weekly check-in that writes your report, jump to open tasks, and open Growth workplace. If you skip Home, you still have Calendar / Work / Report / Metrics — but Home is the intern-facing summary of all of them.",
    category: "Getting started",
    tags: ["home", "dashboard", "week"],
    keywords: ["welcome", "tasks to do", "this week", "live totals", "summary tiles"],
    steps: [
      "Read this week’s focus at the top of Home.",
      "Tap This week, Open work, Metrics, or Social to jump to that work.",
      "Use the green bar: Home, Calendar, Work, Report, Metrics.",
    ],
    fields: [
      {
        label: "This week’s focus",
        meaning:
          "SitGuru’s prompt for the current internship week — what this week is supposed to add to the Market Growth Project.",
        example: "Read it before you start tasks so the week’s work matches the report section it feeds.",
      },
      {
        label: "This week / Open work / Metrics / Social",
        meaning:
          "Jump tiles. They do not create extra assignments. They take you to the check-in, tasks still to do, numbers waiting on SitGuru, or logged posts.",
      },
      {
        label: "Live totals",
        meaning:
          "SitGuru market counts (people and social). They are not your personal grade and they never include Pet Parent names.",
      },
    ],
    tips: [
      "Green bar is the same five areas on every intern screen: Home, Calendar, Work, Report, Metrics.",
      "Growth workplace is on-the-project training. It is not Admin HQ.",
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
      "Your intern profile for SitGuru — preferred name, photo, headline, and student contact. School and hours stay on the academic card.",
    purpose:
      "Your page is how SitGuru addresses you and how they reach you about the internship. It is not a public sitguru.com Guru listing and not your university transcript. School, program, and required hours stay on the academic card at the top of Home because SitGuru sets those from the intern record.",
    contributes:
      "A clear preferred name and photo help SitGuru write feedback. Student email is used for onboarding confirmation and internship messages. LinkedIn is optional professional context. Keep other people’s personal information off this page.",
    category: "Getting started",
    tags: ["profile", "photo", "your page"],
    keywords: ["preferred name", "linkedin", "headline", "student email", "page color"],
    steps: [
      "Tap Your page in the header, or Edit your page on Home.",
      "Update preferred name, full name, phone, student ID, student email, headline, about, LinkedIn, page color, and photo.",
      "Tap Save your page. School, program, and hours stay on the academic card.",
    ],
    fields: [
      {
        label: "Preferred name",
        meaning: "What SitGuru should call you in the portal. It can be shorter than your legal name.",
        example: "Alex — while legal name stays on the intern record for the agreement.",
      },
      {
        label: "Full name",
        meaning: "Your intern record name. Onboarding signatures must match this.",
      },
      {
        label: "Phone / student ID / student email",
        meaning:
          "How SitGuru and (if needed) your school contact you. Student email also receives the signed-agreement confirmation.",
        example: "Use your school email if that is the address your internship coordinator knows.",
      },
      {
        label: "Headline",
        meaning: "One line SitGuru sees with your intern page — role, school, and market.",
        example: "Penn State intern growing SitGuru in Greater Philadelphia",
      },
      {
        label: "About",
        meaning: "Short intern bio. Do not paste customer stories, passwords, or unpublished SitGuru plans.",
      },
      {
        label: "LinkedIn",
        meaning: "Optional. Helps SitGuru see your professional page. Not required for credit.",
      },
      {
        label: "Page color / photo",
        meaning: "Intern-portal appearance only. Photo should be you — not a pet parent, Guru, or classmate without permission.",
      },
    ],
    tips: [
      "Do not put phone numbers or student email in captions, class slides, or public posts.",
      "You cannot edit school, program, or hour requirements here. Ask intern@sitguru.com if those are wrong.",
    ],
    shots: [],
    note: "Keep phone numbers and student email in the form. Do not put other people’s personal information in captions or class screenshots.",
  }),
  article("weekly-checkin", {
    title: "Send your weekly check-in",
    summary:
      "This is the writing that becomes your Business Growth Report. SitGuru reads it as your week’s story — what you shipped, what the numbers showed, and what you will change.",
    purpose:
      "The check-in is not a timesheet and not a chat. Each answer is stored as a contribution to a report section (Market Analysis, Audience Strategy, Pet Parent Growth, and so on). SitGuru uses it in supervisor review and to assemble the report you will finish by the end of the term. “What didn’t work” still counts — failed tests belong in Lessons learned.",
    contributes:
      "Sending a complete week is how your report percent complete rises. Vague lines like “worked on social” do not give SitGuru anything to verify. Specifics (who you reached, which tracking link, what you would do differently) become Measurable outcomes once SitGuru checks the number, or Lessons learned if the test missed.",
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
    fields: [
      {
        label: "Week of",
        meaning: "The Monday (or start date) of the week you are reporting. Do not back-date a different week unless SitGuru asked you to catch up.",
      },
      {
        label: "Contribution to your report",
        meaning:
          "Which chapter this week belongs in. Pick the closest fit. SitGuru can move it later. Market Analysis is research; Pet Parent / Guru Growth is people results; Content / Campaign System is how you posted; Analytics & Attribution is tracking-link proof; Business Growth Report is synthesis near the end.",
        example: "A week spent building Instagram posts with a tracking link → Content System or Campaign System.",
      },
      {
        label: "What did you add or improve this week?",
        meaning: "The new work — not a list of meetings. Who it reached and what you learned.",
        example: "Wrote and scheduled 3 Guru Spotlight drafts for Greater Philadelphia; SitGuru has not approved them yet.",
      },
      {
        label: "What did you finish?",
        meaning: "Completed deliverables SitGuru can open: a sent task, a live post (after approval), a saved campaign, logged hours.",
      },
      {
        label: "What did the numbers show?",
        meaning:
          "What you observed — clicks, signups, impressions — even if SitGuru has not verified them yet. Do not invent a number.",
        example: "Tracking link showed 12 sessions; signup count is still waiting on SitGuru.",
      },
      {
        label: "What didn’t work?",
        meaning: "A miss is still internship evidence. This feeds Lessons learned. Empty this only if nothing failed.",
        example: "Campus flyer with a homepage URL instead of the tracking link — SitGuru cannot count those visits.",
      },
      {
        label: "What’s next?",
        meaning: "The change you will make next week so SitGuru sees a loop, not a one-off.",
      },
      {
        label: "Hours this week",
        meaning:
          "Hours you spent on internship work this week. This is SitGuru’s file copy. Your school still certifies credit hours.",
        example: "8.5 — include real work time, not time waiting on approval.",
      },
      {
        label: "Your number (SitGuru will check it)",
        meaning:
          "One intern-reported result SitGuru can try to verify from an approved source. It stays pending until they confirm. Guessing does not count.",
        example: "27 Pet Parent signups from spring27_growth tracking link",
      },
    ],
    tips: [
      "Write like the report will be read by SitGuru and (in a sanitized form) by your faculty supervisor — specific, no customer names.",
      "You can also log hours on Report. Use one honest weekly total; do not double-count.",
      "Only tap Send this week to SitGuru when the story is true and complete.",
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
    summary:
      "A planner for tasks, check-ins, and program milestones. Calendar does not replace sending the work.",
    purpose:
      "Dots mark something scheduled that week: a task due, a weekly check-in, or a program milestone (for example Program confirmation). Opening a day tells you what is due. It does not submit hours, tasks, or the weekly story.",
    contributes:
      "Use Calendar to plan. Do the actual work on Work, log hours on Report, and send the weekly story from Home. If you only look at Calendar, SitGuru still has nothing to review.",
    category: "Weekly work",
    tags: ["calendar", "milestone", "due date"],
    keywords: ["program confirmation", "up next", "month"],
    steps: [
      "Open Calendar from the green bar.",
      "Tap a dotted day to see what is due.",
      "Do the work on Work, log hours on Report, and send the weekly story from Home.",
    ],
    fields: [
      {
        label: "Dotted day",
        meaning: "Something is scheduled. Tap it. A blank day is not “nothing to do” if Home still shows open work.",
      },
      {
        label: "Milestone",
        meaning:
          "A program checkpoint SitGuru put on your calendar (confirmation, midpoint, final report). It is a reminder, not a grade.",
      },
    ],
    tips: [
      "If a milestone is due and you have questions, email intern@sitguru.com — do not skip the weekly check-in to wait on the milestone.",
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
    summary:
      "A task is assigned internship work. Sending it asks SitGuru to review proof — not to guess that you finished.",
    purpose:
      "Tasks start as to-do. Attachments, a work link, and “What should SitGuru review?” are the evidence packet. SitGuru comments, asks for revision, or accepts the work. Accepted work can feed your report. Empty send = nothing to review.",
    contributes:
      "This is how you prove you completed an assignment. The note tells SitGuru where to look. Status Waiting / revision requested is normal. A KPI letter on a task is SitGuru’s employer snapshot, not your university grade.",
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
    fields: [
      {
        label: "Supporting files",
        meaning: "PDFs, slides, screenshots, or drafts that prove the work. No Pet Parent names, emails, or passwords in the file.",
        example: "Canva PDF of three approved-style post drafts, or a screenshot of the tracking link in the caption.",
      },
      {
        label: "Link to completed work",
        meaning: "The live place SitGuru can open: Google Doc, Canva, published post (only after approval), or Drive folder.",
        example: "https://www.canva.com/design/…",
      },
      {
        label: "What should SitGuru review?",
        meaning:
          "A short brief: what you did, what you want them to check, and anything that is still draft. This is not the weekly check-in — it is about this task only.",
        example: "Please review caption tone and whether the tracking link is in the first comment. Draft is not posted yet.",
      },
      {
        label: "Note to supervisor",
        meaning: "Optional extra context, or (if they asked for revision) what you changed.",
      },
    ],
    tips: [
      "Do not send an empty task. If the work is not ready, leave it to-do and say so in a comment.",
      "If status is revision requested, change the work, explain what you changed, and send it back.",
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
    summary:
      "Logging a post is how SitGuru knows you drafted or published SitGuru work. Designing in Canva does not count until it is logged here.",
    purpose:
      "SitGuru cannot see your personal Canva or CapCut account. The log (title, platform, draft or published link, caption notes, report section) is the intern record. Drafts wait for SitGuru. Live posts should already be approved. Captions never include customer names or emails. Bookings stay on SitGuru — do not send people to another booking site.",
    contributes:
      "Logged posts feed Content System in your report and show SitGuru your volume and quality. Tag @SitGuruOfficial so the brand is consistent. If you skip the log, the week’s social work is invisible in the internship file.",
    category: "Weekly work",
    tags: ["social", "instagram", "tiktok"],
    keywords: ["caption", "published link", "canva", "capcut", "@sitguruofficial"],
    steps: [
      "Open Work → Social, or the Social media toolkit card.",
      "Add a title, platform, draft or published link, and caption notes.",
      "Tag @SitGuruOfficial. Never put a customer name or email in a caption.",
      "Bookings stay on SitGuru.",
    ],
    fields: [
      {
        label: "Title",
        meaning: "A name SitGuru can scan in the list — not the full caption.",
        example: "Guru Spotlight — Greater Philadelphia walk",
      },
      {
        label: "Platform",
        meaning: "Where this will live: Instagram, TikTok, Facebook, X, YouTube, Blog, or Community.",
      },
      {
        label: "Draft link",
        meaning: "Canva, CapCut, or Drive of work that is not live yet. SitGuru reviews this before you post.",
      },
      {
        label: "Published link",
        meaning: "The live URL after SitGuru approved and you posted. Leave blank while it is still a draft.",
      },
      {
        label: "Caption / notes",
        meaning: "The caption or what you want SitGuru to check. No Pet Parent names, emails, or street addresses.",
        example: "Tag @SitGuruOfficial. Tracking link in first comment. Booking stays on SitGuru.",
      },
      {
        label: "Contribution to your report",
        meaning: "Usually Content System. Use Campaign System if this post is part of a named tracking push.",
      },
    ],
    tips: [
      "Log the post even if you designed it in Canva or CapCut.",
      "Do not publish until SitGuru approves. Official posting uses @SitGuruOfficial unless SitGuru assigns another channel.",
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
      "A campaign is a named push with a unique tracking link. SitGuru only counts growth from that link — not from a bare homepage URL.",
    purpose:
      "Without a campaign, SitGuru cannot tell your intern work from everyone else’s traffic. Name it, save it, then copy the tracking link into the post, flyer, or event share. utm_source is the channel; utm_campaign is this push’s name. Referral code is optional if SitGuru gave you one.",
    contributes:
      "This is how intern-attributed Pet Parent or Guru growth gets into Analytics & Attribution and your report. A homepage URL in a caption is intern work SitGuru cannot verify.",
    category: "Weekly work",
    tags: ["campaigns", "utm", "tracking"],
    keywords: ["new campaign", "utm_source", "referral code", "bare homepage"],
    steps: [
      "Open Work → Campaigns or Growth workplace → Campaigns.",
      "Name the campaign and save it before you post.",
      "Copy the tracking link. Never send people to a bare SitGuru homepage.",
    ],
    fields: [
      {
        label: "Campaign name",
        meaning: "Human name for this push. Create it before you post.",
        example: "Spring 2027 campus Pet Parent signup — Instagram",
      },
      {
        label: "utm_source",
        meaning: "The channel people clicked from. Lowercase, no spaces.",
        example: "instagram",
      },
      {
        label: "utm_campaign",
        meaning: "This intern campaign’s machine name. Keep it stable so SitGuru can match weeks.",
        example: "spring27_growth",
      },
      {
        label: "Referral code",
        meaning: "Only if SitGuru issued you a code. Leave blank if they did not.",
      },
      {
        label: "Business objective",
        meaning: "What success looks like in one line — people, not vanity likes.",
        example: "Pet Parent registrations in Greater Philadelphia from campus stories",
      },
      {
        label: "Contribution to your report",
        meaning: "Usually Campaign System or Pet Parent / Guru Growth, depending on who you are trying to grow.",
      },
    ],
    tips: [
      "Copy the tracking link after save. Put it in the post, bio, or first comment — not a bare sitguru.com homepage.",
      "Create the campaign before the post. Retroactive links cannot recover untracked clicks.",
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
      "Report is your Business Growth Report plus Hours this week. Hours are not a separate Work screen.",
    purpose:
      "The Business Growth Report is the semester destination: what you did, SitGuru-checked outcomes, lessons, and recommendations. Percent complete rises as SitGuru accepts weekly work — not as you type. Hours this week is SitGuru’s internship file. Your university still certifies credit hours for school.",
    contributes:
      "Logging hours keeps your internship file honest for SitGuru and for any timesheet your school asks for. The report draft on this tab is assembled from check-ins, accepted tasks, campaigns, and verified metrics. Do not wait until week 15 to write the story — the weekly check-in already writes it.",
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
    fields: [
      {
        label: "Report assembled %",
        meaning:
          "How complete SitGuru’s assembled draft is from accepted intern work. It is not a university grade and not a promise of credit.",
      },
      {
        label: "Measurable outcomes",
        meaning: "Results SitGuru has checked. Your own counts wait here until they confirm.",
      },
      {
        label: "Lessons learned",
        meaning: "What did not work, pulled from weekly check-ins. Empty lessons usually means you skipped “What didn’t work?”",
      },
      {
        label: "Hours this week",
        meaning:
          "Hours spent on internship work this week. Match what you would put on a school timesheet. Do not invent hours to look busy.",
        example: "6 — research + two drafts + check-in writing.",
      },
    ],
    tips: [
      "If you already entered hours on the weekly check-in, use the same total here — one week, one honest number.",
      "Attach final report files only when SitGuru asks. Portfolio versions need written approval and no customer PII.",
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
      "Intern-reported numbers stay Waiting until SitGuru verifies them from an approved source. Guessing does not count toward the report.",
    purpose:
      "Metrics is the verification queue. You name the result, type the value, and point to an approved source (SitGuru Admin, GA4, Meta, TikTok, referral tracking, registration records, and similar). SitGuru compares it to their data. A letter like I on the board is SitGuru’s employer snapshot of KPI contribution — not your university grade.",
    contributes:
      "Verified metrics become Measurable outcomes in the Business Growth Report. Unverified numbers stay pending so you cannot claim growth SitGuru cannot see. That protects you as much as SitGuru: your report will not include inflated counts.",
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
    fields: [
      {
        label: "Metric",
        meaning: "The human name of the result.",
        example: "Pet Parent registrations",
      },
      {
        label: "Metric key",
        meaning: "Short machine name so SitGuru can match weeks. Lowercase with underscores.",
        example: "pet_parent_signups",
      },
      {
        label: "Value",
        meaning: "The number you observed. Do not round up. Do not include other people’s campaigns.",
        example: "27",
      },
      {
        label: "Approved source",
        meaning:
          "Where SitGuru can look it up: SitGuru Admin, Google Analytics (GA4), Search Console, Meta, TikTok, X, YouTube, Mailchimp, referral tracking, SitGuru registration records, or another source they already approved.",
      },
      {
        label: "Source note / report link",
        meaning: "How to find it — report name, date range, or a screenshot attachment. No passwords.",
        example: "GA4 Greater Philadelphia, last 7 days, campaign spring27_growth",
      },
    ],
    tips: [
      "If you do not have an approved source, do not submit a number. Describe what you saw in the weekly check-in instead.",
      "Live totals on Home are market-wide. They are not automatically “your” intern result.",
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
    summary:
      "SitGuru’s visual rules so intern creative looks like SitGuru — logo, brand green #0D5C3A, white type on green, @SitGuruOfficial.",
    purpose:
      "Pet Parents and Gurus should recognize SitGuru immediately. Dark text on brand green fails (site headings default to slate). University logos imply the school endorses SitGuru unless SitGuru recorded permission. Rogue is the mascot. Bookings stay on SitGuru.",
    contributes:
      "Following the kit keeps your drafts approvable. SitGuru will send brand-breaking work back. That delay is intern time you do not get back.",
    category: "Intern toolkit",
    tags: ["brand", "logo", "green"],
    keywords: ["#0d5c3a", "rogue", "university logo", "mix-blend", "chopper", "vector prints"],
    steps: [
      "On Home, tap Brand kit, or download logos from this Help article.",
      "Copy brand green #0D5C3A. Use white type on that green — never dark text.",
      "Tag @SitGuruOfficial. Do not use a university logo unless SitGuru recorded permission.",
    ],
    fields: [
      {
        label: "Brand green",
        meaning: "SitGuru green #0D5C3A. Copy it into Canva. On that green, type is white.",
      },
      {
        label: "Handle",
        meaning: "@SitGuruOfficial on Instagram, Facebook, TikTok, X, and YouTube.",
      },
      {
        label: "Official logos",
        meaning:
          "Chopper vector logos and Vector Prints add-ons are on this page. Download SVG/PDF/EPS for print. Use mix-blend-multiply if a white box appears on brand green.",
      },
    ],
    tips: [
      "If a logo sits on a colored header, avoid a white box around it — white should read as transparent.",
      "Rogue is high-energy and loving. Do not invent a different mascot.",
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
    summary:
      "Same job as creating a campaign: SitGuru only counts growth from your unique link.",
    purpose:
      "Tracking links attach intern work to SitGuru analytics. Create the campaign name, save, then copy the link. Use that same link everywhere for that push (caption, bio, flyer, event share).",
    contributes:
      "This is the intern’s attribution tool. Without it, a busy social week may add nothing verifiable to your report.",
    category: "Intern toolkit",
    tags: ["tracking", "utm", "link"],
    keywords: ["utm_campaign", "spring27_growth", "save tracking link", "copy"],
    steps: [
      "Tap Tracking links on Home.",
      "Create a campaign name, then save.",
      "Copy the unique link after it appears. Use it in every post for that campaign.",
    ],
    fields: [
      {
        label: "Campaign name",
        meaning: "The name of this push. Save first — the link appears after save.",
        example: "spring27_growth campus stories",
      },
    ],
    tips: [
      "One campaign, one link family. Do not make a new link for every story unless SitGuru asked you to split tests.",
      "Work → Campaigns and Growth workplace → Campaigns create the same kind of intern tracking record.",
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
    summary:
      "Checked market totals for intern context — people and social in your area. No names, emails, or payouts.",
    purpose:
      "The snapshot is SitGuru’s intern-safe view of the market so you can write Market Analysis and weekly “what the numbers showed” without seeing Pet Parent records. Pending numbers are waiting on SitGuru. They are not yours to publish as fact.",
    contributes:
      "Use checked totals in the report as market context (“the market had X Find Care visits”). Do not treat market-wide totals as your personal intern KPI unless SitGuru verified a campaign-attributed number on Metrics.",
    category: "Intern toolkit",
    tags: ["snapshot", "market", "kpis"],
    keywords: ["greater philadelphia", "checked numbers", "find care"],
    steps: [
      "Tap Market snapshot on Home.",
      "Use the totals SitGuru has checked. Pending numbers wait on SitGuru.",
    ],
    tips: [
      "If a number is pending, write “waiting on SitGuru” in the check-in. Do not screenshot Admin-looking data you do not have.",
      "Never copy snapshot numbers into unapproved AI tools.",
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
    summary:
      "Public SitGuru community events you may promote. Always attach a tracking link. Do not add private details.",
    purpose:
      "Events to share is a list of public pet events SitGuru already published. Open event or Copy gives you the public card — title, when, place — not partner emails or extra street addresses. Your job is to promote with a tracking link so SitGuru can see intern-driven traffic.",
    contributes:
      "Event shares can feed Pet Event / community growth in the Market Growth Project. Untracked shares are intern effort SitGuru cannot put in the report.",
    category: "Intern toolkit",
    tags: ["events", "community"],
    keywords: ["open event", "copy", "public events", "pennsylvania", "new jersey", "vendor"],
    steps: [
      "Tap Events to share on Home.",
      "Open the event or copy the public details.",
      "Share with a tracking link. Do not add private emails or street addresses that are not already on the public card.",
    ],
    fields: [
      {
        label: "Open event",
        meaning: "The public event page. Use it as the destination behind your tracking link.",
      },
      {
        label: "Copy",
        meaning: "Public details only. Do not paste extra partner phones or home addresses into the caption.",
      },
    ],
    tips: [
      "Create or copy a tracking campaign before you post the event.",
      "If an event is not on this list, ask SitGuru. Do not scrape private rescue inboxes.",
      "PA and NJ vendor research lives in intern Help → PA & NJ vendor events. SitGuru decides booth applications.",
    ],
    shots: [
      {
        file: "24-tool-events.png",
        alt: "Events to share intern tool",
        caption: "Public listings only.",
      },
    ],
  }),
  article("vendor-events", {
    title: "PA & NJ vendor events",
    summary:
      "SitGuru’s approved vendor-research list for Pennsylvania and New Jersey pet events. Promote public listings. Do not apply as SitGuru unless assigned.",
    purpose:
      "This packet is SitGuru’s planning list for booths at pet expos, festivals, and shelter events. Interns use it for Partner Growth and Event posts — always with a tracking link to sitguru.com/events or a public Events-to-share card. Interns do not submit vendor applications, buy booths, or collect private emails.",
    contributes:
      "Event and partner shares with tracking can feed Partner Growth, Pet Parent Growth, or Campaign System. Untracked shares do not count.",
    category: "Intern toolkit",
    tags: ["events", "vendor", "pennsylvania", "new jersey"],
    keywords: [
      "paws at the park",
      "dogdaddy",
      "pupstock",
      "oaks",
      "burlington",
      "vendor events",
      "pet expo",
    ],
    fields: INTERN_VENDOR_EVENTS,
    steps: [
      "Download the PA & NJ vendor events Word file from intern Help.",
      "Check Events to share for a public card before you post.",
      "Create a tracking link. Tag @SitGuruOfficial.",
      "If SitGuru assigns booth work, use tracking codes SitGuru gives you — do not invent vendor applications.",
    ],
    tips: [
      "Priority targets: Paws at the Park, Dogdaddy Festival, Burlington County shelter events, Pupstock, Greater Philadelphia Pet Expo.",
      "Booth copy SitGuru already approved: Find trusted local pet care. Become a Guru. Students: become a SitGuru Ambassador.",
    ],
    shots: [],
    note: "Public destination: https://www.sitguru.com/events. Interns do not add street addresses or partner emails that are not already public.",
  }),
  article("payments-on-sitguru", {
    title: "Payments stay on SitGuru",
    summary:
      "Pet Parents pay on SitGuru through Stripe. Gurus and Ambassadors complete payout setup on their own dashboards. Interns never enter bank or card details.",
    purpose:
      "Interns need the trust story: bookings and payments stay on SitGuru. Stripe processes the charge. SitGuru applies the marketplace fee. Gurus receive Earnings after they finish Stripe. Interns explain that story in SitGuru Feature posts. Interns do not complete Stripe, enter SSN, or log into a bank.",
    contributes:
      "Accurate payment copy supports Conversion Optimization and SitGuru Feature posts. Helping someone enter bank credentials is not intern work and can revoke access.",
    category: "Getting started",
    tags: ["stripe", "payments", "trust"],
    keywords: ["stripe", "payout", "earnings", "payment", "bookings stay on sitguru", "checkout"],
    fields: INTERN_PAYMENTS_INTERN_SAFE,
    steps: [
      "Use this language: Bookings stay on SitGuru. Payments are secure through Stripe.",
      "Send Gurus to Become a Guru with a tracking link. They complete payout on their Guru dashboard.",
      "If someone asks you to enter bank, SSN, or card details, stop and email intern@sitguru.com. Product payout help is support@sitguru.com.",
    ],
    tips: [
      "The Stripe setup Word file is a SitGuru product packet for awareness — not intern homework to complete.",
      "Interns do not open Guru Earnings, Ambassador commissions, or Pet Parent checkout.",
    ],
    shots: [
      {
        file: "assets/pet-parent-payment-guide.jpg",
        alt: "SitGuru Pet Parent payment guide showing Stripe checkout",
        caption: "Pet Parents pay on SitGuru. Interns never collect card numbers.",
      },
      {
        file: "assets/guru-stripe-setup-guide.jpg",
        alt: "SitGuru Guru Stripe setup guide overview",
        caption: "Guru payout setup lives on the Guru dashboard. Interns do not complete it.",
      },
      {
        file: "assets/ambassador-stripe-setup-guide.jpg",
        alt: "SitGuru Ambassador Stripe setup guide overview",
        caption: "Ambassador payouts are not intern internship pay.",
      },
    ],
    note: "Do not paste Stripe, bank, or SSN details into ChatGPT or intern drafts.",
  }),
  article("toolkit-social", {
    title: "Draft social from the toolkit",
    summary:
      "Same intern job as Work → Social, with shortcuts to official SitGuru accounts. Logging still matters.",
    purpose:
      "The Social media toolkit card is a faster place to draft and log. SitGuru still posts from official accounts unless they give you a channel. Your intern log is how they see what you made.",
    contributes:
      "Draft here, tag @SitGuruOfficial, wait for approval, post if they asked you to, then paste the live link. Unlogged drafts do not appear in the report.",
    category: "Intern toolkit",
    tags: ["social", "draft"],
    keywords: ["facebook", "instagram", "tiktok", "youtube", "log a social post"],
    steps: [
      "Tap Social media on Home.",
      "Draft here, tag @SitGuruOfficial, then log the live link.",
      "SitGuru posts from official accounts unless they give you a channel.",
    ],
    tips: [
      "Use Work → Social if you also need “What should SitGuru review?” on a specific post.",
      "Bookings stay on SitGuru in every caption.",
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
      "On-the-project training for the SitGuru Market Growth Project. Write posts, campaigns, and media. SitGuru approves before anything is live.",
    purpose:
      "Growth workplace is intern chrome, not Admin HQ. You do not get passwords, Pet Parent personal information, or payment tools. Weekly KPIs on that home are intern-safe market signals. The bottom bar is Home, Campaigns, Create (+), Media, More.",
    contributes:
      "This is where intern creative is produced for SitGuru to approve. Work you save here can become Content System and Campaign System evidence. Publishing without approval violates intern-safe rules and can revoke access.",
    category: "Growth workplace",
    tags: ["growth", "workplace"],
    keywords: ["create a post", "megaphone", "not admin hq", "bottom bar"],
    steps: [
      "Tap Growth workplace in the header or Open workplace on Home.",
      "Use the bottom bar: Home, Campaigns, Create (+), Media, More.",
      "Do not publish until SitGuru approves. You do not get Admin HQ, passwords, or Pet Parent personal information.",
    ],
    tips: [
      "Open it from the header Growth workplace button or the Home card.",
      "If you need Admin-looking data, you are in the wrong place — use Market snapshot and Metrics instead.",
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
      "Pick a post type, fill the brief, save, copy the tracking link, then publish only after SitGuru approves.",
    purpose:
      "Create is a structured brief so SitGuru can approve intern copy. Post type tells them the job (Guru Spotlight, Event, Partner, PawPerks, Pet Parent, SitGuru Feature, General). Title, channel, market, caption, destination, and date are what they review. Destination should be a tracking link, not a bare homepage.",
    contributes:
      "A complete brief is intern work they can approve quickly. Missing tracking or customer PII in the caption sends it back. After save, you still post in Canva / CapCut / Meta / TikTok yourself unless SitGuru says otherwise.",
    category: "Growth workplace",
    tags: ["create", "caption", "guru spotlight"],
    keywords: ["pawperks", "event", "pet parent", "destination", "canva"],
    steps: [
      "Open Create and pick a type (Guru Spotlight, Event, Partner, PawPerks, Pet Parent, SitGuru Feature, or General Post).",
      "Fill title, channel, market, caption, destination, and date.",
      "Save, copy the tracking link, then publish in Canva / CapCut / Meta / TikTok only after SitGuru approves.",
    ],
    fields: [
      {
        label: "Post type",
        meaning: "The campaign job. Guru Spotlight features a Guru; Event promotes a public event; Pet Parent speaks to pet owners; PawPerks is rewards; Partner is an approved partner; SitGuru Feature is a product story.",
      },
      {
        label: "Title",
        meaning: "Internal name for SitGuru’s queue.",
        example: "Event — weekend adoption meetup",
      },
      {
        label: "Channel / market / date",
        meaning: "Where and when this should run (Instagram, Greater Philadelphia, the event date). SitGuru uses this to schedule review.",
      },
      {
        label: "Caption",
        meaning: "The public words. Tag @SitGuruOfficial. No customer names. Booking stays on SitGuru.",
      },
      {
        label: "Destination",
        meaning: "The URL people should open — your tracking link.",
      },
    ],
    tips: [
      "Save first so the tracking link exists, then paste that link into Destination and the live post.",
      "Do not treat Create as auto-publish to Instagram.",
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
    summary:
      "Campaigns in Growth workplace are the tracking links for intern posts. Every real post needs one.",
    purpose:
      "This list is the intern’s link drawer. Create a Guru or Pet Parent post (or save a campaign) to mint a link. Ready to share means you can copy it into the live caption. Empty campaigns means you have not created a tracked push yet.",
    contributes:
      "Same attribution rule as Work → Campaigns. Untracked posts cannot become verified intern outcomes.",
    category: "Growth workplace",
    tags: ["campaigns", "links"],
    keywords: ["new campaign", "copy tracking", "ready to share"],
    steps: [
      "Open Campaigns in Growth workplace.",
      "Create a Guru or Pet Parent post to get a link.",
      "Copy that link into the live post.",
    ],
    tips: [
      "If the list is empty, create a post or campaign first — there is no generic intern homepage link that counts.",
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
      "Media is the intern asset library. SitGuru reviews links here. They do not post to Instagram for you.",
    purpose:
      "Drop Canva, CapCut, or Drive URLs so SitGuru can open the file without hunting your inbox. Title, type, and “what it is for” tell them whether this is a reel, static, or report graphic. Status needs review until they say it is ready.",
    contributes:
      "Saved media is proof of intern creative. It can support a task or post. Treating an unreviewed asset as live is how intern work gets published off-brand.",
    category: "Growth workplace",
    tags: ["media", "canva", "capcut"],
    keywords: ["save asset", "reel", "drive link", "needs review"],
    steps: [
      "Open Media in Growth workplace.",
      "Add a title, Canva / CapCut / Drive link, type, and what it is for.",
      "Save the asset, then wait for SitGuru review before treating it as live. You still post in Meta and TikTok after approval.",
    ],
    fields: [
      {
        label: "Title",
        meaning: "What SitGuru will see in the media list.",
        example: "Guru Spotlight reel — week 4",
      },
      {
        label: "Canva / CapCut / Drive link",
        meaning: "A link they can open. Check sharing: SitGuru must be able to view it. No passwords in the notes.",
      },
      {
        label: "Type / what it is for",
        meaning: "Reel, static, story, report figure — and which campaign or task it supports.",
      },
    ],
    tips: [
      "After they approve, you still post in Meta or TikTok unless SitGuru assigns an official channel.",
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
      "These rules keep you, SitGuru, and your school out of a data or brand problem. They are also in the intern agreement.",
    purpose:
      "Intern-safe means you can do the Market Growth Project without Admin HQ, customer PII, Stripe/bank setup, or unapproved AI. The rules exist because intern work still touches confidential SitGuru information: strategy, analytics, drafts, credentials. Breaking them can end the internship and is not “just a handbook miss.”",
    contributes:
      "Following them protects your ability to finish for credit. SitGuru can still use your approved, sanitized work in a portfolio later. Using SitGuru confidential information to help a competing pet care marketplace is prohibited; ordinary work in pet care is not.",
    category: "Getting started",
    tags: ["rules", "privacy", "ai"],
    keywords: [
      "admin hq",
      "passwords",
      "chatgpt",
      "sitguru ai",
      "rogue",
      "stripe",
      "ssn",
      "pii",
      "portfolio",
      "university logo",
      "credentials",
      "competing marketplace",
    ],
    steps: [
      "Use only the intern portal and Growth workplace.",
      "Do not share this login. Report a lost device to SitGuru right away.",
      "Do not drop SitGuru confidential information into unapproved AI or chatbots. SitGuru companions (Rogue, Taco, Scout, Delilah) and official SitGuru videos on intern Help are approved. ChatGPT is not for credentials, customer PII, or unpublished analytics.",
      "Do not complete Stripe, bank, SSN, or card checkout. Payments stay on SitGuru. Payout help is support@sitguru.com.",
      "Keep customer names and emails out of drafts, class slides, and portfolios.",
      "Do not count a result as yours until SitGuru verifies it.",
      "Drafts wait for SitGuru. A cleaned-up portfolio version needs written approval.",
      "Do not use SitGuru confidential information to build or help a competing pet care marketplace. Working in pet care is still allowed.",
      "When the internship ends, return or delete SitGuru credentials and internal data.",
    ],
    tips: [
      "SitGuru AI companions and official intern Help videos are approved SitGuru tools. Still never paste passwords, customer names, or unpublished numbers into ChatGPT.",
      "If a device is lost or you pasted something into the wrong chat, email intern@sitguru.com immediately.",
      "A cleaned-up portfolio version of your report needs SitGuru written approval first.",
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
      article.purpose,
      article.contributes,
      article.category,
      ...article.tags,
      ...article.keywords,
      ...article.steps,
      ...article.tips,
      ...article.fields.flatMap((field) => [field.label, field.meaning, field.example || ""]),
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
  if (/^assets\/[a-z0-9._-]+\.(jpg|jpeg|png)$/i.test(clean)) return true;
  if (/^assets\/brand\/[a-z0-9._-]+\.(jpg|jpeg|png|svg)$/i.test(clean)) return true;
  return /^screenshots\/[0-9]{2}-[a-z0-9-]+\.png$/.test(clean);
}
