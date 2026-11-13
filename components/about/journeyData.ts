/** Public company timeline copy. Keep early history separate from formal founding and future plans clearly labelled. */
export type JourneyCategory = "platform" | "team" | "guru" | "pet-parent" | "programs";
export type JourneyStatus = "completed" | "evolving" | "planned";
export type JourneyIcon = "idea" | "founders" | "care" | "team" | "community" | "scale" | "future";

export type JourneyMilestone = {
  id: string;
  date: string;
  title: string;
  summary: string;
  story: string;
  status: JourneyStatus;
  categories: readonly JourneyCategory[];
  icon: JourneyIcon;
  accent: string;
  achievements: readonly string[];
  image: string;
  imageAlt: string;
  links?: readonly { label: string; href: string }[];
};

export type JourneyFeature = {
  title: string;
  category: JourneyCategory;
  icon: "parents" | "gurus" | "ambassadors" | "partners" | "reads" | "studio";
  subtitle: string;
  points: readonly string[];
  href: string;
  cta: string;
};

export const journeyMilestones: readonly JourneyMilestone[] = [
  {
    id: "the-idea",
    date: "2024 · Early idea",
    title: "A better way to care",
    summary: "The vision for a more personal pet care community takes shape.",
    story: "Before SitGuru became a company, the idea was simple: help Pet Parents and trusted local caregivers connect with more confidence, clarity, and heart. Early planning laid the groundwork for the experience that followed.",
    status: "completed",
    categories: ["platform", "pet-parent", "guru"],
    icon: "idea",
    accent: "#0693a0",
    achievements: [
      "A Pet Parent-first idea for more dependable local care",
      "Planning for Guru profiles, care services, and a connected experience",
      "Initial concepts for the platform and its community",
    ],
    image: "/about/journey/early-care-concept.webp",
    imageAlt: "Illustrative scene of a pet caregiver smiling with a golden retriever outdoors",
  },
  {
    id: "founded",
    date: "Nov 2025",
    title: "Founded by Jason & Danette",
    summary: "SitGuru becomes official and the vision takes root.",
    story: "Jason and Danette founded SitGuru in November 2025 under Graff Enterprises LLC. Jason built the platform while both founders shaped a pet-first business focused on trustworthy care and genuine relationships.",
    status: "completed",
    categories: ["team", "platform", "programs"],
    icon: "founders",
    accent: "#f07f18",
    achievements: [
      "November 2025 — SitGuru founded by Jason and Danette",
      "The SitGuru name and company foundation established",
      "Product development and the early community-building effort move forward",
    ],
    image: "/images/brand/intern/sitguru-logo-vector.jpg",
    imageAlt: "Official SitGuru brand logo",
  },
  {
    id: "care-tools",
    date: "2025–2026",
    title: "Care tools take shape",
    summary: "Profiles, requests, bookings, reviews, and visit updates bring care together.",
    story: "The platform grew around the day-to-day needs of both sides of a booking: helping Pet Parents choose and communicate with caregivers while giving Gurus tools to present their services and build their businesses.",
    status: "completed",
    categories: ["platform", "guru", "pet-parent"],
    icon: "care",
    accent: "#1c9862",
    achievements: [
      "Pet Parent and Guru profiles, care preferences, and service information",
      "Guru search, availability, bookings, messaging, and review tools",
      "PawReport Live™ visit updates and easier repeat connections",
      "Promotional, referral, and growth tools for Gurus",
    ],
    image: "/images/booking-hero-pets.png",
    imageAlt: "Pets representing SitGuru's booking and care features",
    links: [
      { label: "For Pet Parents", href: "/signup" },
      { label: "For Gurus", href: "/become-a-guru" },
    ],
  },
  {
    id: "team-growth",
    date: "Oct–Nov 2026",
    title: "Our team grows",
    summary: "Ava leads social and community growth alongside the intern team.",
    story: "SitGuru added dedicated leadership for social media and community growth, with an intern team helping bring more local pet people, fresh ideas, and creative outreach into the pack.",
    status: "completed",
    categories: ["team", "programs"],
    icon: "team",
    accent: "#8644bd",
    achievements: [
      "October 2026 — Ava joins as Social Media & Community Growth Manager",
      "2026 — Ryan, Lola, and Lalita join the Social Media Intern Program",
      "Community outreach, campaigns, and intern assignments gain a shared direction",
    ],
    image: "/about/journey/team-community-illustration.webp",
    imageAlt: "Illustration of a collaborative pet community meeting, not photographs of SitGuru team members",
    links: [{ label: "Meet the Team", href: "#meet-the-team" }],
  },
  {
    id: "content-community",
    date: "2026 · Growing",
    title: "More than bookings",
    summary: "Pet Companions, Reads & Listens, and Community Studio deepen the experience.",
    story: "SitGuru is becoming a pet care community people can enjoy between bookings. New and evolving experiences make room for learning, sharing pet stories, discovering helpful content, and staying connected.",
    status: "evolving",
    categories: ["platform", "programs", "pet-parent", "guru"],
    icon: "community",
    accent: "#b25ec3",
    achievements: [
      "Pet Companions: Scout, Rogue, Delilah, and Taco",
      "SitGuru Reads & Listens: pet books, magazines, podcasts, and stories",
      "Community Studio: pet photos and videos, community galleries, and Pet of the Week",
      "Events, partnerships, and additional ways to participate in the SitGuru community",
    ],
    image: "/images/reads/podcast-hero-retriever.png",
    imageAlt: "Pet-themed SitGuru Reads & Listens podcast artwork",
    links: [
      { label: "Explore Reads & Listens", href: "/reads" },
      { label: "Browse Podcasts", href: "/reads/podcasts" },
      { label: "Community Events", href: "/events" },
    ],
  },
  {
    id: "next-chapter",
    date: "2027 · Planned",
    title: "Enhance & scale",
    summary: "More capabilities, stronger services, and deeper local connections.",
    story: "Our roadmap is focused on improving the everyday experience for Pet Parents, Gurus, Ambassadors, and partners while strengthening the tools and programs that support growth.",
    status: "planned",
    categories: ["platform", "guru", "pet-parent", "programs"],
    icon: "scale",
    accent: "#147eac",
    achievements: [
      "Continue improving booking, communication, and account experiences",
      "Expand insights, service tools, and useful platform features",
      "Build additional partnerships and community programs",
    ],
    image: "/images/pawperks-hero-pets.png",
    imageAlt: "Pets representing the next chapter of SitGuru's services",
  },
  {
    id: "beyond",
    date: "Beyond 2027 · Vision",
    title: "Local roots, wider reach",
    summary: "A connected community of pet people in more places.",
    story: "Our long-term vision is to help more Pet Parents, Gurus, Ambassadors, and partners across the country connect through trusted care and shared love for pets. These are ambitions, not announced launch dates.",
    status: "planned",
    categories: ["team", "guru", "pet-parent", "programs"],
    icon: "future",
    accent: "#56a723",
    achievements: [
      "Grow SitGuru's local pet care community region by region",
      "Build more community and business partnerships",
      "Keep making trusted pet care simpler, warmer, and more connected",
    ],
    image: "/about/journey/future-us-vision.webp",
    imageAlt: "Illustrative green U.S. expansion vision map, not live SitGuru coverage data",
  },
];

export const journeyFeatures: readonly JourneyFeature[] = [
  {
    title: "For Pet Parents",
    category: "pet-parent",
    icon: "parents",
    subtitle: "Care with more confidence",
    points: ["Find and book trusted Gurus", "PawReport Live™ visit updates", "Pet profiles, reviews, and rebooking"],
    href: "/signup",
    cta: "Explore Pet Parent tools",
  },
  {
    title: "For Gurus",
    category: "guru",
    icon: "gurus",
    subtitle: "Tools to care and grow",
    points: ["Profiles, services, and availability", "Requests, bookings, and reviews", "Referrals and business promotion"],
    href: "/become-a-guru",
    cta: "Explore Guru tools",
  },
  {
    title: "For Ambassadors",
    category: "programs",
    icon: "ambassadors",
    subtitle: "Share SitGuru locally",
    points: ["Community and campus outreach", "Events and social promotion", "Ambassador pathways and perks"],
    href: "/programs/ambassadors",
    cta: "See Ambassador programs",
  },
  {
    title: "For Partners",
    category: "programs",
    icon: "partners",
    subtitle: "Grow through connection",
    points: ["Local and national partnerships", "Community events and programs", "Reach Pet Parents and Gurus"],
    href: "/partners",
    cta: "Explore partnerships",
  },
  {
    title: "SitGuru Reads & Listens",
    category: "programs",
    icon: "reads",
    subtitle: "Discover something new",
    points: ["Pet books and magazines", "Featured pet podcasts", "Helpful tips and pet stories"],
    href: "/reads",
    cta: "Browse Reads & Listens",
  },
  {
    title: "Community Studio",
    category: "programs",
    icon: "studio",
    subtitle: "Celebrate the whole pack",
    points: ["Pet of the Week", "Community photos and videos", "Pet stories and local events"],
    href: "/events",
    cta: "Explore community events",
  },
];
