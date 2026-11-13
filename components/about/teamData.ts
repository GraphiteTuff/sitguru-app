/** Public-facing profile content. Keep biographies factual and easy to edit. */
export type SitGuruTeamMember = {
  slug: string;
  name: string;
  role: string;
  major?: string;
  majorLabel?: "Major" | "Degree program";
  image: string | null;
  intro: string;
  bio: string;
  focus: readonly string[];
  strengths: readonly string[];
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
    strengths: ["Full-stack platform development", "Product vision", "Practical problem-solving"],
  },
  {
    slug: "danette",
    name: "Danette Graff",
    role: "Co-Founder & Head of Customer Experience",
    image: "/about/team/danette-graff.webp",
    intro: "Helping Pet Parents and Gurus feel supported, heard, and valued.",
    bio: "As SitGuru’s Co-Founder and Head of Customer Experience, Danette supports Pet Parents and Gurus throughout their SitGuru journey. She answers questions, helps resolve concerns, and builds lasting relationships so every experience feels thoughtful, responsive, and centered on care.",
    focus: ["Customer support", "Pet Parent & Guru relationships", "Customer satisfaction"],
    strengths: ["Compassionate customer care", "Relationship building", "Issue resolution"],
  },
  {
    slug: "ava",
    name: "Ava Venezia",
    role: "Social Media & Community Growth Manager",
    image: "/about/team/ava-venezia.webp",
    intro: "Leading the people, programs, and creative work that grow the SitGuru community.",
    bio: "Ava manages SitGuru’s Social Media and Community Growth programs, shaping campaigns, local outreach, and meaningful engagement with Pet Parents and Gurus. A central part of her leadership is managing the social media intern team: setting weekly priorities, assigning and reviewing projects, coaching interns, and helping turn their ideas into campaigns that strengthen the SitGuru community.",
    focus: ["Social Media program management", "Community Growth program management", "Intern assignments, coaching & reviews", "Campaign planning & community outreach"],
    strengths: ["Program leadership", "Community-building strategy", "Intern mentorship & teamwork"],
  },
  {
    slug: "ryan",
    name: "Ryan Manibo",
    role: "Social Media Intern",
    major: "Advertising & Public Relations",
    image: "/about/team/ryan-manibo.webp",
    intro: "Combining PR storytelling, digital creativity, and campus connections.",
    bio: "Ryan studies Advertising & Public Relations at Penn State. With experience in campus outreach, promotional content, and student journalism, he brings a strong writing and storytelling perspective to SitGuru. He supports social media content, research, and outreach ideas that connect college communities, Pet Parents, and future Gurus.",
    focus: ["Social media content research", "College and campus outreach", "Pet Parent & Guru community storytelling"],
    strengths: ["PR writing & editing", "Campus engagement", "Canva & video editing"],
  },
  {
    slug: "lola",
    name: "Lola Uhl",
    role: "Social Media Intern",
    major: "Marketing",
    image: "/about/team/lola-uhl.webp",
    intro: "Bringing hands-on social media creativity and a customer-first perspective.",
    bio: "Lola is a Marketing major at Saint Joseph’s University with hands-on experience creating and managing social media content for a local business. She brings TikTok and Instagram storytelling, promotional campaign ideas, and a strong customer-service perspective to SitGuru’s social media and community growth efforts.",
    focus: ["Social media content development", "Pet-centered campaign ideas", "Community engagement"],
    strengths: ["TikTok & Instagram content", "Creative promotion", "Customer engagement"],
  },
  {
    slug: "lalita",
    name: "Lalita Dhital",
    role: "Social Media Intern",
    major: "Bachelor of Business Science",
    majorLabel: "Degree program",
    image: null,
    intro: "Bringing business insight, customer care, and team leadership to community growth.",
    bio: "Lalita’s academic background includes a Bachelor of Business Science program at Penn State. She brings experience in customer service, administrative coordination, business analysis, and team supervision. Her customer-first approach and organizational skills support SitGuru’s community outreach, relationship-building, and growth initiatives. Her portrait will be added when available.",
    focus: ["Community outreach support", "Customer-focused communication", "Research & organized project coordination"],
    strengths: ["Customer relationship building", "Business analysis", "Team leadership"],
  },
];
