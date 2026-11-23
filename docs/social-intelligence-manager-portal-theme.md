# SitGuru Social Intelligence — Manager Portal Design System

This design aligns the new Social Intelligence, Content Studio, Admin HQ, Intern Insights and Expo mobile analytics screens with the established Manager's Desk rather than copying Meta Business Suite visually.

## Official design tokens (from `lib/portal/desk-ui.ts`)

| Usage | Token | Hex |
|---|---|---|
| Manager titles and high-emphasis text | Navy | `#0F2744` |
| SitGuru brand identity and post-view actions | Evergreen | `#0D5C3A` |
| Primary actions, charts, selected filters | Action blue | `#2563EB` |
| Primary action hover | Deep blue | `#1D4ED8` |
| Page canvas | Light slate | `#F4F7FB` |
| Card surfaces | White | `#FFFFFF` |
| Inactive controls | Soft slate | `#EEF2F6` |
| Standard border | Pale slate | `#E2E8F0` |
| Chart guides / pale blue borders | Sky | `#DBEAFE` |
| Muted body copy | Slate | `#475569` |

## KPI tones

Use the same six-tone family as `DESK_STAT`:

| Measurement | Tile fill | Metric value |
|---|---|---|
| Video views | `#F5F3FF` | `#6D28D9` (violet) |
| Site visits | `#EFF6FF` | `#1D4ED8` (blue) |
| Link clicks | `#FFF4ED` | `#C2410C` (amber) |
| Registrations | `#F0FDF4` | `#166534` (green) |
| Booking events | `#F0FDFA` | `#0F766E` (teal) |
| Unavailable revenue | `#F8FAFC` | `#0F2744` (navy) |

**Do not color-code a value as verified or successful solely because it uses a green tile.** Existing data coverage / unavailable labeling stays visible.

## Visual patterns

- Hero: accessible navy-to-evergreen gradient, white text, small paw identity and concise process cues.
- Navigation: blue primary action; white/soft slate secondary actions with navy labels and clear focus states.
- Cards: 16–24 px radii, white surfaces, faint navy-tinted shadows and desktop max-width constraints supplied by portal layout.
- Leaderboards: selected blue pills, soft-gray unselected pills, pale blue table header, alternating light rows, evergreen detail actions.
- Charts: action-blue line/bars, pale blue guides, preserve labels and zero/missing-data distinctions.
- Content Studio: six tinted status cards matching Manager Desk, but **do not modify** permissions, reviews, state transitions or publication actions.
- Mobile: mirror the web palette in `sitguru-mobile/src/constants/social-intelligence-desk.ts` without pulling Next/Tailwind code into Expo. The native gradient uses the already installed `expo-linear-gradient` package.
- Typography: Plus Jakarta Sans remains the app-wide font; headings use bold navy. Avoid tiny unreadable click targets (minimum 44px for mobile).
- Responsiveness: keep all analytics and control groups usable at 100% desktop zoom and phone widths; no horizontal page scrolling. The leaderboard table can scroll *within* its panel.

## Scope and release validation

This is a visual-only release. Preserve analytics values, access boundaries, tracking links, provider ingestion and first-party attribution behavior from Social Intelligence PR #241. Web and Expo TypeScript checks must pass before merging; verify layout and contrast on production after deployment.
