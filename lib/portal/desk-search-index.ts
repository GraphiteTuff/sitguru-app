export type DeskSearchHit = {
  href: string;
  title: string;
  detail: string;
  keywords: string;
};

const MANAGER: DeskSearchHit[] = [
  { href: "/manager", title: "Manager's Desk", detail: "Home, team pace, and review queue", keywords: "home desk interns overview" },
  { href: "/manager/growth", title: "Growth Home", detail: "Campaigns and growth workspace", keywords: "growth workspace campaigns" },
  { href: "/manager/campus-growth", title: "Campus Growth", detail: "Campus missions, leads, and results", keywords: "campus university qr petperks" },
  { href: "/manager/team", title: "My Team", detail: "Assigned interns", keywords: "interns team people roster" },
  { href: "/manager/assignments", title: "Assignments", detail: "Intern work and deadlines", keywords: "assignments tasks work due" },
  { href: "/manager/check-ins", title: "Check-Ins", detail: "Weekly check-ins to review", keywords: "check in checkins weekly review" },
  { href: "/manager/milestones", title: "Milestones", detail: "Goals and pace", keywords: "milestones goals progress" },
  { href: "/manager/messages", title: "Messaging", detail: "Team notes and conversations", keywords: "messages chat inbox" },
  { href: "/manager/my-time", title: "My Time", detail: "Log hours and the weekly pace", keywords: "time hours timer log" },
  { href: "/manager/payments", title: "My Payments", detail: "Pay periods and history", keywords: "payments pay invoice rate" },
  { href: "/manager/results", title: "Live Results", detail: "People and social totals", keywords: "results live reach posts" },
  { href: "/manager/calendar", title: "Calendar", detail: "Deadlines, check-ins, and meetings", keywords: "calendar schedule dates" },
  { href: "/manager/metrics", title: "Metrics", detail: "Visits, signups, and channels", keywords: "metrics analytics visits" },
  { href: "/manager/reports", title: "Business Growth Report", detail: "How SitGuru is growing", keywords: "report reports growth business" },
  { href: "/manager/toolkit", title: "Manager Toolkit", detail: "Brand and tracking tools", keywords: "toolkit tools brand" },
  { href: "/manager/training", title: "Training", detail: "Modules and guides", keywords: "training learn modules" },
  { href: "/manager/resources", title: "Resources", detail: "Templates, links, and files", keywords: "resources files templates sharepoint" },
  { href: "/manager/help", title: "Help", detail: "Guides for the manager desk", keywords: "help support faq" },
  { href: "/manager/weekly-work", title: "My Weekly Work", detail: "Initiatives and weekly learning", keywords: "weekly work initiative goals" },
  { href: "/manager/campaigns-content", title: "Campaigns & Content", detail: "Organic campaigns and captions", keywords: "campaign content utm" },
  { href: "/manager/outreach", title: "Community Outreach", detail: "Partners and follow-ups", keywords: "outreach partner shelter" },
  { href: "/manager/surveys", title: "Polls & Surveys", detail: "Community questions", keywords: "poll survey" },
  { href: "/manager/conversions", title: "Growth & Conversions", detail: "Registrations and bookings", keywords: "conversion booking registration" },
  { href: "/manager/settings", title: "Settings", detail: "Account, notifications, and password", keywords: "settings profile password account" },
  { href: "/manager/onboarding", title: "Onboarding", detail: "Your SitGuru checklist", keywords: "onboarding checklist documents" },
];

const INTERN: DeskSearchHit[] = [
  { href: "/intern", title: "Home", detail: "Intern portal home", keywords: "home portal" },
  { href: "/intern/work", title: "My Work", detail: "Current work and tasks", keywords: "work tasks" },
  { href: "/intern/assignments", title: "My Assignments", detail: "Due work", keywords: "assignments homework due" },
  { href: "/intern/milestones", title: "My Milestones", detail: "Goals for the term", keywords: "milestones goals" },
  { href: "/intern/time", title: "My Hours", detail: "Log internship hours", keywords: "hours time log" },
  { href: "/intern/check-ins", title: "My Check-Ins", detail: "Weekly check-in", keywords: "check in checkins weekly" },
  { href: "/intern/messages", title: "Messages", detail: "Notes with your manager", keywords: "messages chat" },
  { href: "/intern/results", title: "Live Results", detail: "Community results", keywords: "results live" },
  { href: "/intern/calendar", title: "Calendar", detail: "Dates and deadlines", keywords: "calendar schedule" },
  { href: "/intern/metrics", title: "Metrics", detail: "Visits and signups", keywords: "metrics analytics" },
  { href: "/intern/growth", title: "Business Growth Report", detail: "Your growth report", keywords: "report growth" },
  { href: "/intern/toolkit", title: "Intern Toolkit", detail: "Brand and tracking tools", keywords: "toolkit tools" },
  { href: "/intern/campus-growth", title: "Campus Growth", detail: "Campus opportunities, QR codes, and leads", keywords: "campus university qr petperks event" },
  { href: "/intern/training", title: "Training", detail: "Modules and lessons", keywords: "training learn" },
  { href: "/intern/resources", title: "Resources", detail: "Templates and guides", keywords: "resources files templates" },
  { href: "/intern/help", title: "Help", detail: "How the portal works", keywords: "help support faq" },
  { href: "/intern/settings", title: "Settings", detail: "Account and preferences", keywords: "settings profile password" },
];

export function searchDesk(audience: "manager" | "intern", query: string): DeskSearchHit[] {
  const needle = query.trim().toLowerCase();
  const rows = audience === "manager" ? MANAGER : INTERN;
  if (!needle) return rows.slice(0, 6);
  return rows
    .map((row) => {
      const haystack = `${row.title} ${row.detail} ${row.keywords}`.toLowerCase();
      const title = row.title.toLowerCase();
      let score = 0;
      if (title.startsWith(needle)) score += 5;
      if (title.includes(needle)) score += 3;
      if (haystack.includes(needle)) score += 1;
      return { row, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.row)
    .slice(0, 8);
}
