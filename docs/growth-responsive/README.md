# Growth Workspace — Responsive Implementation

Responsive redesign of the SitGuru Growth Workspace (`/admin/growth`, `/intern/growth`) so the same shared components, data, permissions, and APIs work from phone through desktop.

## Breakpoints (Tailwind defaults)

| Range | Layout behavior |
| --- | --- |
| &lt; 640px | 2-col KPI grid, stacked modules, Quick Actions, day list calendar, bottom Growth phone bar |
| 640–1023px | Tablet: 2–3 col actions, touch targets ≥44px, collapsible sections |
| ≥ 1024px | Desktop sidebar/chrome, 4-col KPIs, side-by-side Community & Events \| Campaigns, desktop action strip |

## Module order (mobile)

1. Growth Overview (Pet Parents · Gurus · Ambassadors · Referrals)
2. Quick Actions (role-filtered)
3. Growth trend / registrations
4. Community & Events
5. Campaigns
6. Ambassador Growth
7. Growth Intelligence
8. Team
9. Upcoming Work / Recent activity

Desktop keeps multi-column scanning without a separate product.

## Event-day (phone / tablet)

- Events primary in the Growth phone bar
- Event cards: Promote · Record leads · Open event
- Managers deep-link to lead entry for Pet Parent / Guru / Ambassador results (interns stay out of Admin CRM)

## Shared backend for future mobile

`GET /api/admin/growth/workspace` — JSON snapshot of KPIs, campaigns, content, upcoming events, and permissions. Not tied to React layout.

## Local screenshots

| Device | File |
| --- | --- |
| Mobile 390px overview | `growth-mobile-390-overview.webp` |
| Mobile 390px modules | `growth-mobile-390-sections.webp` |
| Tablet 820px | `growth-tablet-820.webp` |
| Desktop 1440px | `growth-desktop-1440.webp` |

Preview (local only): `INTERN_DOCUMENTATION_MODE=true` → `/dev/growth-responsive?role=admin`
