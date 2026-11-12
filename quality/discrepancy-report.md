# Companion QA bank vs production truth — discrepancy report

Verified against `sitguru-main` @ `258506e0` on 2026-11-12.

| Topic | QA / older chat copy | Production truth (use this) |
|-------|----------------------|-----------------------------|
| Support email | `pack@sitguru.com` in some Rogue prompts / old tests | `support@sitguru.com` (`lib/config/site.ts`) |
| Pet Parent signup | `/register?role=parent` or `/signup` variants | `/signup?role=pet_parent` |
| Ambassador apply | `/ambassador/join` | `/programs/ambassadors/apply` (join redirects) |
| Marketplace fee | Unpublished `$2.99` / Rover % as SitGuru fee | Marketplace Support — Free during launch; future fee not published |
| PetPerks | Generic `$10 to $20` Ambassador reward | Give $10 Get $10 / Refer a Guru $20 — conditional credits only |
| Manayunk | ~58 mi from Philadelphia / Montgomery | Philadelphia County (distance 0 to Philly) |
| Guru count / named Gurus | Hard-coded fixtures (72, Amanda, Sofia, George) | Always live `/search` query — never hard-code |
| Event count | “91 events” fixture | Live catalog query — never hard-code |
| Fake escalation | “live teammate” / Pack Coordinator | Only when a real handoff ID exists; otherwise AI + support email |

Do **not** silently rewrite historical question text or the Nov 12 score (124/400). Correct expectations in the runner when production truth supersedes the bank.
