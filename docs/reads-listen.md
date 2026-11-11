# SitGuru Reads & Listen

Centralized media, learning, and community destination for books, magazines,
podcasts, YouTube videos, authors/experts, Team Picks, and partnerships.

## Public routes

- `/reads`
- `/reads/books`, `/reads/books/[slug]`
- `/reads/magazines`, `/reads/magazines/[slug]`
- `/reads/podcasts`, `/reads/podcasts/[slug]`
- `/reads/videos`, `/reads/videos/[slug]`
- `/reads/authors`, `/reads/authors/[slug]`
- `/reads/team-picks`
- `/reads/guru-picks` (V2 placeholder)
- `/reads/pet-parent-picks` (V2 placeholder)
- `/reads/topics`, `/reads/topics/[slug]`
- `/reads/search`
- `/reads/partner`

## Staff portals

| Role | Route | Capabilities |
| --- | --- | --- |
| Intern (Ryan / Lola) | `/intern/content/reads` | Draft, submit, Team Picks, YouTube import draft, own analytics |
| Manager (Ava) | `/manager/reads` | Review, request changes, approve, schedule, publish, partnerships, analytics |
| Admin / Super Admin | `/admin/growth/reads` | Full oversight, escalations, taxonomy, archive with audit |

Content Studio entry points also link from `/admin/sales-marketing` and
`/admin/sales-marketing/content`.

## Roles (HQ)

Migration seeds:

- `growth_manager` — Ava
- `content_intern` — Ryan / Lola
- `marketing_manager` — marketing manager with Reads publish authority

Assign via Admin Settings → HQ access (`admin_user_access`).

## Database

Migration: `supabase/migrations/20261111_create_reads_listen.sql`

Key tables: `reads_content`, type extensions, topics, relationships,
`reads_team_members`, `reads_team_picks`, partners + submissions + activity,
reviews, status history, analytics events.

RLS: public SELECT only for `status = published` AND `visibility = public`.
Partner contact fields have no public SELECT.

## Environment

No new required env vars for V1.

Optional:

- `TURNSTILE_SECRET_KEY` / Turnstile site key — partner form spam protection
- Future: YouTube Data API key for automated channel sync (V2)

## Analytics events

Persisted to `reads_analytics_events` and mirrored through `/api/analytics/track`
with `reads_` prefix.

## AI companion readiness

`lib/reads/ai-access.ts` exposes authorized published-content queries for Scout /
Rogue without enabling autonomous behavior.
