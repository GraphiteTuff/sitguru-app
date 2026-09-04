import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mergeAdminBcc } from "@/lib/email/admin-bcc";
import { notifyHqCareerApplication } from "@/lib/admin/customers/signup-alerts";

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
      bcc: mergeAdminBcc(payload.email),
      subject: "We received your SitGuru Ambassador application",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; line-height: 1.6; color: #12382b;">
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
      bcc: mergeAdminBcc(adminEmail),
      subject: "New SitGuru Ambassador application",
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, Helvetica, sans-serif; line-height: 1.6; color: #12382b;">
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
    const locationLabel = [city, state, zipCode].filter(Boolean).join(", ");
    const referralSource =
      referredByCode ||
      referralCode ||
      cleanString(body.utmSource) ||
      "public_ambassador_application";

    const notes = [
      `Ambassador type: ${ambassadorType}`,
      profession ? `Profession: ${profession}` : "",
      organizationName ? `Organization: ${organizationName}` : "",
      `Referral focus: ${referralFocus}`,
      communityReach ? `Community reach: ${communityReach}` : "",
      `Why interested: ${whyInterested}`,
      referralCode ? `Referral code: ${referralCode}` : "",
      referredByCode ? `Referred by: ${referredByCode}` : "",
      `Consent to feature: ${consentToFeature ? "yes" : "no"}`,
      `Consent to contact: ${consentToContact ? "yes" : "no"}`,
      cleanString(body.sourceUrl)
        ? `Source URL: ${cleanString(body.sourceUrl)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Match the live program_applications schema used by /api/program-applications.
    // The previous payload used incompatible columns (program_type, first_name,
    // zipcode, why_sitguru, metadata, etc.) which caused insert failures.
    const applicationRecord = {
      program: "ambassador-program",
      full_name: fullName,
      email,
      phone: phone || null,
      zip_code: zipCode,
      city,
      state,
      availability: communityReach || "Ambassador program interest",
      services_interested: [
        `Ambassador type: ${ambassadorType}`,
        `Referral focus: ${referralFocus}`,
        profession ? `Profession: ${profession}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
      experience: whyInterested,
      military_connected_background:
        ambassadorType === "veteran-military"
          ? "Veteran / military-connected ambassador applicant"
          : null,
      referral_source: referralSource,
      resume_link: null,
      resume_file_url: null,
      resume_file_name: null,
      resume_file_type: null,
      resume_file_size_bytes: null,
      additional_documents: [],
      background_check_consent: true,
      notes,
      status: "new",
      source: "public_ambassador_application",
    };

    let data: { id?: string } | null = null;

    const primaryInsert = await supabaseAdmin
      .from("program_applications")
      .insert(applicationRecord)
      .select("id")
      .single();

    if (primaryInsert.error) {
      console.warn(
        "Ambassador application primary insert failed, retrying with lean payload:",
        primaryInsert.error,
      );

      // Lean fallback for older/partial program_applications schemas.
      const leanInsert = await supabaseAdmin
        .from("program_applications")
        .insert({
          program: "ambassador-program",
          full_name: fullName,
          email,
          phone: phone || null,
          zip_code: zipCode,
          city,
          state,
          availability: communityReach || "Ambassador program interest",
          services_interested: referralFocus,
          experience: whyInterested,
          referral_source: referralSource,
          background_check_consent: true,
          notes,
          status: "new",
          source: "public_ambassador_application",
        })
        .select("id")
        .single();

      if (leanInsert.error) {
        console.error(
          "Ambassador application insert failed:",
          leanInsert.error,
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "We could not submit your Ambassador application right now. Please try again.",
          },
          { status: 500 },
        );
      }

      data = leanInsert.data;
    } else {
      data = primaryInsert.data;
    }

    // Best-effort dual write so HR / Ambassador Leads also sees the applicant.
    const { error: leadError } = await supabaseAdmin
      .from("ambassador_leads")
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
        program: "Ambassador Program",
        source: "public_ambassador_application",
        status: "new",
        location: locationLabel || null,
        zip_code: zipCode,
        city,
        state,
        notes,
        created_at: submittedAt,
        updated_at: submittedAt,
      });

    if (leadError) {
      console.warn(
        "Ambassador application saved, but ambassador_leads dual-write failed:",
        leadError,
      );
    }

    void notifyHqCareerApplication({
      id: typeof data?.id === "string" ? data.id : undefined,
      program: "ambassador-program",
      name: fullName,
      email,
      phone: phone || undefined,
    }).catch((notifyError) => {
      console.warn("Ambassador application HQ bell skipped:", notifyError);
    });

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