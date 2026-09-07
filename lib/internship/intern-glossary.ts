import {
  SITGURU_OFFICIAL_HANDLE,
  SITGURU_OFFICIAL_SOCIAL_LINKS,
} from "@/lib/chat/sitguru-social";

export { SITGURU_OFFICIAL_HANDLE, SITGURU_OFFICIAL_SOCIAL_LINKS };

export type InternGlossaryTerm = {
  label: string;
  meaning: string;
  example?: string;
};

export type InternWatchVideo = {
  id: string;
  title: string;
  src: string;
  poster: string;
  group: "product" | "pet-parent" | "guru" | "ambassador";
  watchFor: string;
  promoteHref: string;
};

export const INTERN_EVENTS_URL = "https://www.sitguru.com/events";
export const INTERN_PAWPERKS_URL = "https://www.sitguru.com/customer/dashboard/pawperks";
export const INTERN_FIND_CARE_URL = "https://www.sitguru.com/search";
export const INTERN_PAWREPORT_GUIDE_URL = "https://www.sitguru.com/help/parents/pawreport-guide";
export const INTERN_LIVE_CARE_URL = "https://www.sitguru.com/help/booking/live-care-updates";
export const INTERN_AMBASSADORS_URL = "https://www.sitguru.com/ambassadors";
export const INTERN_BECOME_GURU_URL = "https://www.sitguru.com/become-a-guru";
export const INTERN_SUPPORT_INBOX = "support@sitguru.com";

export const INTERN_OFFICIAL_WEB_LINKS = [
  {
    label: "Find Care",
    href: INTERN_FIND_CARE_URL,
    meaning:
      "Public search for trusted local Gurus. Interns send people here with a tracking link. Bookings stay on SitGuru.",
  },
  {
    label: "Pet Events",
    href: INTERN_EVENTS_URL,
    meaning:
      "SitGuru’s public pet events page. Interns promote listings from Events to share or from this page, always with a tracking link. Do not add private emails or street addresses that are not already public.",
  },
  {
    label: "PawPerks",
    href: INTERN_PAWPERKS_URL,
    meaning:
      "The Pet Parent PawPerks rewards dashboard after they sign in. Interns do not log into a Pet Parent account. Promote PawPerks with a tracking link. This URL is the destination Pet Parents land on once they are signed in.",
  },
  {
    label: "PawReport",
    href: INTERN_PAWREPORT_GUIDE_URL,
    meaning:
      "Live care updates tied to a booking: walk progress, distance, route, photos, and care notes. Interns promote PawReport as a SitGuru Feature. They do not run Guru live walks from the intern portal.",
  },
  {
    label: "Ambassadors",
    href: INTERN_AMBASSADORS_URL,
    meaning:
      "Public Ambassador program page, including the promo video. Interns may promote it with a tracking link. Internship hours stay in the intern portal — not Ambassador commissions.",
  },
  {
    label: "Become a Guru",
    href: INTERN_BECOME_GURU_URL,
    meaning:
      "Public Guru join path. Interns send interested sitters here with a tracking link. Interns do not set up Guru Stripe or open Guru Earnings.",
  },
] as const;

export const INTERN_AI_COMPANIONS: InternGlossaryTerm[] = [
  {
    label: "Rogue — Chief Treat Officer",
    meaning:
      "SitGuru AI for Pet Parents. Use it to draft intern-safe Pet Parent community copy, then wait for SitGuru approval. Do not paste credentials, customer PII, or unpublished analytics.",
    example: "https://www.sitguru.com/?chat=rogue#ai-companions",
  },
  {
    label: "Taco — Ambassador Advocate",
    meaning:
      "SitGuru AI for Ambassador outreach and tracking-link questions. Helps intern social/community growth copy for the Ambassador path. Internship work still logs in the intern portal.",
    example: "https://www.sitguru.com/ambassadors?chat=taco",
  },
  {
    label: "Scout — Guru Matching Officer",
    meaning:
      "SitGuru AI for Gurus and Guru recruiting. Use it when a SitGuru Feature post is about becoming a Guru or Find Care matching.",
    example: "https://www.sitguru.com/become-a-guru?chat=scout",
  },
  {
    label: "Delilah — Pet Event Coordinator",
    meaning:
      "SitGuru AI for Pet Events. Use it when the intern job is promoting a public event with a tracking link.",
    example: "https://www.sitguru.com/events?chat=delilah",
  },
];

const PRODUCT_POSTER = "/images/sitguru-homepage-hero-poster.jpg";
const AMBASSADOR_POSTER = "/images/ambassadors/student-ambassador2.jpg";
const UNIVERSITY_POSTER = "/images/university/sitguru-university-guide.jpg";

export const INTERN_WATCH_VIDEOS: InternWatchVideo[] = [
  {
    id: "from-chaos-to-clarity",
    title: "SitGuru: From Chaos to Clarity",
    src: "/videos/sitguru-from-chaos-to-clarity.mp4",
    poster: PRODUCT_POSTER,
    group: "product",
    watchFor:
      "The product story: SitGuru turns messy pet-care hunting into a trusted marketplace. Use this before you write SitGuru Feature captions.",
    promoteHref: "https://www.sitguru.com/",
  },
  {
    id: "trusted-pet-care",
    title: "SitGuru: Trusted Pet Care",
    src: "/videos/sitguru-trusted-pet-care.mp4",
    poster: PRODUCT_POSTER,
    group: "product",
    watchFor:
      "Brand promise — Trusted Pet Care. Simplified. Bookings stay on SitGuru. Payments stay on SitGuru.",
    promoteHref: "https://www.sitguru.com/",
  },
  {
    id: "trusted-local-pet-care",
    title: "SitGuru: Trusted Local Pet Care",
    src: "/videos/sitguru-trusted-local-pet-care.mp4",
    poster: PRODUCT_POSTER,
    group: "product",
    watchFor:
      "YouTube product video: trusted local care on SitGuru. Watch first, then promote homepage or Find Care with a tracking link.",
    promoteHref: INTERN_FIND_CARE_URL,
  },
  {
    id: "ambassador-promo",
    title: "SitGuru Ambassador promo",
    src: "/videos/sitguru-ambassador-promo.mp4",
    poster: AMBASSADOR_POSTER,
    group: "product",
    watchFor:
      "What Ambassadors actually do: share, refer, show up locally, grow the pack. Interns promote this path. They do not run Ambassador payouts as intern work.",
    promoteHref: `${INTERN_AMBASSADORS_URL}#ambassador-video`,
  },
  {
    id: "pet-parent-overview",
    title: "Pet Parent Academy — Certified Trust overview",
    src: "/videos/sitguru-pet-parent-overview.mp4",
    poster: UNIVERSITY_POSTER,
    group: "pet-parent",
    watchFor:
      "How Pet Parents find, book, and trust care on SitGuru. Interns do not log into a Pet Parent account or complete Pet Parent Academy for intern credit.",
    promoteHref: INTERN_FIND_CARE_URL,
  },
  {
    id: "pet-parent-masterclass",
    title: "Certified Trust: The SitGuru Pet Parent Masterclass",
    src: "/videos/sitguru-pet-parent-masterclass.mp4",
    poster: UNIVERSITY_POSTER,
    group: "pet-parent",
    watchFor:
      "Pet Parent Academy deep dive. Watch so intern Event and Pet Parent posts match SitGuru’s trust language.",
    promoteHref: INTERN_FIND_CARE_URL,
  },
  {
    id: "guru-opportunity",
    title: "Guru Academy — The Guru Opportunity",
    src: "/videos/sitguru-guru-opportunity.mp4",
    poster: "/images/university/guru-certified-badge.png",
    group: "guru",
    watchFor:
      "Why people become Gurus. Interns recruit to Become a Guru with a tracking link. Interns do not complete Guru Stripe or Guru Academy as intern hours.",
    promoteHref: INTERN_BECOME_GURU_URL,
  },
  {
    id: "ambassador-onboarding",
    title: "Student Ambassador Onboarding — The Ecosystem Equation",
    src: "/videos/sitguru-student-ambassador-onboarding.mp4",
    poster: AMBASSADOR_POSTER,
    group: "ambassador",
    watchFor:
      "How Pet Parents, Gurus, and Ambassadors fit together. Use this before Partner Growth or Ambassador SitGuru Feature posts.",
    promoteHref: INTERN_AMBASSADORS_URL,
  },
  {
    id: "ambassador-playbook",
    title: "Ambassador Academy — Playbook",
    src: "/videos/sitguru-ambassador-playbook.mp4",
    poster: AMBASSADOR_POSTER,
    group: "ambassador",
    watchFor:
      "Approved outreach: parks, events, campus, talking points. Intern social still waits for SitGuru approval. Intern tracking links are not Ambassador payout links.",
    promoteHref: INTERN_AMBASSADORS_URL,
  },
  {
    id: "ambassador-training",
    title: "Ambassador Academy — Training (optional)",
    src: "/videos/sitguru-ambassador-training.mp4",
    poster: AMBASSADOR_POSTER,
    group: "ambassador",
    watchFor:
      "Optional extra Ambassador training. Watch if SitGuru asked you to understand the Ambassador dashboard. Switch to Intern for credit-bearing intern work.",
    promoteHref: INTERN_AMBASSADORS_URL,
  },
];

export const INTERN_BRAND_LOGOS: Array<{
  id: string;
  label: string;
  src: string;
  use: string;
  download?: string;
  onGreen?: boolean;
}> = [
  {
    id: "horizontal",
    label: "Horizontal logo",
    src: "/images/brand/intern/sitguru-logo-horizontal.jpg",
    use: "Canva titles, flyers, and captions. Prefer this lockup for most intern posts.",
  },
  {
    id: "vector-preview",
    label: "Full logo (print preview)",
    src: "/images/brand/intern/sitguru-logo-vector.jpg",
    use: "Same lockup as the vector print file. Download SVG/PDF/EPS for print.",
    download: "/images/brand/intern/sitguru-full-logo-vector.svg",
  },
  {
    id: "symbol-green",
    label: "Dog & cat mark (green)",
    src: "/images/brand/intern/sitguru-symbol-green.jpg",
    use: "Profile pictures, stickers, and small corners.",
  },
  {
    id: "symbol-bw",
    label: "Dog & cat mark (black & white)",
    src: "/images/brand/intern/sitguru-symbol-bw.jpg",
    use: "One-color print when color is not available.",
  },
  {
    id: "icon-transparent",
    label: "Icon vector (transparent)",
    src: "/images/brand/intern/sitguru-icon-transparent.svg",
    use: "On brand green headers, white should read as transparent. Use mix-blend-multiply if a white box appears.",
    onGreen: true,
  },
  {
    id: "cropped",
    label: "Site logo (cropped)",
    src: "/images/brand/intern/sitguru-logo-cropped.png",
    use: "The same logo SitGuru uses on the website header.",
  },
];

export const INTERN_WATCH_VIDEO_GROUPS = [
  { id: "product" as const, title: "SitGuru product — watch first" },
  { id: "pet-parent" as const, title: "Pet Parent Academy" },
  { id: "guru" as const, title: "Guru Academy" },
  { id: "ambassador" as const, title: "Ambassador Academy" },
];

export const INTERN_SITGURU_FEATURES: InternGlossaryTerm[] = [
  {
    label: "SitGuru Feature",
    meaning:
      "Growth workplace post type for a product story: Find Care, PawReport, PawPerks, Pet Events, SitGuru AI, SitGuru University, or official videos. Always use a tracking link. Bookings stay on SitGuru.",
    example: "PawReport Live — Pet Parents see the walk as it happens.",
  },
  {
    label: "Find Care",
    meaning:
      "Public Guru search. Interns send Pet Parents here with a tracking link, not a bare homepage.",
    example: INTERN_FIND_CARE_URL,
  },
  {
    label: "PawReport",
    meaning:
      "Live care updates on an active booking: progress, distance, route, photos, water/potty/food/play notes, and completed visit history. Interns promote it. They do not start Guru walks from intern Help.",
    example: INTERN_PAWREPORT_GUIDE_URL,
  },
  {
    label: "PawPerks",
    meaning:
      "Pet Parent rewards. Interns promote with a tracking link. Do not log into a Pet Parent dashboard.",
    example: INTERN_PAWPERKS_URL,
  },
  {
    label: "Pet Events",
    meaning:
      "Public SitGuru community events. Promote from Events to share or sitguru.com/events. Attach a tracking link.",
    example: INTERN_EVENTS_URL,
  },
  {
    label: "Meet the Pack (SitGuru AI)",
    meaning:
      "Rogue, Taco, Scout, and Delilah are approved SitGuru tools for intern community and social drafts. Do not paste credentials, customer PII, or unpublished analytics into ChatGPT or other unapproved AI.",
    example: "https://www.sitguru.com/?chat=rogue#ai-companions",
  },
  {
    label: "SitGuru University",
    meaning:
      "SitGuru’s onboarding academies for Pet Parents, Gurus, and Ambassadors. Certificates are platform training, not school credit and not this internship. Interns watch the videos to promote the paths. SitGuru University is not an accredited educational institution.",
  },
  {
    label: "Bookings stay on SitGuru",
    meaning:
      "Pet Parents request and pay on SitGuru. Stripe processes the payment. SitGuru applies the marketplace fee. Gurus receive payouts in Earnings after they complete Stripe. Interns never take payment off-platform and never collect card numbers.",
  },
];

export const INTERN_UNIVERSITY_PATHS: InternGlossaryTerm[] = [
  {
    label: "Pet Parent Academy",
    meaning:
      "Short SitGuru University path: pet profiles, Find Care, Meet & Greet, booking safely. Completing it can show a Certified Pet Parent badge. Interns watch; they do not complete it on a Pet Parent login for intern hours.",
  },
  {
    label: "Guru Academy",
    meaning:
      "Optional SitGuru University path for Gurus. A Certified Guru badge is not required to become bookable. Interns recruit Gurus. They do not finish Guru payout setup.",
  },
  {
    label: "Ambassador Academy",
    meaning:
      "SitGuru University path for community advocates: approved outreach, tracking, referrals, PawPerks as a Pet Parent reward to mention — not intern commissions. Internship work stays in the intern portal.",
  },
  {
    label: "Ambassador Dashboard",
    meaning:
      "Ambassador workspace: QR codes, official social, referral tracking, commissions, and payouts. If your login also has Intern, use Switch to Intern for credit-bearing intern work. Do not log intern hours against Ambassador commissions.",
  },
];

export const INTERN_VENDOR_EVENTS: InternGlossaryTerm[] = [
  {
    label: "Paws at the Park (priority)",
    meaning: "Allentown, PA — May 31, 2026. Local, pet-specific, affordable booth. SitGuru’s first-priority PA vendor target.",
  },
  {
    label: "Dogdaddy Festival (priority)",
    meaning: "Rice’s Market, New Hope, PA — June 6, 2026. Bucks County. Vendor call asks for pet services.",
  },
  {
    label: "Fur Baby Festival / Paw Prints PetFest (priority)",
    meaning: "Burlington County, NJ — April and October 2026. Shelter-linked pet-family events. Strong NJ expansion.",
  },
  {
    label: "Pupstock Festival (priority)",
    meaning: "Sussex County Fairgrounds, Augusta, NJ — August 22, 2026. Family dog festival. Brand visibility.",
  },
  {
    label: "Greater Philadelphia Pet Expo (priority)",
    meaning: "Oaks, PA — March 6–8, 2026. Large regional pet-owner traffic. Bigger booth investment.",
  },
  {
    label: "National Dog Show Cluster (priority)",
    meaning: "Oaks, PA — November 12–15, 2026. Strong dog-owner audience. COI and a polished booth required.",
  },
  {
    label: "How interns use this list",
    meaning:
      "This is SitGuru’s vendor-research packet, not a student shopping list. Promote public events that SitGuru already listed in Events to share. Do not apply as SitGuru unless SitGuru assigns booth work. Every share needs a tracking link. Do not add private emails.",
    example: INTERN_EVENTS_URL,
  },
];

export const INTERN_PAYMENTS_INTERN_SAFE: InternGlossaryTerm[] = [
  {
    label: "Pet Parent payment",
    meaning:
      "Pet Parents pay on SitGuru through Stripe checkout. Interns explain that bookings and payments stay on SitGuru. Interns never collect card numbers, CVC, or billing addresses.",
  },
  {
    label: "Guru payouts",
    meaning:
      "Gurus complete Stripe Connect so Earnings can pay out. Interns may say payouts are secure on SitGuru. Interns do not enter SSN, bank username, or bank password, and they do not open Guru Earnings.",
  },
  {
    label: "Ambassador payouts",
    meaning:
      "Ambassadors complete Stripe to receive referral earnings. That is not intern internship pay. Intern questions go to intern@sitguru.com. Product payout help goes to support@sitguru.com.",
    example: `mailto:${INTERN_SUPPORT_INBOX}`,
  },
];

export const INTERN_REPORT_SECTION_DEFINITIONS: InternGlossaryTerm[] = [
  {
    label: "Contribution to your report",
    meaning:
      "The dropdown on weekly check-in, tasks, posts, and campaigns. It asks “Which part of your report did this help?” Pick the closest fit. SitGuru can move it later. That pick files your work into the Business Growth Report instead of leaving it as a loose note.",
    example: "A week of Instagram drafts with a tracking link → Content System or Campaign System.",
  },
  {
    label: "Market Analysis",
    meaning:
      "Research on SitGuru’s market: who needs pet care, where demand is, and what the intern-safe snapshot shows. For you, this is the starting chapter — proof you understood the market before you posted. Use market totals, not customer names.",
    example: "Greater Philadelphia snapshot: Find Care interest vs Guru coverage, with no Pet Parent PII.",
  },
  {
    label: "Audience Strategy",
    meaning:
      "Who the message is for. Pet Parents book care. Gurus provide care. Partners and events help reach both. For you, this is writing “this post is for X in this market,” so SitGuru can approve the right tone and destination.",
    example: "Campus Pet Parents who need a weekend walker — not a Guru recruiting post.",
  },
  {
    label: "Growth Strategy",
    meaning:
      "The plan, not one post: what you are trying to grow this term and how you will measure it. For you, this is SMART goals tied to intern work SitGuru can verify (signups, Guru interest, tracked clicks) — not vanity likes.",
    example: "Grow tracked Pet Parent registrations from campus stories using one campaign link.",
  },
  {
    label: "Content System",
    meaning:
      "How SitGuru intern posts get made, tagged, logged, and approved. For you, this is the repeatable machine: brand kit, @SitGuruOfficial, draft in Canva/CapCut, log in Work or the toolkit, wait for SitGuru, then publish if they say yes.",
    example: "Three Guru Spotlight drafts logged with draft links, not yet live.",
  },
  {
    label: "Campaign System",
    meaning:
      "Named pushes with a unique tracking link. SitGuru only counts intern growth from that link — not a bare homepage URL. For you, this is how your social week becomes attributable: create the campaign, copy the link, put it in the post, then report the result.",
    example: "Campaign name “Spring campus Pet Parent signup,” utm_source=instagram, utm_campaign=spring27_growth.",
  },
  {
    label: "Pet Parent Growth",
    meaning:
      "Intern work meant to grow people who need pet care — awareness, signups, or bookings on SitGuru. For you, pick this when the week’s job was reaching pet owners, not recruiting Gurus.",
    example: "Event share + tracking link aimed at Pet Parents in Greater Philadelphia.",
  },
  {
    label: "Guru Growth",
    meaning:
      "Intern work meant to grow trusted sitters (Gurus). For you, pick this when the week recruited, featured, or sent Gurus to join or stay active on SitGuru.",
    example: "Guru Spotlight series with a tracking link to the Guru join path.",
  },
  {
    label: "Partner Growth",
    meaning:
      "Intern work with approved local partners, rescues, events, or campus groups SitGuru already listed as public. For you, this is promoting a public partner or event card — not collecting private emails.",
    example: "Public pet event from Events to share, posted with a tracking link.",
  },
  {
    label: "Conversion Optimization",
    meaning:
      "Improving the path from “saw the post” to a SitGuru action (open the link, sign up, book). For you, this is testing caption, first comment, destination, and whether bookings stay on SitGuru — then writing what changed.",
    example: "Moved the tracking link into the first comment; next week compare sessions.",
  },
  {
    label: "Analytics & Attribution",
    meaning:
      "Proof that intern work caused a result SitGuru can check. For you, this is tracking links, approved sources (GA4, Meta, SitGuru registration records), and Metrics submissions that stay Waiting until SitGuru verifies them.",
    example: "Your number: 27 Pet Parent signups from spring27_growth — status Waiting.",
  },
  {
    label: "SOP / Handoff",
    meaning:
      "A short standard operating procedure so SitGuru can repeat your process after the internship. For you, this is writing the steps clearly enough that the next intern or SitGuru staff can run the same campaign without you.",
    example: "How to create a campus campaign link, log the post, and send the weekly check-in.",
  },
  {
    label: "Business Growth Report",
    meaning:
      "The semester destination document SitGuru assembles from your weekly check-ins, accepted tasks, campaigns, and verified numbers: what you did, measurable outcomes, lessons, and recommendations. For you, sending complete weeks is how this report gets written — do not wait until week 15. Your school still owns credit; SitGuru letters are not a university grade.",
  },
  {
    label: "Portfolio Case Study",
    meaning:
      "A cleaned-up professional version of your report you may keep only after SitGuru approves it in writing. For you, this is the piece you can show faculty or employers — with no Pet Parent names, passwords, source code, or unpublished SitGuru internals.",
  },
];

export const INTERN_REPORT_DRAFT_SECTIONS: InternGlossaryTerm[] = [
  {
    label: "Starting Point",
    meaning:
      "Chapter 1 of the Business Growth Report: where SitGuru and this market stood when you arrived. Define the market (who needs pet care, where, why now), what intern-safe snapshot totals show, and what public research you found. Use market totals, not customer names. This is research, not a caption dump. Do it in week 1–2 and keep adding citations as you learn.",
    example:
      "Greater Philadelphia Pet Parents searching for weekend walking vs Guru coverage on Find Care. Cite Market snapshot + one public source (campus pet policy, public event calendar). No emails.",
  },
  {
    label: "Baseline & SMART Goals",
    meaning:
      "The starting numbers and the intern goals SitGuru can actually check. SMART means Specific, Measurable, Achievable, Relevant, Time-bound — tied to tracking links, signups, Guru interest, or event shares, not vanity likes. Copy baseline from Market snapshot and any SitGuru-checked Metrics. Do not invent a baseline. If you do not have a verified number yet, write “baseline pending SitGuru check” and the metric you will submit.",
    example:
      "By week 8, grow tracked campus Pet Parent registrations from this intern campaign (utm_campaign=spring27_campus) — target SitGuru can verify in registrations, not Instagram likes.",
  },
  {
    label: "How the work was done",
    meaning:
      "Your method so SitGuru (and the next intern) can repeat it: who you wrote for (Pet Parent, Guru, partner/event), which channels, brand kit rules, how drafts get approved, where tracking links go, and the SOP. This is Audience Strategy + Content System + Campaign System + SOP / Handoff in one chapter. Write the process, not a diary.",
    example:
      "Pet Parent campus stories: Brand kit → Create SitGuru Feature → tracking link in first comment → wait for SitGuru → post → log in Work → Social.",
  },
  {
    label: "Campaign Experiments",
    meaning:
      "Named tests with a hypothesis, one change at a time, and a tracking link. Example: caption vs first-comment link, Event post vs Guru Spotlight, Instagram vs TikTok. A flop still belongs here. Untracked posts are not experiments SitGuru can read. Create the campaign before you post.",
    example:
      "Hypothesis: first-comment tracking link lifts sessions vs burying the URL in the caption. Campaign spring27_first_comment. Compare next week’s SitGuru-checked sessions.",
  },
  {
    label: "Measurable Outcomes",
    meaning:
      "Only results SitGuru has checked. Your number on check-in/Metrics stays pending until they confirm it. Guessing, screenshot likes, or a roommate’s count do not belong here. If the week had no verified number, say so and point to the pending Metrics row. This protects you: the report will not claim growth SitGuru cannot see.",
    example:
      "SitGuru-checked: 27 Pet Parent signups from spring27_growth. Status confirmed. Do not add 40 because the event “felt busy.”",
  },
  {
    label: "Lessons Learned",
    meaning:
      "What did not work, what you would change, and what you would keep. Fill “What didn’t work?” every week — empty lessons usually mean you skipped that field. Failed tests are intern work. Hide nothing SitGuru already saw in a check-in. No customer PII in the write-up.",
    example:
      "Event share without a tracking link got comments but zero intern-attributed signups. Next week: campaign link before posting.",
  },
  {
    label: "Recommendations",
    meaning:
      "What SitGuru should do after you leave: keep, stop, or try next term — with evidence from verified outcomes and lessons. This is not a thank-you note. Be specific enough to hand off: which campaign, which market, which SitGuru Feature, which event type. SitGuru can use this in the playbook. Your school still owns credit.",
    example:
      "Keep campus Pet Parent stories with tracking links. Stop bare homepage URLs. Next intern: staff Paws at the Park only if SitGuru assigns the booth; otherwise promote public Events to share.",
  },
];

export const INTERN_REPORT_WEEKLY_BUILD_FIELDS: InternGlossaryTerm[] = [
  {
    label: "This week’s build",
    meaning:
      "The form on Report that files one week into a draft chapter. The green banner (for example “Feeds Final report: Starting Point”) tells you which chapter this week is feeding. Fill it the same week you work — do not wait until week 15. Same story as the Home weekly check-in: completeness beats poetry.",
  },
  {
    label: "Week of",
    meaning: "The week you are documenting. One week, one build. Do not mash three weeks into one form unless SitGuru asked you to catch up.",
  },
  {
    label: "Contribution to your report",
    meaning:
      "Dropdown: which part of the report this week helped (Market Analysis, Audience Strategy, Growth Strategy, Content System, Campaign System, Pet Parent / Guru / Partner Growth, Conversion Optimization, Analytics & Attribution, SOP / Handoff, Business Growth Report, Portfolio Case Study). Pick the closest fit. SitGuru can move it. That pick is how the week lands in Starting Point vs Campaign Experiments vs Outcomes.",
    example: "Week of market research → Market Analysis (Starting Point). Week of a tracked Instagram test → Campaign System or Campaign Experiments.",
  },
  {
    label: "What did you add or improve this week?",
    meaning:
      "What you shipped, who it was for, and what you learned. Name the audience (Pet Parent, Guru, event), the channel, and the tracking campaign if you had one. “Worked on social” is not enough for the draft.",
    example: "Added a SitGuru Feature draft on PawReport for campus Pet Parents. Tracking campaign spring27_pawreport. Waiting on SitGuru approval.",
  },
  {
    label: "What did you finish?",
    meaning: "Completed intern work SitGuru can find: sent check-in, logged post, created campaign, submitted a metric, finished a task with proof.",
  },
  {
    label: "What did the numbers show?",
    meaning:
      "What the data said this week — including “no verified number yet.” Point to a Metrics submission or tracking-link sessions. Do not paste unpublished Admin HQ exports. Totals only.",
  },
  {
    label: "What didn’t work?",
    meaning:
      "Required. If a post flopped, write it. That still counts and becomes Lessons Learned. Skipping this starves the report.",
    example: "If a tweet flopped, write it here. That still counts.",
  },
  {
    label: "What’s next?",
    meaning: "The smallest next intern action SitGuru can approve: which campaign, which draft, which metric you will submit.",
  },
  {
    label: "Hours this week / Your number",
    meaning:
      "Hours: honest internship time (research, drafts, events, writing the report). Your number: one result SitGuru will try to verify. Both belong in the same week’s story.",
  },
];

export const INTERN_PORTAL_WORD_DEFINITIONS: InternGlossaryTerm[] = [
  {
    label: "@SitGuruOfficial",
    meaning:
      "The official SitGuru social handle on every platform. Tag it in intern captions. SitGuru posts from official accounts unless they assign you a channel. Bookings stay on SitGuru.",
  },
  ...SITGURU_OFFICIAL_SOCIAL_LINKS.map((link) => ({
    label: link.label,
    meaning: `Official SitGuru ${link.label} account. Handle ${SITGURU_OFFICIAL_HANDLE}. Open ${link.href}. Use this when you tag, share, or log a ${link.label} post.`,
    example: link.href,
  })),
  ...INTERN_OFFICIAL_WEB_LINKS.map((link) => ({
    label: link.label,
    meaning: `${link.meaning} Open ${link.href}.`,
    example: link.href,
  })),
  {
    label: "Campaign",
    meaning:
      "A named intern growth push with tracking (utm_source, utm_campaign, and a unique link). Create it before you post. Without it, SitGuru cannot tell your work from everyone else’s traffic.",
  },
  {
    label: "Tracking link",
    meaning:
      "The unique URL SitGuru gives your campaign. Put it in the caption, bio, first comment, flyer, or event share. A bare sitguru.com homepage does not count as intern-attributed growth.",
  },
  {
    label: "Weekly check-in",
    meaning:
      "The week’s story SitGuru files into your report: what you added, finished, what the numbers showed, what did not work, what’s next, hours, and Your number.",
  },
  {
    label: "Your number",
    meaning:
      "One intern-reported result SitGuru will try to verify. It stays pending until they confirm it. Guessing does not count.",
  },
  {
    label: "Hours this week",
    meaning:
      "Time you spent on internship work. SitGuru keeps it in the internship file. Your school still certifies credit hours.",
  },
  {
    label: "Growth workplace",
    meaning:
      "On-the-project intern bench for posts, campaigns, and media. Not Admin HQ. SitGuru approves drafts before anything goes live.",
  },
  {
    label: "Intern agreement",
    meaning:
      "The Confidentiality, Intellectual Property & Professional Conduct Agreement you sign in onboarding. Separate from the syllabus your school receives.",
  },
];

export const INTERN_GLOSSARY: InternGlossaryTerm[] = [
  ...INTERN_SITGURU_FEATURES,
  ...INTERN_UNIVERSITY_PATHS,
  ...INTERN_AI_COMPANIONS,
  ...INTERN_PAYMENTS_INTERN_SAFE,
  ...INTERN_REPORT_SECTION_DEFINITIONS,
  ...INTERN_REPORT_DRAFT_SECTIONS,
  ...INTERN_REPORT_WEEKLY_BUILD_FIELDS,
  ...INTERN_PORTAL_WORD_DEFINITIONS,
  ...INTERN_VENDOR_EVENTS,
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function termHtml(term: InternGlossaryTerm) {
  const example = term.example
    ? term.example.startsWith("http") || term.example.startsWith("mailto:")
      ? ` <a href="${escapeHtml(term.example)}">${escapeHtml(term.example)}</a>`
      : ` Example: ${escapeHtml(term.example)}`
    : "";
  return `<h3>${escapeHtml(term.label)}</h3><p>${escapeHtml(term.meaning)}${example}</p>`;
}

function groupHtml(title: string, terms: InternGlossaryTerm[]) {
  return `<h3>${escapeHtml(title)}</h3>${terms.map(termHtml).join("")}`;
}

export function internGlossarySectionHtml() {
  const socialItems = SITGURU_OFFICIAL_SOCIAL_LINKS.map(
    (link) =>
      `<li><strong>${escapeHtml(link.label)}:</strong> <a href="${escapeHtml(link.href)}">${escapeHtml(link.href)}</a></li>`,
  ).join("");
  const webItems = INTERN_OFFICIAL_WEB_LINKS.map(
    (link) =>
      `<li><strong>${escapeHtml(link.label)}:</strong> <a href="${escapeHtml(link.href)}">${escapeHtml(link.href)}</a></li>`,
  ).join("");
  const videos = INTERN_WATCH_VIDEOS.map(
    (video) =>
      `<li><strong>${escapeHtml(video.title)}:</strong> Watch on intern Help. Promote with a tracking link to <a href="${escapeHtml(video.promoteHref)}">${escapeHtml(video.promoteHref)}</a>. ${escapeHtml(video.watchFor)}</li>`,
  ).join("");
  const portalLabels = new Set([
    ...SITGURU_OFFICIAL_SOCIAL_LINKS.map((link) => link.label),
    ...INTERN_OFFICIAL_WEB_LINKS.map((link) => link.label),
    ...INTERN_SITGURU_FEATURES.map((term) => term.label),
  ]);
  const words = INTERN_PORTAL_WORD_DEFINITIONS.filter((term) => !portalLabels.has(term.label));

  return `<section id="definitions" class="break">
      <h2>1. Definitions</h2>
      <p>These are intern-portal words. The rest of this guide uses them the same way. When you send a weekly check-in or a task, <strong>Contribution to your report</strong> asks which part of the report the work helped. Pick the closest fit.</p>
      <div class="callout">Watch the SitGuru videos on intern Help first. Official SitGuru links for intern posts always go behind your tracking link. Do not log into a Pet Parent account. Do not complete Stripe, bank, or SSN setup. SitGuru University certificates are not internship credit.</div>
      <h3>Official SitGuru links</h3>
      <ul class="steps">
        ${socialItems}
        ${webItems}
      </ul>
      <p>Handle: <strong>${escapeHtml(SITGURU_OFFICIAL_HANDLE)}</strong> on every social platform. Tag it. Bookings stay on SitGuru.</p>
      <h3>Watch these SitGuru videos</h3>
      <ul class="steps">${videos}</ul>
      ${groupHtml("SitGuru Features", INTERN_SITGURU_FEATURES)}
      ${groupHtml("SitGuru University", INTERN_UNIVERSITY_PATHS)}
      ${groupHtml("Meet the Pack (SitGuru AI)", INTERN_AI_COMPANIONS)}
      ${groupHtml("Payments stay on SitGuru", INTERN_PAYMENTS_INTERN_SAFE)}
      ${groupHtml("PA and NJ vendor events", INTERN_VENDOR_EVENTS)}
      ${groupHtml("Contribution to your report", INTERN_REPORT_SECTION_DEFINITIONS)}
      ${groupHtml("Business Growth Report draft chapters", INTERN_REPORT_DRAFT_SECTIONS)}
      ${groupHtml("Weekly report build", INTERN_REPORT_WEEKLY_BUILD_FIELDS)}
      ${groupHtml("Intern portal words", words)}
    </section>`;
}
