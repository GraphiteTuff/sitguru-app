import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AmbassadorApplicationPayload = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zipcode?: string;
  ambassadorType?: string;
  profession?: string;
  organizationName?: string;
  organization?: string;
  referralFocus?: string;
  communityReach?: string;
  whyInterested?: string;
  whySitGuru?: string;
  referralCode?: string;
  referredByCode?: string;
  consentToFeature?: boolean;
  consentToHighlight?: boolean;
  consentToContact?: boolean;
  sourceUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPhone(value: unknown) {
  return cleanString(value).replace(/[^\d]/g, "").slice(0, 10);
}

function cleanZipCode(value: unknown) {
  return cleanString(value).replace(/[^\d]/g, "").slice(0, 5);
}

function cleanState(value: unknown) {
  return cleanString(value).slice(0, 50);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function splitFullName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendConfirmationEmail(payload: {
  fullName: string;
  firstName: string;
  email: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  const fromEmail =
    process.env.SITGURU_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "SitGuru <no-reply@sitguru.com>";

  if (!resendApiKey) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: payload.email,
      subject: "We received your SitGuru Ambassador application",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12382b;">
          <h2 style="color:#14532d;">Thank you for your interest in joining the SitGuru pack!</h2>
          <p>Hi ${escapeHtml(payload.firstName || payload.fullName || "there")},</p>
          <p>We received your Ambassador application and our team will review it soon.</p>
          <p>
            SitGuru Ambassadors help grow a trusted pet-care community by connecting
            great Gurus, Pet Parents, and pet-care professionals.
          </p>
          <p>We appreciate your interest in helping SitGuru lead the pack.</p>
          <p style="margin-top:24px;">
            With gratitude,<br />
            <strong>The SitGuru Team</strong>
          </p>
        </div>
      `,
    }),
  }).catch((error) => {
    console.error("Ambassador confirmation email failed:", error);
  });
}

async function sendAdminNotificationEmail(payload: {
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  city: string;
  state: string;
  ambassadorType: string;
  profession: string;
  referralFocus: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  const adminEmail =
    process.env.SITGURU_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    process.env.SITGURU_SUPPORT_EMAIL;

  const fromEmail =
    process.env.SITGURU_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "SitGuru <no-reply@sitguru.com>";

  if (!resendApiKey || !adminEmail) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: adminEmail,
      subject: "New SitGuru Ambassador application",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #12382b;">
          <h2 style="color:#14532d;">New Ambassador Application</h2>
          <p><strong>Name:</strong> ${escapeHtml(payload.fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "Not provided")}</p>
          <p><strong>Location:</strong> ${escapeHtml(
            [payload.city, payload.state, payload.zipCode]
              .filter(Boolean)
              .join(", ") || "Not provided",
          )}</p>
          <p><strong>Ambassador Type:</strong> ${escapeHtml(
            payload.ambassadorType || "Not provided",
          )}</p>
          <p><strong>Profession:</strong> ${escapeHtml(
            payload.profession || "Not provided",
          )}</p>
          <p><strong>Referral Focus:</strong> ${escapeHtml(
            payload.referralFocus || "Not provided",
          )}</p>
        </div>
      `,
    }),
  }).catch((error) => {
    console.error("Ambassador admin notification email failed:", error);
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AmbassadorApplicationPayload;

    const fullNameFromBody = cleanString(body.fullName);
    const splitName = splitFullName(fullNameFromBody);

    const firstName = cleanString(body.firstName) || splitName.firstName;
    const lastName = cleanString(body.lastName) || splitName.lastName;
    const fullName =
      fullNameFromBody || [firstName, lastName].filter(Boolean).join(" ");

    const email = cleanString(body.email).toLowerCase();
    const phone = cleanPhone(body.phone);
    const city = cleanString(body.city);
    const state = cleanState(body.state);
    const zipCode = cleanZipCode(body.zipCode || body.zipcode);

    const ambassadorType = cleanString(body.ambassadorType) || "community";
    const profession = cleanString(body.profession);
    const organizationName =
      cleanString(body.organizationName) || cleanString(body.organization);
    const referralFocus = cleanString(body.referralFocus) || "both";
    const communityReach = cleanString(body.communityReach);
    const whyInterested =
      cleanString(body.whyInterested) || cleanString(body.whySitGuru);

    const referralCode = cleanString(body.referralCode).toUpperCase();
    const referredByCode = cleanString(body.referredByCode).toUpperCase();

    const consentToFeature = Boolean(
      body.consentToFeature || body.consentToHighlight,
    );

    const consentToContact = body.consentToContact !== false;

    if (!fullName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Full name is required.",
        },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "A valid email address is required.",
        },
        { status: 400 },
      );
    }

    if (phone.length > 0 && phone.length !== 10) {
      return NextResponse.json(
        {
          ok: false,
          error: "Phone number must be 10 digits.",
        },
        { status: 400 },
      );
    }

    if (zipCode.length !== 5) {
      return NextResponse.json(
        {
          ok: false,
          error: "A valid 5-digit ZIP code is required.",
        },
        { status: 400 },
      );
    }

    if (!city) {
      return NextResponse.json(
        {
          ok: false,
          error: "City is required.",
        },
        { status: 400 },
      );
    }

    if (!state) {
      return NextResponse.json(
        {
          ok: false,
          error: "State is required.",
        },
        { status: 400 },
      );
    }

    if (!whyInterested) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please tell us why you want to become a SitGuru Ambassador.",
        },
        { status: 400 },
      );
    }

    const submittedAt = new Date().toISOString();

    const applicationRecord = {
      program_type: "ambassador",
      applicant_type: "ambassador",
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      zipcode: zipCode,
      city,
      state,
      profession,
      organization: organizationName,
      referral_source: referralFocus,
      experience: communityReach,
      why_sitguru: whyInterested,
      consent_to_highlight: consentToFeature,
      status: "submitted",
      source: "public_ambassador_application",
      submitted_at: submittedAt,
      metadata: {
        program: "Ambassador Program",
        publicFacingProgram: true,
        fullName,
        firstName,
        lastName,
        email,
        phone,
        city,
        state,
        zipCode,
        ambassadorType,
        profession,
        organizationName,
        referralFocus,
        communityReach,
        whyInterested,
        referralCode,
        referredByCode,
        consentToFeature,
        consentToContact,
        sourceUrl: cleanString(body.sourceUrl),
        utm: {
          source: cleanString(body.utmSource),
          medium: cleanString(body.utmMedium),
          campaign: cleanString(body.utmCampaign),
          content: cleanString(body.utmContent),
          term: cleanString(body.utmTerm),
        },
      },
    };

    const { data, error } = await supabaseAdmin
      .from("program_applications")
      .insert(applicationRecord)
      .select("id")
      .single();

    if (error) {
      console.error("Ambassador application insert failed:", error);

      return NextResponse.json(
        {
          ok: false,
          error:
            "We could not submit your Ambassador application right now. Please try again.",
        },
        { status: 500 },
      );
    }

    await Promise.allSettled([
      sendConfirmationEmail({
        fullName,
        firstName,
        email,
      }),
      sendAdminNotificationEmail({
        fullName,
        email,
        phone,
        zipCode,
        city,
        state,
        ambassadorType,
        profession,
        referralFocus,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      success: true,
      applicationId: data?.id,
      application: data,
      message:
        "Your SitGuru Ambassador application has been submitted. Thank you for your interest in joining the pack!",
    });
  } catch (error) {
    console.error("Ambassador application route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong while submitting your Ambassador application.",
      },
      { status: 500 },
    );
  }
}