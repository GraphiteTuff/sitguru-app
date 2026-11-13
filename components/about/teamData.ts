/** Public-facing profile content. Keep biographies factual and easy to edit. */
export type SitGuruTeamMember = {
  slug: string;
  name: string;
  role: string;
  image: string | null;
  intro: string;
  bio: string;
  focus: readonly string[];
};

export const sitguruTeam: readonly SitGuruTeamMember[] = [
  {
    slug: "jason",
    name: "Jason Graff",
    role: "Founder & CEO",
    image: "/about/team/jason-graff.webp",
    intro: "Founder, builder, and Pet Parent behind the SitGuru platform.",
    bio: "Jason founded SitGuru and personally built the technology behind the platform. He leads product vision, software development, and the experience that helps Pet Parents and Gurus connect through trusted, community-centered pet care.",
    focus: ["Founder vision", "Software & platform development", "Product experience"],
  },
  {
    slug: "danette",
    name: "Danette Graff",
    role: "Co-Founder & Head of Marketing",
    image: "/about/team/danette-graff.webp",
    intro: "Helping make SitGuru's brand and community feel personal.",
    bio: "As SitGuru’s Co-Founder and Head of Marketing, Danette guides brand, marketing, social media, and outreach. She helps ensure the SitGuru community feels welcoming, pet-first, and personal.",
    focus: ["Brand strategy", "Marketing", "Community outreach"],
  },
  {
    slug: "ava",
    name: "Ava Venezia",
    role: "Social Media & Community Growth Manager",
    image: "/about/team/ava-venezia.webp",
    intro: "Connecting the people and stories that make the SitGuru pack grow.",
    bio: "Ava leads SitGuru’s social media and community growth, guiding campaigns, community engagement, partnerships, and the social media intern team. Her work helps more Pet Parents and Gurus discover the SitGuru community.",
    focus: ["Social strategy", "Community growth", "Intern coordination"],
  },
  {
    slug: "ryan",
    name: "Ryan Manibo",
    role: "Social Media Intern",
    image: "/about/team/ryan-manibo.webp",
    intro: "Bringing new perspectives to content and campus connections.",
    bio: "Ryan supports SitGuru’s social media, content research, and community outreach initiatives, including ideas for connecting with college campuses and student pet-care providers.",
    focus: ["Social content", "Campus outreach", "Community research"],
  },
  {
    slug: "lola",
    name: "Lola Uhl",
    role: "Social Media Intern",
    image: "/about/team/lola-uhl.webp",
    intro: "Sharing pet-centered stories and creative community ideas.",
    bio: "Lola contributes to SitGuru’s social media and community storytelling, helping create engaging pet-centered content and new ways to connect with Pet Parents and Gurus.",
    focus: ["Social content", "Creative storytelling", "Community engagement"],
  },
  {
    slug: "lalita",
    name: "Lalita Dhital",
    role: "Social Media Intern",
    image: null,
    intro: "A new member of the SitGuru social media intern team.",
    bio: "Lalita is joining the SitGuru social media intern team. Her personal introduction and portrait will be added when approved.",
    focus: ["Social media", "Community outreach", "Full introduction coming soon"],
  },
];
