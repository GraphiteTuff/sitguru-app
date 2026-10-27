# Growth Workspace ↔ Microsoft Teams + Planner

## What changed

The Growth Workspace was refined so it **measures business outcomes** and does **not** recreate Microsoft Teams communication, Planner task management, SharePoint file storage, Canva creative tools, Intern Portal academics, or Manager Desk oversight.

## Responsibility map

| System | Purpose |
| --- | --- |
| **Microsoft Teams** | Communicate — discuss, meet, brainstorm, coordinate |
| **Microsoft Planner** | Manage work — assignments, owners, due dates, Ava Review, Jason Approval when required, Results & Learning bucket |
| **SharePoint** | Official shared team files |
| **OneDrive** | Individual drafts |
| **Canva** | Creative production |
| **SitGuru Growth Workspace** | Measure growth — KPIs, event results, campaign outcomes, Ambassador performance, Growth Intelligence |
| **Intern Portal** | Formal internship record — hours, university requirements, milestones, check-ins |
| **Manager Desk** | Formal oversight of assigned interns |
| **Admin Portal** | Roles and access (assign Growth Manager without deploy) |

## Operating loop

Founder direction → Growth Manager strategy → Teams discussion → Planner execution → Growth Workspace results → learning → next experiment.

## Microsoft Teams (teams.cloud.microsoft)

Team: **SitGuru | Marketing & Community Growth**

SitGuru does **not** mirror channel welcome handbooks. Channel folders stay in Teams; SitGuru holds the matching data, reports, and formal processes.

| Teams channel | SitGuru system of record |
| --- | --- |
| General | Manager Desk / Growth home |
| Growth and Strategy | Campaigns, initiatives, Growth Workspace |
| Content and Social | Content / media / campaign outcomes |
| Intern Projects | Intern Portal + Intern Team Desk |
| Partnerships and Community | Partners, events, community results |
| Analytics and Results | Analytics, Intelligence, KPI reports |
| Leadership - Jason, Danette, and Ava (private) | Leadership chat only — HR/payroll stay in Admin |

Default open URL: `https://teams.cloud.microsoft`

Optional deep links:

```bash
NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_GENERAL_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_ANALYTICS_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_CONTENT_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_STRATEGY_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_INTERNS_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_LEADERSHIP_URL=
NEXT_PUBLIC_SITGURU_TEAMS_CHANNEL_PARTNERSHIPS_URL=
NEXT_PUBLIC_SITGURU_PLANNER_GROWTH_URL=
NEXT_PUBLIC_SITGURU_BRAND_KIT_URL=
```

Channel ↔ path map: `lib/admin/growth/teams-access.ts`  
SharePoint Documents shortcuts: `lib/admin/growth/sharepoint-files.ts`  
OneNote notebook sections: `lib/admin/growth/onenote-notebook.ts`

Configure:

```bash
NEXT_PUBLIC_SITGURU_SHAREPOINT_GROWTH_URL=
NEXT_PUBLIC_SITGURU_ONENOTE_GROWTH_URL=
# plus optional per-folder / per-section URL env keys in those modules
```

## Intern collaboration (Marketing & Community Growth)

| System | Use |
| --- | --- |
| **SitGuru Intern Portal** | Official hours, check-ins, milestones, evidence, reviews, university requirements, final project |
| **Teams** | Questions, communication, updates, collaboration, meetings |
| **Planner** | Assigned work, owners, deadlines, status, manager review workflow |
| **SharePoint** | Shared internship files, research, presentations, approved materials |
| **OneNote** | Brainstorming, meeting notes, lessons learned — never official hours/evaluations |

Intern “where work happens” card: `lib/internship/intern-work-systems.ts`

## Permissions

Growth Manager (`social_community_manager` / Growth portal): Growth Workspace, event results, campaigns, intelligence, assigned intern summary, Manager Desk links.

Not granted: Stripe admin, payroll, banking, legal, system-wide auth admin, unrestricted Admin HQ.

Founder / Super Admin retain full Admin HQ plus Manager Portal access via growth workplace gates.

## Future (not in this milestone)

Microsoft Graph sync of Planner tasks, Teams messages, SharePoint folders, Outlook calendars — deferred. Schema leaves nullable `microsoft_*` reference columns for later.
