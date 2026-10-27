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

## Removed / simplified

- **No Growth Work Items task tracker** — never built as Planner duplicate; high-level **Current Initiatives** only (name/purpose/status/market).
- **Content calendar demoted** — reframed as inventory; production workflow language points to Planner.
- **Home Quick Actions** — outcome-focused (Record Event Results, Intelligence, Manager Desk) instead of “create a post” task language.
- **Phone bar center action** — Record event results (measurement), not a generic create task.
- **No Microsoft Graph sync** — configurable optional URL env vars only.

## Growth Workspace sections

1. Overview (business KPIs)
2. Analytics / Results (trends)
3. Current Initiatives (lightweight themes)
4. Community & Events (activation + results)
5. Campaigns (performance / tracking)
6. Ambassador Growth
7. Growth Intelligence (surveys/polls/tests)
8. Team (dynamic assigned interns → Manager Desk)
9. Resources (Teams / Planner / Brand Kit / portals when configured)
10. Results & Learning bridge copy

## Schema (new)

Migration `20261025_growth_workspace_outcomes.sql`:

- `growth_initiatives` — high-level themes (optional future `microsoft_*` refs unused)
- `growth_event_results` — event acquisition outcomes + manual/system metric sources
- `growth_intelligence_entries` — Test → Learn → Recommend → Act
- Optional outcome columns on existing `growth_campaigns` when present

## Permissions

Growth Manager (`social_community_manager` / Growth portal): Growth Workspace, event results, campaigns, intelligence, assigned intern summary, Manager Desk links.

Not granted: Stripe admin, payroll, banking, legal, system-wide auth admin, unrestricted Admin HQ.

Founder approval remains reserved for spend, paid ads, contracts, legal/policy, compensation, brand-risk decisions.

## Configurable links

```bash
NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL=
NEXT_PUBLIC_SITGURU_PLANNER_GROWTH_URL=
NEXT_PUBLIC_SITGURU_BRAND_KIT_URL=
```

## Future (not in this milestone)

Microsoft Graph sync of Planner tasks, Teams messages, SharePoint folders, Outlook calendars — deferred. Schema leaves nullable `microsoft_*` reference columns for later.
