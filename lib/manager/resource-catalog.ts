export type ResourceLink = {
  label: string;
  detail: string;
  href?: string;
  external?: boolean;
  unavailable?: string;
};

export type ResourceGroup = {
  id: string;
  title: string;
  subtitle: string;
  items: ResourceLink[];
};

const WORK_ACCOUNT = "Available on a @sitguru.com work account. The file stays in SharePoint.";

function folder(label: string, detail: string, href: string | null): ResourceLink {
  if (!href) return { label, detail, unavailable: WORK_ACCOUNT };
  return { label, detail, href, external: true };
}

export function buildManagerResources(input: {
  isSuperUser: boolean;
  folders: Record<string, string | null>;
  teamsHref: string;
}): ResourceGroup[] {
  const href = (id: string) => input.folders[id] || null;
  return [
    {
      id: "start",
      title: "Getting Started",
      subtitle: "How to use the manager desk.",
      items: [
        { label: "Manager onboarding", detail: "Checklist for a new growth manager.", href: "/manager/onboarding" },
        { label: "Help center", detail: "Guides for reviews, hours, and the desk.", href: "/manager/help" },
        { label: "Manager desk", detail: "Your home for team pace and reviews.", href: "/manager" },
      ],
    },
    {
      id: "policies",
      title: "Company Policies",
      subtitle: "Rules the growth team follows.",
      items: [
        { label: "Brand policies", detail: "Guidelines stored in the Brand Kit.", href: "/manager/toolkit/brand?category=guidelines" },
        { label: "Training policies", detail: "Manager training modules.", href: "/manager/training" },
        folder("Approved company folder", "Final company materials in SharePoint.", href("general-approved-company")),
      ],
    },
    {
      id: "guides",
      title: "Team Guides",
      subtitle: "How-to documents for the growth team.",
      items: [
        folder("Team guides", "Onboarding and communication standards in SharePoint.", href("general-team-guides")),
        { label: "Help articles", detail: "SitGuru help for this portal.", href: "/manager/help" },
      ],
    },
    {
      id: "sops",
      title: "Standard Operating Procedures",
      subtitle: "Repeatable marketing and team processes.",
      items: [
        folder("Templates and SOPs", "Checklists and approved processes in SharePoint.", href("general-templates-sops")),
        { label: "Training walkthroughs", detail: "In-product training for the desk.", href: "/manager/training" },
      ],
    },
    {
      id: "m365",
      title: "Microsoft 365 Work Systems",
      subtitle: "Teams, SharePoint, and OneNote. SitGuru only links to them.",
      items: [
        {
          label: "Microsoft Teams",
          detail: "Opens Teams. A Growth channel link is used when it is configured; otherwise Teams home opens.",
          href: input.teamsHref,
          external: true,
        },
        folder("Growth document library", "SharePoint documents for this team.", href("general-approved-company")),
      ],
    },
    {
      id: "brand",
      title: "Marketing and Brand Guidelines",
      subtitle: "Where to find brand rules and creative files.",
      items: [
        { label: "Brand Kit", detail: "Upload and organize company brand files.", href: "/manager/toolkit/brand" },
        { label: "Brand guidelines", detail: "Guideline files in the Brand Kit.", href: "/manager/toolkit/brand?category=guidelines" },
        folder("SharePoint Brand Kit", "Logo masters that remain in SharePoint.", href("general-brand-kit")),
      ],
    },
    {
      id: "internship",
      title: "Internship and Team Management",
      subtitle: "Reference for managing assigned intern work.",
      items: [
        { label: "My Team", detail: "Interns you are allowed to see.", href: "/manager/team" },
        { label: "Assignments", detail: "Weekly work and reviews.", href: "/manager/assignments" },
        { label: "Milestones", detail: "Academic and project pace.", href: "/manager/milestones" },
        { label: "Check-ins", detail: "Coaching notes.", href: "/manager/check-ins" },
        {
          label: "Ambassador directory",
          detail: input.isSuperUser
            ? "Super Admin ambassador records."
            : "Ambassador administration stays with Super Admins. Partner promotions are on your desk.",
          href: input.isSuperUser ? "/admin/ambassadors" : "/manager/partners",
        },
      ],
    },
    {
      id: "approved",
      title: "Approved Company Documents",
      subtitle: "Final reference material. Confidential files are not copied into SitGuru.",
      items: [
        folder("Approved company resources", "Final marketing and internship materials in SharePoint.", href("general-approved-company")),
        { label: "Approved brand files", detail: "Brand Kit files marked approved.", href: "/manager/toolkit/brand?status=approved" },
      ],
    },
    {
      id: "training",
      title: "Training and Help",
      subtitle: "Learn the desk, then ask for help.",
      items: [
        { label: "Training", detail: "Manager training modules.", href: "/manager/training" },
        { label: "Help", detail: "Searchable manager help.", href: "/manager/help" },
      ],
    },
  ];
}

export function searchResources(query: string, groups: ResourceGroup[]) {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        `${group.title} ${group.subtitle} ${item.label} ${item.detail} ${item.unavailable || ""}`
          .toLowerCase()
          .includes(needle),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
