/**
 * Where Marketing & Community Growth internship work happens.
 * Official academic/internship records stay in SitGuru Intern Portal.
 */

export const INTERN_WORK_SYSTEMS = [
  {
    id: "intern-portal",
    label: "SitGuru Intern Portal",
    role: "Official internship system of record",
    uses: [
      "Hours",
      "Weekly check-ins",
      "Academic milestones",
      "Evidence",
      "Manager reviews",
      "University requirements",
      "Final internship project progress",
    ],
    href: "/intern",
    external: false,
  },
  {
    id: "teams",
    label: "Microsoft Teams",
    role: "Questions, team communication, updates, collaboration, meetings",
    uses: [
      "Questions",
      "Team communication",
      "Updates",
      "Collaboration",
      "Meetings",
    ],
    href: null,
    external: true,
  },
  {
    id: "planner",
    label: "Planner",
    role: "Assigned work, owners, deadlines, status, manager review workflow",
    uses: [
      "Assigned work",
      "Owners",
      "Deadlines",
      "Status",
      "Manager review workflow",
    ],
    href: null,
    external: true,
  },
  {
    id: "sharepoint",
    label: "SharePoint",
    role: "Shared internship files and approved project materials",
    uses: [
      "Shared internship files",
      "Research",
      "Presentations",
      "Supporting documents",
      "Approved project materials",
    ],
    href: null,
    external: true,
  },
  {
    id: "onenote",
    label: "OneNote",
    role: "Shared brainstorming and collaborative working knowledge",
    uses: [
      "Shared brainstorming",
      "Meeting notes",
      "Lessons learned",
      "Collaborative working knowledge",
    ],
    href: null,
    external: true,
  },
] as const;

export const INTERN_WORKFLOW_STEPS = [
  "Understand the assignment",
  "Complete the work",
  "Save supporting evidence",
  "Ask questions early when blocked",
  "Submit for manager review",
  "Make revisions if requested",
  "Document results and learning",
  "Connect the work to the final internship project",
] as const;

export const INTERN_COLLABORATION_EXPECTATIONS = [
  "Respect each intern’s university schedule and approved availability",
  "Do not expect another intern to be online constantly",
  "Communicate clearly",
  "Share useful research and learning",
  "Give credit for another person’s work or ideas",
  "Ask before changing someone else’s work",
  "Use the appropriate Teams channel when discussion should remain visible to the team",
  "Escalate blockers early",
] as const;

export const INTERN_MANAGER_SUPPORT = [
  "Day-to-day guidance",
  "Work review",
  "Coaching",
  "Feedback",
  "Priority clarification",
  "Help removing blockers",
] as const;

export const INTERN_WORK_SYSTEMS_IMPORTANT =
  "Do not place official internship hours, confidential evaluations, university records, or private performance feedback in OneNote. Those stay in the SitGuru Intern Portal.";
