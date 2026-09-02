/**
 * Automated CRM hook: alert internal team when a high-priority pet lead signs up.
 * Channels: outbound webhook, Resend email, optional Twilio SMS, in-app notifications.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { mergeAdminBcc } from "@/lib/email/admin-bcc";
import {
  assessHighPriorityPetLead,
  type HighPriorityPetLeadAssessment,
  type MarketingLeadInput,
  type MarketingLeadPetInput,
} from "@/lib/marketing/high-priority-pet-leads";

export type HighPriorityLeadAlertResult = {
  triggered: boolean;
  skippedReason?: string;
  assessment: HighPriorityPetLeadAssessment;
  channels: {
    webhook?: { ok: boolean; status?: number; error?: string; skipped?: boolean };
    email?: { ok: boolean; error?: string; skipped?: boolean };
    sms?: { ok: boolean; error?: string; skipped?: boolean };
    inApp?: { ok: boolean; count?: number; error?: string; skipped?: boolean };
    audit?: { ok: boolean; error?: string };
  };
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function splitList(value: string) {
  return value
    .split(/[,\n;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getSiteBaseUrl() {
  const raw =
    clean(process.env.NEXT_PUBLIC_SITE_URL) ||
    clean(process.env.SITE_URL) ||
    "https://www.sitguru.com";
  return raw.replace(/\/+$/, "");
}

function getWebhookUrl() {
  return (
    clean(process.env.MARKETING_LEAD_WEBHOOK_URL) ||
    clean(process.env.SITGURU_MARKETING_WEBHOOK_URL) ||
    clean(process.env.SLACK_MARKETING_WEBHOOK_URL) ||
    clean(process.env.ADMIN_MARKETING_WEBHOOK_URL) ||
    ""
  );
}

function getAlertEmails() {
  const configured =
    clean(process.env.MARKETING_LEAD_ALERT_EMAILS) ||
    clean(process.env.SITGURU_ADMIN_ALERT_EMAILS) ||
    clean(process.env.ADMIN_ALERT_EMAILS) ||
    clean(process.env.SIGNUP_ALERT_EMAILS) ||
    "jason@sitguru.com,nette@sitguru.com";
  return Array.from(new Set(splitList(configured)));
}

function getAlertPhones() {
  const configured =
    clean(process.env.MARKETING_LEAD_ALERT_SMS_TO) ||
    clean(process.env.ADMIN_ALERT_SMS_TO) ||
    clean(process.env.SITGURU_ADMIN_ALERT_PHONES) ||
    clean(process.env.ADMIN_ALERT_PHONES) ||
    "";
  return Array.from(new Set(splitList(configured)));
}

function leadDisplayName(lead: MarketingLeadInput) {
  return (
    clean(lead.full_name) ||
    [clean(lead.first_name), clean(lead.last_name)].filter(Boolean).join(" ") ||
    "New lead"
  );
}

function leadLocation(lead: MarketingLeadInput) {
  return (
    clean(lead.market_area) ||
    [clean(lead.city), clean(lead.state), clean(lead.zip_code)]
      .filter(Boolean)
      .join(", ") ||
    "Market unknown"
  );
}

function buildCrmHref(leadId: string) {
  return `${getSiteBaseUrl()}/admin/sales-marketing/signup-leads#lead-${leadId}`;
}

function buildAlertText(params: {
  lead: MarketingLeadInput;
  leadId: string;
  assessment: HighPriorityPetLeadAssessment;
}) {
  const { lead, leadId, assessment } = params;
  const name = leadDisplayName(lead);
  const reasons = assessment.reasons.map((reason) => `• ${reason.label}`).join("\n");

  return [
    `🔥 High-priority SitGuru pet lead: ${name}`,
    `Score: ${assessment.score}`,
    `Location: ${leadLocation(lead)}`,
    `Pets: ${assessment.petSummary}`,
    `Contact: ${clean(lead.email) || "no email"} · ${clean(lead.phone) || "no phone"}`,
    `Lead type: ${clean(lead.lead_type) || clean(lead.relationship_category) || "Pet Parent"}`,
    `Why now:\n${reasons || "• Priority signal"}`,
    `Suggested deal: ${assessment.suggestedDeal}`,
    `CRM: ${buildCrmHref(leadId)}`,
  ].join("\n");
}

function buildAlertHtml(params: {
  lead: MarketingLeadInput;
  leadId: string;
  assessment: HighPriorityPetLeadAssessment;
}) {
  const text = buildAlertText(params);
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap;line-height:1.5;font-size:14px;">${escaped}</pre>`;
}

async function postWebhook(payload: Record<string, unknown>) {
  const url = getWebhookUrl();
  if (!url) {
    return { skipped: true as const, ok: false as const };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false as const,
        status: response.status,
        error: body.slice(0, 400) || `HTTP ${response.status}`,
      };
    }

    return { ok: true as const, status: response.status };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Webhook failed",
    };
  }
}

async function sendEmailAlert(params: {
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = clean(process.env.RESEND_API_KEY);
  const recipients = getAlertEmails();
  if (!apiKey || recipients.length === 0) {
    return { skipped: true as const, ok: false as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          clean(process.env.ALERT_FROM_EMAIL) ||
          clean(process.env.RESEND_FROM_EMAIL) ||
          "SitGuru Alerts <alerts@sitguru.com>",
        to: recipients,
        bcc: mergeAdminBcc(recipients),
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false as const,
        error: body.slice(0, 400) || `Resend HTTP ${response.status}`,
      };
    }

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Email failed",
    };
  }
}

async function sendSmsAlert(message: string) {
  const accountSid = clean(process.env.TWILIO_ACCOUNT_SID);
  const authToken = clean(process.env.TWILIO_AUTH_TOKEN);
  const fromNumber = clean(process.env.TWILIO_FROM_NUMBER);
  const messagingServiceSid = clean(process.env.TWILIO_MESSAGING_SERVICE_SID);
  const recipients = getAlertPhones();

  if (
    !accountSid ||
    !authToken ||
    (!fromNumber && !messagingServiceSid) ||
    recipients.length === 0
  ) {
    return { skipped: true as const, ok: false as const };
  }

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString(
      "base64",
    );

    await Promise.all(
      recipients.map(async (to) => {
        const body = new URLSearchParams({
          To: to,
          Body: message.slice(0, 1400),
        });
        if (messagingServiceSid) {
          body.set("MessagingServiceSid", messagingServiceSid);
        } else if (fromNumber) {
          body.set("From", fromNumber);
        }

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          },
        );

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(text.slice(0, 300) || `Twilio HTTP ${response.status}`);
        }
      }),
    );

    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "SMS failed",
    };
  }
}

async function notifyAdminsInApp(params: {
  title: string;
  body: string;
  leadId: string;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(200);

    if (error) {
      return { ok: false as const, error: error.message };
    }

    const adminIds = (data || [])
      .map((row) => clean((row as { id?: string }).id))
      .filter(Boolean);

    if (!adminIds.length) {
      return { skipped: true as const, ok: false as const, count: 0 };
    }

    const href = `/admin/sales-marketing/signup-leads#lead-${params.leadId}`;
    const now = new Date().toISOString();
    const rows = adminIds.map((userId) => ({
      user_id: userId,
      title: params.title,
      body: params.body,
      type: "marketing_high_priority_pet_lead",
      href,
      link: href,
      is_read: false,
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("notifications")
      .insert(rows);

    if (insertError) {
      return { ok: false as const, error: insertError.message };
    }

    return { ok: true as const, count: rows.length };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "In-app notify failed",
    };
  }
}

async function writeAuditEvent(params: {
  leadId: string;
  assessment: HighPriorityPetLeadAssessment;
  channels: HighPriorityLeadAlertResult["channels"];
  pets: MarketingLeadPetInput[];
}) {
  try {
    const { error } = await supabaseAdmin
      .from("admin_marketing_lead_alert_events")
      .insert({
        signup_lead_id: params.leadId,
        alert_type: "high_priority_pet_lead",
        priority_score: params.assessment.score,
        reasons: params.assessment.reasons,
        suggested_deal: params.assessment.suggestedDeal,
        pet_summary: params.assessment.petSummary,
        pet_snapshot: params.pets,
        channel_results: params.channels,
        triggered: true,
      });

    if (error) {
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Audit insert failed",
    };
  }
}

/**
 * Evaluate pets + lead flags; if high-priority, fan out alerts.
 * Never throws — lead save must remain successful even if alerts fail.
 */
export async function notifyHighPriorityPetLeadSignup(params: {
  leadId: string;
  lead: MarketingLeadInput;
  pets: MarketingLeadPetInput[];
}): Promise<HighPriorityLeadAlertResult> {
  const assessment = assessHighPriorityPetLead({
    lead: params.lead,
    pets: params.pets,
  });

  if (!assessment.isHighPriority) {
    return {
      triggered: false,
      skippedReason: "Lead did not meet high-priority pet profile thresholds.",
      assessment,
      channels: {},
    };
  }

  if (!params.leadId) {
    return {
      triggered: false,
      skippedReason: "Missing signup lead id.",
      assessment,
      channels: {},
    };
  }

  const name = leadDisplayName(params.lead);
  const text = buildAlertText({
    lead: params.lead,
    leadId: params.leadId,
    assessment,
  });
  const html = buildAlertHtml({
    lead: params.lead,
    leadId: params.leadId,
    assessment,
  });
  const subject = `🔥 High-priority pet lead: ${name} (score ${assessment.score})`;

  const webhookPayload = {
    event: "marketing.high_priority_pet_lead",
    source: "admin_marketing_signup_lead_pets",
    leadId: params.leadId,
    lead: {
      name,
      email: clean(params.lead.email) || null,
      phone: clean(params.lead.phone) || null,
      location: leadLocation(params.lead),
      leadType: clean(params.lead.lead_type) || null,
      campaignSource: clean(params.lead.campaign_source) || null,
      priorityLevel: clean(params.lead.priority_level) || null,
      ceoPriority: Boolean(params.lead.ceo_priority),
    },
    pets: params.pets,
    assessment: {
      score: assessment.score,
      reasons: assessment.reasons,
      suggestedDeal: assessment.suggestedDeal,
      petSummary: assessment.petSummary,
    },
    crmUrl: buildCrmHref(params.leadId),
    // Slack Incoming Webhooks also accept `text`
    text,
  };

  const [webhook, email, sms, inApp] = await Promise.all([
    postWebhook(webhookPayload),
    sendEmailAlert({ subject, html, text }),
    sendSmsAlert(
      `SitGuru high-priority pet lead: ${name}. ${assessment.suggestedDeal} CRM: ${buildCrmHref(params.leadId)}`,
    ),
    notifyAdminsInApp({
      leadId: params.leadId,
      title: "High-priority pet lead",
      body: `${name} · ${assessment.petSummary}. ${assessment.suggestedDeal}`,
    }),
  ]);

  const channels: HighPriorityLeadAlertResult["channels"] = {
    webhook,
    email,
    sms,
    inApp,
  };

  const audit = await writeAuditEvent({
    leadId: params.leadId,
    assessment,
    channels,
    pets: params.pets,
  });
  channels.audit = audit;

  return {
    triggered: true,
    assessment,
    channels,
  };
}
