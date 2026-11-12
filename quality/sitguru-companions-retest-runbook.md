# SitGuru AI Companions — Retest Runbook

**Production baseline SHA (2026-11-12):** `258506e035898ebed4728a05f80a25d6f26367d2` (`sitguru-main`)  
**Working branch:** `feature/companions-muse-agent-platform`

## Bundled artifacts

| File | Status |
|------|--------|
| `quality/sitguru-companion-stress-test-400.pdf` | Present (assessment PDF) |
| `quality/sitguru-ai-companions-rollup-cursor-fix-plan.pdf` | Present |
| `quality/sitguru-ai-companions-400-question-bank.json` | **MISSING** — place the JSON bank here before the 400-question staging run |

## Canonical production facts (code-verified)

- Support email: `support@sitguru.com` (`SITE_CONFIG.supportEmail`)
- Pet Parent signup: `/signup?role=pet_parent`
- Ambassador apply: `/programs/ambassadors/apply` (`/ambassador/join` redirects)
- Marketplace Support: Free during launch (Help billing FAQ)
- PetPerks: Give $10 Get $10 / Refer a Guru $20 credits — no generic $10–$20 claim
- Manayunk: Philadelphia County

## Automated unit suites (local)

```bash
npx tsx --test \
  lib/ai/companion-response-policy.test.ts \
  lib/chat/care-matching-interrupt.test.ts \
  lib/companions/session-state.test.ts \
  lib/community/manayunk-geography.test.ts \
  lib/companions/memory-intents.test.ts \
  lib/companions/types.test.ts
```

## Staging 400-question gate (blocked until JSON bank is provided)

1. Drop `sitguru-ai-companions-400-question-bank.json` into `quality/`.
2. Confirm preview/staging uses **isolated** Supabase + API credentials (not production).
3. Run companion harness (20 questions per companion per batch), same-chat memory for setup lines.
4. Write evidence per ID: reply, TTFR, citations, pass/fail.
5. Release only if Rogue ≥85, Scout/Taco/Delilah ≥80, zero fake escalations, zero unsupported trust/fee/reward claims.

## Vercel note

`vercel.json` ignoreCommand only builds when `VERCEL_GIT_COMMIT_REF == sitguru-main`. Feature-branch pushes do not create production deployments.
