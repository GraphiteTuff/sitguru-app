// lib/services/resend.ts
/**
 * Resend connector — final PawReport summary email on WALK_END.
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL (optional)
 *
 * Primary template: generatePawReportEmailHtml(summaryData)
 * — table-cell / fully inlined CSS for Gmail, Apple Mail, mobile clients.
 */

import { Resend } from "resend";
import { mergeAdminBcc } from "@/lib/email/admin-bcc";
import {
  SITGURU_EMAIL_FONT_FAMILY,
  SITGURU_EMAIL_FONT_HEAD,
} from "@/lib/email/brand-font";

export type PawReportTimelineEvent = {
  /** Display time, e.g. "10:06 AM" */
  at: string;
  /** Short label, e.g. "Potty Break (Poop)" */
  label: string;
  /** Visual cue used in the timeline row */
  icon?: "start" | "potty" | "break" | "home" | "note";
};

export type FinalReportSummaryData = {
  petName: string;
  guruName?: string;
  distanceMiles?: number;
  durationMinutes?: number;
  photoCount?: number;
  pottyEvents?: Array<{ label: string; at: string }>;
  /** Ordered walk timeline for the email snapshot */
  timelineEvents?: PawReportTimelineEvent[];
  liveUrl?: string;
  bookingId?: string;
  endedAt?: string;
  startedAt?: string;
  /** Optional photo URLs for thumbnail row */
  photoUrls?: string[];
  supportEmail?: string;
};

export type ResendEmailResult = {
  ok: boolean;
  skipped?: boolean;
  id?: string | null;
  error?: string;
};

function getResendFromEmail() {
  return (
    String(process.env.RESEND_FROM_EMAIL || "").trim() ||
    String(process.env.SITGURU_ALERT_FROM_EMAIL || "").trim() ||
    "SitGuru <alerts@sitguru.com>"
  );
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildTrackableUrl(summary: FinalReportSummaryData) {
  const fromLive = String(summary.liveUrl || "").trim();
  if (fromLive) return fromLive;

  const bookingId = String(summary.bookingId || "").trim();
  if (bookingId) {
    return `https://sitguru.com/${bookingId.replace(/^\//, "")}`;
  }

  return "https://sitguru.com";
}

function timelineIcon(kind: PawReportTimelineEvent["icon"]) {
  switch (kind) {
    case "start":
      return "🟢";
    case "potty":
      return "💩";
    case "break":
      return "🌳";
    case "home":
      return "🏡";
    default:
      return "•";
  }
}

function inferIconFromLabel(label: string): PawReportTimelineEvent["icon"] {
  const text = label.toLowerCase();
  if (text.includes("start")) return "start";
  if (text.includes("potty") || text.includes("poop") || text.includes("pee")) {
    return "potty";
  }
  if (text.includes("break") || text.includes("rest") || text.includes("water")) {
    return "break";
  }
  if (
    text.includes("home") ||
    text.includes("arrived") ||
    text.includes("ended") ||
    text.includes("safe")
  ) {
    return "home";
  }
  return "note";
}

/**
 * Build a warm default timeline when the dispatcher only has potty snapshots.
 */
function resolveTimeline(
  summary: FinalReportSummaryData,
): PawReportTimelineEvent[] {
  if (summary.timelineEvents && summary.timelineEvents.length > 0) {
    return summary.timelineEvents.map((event) => ({
      ...event,
      icon: event.icon || inferIconFromLabel(event.label),
    }));
  }

  const events: PawReportTimelineEvent[] = [
    {
      at: summary.startedAt || "Start",
      label: "Walk Started",
      icon: "start",
    },
  ];

  for (const potty of summary.pottyEvents || []) {
    events.push({
      at: potty.at,
      label: potty.label.toLowerCase().includes("poop")
        ? "Potty Break (Poop)"
        : potty.label.toLowerCase().includes("pee")
          ? "Potty Break (Pee)"
          : `Potty Break (${potty.label})`,
      icon: "potty",
    });
  }

  events.push({
    at: summary.endedAt || "End",
    label: "Arrived Safely Home",
    icon: "home",
  });

  return events;
}

/**
 * Polished, mobile-first PawReport HTML for WALK_END Resend delivery.
 * Uses nested tables + fully inlined styles for Gmail / Apple Mail / mobile.
 */
export function generatePawReportEmailHtml(summaryData: FinalReportSummaryData | Record<string, unknown>): string {
  const summary = (summaryData || {}) as FinalReportSummaryData;
  const petNameRaw = String(summary.petName || "Scout").trim() || "Scout";
  const petName = escapeHtml(petNameRaw);
  const guruName = escapeHtml(summary.guruName || "Your Guru");
  const miles = asNumber(summary.distanceMiles).toFixed(1);
  const minutes = Math.round(asNumber(summary.durationMinutes));
  const supportEmail = escapeHtml(
    summary.supportEmail ||
      process.env.SITGURU_SUPPORT_EMAIL ||
      "support@sitguru.com",
  );
  const ctaUrl = escapeHtml(buildTrackableUrl(summary));
  const timeline = resolveTimeline(summary);

  const timelineRows = timeline
    .map((event, index) => {
      const isLast = index === timeline.length - 1;
      const icon = timelineIcon(event.icon || inferIconFromLabel(event.label));
      const border = isLast ? "none" : "1px solid #e2e8f0";
      return `
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 10px 16px 0;">
            <div style="width:28px;height:28px;line-height:28px;text-align:center;font-size:16px;">
              ${icon}
            </div>
            ${
              isLast
                ? ""
                : `<div style="width:2px;height:18px;margin:4px auto 0;background:#bbf7d0;"></div>`
            }
          </td>
          <td style="vertical-align:top;padding:0 0 16px 0;border-bottom:${border};">
            <p style="margin:0;font-size:12px;font-weight:800;color:#64748b;letter-spacing:0.02em;">
              ${escapeHtml(event.at)}
            </p>
            <p style="margin:4px 0 0;font-size:15px;font-weight:800;color:#0f172a;line-height:1.35;">
              ${escapeHtml(event.label)}
            </p>
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${petName}'s PawReport is Ready</title>
  ${SITGURU_EMAIL_FONT_HEAD}
</head>
<body style="margin:0;padding:0;background:#f0fdf4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${SITGURU_EMAIL_FONT_FAMILY};">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${petName}'s walk is complete — ${miles} miles · ${minutes} minutes. View the interactive route map inside.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;margin:0;padding:0;width:100%;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #bbf7d0;">

          <!-- 1. Branding header -->
          <tr>
            <td style="background:#0D5C3A;padding:28px 24px 26px;text-align:left;">
              <p style="margin:0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#ffffff;">
                SitGuru
              </p>
              <h1 style="margin:14px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;font-weight:700;color:#ffffff;">
                ${petName}'s PawReport is Ready! &#128062;
              </h1>
              <p style="margin:12px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:rgba(255,255,255,0.92);">
                Care by ${guruName} · Trusted pet care, simplified.
              </p>
            </td>
          </tr>

          <!-- 2. Performance metrics (2-column) -->
          <tr>
            <td style="padding:24px 20px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top" style="padding:0 6px 12px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;">
                      <tr>
                        <td style="padding:18px 14px;text-align:center;">
                          <p style="margin:0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0D5C3A;">
                            Miles Traveled
                          </p>
                          <p style="margin:10px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:30px;line-height:1;font-weight:900;color:#0f172a;">
                            ${miles}
                          </p>
                          <p style="margin:6px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#64748b;">
                            miles
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" valign="top" style="padding:0 0 12px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;">
                      <tr>
                        <td style="padding:18px 14px;text-align:center;">
                          <p style="margin:0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0D5C3A;">
                            Minutes Active
                          </p>
                          <p style="margin:10px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:30px;line-height:1;font-weight:900;color:#0f172a;">
                            ${minutes}
                          </p>
                          <p style="margin:6px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#64748b;">
                            minutes
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Event timeline snapshot -->
          <tr>
            <td style="padding:8px 24px 8px;">
              <p style="margin:0 0 14px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:16px;font-weight:900;color:#0f172a;">
                Walk timeline
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${timelineRows}
              </table>
            </td>
          </tr>

          <!-- 4. High-conversion CTA -->
          <tr>
            <td align="center" style="padding:20px 24px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#0D5C3A" style="border-radius:14px;background:#0D5C3A;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${ctaUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="28%" stroke="f" fillcolor="#0D5C3A">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">
                        View Full Interactive Route Map
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="${ctaUrl}" style="display:inline-block;padding:16px 28px;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;background:#0D5C3A;line-height:1.2;">
                      View Full Interactive Route Map
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;line-height:1.5;">
                Opens your live PawReport route for ${petName}.
              </p>
            </td>
          </tr>

          <!-- 5. Footer compliance -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 24px 26px;text-align:center;">
              <p style="margin:0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#0f172a;">
                Thank you for trusting SitGuru!
              </p>
              <p style="margin:12px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#64748b;">
                Questions about this visit?
                <a href="mailto:${supportEmail}" style="color:#0D5C3A;font-weight:700;text-decoration:none;">Contact support</a>
                &nbsp;·&nbsp;
                <a href="https://sitguru.com" style="color:#0D5C3A;font-weight:700;text-decoration:none;">sitguru.com</a>
              </p>
              <p style="margin:14px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:11px;line-height:1.55;color:#94a3b8;">
                This transactional message was sent because a walk was completed for your SitGuru booking.
                SitGuru does not sell your personal information. If you received this in error, please contact
                <a href="mailto:${supportEmail}" style="color:#64748b;">${supportEmail}</a>.
              </p>
              <p style="margin:12px 0 0;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;">
                © ${new Date().getFullYear()} SitGuru · Trusted pet care, simplified.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** @deprecated Prefer generatePawReportEmailHtml */
export function buildFinalReportHtml(summary: FinalReportSummaryData) {
  return generatePawReportEmailHtml(summary);
}

export function isResendConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || "").trim());
}

export function getResendClient() {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Final PawReport email — mobile-optimized HTML table summary.
 */
export async function sendFinalReportEmail(
  to: string,
  summaryData: FinalReportSummaryData,
): Promise<ResendEmailResult> {
  try {
    const recipient = String(to || "").trim().toLowerCase();
    if (!recipient) {
      return { ok: false, skipped: true, error: "Missing recipient email." };
    }

    const petName = summaryData.petName || "Scout";
    const subject = `🏡 ${petName}'s PawReport is Ready!`;

    if (process.env.SIMULATE_WALK === "1") {
      console.log("[SIMULATE_WALK][resend] payload", {
        to: recipient,
        subject,
        distanceMiles: summaryData.distanceMiles,
        durationMinutes: summaryData.durationMinutes,
        liveUrl: buildTrackableUrl(summaryData),
        bookingId: summaryData.bookingId,
        pottyEvents: summaryData.pottyEvents?.length ?? 0,
        timelineEvents: summaryData.timelineEvents?.length ?? 0,
      });
    }

    const client = getResendClient();
    if (!client) {
      console.info("[resend] skipped — RESEND_API_KEY not configured");
      return {
        ok: false,
        skipped: true,
        error: "Resend is not configured.",
      };
    }

    const { data, error } = await client.emails.send({
      from: getResendFromEmail(),
      to: [recipient],
      bcc: mergeAdminBcc(recipient),
      subject,
      html: generatePawReportEmailHtml(summaryData),
    });

    if (error) {
      console.error("[resend] sendFinalReportEmail failed:", error.message);
      return { ok: false, id: null, error: error.message };
    }

    return { ok: true, id: data?.id || null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resend request failed.";
    console.error("[resend] exception:", message);
    return { ok: false, id: null, error: message };
  }
}

/** @deprecated Prefer sendFinalReportEmail(to, summaryData) */
export async function sendFinalPawReportEmail(params: {
  to: string;
  subject?: string;
  report: FinalReportSummaryData;
}): Promise<ResendEmailResult> {
  return sendFinalReportEmail(params.to, params.report);
}
