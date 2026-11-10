# Desk preservation review

Manager's Desk and the existing Intern dashboard remain the established products.
Do not replace them with Community Studio, a generic dashboard, or new portals.
Do not rename their current displayed titles or change their branding to match
the new public Pack page.

## Comparison performed

Compared the feature work with baseline commit `d8e2fcf7` and inspected the
repository's Intern guide screenshot `docs/intern-guide/screenshots/01-home-welcome.png`.
That screenshot is a historical repository reference, not a verified current
production capture. No authenticated production screenshot was supplied or
captured. Current production visual parity is therefore not asserted.

The following existing components have no feature changes:

- `app/manager/page.tsx`, `app/intern/page.tsx` and both portal layouts.
- `components/portal/PortalDeskProfile.tsx` and
  `components/sitguru/SiteAccountMenu.tsx`.
- `components/internship/InternPortalHome.tsx` and shared Desk branding tokens.

The Manager shell changes only add icons for the two new destinations. Its
header, logo, search, profile control, sidebar rendering, mobile navigation and
chat dock are retained. The Intern shell changes only add the Community Studio
icon. Existing Manager navigation groups and all original Intern destinations
remain in order. Community Studio follows Manager Content Studio; standalone
Market Density follows Campus Growth.

Manager home adds its optional activity heatmap within the existing layout;
the roster, assignments, approval queues, check-ins, milestones and Microsoft
shortcuts are retained. Intern home is unchanged. Native Intern work adds a
Community Studio entry and live updates while retaining the existing screen.

The live header continues to use `PortalDeskProfileLive` → `SiteAccountMenu`.
That menu resolves the authenticated user with `auth.getUser()`, loads profile
and role records for that user's ID, and uses existing authorized-role and
avatar resolvers. No fixture identity or hardcoded user was substituted into
either authenticated Desk. The six-line Admin identity refactor reuses the same
role resolver for verified Bearer users; it does not change role rules.

## Preservation contract

- Keep both current home routes, dashboard components, headers, titles, account
  dropdowns, onboarding and layouts. Use existing shared components for additions.
- Keep Manager, Intern and Admin authorization separate. Navigation is not an
  authorization grant, and preview identity must not replace the signed-in account.
- Keep existing Microsoft resources, Content Studio, Brand Kit and assignment
  workflows. New community contributions follow their existing scopes.
- Use the established live-signal infrastructure and retain unfinished form state.
- Obtain/compare verified current production screenshots before any future
  visual redesign. This review makes no header or dashboard layout changes.

Added `lib/portal/desk-preservation.test.ts` to check stable identities,
navigation groups/destinations, approved new feature locations and role scoping.
The preservation, authorized role-switching and existing route checks pass:
16 tests, 0 failures. Run them with `npm.cmd run test:desks`.
Actual profile-picture rendering, role switching and responsive visual parity
still require isolated authenticated browser/device checks.
