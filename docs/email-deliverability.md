# SitGuru Email Deliverability Architecture

**Company:** Graff Enterprises LLC DBA SitGuru  
**Primary domain:** `sitguru.com`  
**Founder mailbox (HIGH VALUE):** `jason@sitguru.com`  
**Last audited:** 2026-10-02 (repository + public DNS)

This document is the operational source of truth for SitGuru email streams, authentication (SPF / DKIM / DMARC), and how to avoid damaging personal or transactional sender reputation.

---

## 1. Architecture overview

| Stream | Purpose | Provider | Typical From | Automated? |
|--------|---------|----------|--------------|------------|
| **Personal** | Human-to-human (candidates, partners, schools) | Microsoft 365 | `jason@sitguru.com` | No — Outlook only |
| **Support** | Customer / Guru support | Resend (app) + M365 mailbox | `support@sitguru.com` | App notifies; humans reply in M365 |
| **Transactional** | Booking/PawReport/reminders/messages | **Resend** | `RESEND_FROM_EMAIL` / `support@` / `alerts@` | Yes |
| **Operational** | Admin alerts, finance exports, broadcasts | **Resend** | `alerts@sitguru.com` (+ finance variants) | Yes |
| **Marketing** | Email Updates newsletter welcome | **Resend** | `RESEND_FROM_EMAIL` | Yes — requires unsubscribe |
| **Auth / security** | Signup confirm, password reset | **Supabase Auth** | Dashboard SMTP / Supabase From | Yes — do not alter lightly |
| **Recruiting (app-assisted)** | Guru lead mailto templates | Opens **mailto:** to human Outlook | `jason@…` (user’s client) | Human send |
| **Third-party** | Stripe receipts, Checkr invitations | Stripe / Checkr | Their domains | External |

**Critical rule:** Automated SitGuru application mail must **never** use `From: jason@sitguru.com`. Code in `lib/email/config.ts` / `lib/email/resend.ts` refuses that mailbox as an automated From.

---

## 2. Provider inventory (proven from repo + DNS)

### A. Microsoft 365 / Outlook (personal + company mailboxes)

**Evidence**

- MX: `sitguru-com.mail.protection.outlook.com`
- SPF includes: `include:spf.protection.outlook.com`
- Autodiscover: `autodiscover.outlook.com`
- MS domain verification TXT: `v=verifydomain MS=…`
- No Microsoft Graph / SMTP code in this repository

**Sends:** Human mail from `jason@`, `support@`, and other M365 mailboxes.

**Reputation impact on `jason@sitguru.com`:** Direct. DKIM/DMARC on the organizational domain controls inbox vs spam for recruiting and partner mail.

### B. Resend (application transactional + marketing)

**Evidence**

- `package.json` dependency `"resend"`
- `lib/email/resend.ts`, `lib/services/resend.ts`, many `app/api/**` senders
- DNS: `resend._domainkey.sitguru.com` (TXT public key present)
- DNS: `send.sitguru.com` SPF `include:amazonses.com` + MX `feedback-smtp.us-east-1.amazonses.com` (Resend/SES return-path)

**Env vars (names only):** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`, plus stream-specific From overrides listed in §15.

**Custom domain:** Appears partially configured (`resend._domainkey` + `send` subdomain). Confirm “Verified” status in Resend dashboard.

### C. Supabase Auth

**Evidence:** `supabase.auth.signUp`, `resetPasswordForEmail`; templates under `supabase/email-templates/`.

**SMTP / From:** Configured in Supabase Dashboard (not in this repo — no `config.toml`). May use Supabase shared sending or custom SMTP (often Resend). **External verification required.**

### D. Not implemented as senders in this repo

SendGrid (env name only in admin health check), Postmark, Mailgun, Mailchimp, Brevo, AWS SES SDK, nodemailer, Microsoft Graph — **not found** as application senders.

---

## 3. Approved From / Reply-To behavior

| Use | From | Reply-To |
|-----|------|----------|
| Personal recruiting / partnerships | `Jason Graff <jason@sitguru.com>` via Outlook only | Same mailbox |
| Support notifications | `SitGuru Support <support@sitguru.com>` (or env) | `support@sitguru.com` |
| Message alerts | Support From (env chain) | Support Reply-To |
| Admin Message Center | `Name via SitGuru <support@…>` (verified domain) | Selected admin email or support |
| PawReport / alerts | `alerts@sitguru.com` fallback chain | Often unset — prefer support Reply-To |
| Marketing welcome | `RESEND_FROM_EMAIL` | `RESEND_REPLY_TO_EMAIL` if set |
| Auth | Supabase project setting | Supabase setting |

**Do not** send bulk or marketing from `jason@sitguru.com`.

---

## 4. Transactional vs marketing separation

| | Transactional | Marketing |
|--|---------------|-----------|
| Examples | PawReport, support case, password reset, message notify | Email Updates welcome, future newsletters |
| Unsubscribe body | Usually no | Required |
| `List-Unsubscribe` | No | Required (`lib/email/resend.ts` enforces when `isMarketing: true`) |
| Consent | Account / service relationship | Explicit subscribe |
| Suppression | Provider + app hard-bounce (see §11) | App `email_update_subscribers` + headers |

---

## 5–8. SPF, DKIM, DMARC (live DNS as of audit)

### Confirmed live records (public DNS)

**SPF (`sitguru.com` TXT):**

```text
v=spf1 include:spf.protection.outlook.com -all
```

**DMARC (`_dmarc.sitguru.com` TXT):**

```text
v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;
```

**Microsoft DKIM selectors:**

| Host | Status |
|------|--------|
| `selector1._domainkey.sitguru.com` | **MISSING** (no CNAME/TXT) |
| `selector2._domainkey.sitguru.com` | **MISSING** (no CNAME/TXT) |

**Resend DKIM:** `resend._domainkey.sitguru.com` TXT present.  
**Resend return-path:** `send.sitguru.com` SPF + SES feedback MX present.

### Why Jason’s Outlook mail can land in spam (CONFIRMED mechanism)

1. Microsoft 365 often **passes SPF** while the Return-Path authenticates as an Outlook/protection domain — **SPF alignment with `sitguru.com` frequently fails**.
2. DMARC for `sitguru.com` is already **`p=quarantine`**.
3. Without **DKIM signing** for `sitguru.com` (selectors missing), **DMARC fails** for many M365 outbound messages.
4. Quarantine policy → Gmail/Yahoo commonly place the message in **Spam/Junk**.

This matches a legitimate one-to-one recruiting message from `jason@sitguru.com` landing in spam **without** needing “spammy wording.”

### SPF architecture (ONE record per hostname)

Do **not** publish multiple SPF TXT records on the same name.

| HOST | TYPE | CURRENT PURPOSE | PROPOSED VALUE | WHY | RISK | VALIDATION |
|------|------|-----------------|----------------|-----|------|------------|
| `sitguru.com` | TXT | Authorize M365 only | Keep Outlook include; **do not** stuff Resend into apex if Return-Path is `send.sitguru.com` | Apex SPF is for envelope domain of that host | Soft-fail/hard-fail if wrong `-all` | `dig TXT sitguru.com` + mail-tester |
| `send.sitguru.com` | TXT | Resend/SES MAIL FROM | Keep `v=spf1 include:amazonses.com ~all` (or Resend’s documented value) | Aligns Resend Return-Path | Breaking stops Resend bounces/SPF | Send Resend test; check Return-Path |
| Future `updates.sitguru.com` | TXT | Marketing subdomain (optional) | Provider-specific include when marketing splits | Isolate marketing reputation | Extra DNS ops | Provider verify + test |

If Supabase Auth uses custom SMTP on `@sitguru.com` with a different MAIL FROM host, add that host’s SPF — still **one TXT per hostname**.

### DKIM checklist

| Provider | Selector expectation | Status | Action |
|----------|----------------------|--------|--------|
| Microsoft 365 | `selector1` / `selector2` CNAMEs to **tenant-specific** targets | **Missing** | Enable DKIM in Defender; publish CNAMEs from the portal (**do not invent targets**) |
| Resend | `resend._domainkey` (or Resend dashboard values) | TXT present | Confirm Verified in Resend; rotate only via dashboard |
| Supabase Auth | Depends on custom SMTP | Unknown in repo | If custom domain, verify DKIM in that provider |

### DMARC rollout

**Already at `p=quarantine`.** Do **not** jump to `p=reject` until:

1. M365 DKIM enabled and selectors resolve  
2. Gmail “Show original” shows SPF/DKIM/DMARC PASS for Jason → Gmail  
3. Resend → Gmail PASS with aligned `d=` / From  
4. Supabase Auth mail PASS (or known non-aligned exception documented)  
5. Aggregate `rua` reports reviewed for unexpected sources  

**Suggested progression after DKIM fix:** stay on `quarantine` while monitoring → then `p=reject` when clean.

**rua:** Currently GoDaddy `dmarc_rua@onsecureserver.net`. Prefer also (or instead) a mailbox you control, e.g. `dmarc@sitguru.com`, once monitored.  
**ruf:** Optional; many receivers omit forensic reports — do not rely on them.  
**adkim/aspf:** Currently relaxed (`r`) — appropriate until all sources align.  
**sp:** Not set (inherits). When adding marketing subdomains, consider explicit subdomain policy.

---

## 9. DMARC alignment by system

| System | Visible From | Envelope / Return-Path (typical) | DKIM `d=` | Alignment path |
|--------|--------------|----------------------------------|-----------|----------------|
| M365 Jason | `@sitguru.com` | Often Outlook protection domain | Should be `sitguru.com` via selector1/2 | **Needs DKIM** for reliable DMARC |
| Resend app | `@sitguru.com` | Likely `send.sitguru.com` | `sitguru.com` via `resend._domainkey` | DKIM alignment if domain verified |
| Supabase Auth | Dashboard | Provider-dependent | Provider-dependent | **External check** |
| Stripe / Checkr | Their domains | Their domains | Their domains | N/A to sitguru.com DMARC |

---

## 10. URL / template hygiene

- SitGuru-controlled email HTML in-repo uses **HTTPS** (`https://sitguru.com` / `https://www.sitguru.com`).
- Canonical marketing origin helper: `SITE_CONFIG.productionOrigin` / `getEmailBaseUrl()`.
- Guru lead mailto template signature uses `https://sitguru.com` and Founder & CEO block.
- Prefer apex `https://sitguru.com` in human signatures; www also acceptable if it matches redirects without loops.

---

## 11. Bounce, complaint, suppression

| Capability | Status |
|------------|--------|
| Marketing unsubscribe table | Implemented (`email_update_subscribers`) |
| List-Unsubscribe headers | Implemented for Email Updates welcome |
| Resend bounce/complaint webhooks | **Not implemented** in repo |
| Hard-bounce suppression table | **Not implemented** |

**Recommendation:** Enable Resend webhooks → API route that records hard bounces/complaints and skips future sends. Until then, rely on Resend dashboard suppression and stop manual retries to known bad addresses.

---

## 12. Microsoft 365 checklist (Jason / admin)

1. Microsoft Defender portal → **Email & collaboration** → **Policies & rules** → **Threat policies** → **Email authentication settings**  
2. Select **sitguru.com** → **DKIM**  
3. Enable DKIM signing  
4. Publish the **exact** `selector1` / `selector2` CNAME targets shown in the portal (never invent)  
5. Wait for DNS propagation; confirm status is not `CnameMissing`  
6. Verify SPF still a **single** TXT starting with `v=spf1`  
7. Confirm accepted domain `sitguru.com` is Healthy  
8. Review outbound spam filter policy (ensure Jason isn’t throttled as bulk)  
9. Send test to Gmail → Show original → expect SPF/DKIM/DMARC PASS  

---

## 13. Gmail verification procedure

1. From Outlook, send a normal message: `jason@sitguru.com` → your Gmail test inbox  
2. Gmail → open message → ⋮ → **Show original**  
3. Expect: `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`  
4. Note DKIM `d=` (should be `sitguru.com`) and Return-Path  
5. Repeat with a Resend transactional test (e.g. support notify to yourself)  
6. Repeat with marketing welcome to a subscribed test address  

**Do not** automate login to personal Gmail.

---

## 14. Adding a new email provider safely

1. Document the flow in the inventory table  
2. Prefer a **subdomain** for marketing (`updates.`) vs transactional (`send.` already used by Resend)  
3. Add **one** SPF TXT on the MAIL FROM hostname only  
4. Publish provider DKIM; verify before cutting over  
5. Confirm DMARC alignment with a Gmail test  
6. Never set automated From to `jason@sitguru.com`  
7. Marketing only: consent + List-Unsubscribe + suppression  

---

## 15. Environment variables (names only)

See `EMAIL_ENV_VAR_NAMES` in `lib/email/config.ts`. Critical:

- `RESEND_API_KEY` — server only  
- `RESEND_FROM_EMAIL` — verified domain From  
- `RESEND_REPLY_TO_EMAIL` — human mailbox  
- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` — HTTPS absolute links  

Mobile (`sitguru-mobile`) must **never** ship `RESEND_API_KEY` or SMTP passwords.

---

## 16. Code map (primary)

| Path | Role |
|------|------|
| `lib/email/resend.ts` | Shared Resend send + marketing header enforcement |
| `lib/email/config.ts` | Stream config + personal From guard |
| `lib/email/headers.ts` | Header sanitization + List-Unsubscribe builders |
| `lib/email/email-updates-welcome.ts` | Marketing welcome |
| `lib/services/resend.ts` | PawReport transactional |
| `lib/admin/support/email.ts` | Support notifications |
| `supabase/email-templates/*` | Auth confirm template |
| `docs/email-deliverability.md` | This document |

---

## 17. Protecting `jason@sitguru.com` reputation

1. Enable M365 DKIM (P0)  
2. Keep recruiting as one-to-one Outlook mail (mailto helpers OK)  
3. Never BCC mass lists from Jason’s mailbox  
4. Never wire Resend From to Jason  
5. Separate marketing reputation (headers + eventual subdomain)  
6. Monitor DMARC aggregate reports for spoofing  

---

## 18. DNS action plan summary

**P0 — Publish Microsoft 365 DKIM CNAMEs** (targets from Defender only).  
**P1 — Confirm Resend domain Verified; review `rua` mailbox ownership.**  
**P2 — Optional marketing subdomain + bounce webhook.**  
**P3 — DMARC `p=reject` after clean reports.**

External DNS already inspected for this audit (GoDaddy nameservers `domaincontrol.com`). Re-check after any change with `dig`.
