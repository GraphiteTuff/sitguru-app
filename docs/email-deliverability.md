# SitGuru Email Deliverability Architecture

**Company:** Graff Enterprises LLC DBA SitGuru  
**Primary domain:** `sitguru.com`  
**Founder mailbox (HIGH VALUE):** `jason@sitguru.com`  
**Last updated:** 2026-10-02  

This document is the operational source of truth for SitGuru email streams, authentication (SPF / DKIM / DMARC), and how to avoid damaging personal or transactional sender reputation.

---

## Status snapshot

| Stream | Status |
|--------|--------|
| **Microsoft 365** (`jason@sitguru.com`) | **CONFIRMED WORKING** — SPF/DKIM/DMARC PASS on real Gmail test; DKIM Status Valid; 2048-bit keys |
| **Resend** (app transactional / marketing) | **REQUIRES RESEND DASHBOARD VERIFICATION** — DNS evidence present; dashboard Verified status not proven in-repo |
| **Supabase Auth** | **REQUIRES DASHBOARD CHECK** — templates in repo; SMTP/From only in Supabase Dashboard |

### Remote migration provenance (`email_suppressions`)

| Field | Value |
|-------|-------|
| Project name | **SitGuru** |
| Project ref | **`mmtjhxnzuglbyumbsjhs`** |
| API host | `mmtjhxnzuglbyumbsjhs.supabase.co` |
| Environment | **production** (not Staging) |
| Evidence | Linked project in `supabase/.temp/`; `next.config.ts` / prisma README treat this ref as live; migration version `20261002215629` / name `email_suppressions` appears in this project's migration list |
| Staging check | Project **SitGuru Staging** (`ehdvngkqddttcwhjubwu`) does **not** have `email_suppressions` |

**This DDL was applied to production.** No customer rows were written (table empty at inspection). Do not re-apply.

Read-only table inspection (production):

- Table exists; RLS **enabled**; **0** RLS policies (anon/authenticated PostgREST access denied by default)
- Columns: `id`, `email_normalized`, `reason`, `source_event`, `provider_message_id`, `provider_event_id`, `metadata`, `created_at`, `updated_at`
- Constraints: PK(`id`), UNIQUE(`email_normalized`), CHECK(`reason` in hard_bounce/complaint/manual/provider_suppressed)
- Indexes: reason, provider_event_id (partial)
- Server writes expected via `service_role` (bypasses RLS); webhook uses `supabaseAdmin`
- No accidental public write path via policies (none granted for anon/auth policies)

---

## 1. Architecture overview

| Stream | Purpose | Provider | Typical From | Automated? |
|--------|---------|----------|--------------|------------|
| **Personal** | Human-to-human (candidates, partners, schools, vendors) | Microsoft 365 | `jason@sitguru.com` | No — Outlook only |
| **Support** | Customer / Guru support | Resend (app) + M365 mailbox | `support@sitguru.com` | App notifies; humans reply in M365 |
| **Transactional** | Booking/PawReport/reminders/messages | **Resend** | `RESEND_FROM_EMAIL` / `support@` / `alerts@` | Yes |
| **Operational** | Admin alerts, finance exports, broadcasts | **Resend** | `alerts@sitguru.com` (+ finance variants) | Yes |
| **Marketing** | Email Updates newsletter welcome | **Resend** | `RESEND_FROM_EMAIL` | Yes — List-Unsubscribe + suppression |
| **Auth / security** | Signup confirm, password reset | **Supabase Auth** | Dashboard SMTP / From | Yes — do not alter lightly |
| **Recruiting (app-assisted)** | Guru lead mailto templates | Opens **mailto:** → Outlook | `jason@…` (user’s client) | Human send |
| **Third-party** | Stripe receipts, Checkr invitations | Stripe / Checkr | Their domains | External |

**Critical rule:** Automated SitGuru application mail must **never** use `From: jason@sitguru.com`. Code in `lib/email/config.ts` / `lib/email/resend.ts` refuses that mailbox as an automated From (covered by tests).

---

## 2. Provider inventory

### A. Microsoft 365 / Outlook — CONFIRMED WORKING

**Evidence (DNS + Microsoft + Gmail):**

- MX: `sitguru-com.mail.protection.outlook.com`
- Accepted domain: `sitguru.com` — Authoritative, Default, Allow Sending
- SPF apex: `v=spf1 include:spf.protection.outlook.com -all`
- DKIM Enabled: **True**; Status: **Valid**; Key size: **2048**
- Selectors (public DNS):
  - `selector1._domainkey.sitguru.com` → `selector1-sitguru-com._domainkey.sitgurullc.n-v1.dkim.mail.microsoft`
  - `selector2._domainkey.sitguru.com` → `selector2-sitguru-com._domainkey.sitgurullc.n-v1.dkim.mail.microsoft`
- **Gmail Show original (jason@sitguru.com → controlled Gmail):** SPF PASS, DKIM PASS (`d=sitguru.com`), DMARC PASS

**P0 “Enable M365 DKIM + publish selector CNAMEs”:** **COMPLETE**

**Do not** rotate DKIM, delete selectors, change SPF/DMARC/MX, or touch `graffenterprises.com`.

### B. Resend (application transactional + marketing)

**Evidence (repository + public DNS only):**

- Dependency `"resend"`; senders under `lib/email/*`, `lib/services/resend.ts`, many `app/api/**`
- DNS: `resend._domainkey.sitguru.com` (TXT public key present)
- DNS: `send.sitguru.com` SPF `include:amazonses.com` + MX `feedback-smtp.us-east-1.amazonses.com` (typical Resend/SES return-path)
- Code From defaults use `@sitguru.com` addresses (never `jason@` as automated From)
- Bounce/complaint webhook: `app/api/webhooks/resend` + `email_suppressions` (marketing only)

**Env vars (names only):** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`, `RESEND_WEBHOOK_SECRET`, plus stream overrides in §15 / `docs/email.env.example`.

**Custom domain Verified in Resend UI:** **REQUIRES RESEND DASHBOARD VERIFICATION** (DNS looks configured; dashboard state cannot be proven from the repo).

### C. Supabase Auth

**Evidence:** `supabase.auth.signUp`, `resetPasswordForEmail`; repo templates under `supabase/email-templates/` (confirm-signup only).

**SMTP / From:** Supabase Dashboard only (no `config.toml` in repo). **REQUIRES DASHBOARD CHECK.**

### D. Not implemented as app senders

SendGrid (health-check env name only), Postmark, Mailgun, Mailchimp, Brevo, AWS SES SDK, nodemailer, Microsoft Graph — **not found**.

---

## 3. Approved From / Reply-To

| Use | From | Reply-To |
|-----|------|----------|
| Personal recruiting / partnerships | `Jason Graff <jason@sitguru.com>` via Outlook only | Same |
| Support notifications | `SitGuru Support <support@sitguru.com>` | `support@sitguru.com` |
| Message alerts / Admin Message Center | Support domain From (`Name via SitGuru <support@>`) | Admin or support |
| PawReport / alerts | `alerts@` / env chain | Prefer support Reply-To |
| Marketing welcome | `RESEND_FROM_EMAIL` | `RESEND_REPLY_TO_EMAIL` if set |
| Auth | Supabase project setting | Supabase setting |

---

## 4. Stream classification (Resend callers)

| Flow | Class | Unsubscribe / suppression |
|------|-------|---------------------------|
| Email Updates welcome | MARKETING | Body + List-Unsubscribe + `email_suppressions` |
| PawReport WALK_END | TRANSACTIONAL | No marketing unsubscribe |
| Profile completion reminders | TRANSACTIONAL | No |
| Support / disputes | SUPPORT / TRANSACTIONAL | No |
| Contact / homepage messenger → admin | OPERATIONAL | No |
| In-app message notify | TRANSACTIONAL | No |
| Admin broadcast | OPERATIONAL | Internal team |
| Program / ambassador apply | RECRUITING / OPERATIONAL | No marketing headers |
| Finance exports / CPA | OPERATIONAL | No |
| Checkr guidance | TRANSACTIONAL | No |
| Guru status emails | OPERATIONAL | No |
| University cert notices | TRANSACTIONAL | No |

Auth mail (signup / reset) is **Supabase Auth**, not Resend — never add List-Unsubscribe to auth/security messages.

---

## 5–8. SPF, DKIM, DMARC

### Live records (do not change SPF/DMARC in this workstream)

**SPF (`sitguru.com`):** `v=spf1 include:spf.protection.outlook.com -all`  
**DMARC:** `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`  
**M365 DKIM:** selectors present and Valid (see §2A).  
**Resend:** `resend._domainkey` + `send.sitguru.com` present.

### Historical note (resolved)

Previously missing M365 DKIM under `p=quarantine` caused personal Outlook mail to fail DMARC alignment and land in spam. That path is **fixed and Gmail-validated**.

### DMARC progression

Stay on `p=quarantine` until Resend + Supabase Auth also show Gmail PASS and aggregate reports are clean. **Do not move to `p=reject` yet.**

---

## 9. DMARC alignment by system

| System | Status |
|--------|--------|
| M365 Jason | **CONFIRMED** — Gmail SPF/DKIM/DMARC PASS; `d=sitguru.com` |
| Resend app | **LIKELY OK if domain Verified** — From `@sitguru.com`, DKIM TXT present, Return-Path likely `send.sitguru.com` → **dashboard + Gmail test required** |
| Supabase Auth | **UNKNOWN** until dashboard SMTP + Gmail auth-mail test |

---

## 10. URL / template hygiene

- SitGuru-controlled email HTML uses HTTPS.
- Recruiting mailto signature: Founder & CEO + `https://sitguru.com`.
- Canonical helpers: `getEmailBaseUrl()` / `SITE_CONFIG`.

---

## 11. Bounce, complaint, suppression

| Capability | Status |
|------------|--------|
| Marketing unsubscribe table | `email_update_subscribers` |
| List-Unsubscribe headers | Marketing welcome via `sendSitGuruEmail({ isMarketing: true })` |
| Resend webhook route | `POST /api/webhooks/resend` (Svix signature via `RESEND_WEBHOOK_SECRET`) |
| Suppression table | `email_suppressions` — marketing block only |
| Event log | Appends to existing `email_events` (no message bodies) |

**Events that suppress:** `email.bounced`, `email.complained`, `email.suppressed`  
**Events that do not suppress:** delivered, delayed, opened, clicked, sent, failed (logged only if subscribed)

Auth/security mail is unaffected by this list.

---

## 12. Microsoft 365 checklist

**COMPLETE** for DKIM. Optionally monitor outbound spam policy and DMARC `rua` ownership. Do not re-create DKIM.

---

## 13. Resend dashboard checklist (Jason)

1. Resend → Domains → confirm `sitguru.com` (or intended domain) shows **Verified**  
2. Confirm DKIM Verified (matches `resend._domainkey` if that is the selector Resend shows)  
3. Confirm Return-Path / SPF for `send.sitguru.com` Verified  
4. Confirm production From values use the verified domain (not `*.resend.dev`)  
5. Webhooks → endpoint `https://www.sitguru.com/api/webhooks/resend`  
6. Subscribe at least: `email.bounced`, `email.complained`, `email.suppressed`  
7. Copy signing secret → server env `RESEND_WEBHOOK_SECRET` (never Expo / `NEXT_PUBLIC_`)  
8. Send controlled Resend → Gmail test → Show original SPF/DKIM/DMARC PASS  

Do **not** invent new DNS targets; use only values shown in the Resend UI if anything is missing.

---

## 14. Supabase Auth checklist (Jason)

1. Supabase → Authentication → Emails / SMTP  
2. Note whether **custom SMTP** is enabled or default Supabase mail is used  
3. Record sender email, sender name, host, port (not passwords)  
4. Confirm From domain aligns with `sitguru.com` when using custom SMTP  
5. Confirm Site URL / redirect URLs use production HTTPS  
6. Confirm confirm-signup template matches `supabase/email-templates/` if customized in dashboard  
7. Trigger password reset or confirm to a controlled Gmail → Show original PASS  

If production still uses Supabase **shared** mail, flag it and prefer custom SMTP through the approved provider (typically Resend) without changing providers automatically.

---

## 15. Real-world test plan

### TEST A — Microsoft 365 — COMPLETE

`jason@sitguru.com` → Gmail: SPF PASS, DKIM PASS (`sitguru.com`), DMARC PASS.

### TEST B — Resend transactional (manual)

Safe internal/test message to controlled Gmail. Inspect From, Return-Path, DKIM `d=`, SPF, DMARC, Message-ID. Expect all PASS. Do not mail customers.

### TEST C — Supabase Auth (manual)

Controlled test account: password reset or confirm. Expect SPF/DKIM/DMARC PASS. Do not alter real user accounts unnecessarily.

---

## 16. Environment variables

See `EMAIL_ENV_VAR_NAMES` in `lib/email/config.ts` and `docs/email.env.example`.  
Mobile must never ship `RESEND_API_KEY` or `RESEND_WEBHOOK_SECRET`.

---

## 17. Code map

| Path | Role |
|------|------|
| `lib/email/resend.ts` | Shared Resend send + marketing headers + Jason From guard + marketing suppression |
| `lib/email/config.ts` | Stream config |
| `lib/email/headers.ts` | Header hygiene + List-Unsubscribe builders |
| `lib/email/suppression.ts` | Marketing suppressions |
| `lib/email/email-updates-welcome.ts` | Marketing welcome |
| `app/api/webhooks/resend/route.ts` | Bounce/complaint webhook |
| `lib/services/resend.ts` | PawReport transactional |
| `supabase/email-templates/*` | Auth confirm template |
| `docs/email-deliverability.md` | This document |

---

## 18. Protecting `jason@sitguru.com`

1. Keep M365 DKIM Valid (done)  
2. Recruiting stays one-to-one Outlook (mailto helpers OK)  
3. Never BCC mass lists from Jason  
4. Never wire Resend From to Jason (enforced in code)  
5. Marketing uses unsubscribe + suppression  
6. Monitor DMARC aggregate reports  

---

## 19. Priority list (current)

| Pri | Item | Status |
|-----|------|--------|
| **P0** | M365 DKIM + Gmail validation | **COMPLETE** |
| **P1** | Verify Resend domain in dashboard + Gmail Test B | Open |
| **P1** | Verify Supabase Auth SMTP alignment + Gmail Test C | Open |
| **P2** | Configure Resend webhook + `RESEND_WEBHOOK_SECRET` in production | Code ready |
| **P2** | Review DMARC aggregate reports | Open |
| **P3** | Dedicated marketing subdomain if volume grows | Optional |
| **P3** | DMARC `p=reject` after sustained clean reports | Not yet |
| **P3** | BIMI | Later |

---

## 20. Adding a new email provider

1. Inventory the flow  
2. Prefer subdomain for marketing vs personal/transactional  
3. One SPF TXT per MAIL FROM hostname  
4. Provider DKIM → Gmail test before cutover  
5. Never automated From `jason@sitguru.com`  
6. Marketing: consent + List-Unsubscribe + suppression  
