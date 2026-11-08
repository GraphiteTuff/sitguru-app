import { MANAGER_ROUTES } from "@/lib/admin/growth/manager-routes";

export type ToolkitFeature = {
  label: string;
  detail: string;
  href?: string;
  external?: boolean;
  unavailable?: string;
};

export type ToolkitSection = {
  id: "brand" | "campaigns" | "growth" | "events" | "interns" | "company";
  title: string;
  subtitle: string;
  href: string;
  features: ToolkitFeature[];
};

const SHAREPOINT_NOTE =
  "Opens for a @sitguru.com work account. Files stay in SharePoint.";

function external(label: string, detail: string, href: string | null, unavailable = SHAREPOINT_NOTE): ToolkitFeature {
  if (!href) return { label, detail, unavailable };
  return { label, detail, href, external: true };
}

export function buildManagerToolkit(input: {
  isSuperUser: boolean;
  folders: Record<string, string | null>;
  teamsHref: string;
}): ToolkitSection[] {
  const folder = (id: string) => input.folders[id] || null;
  return [
    {
      id: "brand",
      title: "Brand & Creative",
      subtitle: "Logos, graphics, brand guidelines, and templates.",
      href: `${MANAGER_ROUTES.toolkit}/brand`,
      features: [
        { label: "Brand Kit Library", detail: "Approved and in-progress company files.", href: `${MANAGER_ROUTES.toolkit}/brand` },
        { label: "Upload New Asset", detail: "PNG, JPG, WEBP, SVG, PDF, ZIP, and short video.", href: `${MANAGER_ROUTES.toolkit}/brand#upload` },
        { label: "Official Logos", detail: "Site files plus uploaded logo masters.", href: `${MANAGER_ROUTES.toolkit}/brand?category=official_logos` },
        { label: "Seasonal Logos", detail: "Seasonal branding in the Brand Kit.", href: `${MANAGER_ROUTES.toolkit}/brand?category=seasonal` },
        { label: "Social Graphics", detail: "Graphics ready for social drafts.", href: `${MANAGER_ROUTES.toolkit}/brand?category=social_graphics` },
        { label: "Marketing Templates", detail: "Flyers and layout templates.", href: `${MANAGER_ROUTES.toolkit}/brand?category=templates` },
        { label: "Brand Guidelines", detail: "Colors, type, and usage notes.", href: `${MANAGER_ROUTES.toolkit}/brand?category=guidelines` },
        { label: "Video Assets", detail: "Short brand videos, up to 25MB.", href: `${MANAGER_ROUTES.toolkit}/brand?category=videos` },
        external("SharePoint Brand Kit", "Master files that stay in Microsoft 365.", folder("general-brand-kit")),
      ],
    },
    {
      id: "campaigns",
      title: "Social Campaigns",
      subtitle: "Plan, create, review, and publish marketing materials.",
      href: MANAGER_ROUTES.campaigns,
      features: [
        { label: "Content Calendar", detail: "Deadlines and publishing dates on the manager calendar.", href: MANAGER_ROUTES.calendar },
        { label: "Campaign Library", detail: "Growth campaigns already in SitGuru.", href: MANAGER_ROUTES.campaigns },
        { label: "Social Media Templates", detail: "Captions and content records.", href: "/manager/content" },
        { label: "Draft Content", detail: "Content still being written in SitGuru.", href: "/manager/content" },
        external("Drafts folder", "SharePoint copies of in-progress creative.", folder("content-drafts")),
        { label: "Pending Review", detail: "Content waiting on the growth desk.", href: "/manager/campaigns-content" },
        external("Review folder", "SharePoint files submitted for review.", folder("content-ava-review"), SHAREPOINT_NOTE),
        { label: "Approved Content", detail: "Content records that are ready to use.", href: "/manager/content" },
        external("Approved folder", "Final files kept in SharePoint.", folder("content-approved")),
        { label: "Published Content", detail: "Campaigns and posts already recorded.", href: MANAGER_ROUTES.campaigns },
        external("Published folder", "Copies of published work in SharePoint.", folder("content-published")),
        { label: "Campaign Tracking Links", detail: "Links created with each campaign.", href: MANAGER_ROUTES.campaigns },
        { label: "Create Campaign", detail: "Start a campaign in the growth workspace.", href: "/manager/create" },
      ],
    },
    {
      id: "growth",
      title: "Growth Intelligence",
      subtitle: "Market insights, competitor research, and growth performance.",
      href: MANAGER_ROUTES.results,
      features: [
        { label: "Live Results", detail: "Current people, visit, and signup totals.", href: MANAGER_ROUTES.results },
        { label: "Business Growth Report", detail: "The growth report already on the manager desk.", href: MANAGER_ROUTES.reports },
        { label: "Pet Parent Growth", detail: "Pet Parent totals from Live Results.", href: MANAGER_ROUTES.results },
        { label: "Guru Growth", detail: "Guru totals from Live Results.", href: MANAGER_ROUTES.results },
        { label: "Registration and Conversion Data", detail: "Registration and booking conversions.", href: "/manager/conversions" },
        { label: "Social Analytics", detail: "SitGuru channel totals. A separate social-network API is not connected.", href: MANAGER_ROUTES.metrics },
        external(
          "Competitor Research",
          "Manually maintained notes for Rover, Wag, and local competitors. SitGuru does not invent those figures.",
          folder("strategy-market-research"),
          "Competitor research is kept in SharePoint, not as SitGuru metrics. A @sitguru.com work account is required to open that folder.",
        ),
        { label: "Campaign Performance", detail: "Campaign results recorded in SitGuru.", href: MANAGER_ROUTES.campaigns },
        { label: "Market Research Notes", detail: "Growth intelligence already stored in SitGuru.", href: "/manager/intelligence" },
      ],
    },
    {
      id: "events",
      title: "Events & Outreach",
      subtitle: "Promote SitGuru in local communities.",
      href: "/manager/events",
      features: [
        { label: "Upcoming Events", detail: "Events recorded in the growth workspace.", href: "/manager/events" },
        { label: "Community Outreach", detail: "Partner outreach and follow-ups.", href: "/manager/outreach" },
        { label: "Approved Event Graphics", detail: "Event graphics uploaded to the Brand Kit.", href: `${MANAGER_ROUTES.toolkit}/brand?category=flyers` },
        { label: "Event Promotion Templates", detail: "Campaign and content templates.", href: "/manager/content" },
        {
          label: "Ambassador Resources",
          detail: input.isSuperUser
            ? "Ambassador HQ for approved community ambassadors."
            : "Partner materials on your growth desk. Ambassador HQ is limited to Super Admins.",
          href: input.isSuperUser ? "/admin/ambassadors" : "/manager/partners",
        },
        { label: "Community Partner Materials", detail: "Partner promotions in the growth workspace.", href: "/manager/partners" },
      ],
    },
    {
      id: "interns",
      title: "Intern Collaboration",
      subtitle: "Keep marketing projects, assignments, and reviews organized.",
      href: MANAGER_ROUTES.team,
      features: [
        { label: "Assigned Interns", detail: "Interns on your authorized desk.", href: MANAGER_ROUTES.team },
        { label: "Weekly Assignments", detail: "Assignment queue for your team.", href: MANAGER_ROUTES.assignments },
        { label: "Milestones", detail: "Academic and project milestones you can review.", href: MANAGER_ROUTES.milestones },
        { label: "Pending Reviews", detail: "Review queue on the manager desk.", href: MANAGER_ROUTES.home },
        { label: "Team Collaboration", detail: "Messages with your team.", href: MANAGER_ROUTES.messages },
        { label: "Shared Materials", detail: "Company resources and the Brand Kit.", href: MANAGER_ROUTES.resources },
        { label: "Manager Feedback", detail: "Check-ins and coaching notes.", href: MANAGER_ROUTES.checkIns },
        { label: "Academic Project Progress", detail: "Milestone pace for assigned interns.", href: MANAGER_ROUTES.milestones },
      ],
    },
    {
      id: "company",
      title: "Company Resources",
      subtitle: "Training, documents, guides, and company resources.",
      href: MANAGER_ROUTES.resources,
      features: [
        { label: "Manager Resources", detail: "Guides and reference links.", href: MANAGER_ROUTES.resources },
        { label: "Standard Operating Procedures", detail: "Training pages and SharePoint SOP folders.", href: MANAGER_ROUTES.resources },
        { label: "Team Guides", detail: "Onboarding and help for this desk.", href: "/manager/help" },
        { label: "Training Materials", detail: "Manager training modules.", href: MANAGER_ROUTES.training },
        { label: "Approved Company Documents", detail: "Reference library, with Microsoft 365 files left in SharePoint.", href: MANAGER_ROUTES.resources },
        external("SharePoint Documents", "Growth document library.", folder("general-approved-company")),
        {
          label: "Microsoft Teams",
          detail: "Teams home, or the Growth channel when that link is configured.",
          href: input.teamsHref,
          external: input.teamsHref.startsWith("http"),
        },
        { label: "Brand Policies", detail: "Brand guidelines in the Brand Kit.", href: `${MANAGER_ROUTES.toolkit}/brand?category=guidelines` },
      ],
    },
  ];
}

export type ToolkitSearchHit = {
  href: string;
  title: string;
  detail: string;
  external?: boolean;
};

export function searchToolkit(
  query: string,
  sections: ToolkitSection[],
  assets: Array<{ title: string; href: string; detail: string }>,
): ToolkitSearchHit[] | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const hits: ToolkitSearchHit[] = [];
  for (const section of sections) {
    const sectionBlob = `${section.title} ${section.subtitle}`.toLowerCase();
    if (sectionBlob.includes(needle)) {
      hits.push({ href: section.href, title: section.title, detail: section.subtitle });
    }
    for (const feature of section.features) {
      if (!feature.href) continue;
      const blob = `${feature.label} ${feature.detail} ${section.title}`.toLowerCase();
      if (!blob.includes(needle)) continue;
      if (hits.some((hit) => hit.href === feature.href && hit.title === feature.label)) continue;
      hits.push({
        href: feature.href,
        title: feature.label,
        detail: feature.detail,
        external: feature.external,
      });
    }
  }
  for (const asset of assets) {
    const blob = `${asset.title} ${asset.detail}`.toLowerCase();
    if (!blob.includes(needle)) continue;
    hits.push({ href: asset.href, title: asset.title, detail: asset.detail });
  }
  return hits.slice(0, 24);
}
