import { revalidatePath } from "next/cache";
import { sendSitGuruEmail } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ambassadorTypeForApplication,
  isAmbassadorProgram,
  roleContactEmails,
  sameInboxEmail,
} from "@/lib/ambassador/application-queue";

const APPROVAL_EMAIL_MARK = "Ambassador approval email sent.";

type ApplicationRow = {
  id: string;
  program: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  admin_notes: string | null;
  applicant_user_id: string | null;
  ambassador_type: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export type AmbassadorApprovalResult =
  | {
      ok: true;
      ambassadorId: string;
      alreadyApproved: boolean;
      emailed: boolean;
      internLinked: boolean;
    }
  | { ok: false; error: string };

function clean(value: string | null | undefined) {
  return String(value || "").trim();
}

function referralSeed(name: string) {
  const letters = name.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 6) || "PACK";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${letters}${suffix}`;
}

async function uniqueReferralCode(name: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = referralSeed(name);
    const { data } = await supabaseAdmin
      .from("ambassadors")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!data?.id) return code;
  }
  return referralSeed(`${name}${Date.now()}`);
}

async function profileForEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  return (data || null) as ProfileRow | null;
}

async function ensureRole(userId: string, role: string) {
  const { error } = await supabaseAdmin.from("user_roles").upsert(
    { user_id: userId, role },
    { onConflict: "user_id,role" },
  );
  if (error) throw new Error(error.message);
}

async function linkInternAccount(profile: ProfileRow, workEmail: string) {
  const name = clean(profile.full_name);
  const email = clean(profile.email).toLowerCase();
  if (!name || !email) return false;
  const { data } = await supabaseAdmin
    .from("internship_interns")
    .select("id,email,full_name,user_id,notes")
    .ilike("full_name", name);
  const matches = ((data || []) as Array<{
    id: string;
    email: string | null;
    user_id: string | null;
    notes: string | null;
  }>).filter((row) => {
    if (row.user_id && row.user_id !== profile.id) return false;
    return row.user_id === profile.id || sameInboxEmail(row.email, email);
  });
  if (matches.length !== 1) return false;
  const row = matches[0];
  const previous = clean(row.email);
  const alreadyNoted = previous && String(row.notes || "").includes(previous);
  const notes =
    previous && previous.toLowerCase() !== email && !alreadyNoted
      ? `${clean(row.notes) ? `${clean(row.notes)}\n` : ""}Previous internship email ${previous} linked to the verified SitGuru account.`
      : row.notes;
  const { error } = await supabaseAdmin
    .from("internship_interns")
    .update({
      user_id: profile.id,
      email,
      work_email: workEmail || null,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  await ensureRole(profile.id, "intern");
  return true;
}

function approvalEmail(name: string, personalEmail: string, workEmail: string) {
  const first = name.split(/\s+/)[0] || "there";
  const both = workEmail
    ? `Keep using ${personalEmail} for now. ${workEmail} is your SitGuru address and will be ready in January.`
    : "Sign in with your existing SitGuru account.";
  const text = [
    `Hi ${first},`,
    "",
    "Your SitGuru Ambassador role is approved.",
    "Pet Parent, Guru, Ambassador, and Intern are available from Switch Your SitGuru Role.",
    both,
    "",
    "https://www.sitguru.com",
    "",
    "The SitGuru Team",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#12382b;">
      <p>Hi ${first},</p>
      <p>Your SitGuru Ambassador role is approved.</p>
      <p>Pet Parent, Guru, Ambassador, and Intern are available from Switch Your SitGuru Role.</p>
      <p>${both}</p>
      <p><a href="https://www.sitguru.com">https://www.sitguru.com</a></p>
      <p>The SitGuru Team</p>
    </div>
  `;
  return { text, html };
}

export async function approveAmbassadorProgramApplication(input: {
  applicationId: string;
  actorUserId: string;
  workEmail?: string | null;
}): Promise<AmbassadorApprovalResult> {
  const applicationId = clean(input.applicationId);
  const actorUserId = clean(input.actorUserId);
  if (!applicationId || !actorUserId) {
    return { ok: false, error: "Application and reviewer are required." };
  }

  const { data: loaded, error: loadError } = await supabaseAdmin
    .from("program_applications")
    .select("id,program,full_name,email,phone,city,state,zip_code,status,source,notes,admin_notes,applicant_user_id,ambassador_type")
    .eq("id", applicationId)
    .maybeSingle();
  if (loadError || !loaded) {
    return { ok: false, error: "That Ambassador application was not found." };
  }
  const application = loaded as ApplicationRow;
  if (!isAmbassadorProgram(application.program)) {
    return { ok: false, error: "That application is not an Ambassador application." };
  }
  const email = clean(application.email).toLowerCase();
  if (!email) return { ok: false, error: "The application has no email." };
  const contacts = roleContactEmails(email, input.workEmail);

  const profile = await profileForEmail(email);
  if (!profile?.id) {
    return { ok: false, error: "No SitGuru account matches this application email." };
  }
  if (contacts.workEmail) {
    const { data: taken } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", contacts.workEmail)
      .neq("id", profile.id)
      .limit(1)
      .maybeSingle();
    if (taken?.id) {
      return { ok: false, error: "That SitGuru email already belongs to another account." };
    }
  }

  const { data: existingRows } = await supabaseAdmin
    .from("ambassadors")
    .select("id,status,dashboard_enabled,login_enabled,referral_code,notes")
    .or(`user_id.eq.${profile.id},email.ilike.${email}`)
    .limit(5);
  const existing = ((existingRows || []) as Array<{
    id: string;
    status: string | null;
    dashboard_enabled: boolean | null;
    login_enabled: boolean | null;
    referral_code: string | null;
    notes: string | null;
  }>)[0];

  const now = new Date().toISOString();
  const name = clean(application.full_name) || clean(profile.full_name) || email;
  let ambassadorId = existing?.id || "";
  let alreadyApproved =
    application.status === "approved" &&
    existing?.status === "active" &&
    existing.dashboard_enabled === true &&
    existing.login_enabled === true;

  if (!existing) {
    const referralCode = await uniqueReferralCode(name);
    const { data: created, error: insertError } = await supabaseAdmin
      .from("ambassadors")
      .insert({
        user_id: profile.id,
        full_name: name,
        display_name: name,
        email: contacts.email,
        contact_email: contacts.contactEmail,
        login_email: contacts.loginEmail,
        phone: clean(application.phone) || null,
        city: clean(application.city) || null,
        state: clean(application.state) || null,
        zip_code: clean(application.zip_code) || null,
        ambassador_type: ambassadorTypeForApplication(application.ambassador_type || application.notes),
        tier: "bronze",
        points: 0,
        referral_code: referralCode,
        referral_link: `https://www.sitguru.com/signup?ref=${encodeURIComponent(referralCode)}`,
        status: "active",
        program: "Ambassador Program",
        source: application.source || "public_ambassador_application",
        notes: clean(application.notes) || null,
        dashboard_enabled: true,
        login_enabled: true,
        approved_by: actorUserId,
        approved_at: now,
        activated_at: now,
        is_bookable: false,
        is_public_visible: false,
      })
      .select("id")
      .single();
    if (insertError || !created?.id) {
      return { ok: false, error: insertError?.message || "The Ambassador record could not be created." };
    }
    ambassadorId = String(created.id);
    alreadyApproved = false;
  } else if (!alreadyApproved) {
    const patch: Record<string, string | boolean | null> = {
      user_id: profile.id,
      full_name: name,
      display_name: name,
      email: contacts.email,
      contact_email: contacts.contactEmail,
      login_email: contacts.loginEmail,
      status: "active",
      dashboard_enabled: true,
      login_enabled: true,
      approved_by: actorUserId,
      activated_at: now,
      archived_at: null,
      updated_at: now,
    };
    if (existing.status !== "active") patch.approved_at = now;
    const { error: updateError } = await supabaseAdmin
      .from("ambassadors")
      .update(patch)
      .eq("id", existing.id);
    if (updateError) return { ok: false, error: updateError.message };
    ambassadorId = existing.id;
  }

  await ensureRole(profile.id, "customer");
  await ensureRole(profile.id, "ambassador");
  const internLinked = await linkInternAccount(profile, contacts.workEmail);

  const emailedAlready = String(application.admin_notes || "").includes(APPROVAL_EMAIL_MARK);
  const { error: applicationError } = await supabaseAdmin
    .from("program_applications")
    .update({
      status: "approved",
      applicant_user_id: profile.id,
      approved_at: now,
      reviewed_by: actorUserId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", application.id);
  if (applicationError) return { ok: false, error: applicationError.message };

  let emailed = false;
  if (!emailedAlready) {
    try {
      const message = approvalEmail(name, contacts.email, contacts.workEmail);
      await sendSitGuruEmail({
        to: email,
        subject: "Your SitGuru Ambassador role is approved",
        html: message.html,
        text: message.text,
      });
      emailed = true;
      await supabaseAdmin
        .from("program_applications")
        .update({
          admin_notes: `${clean(application.admin_notes) ? `${clean(application.admin_notes)}\n` : ""}${APPROVAL_EMAIL_MARK}`,
        })
        .eq("id", application.id);
    } catch (error) {
      console.warn("Ambassador approval email failed:", error);
    }
  }

  revalidatePath("/admin/ambassadors");
  revalidatePath("/admin/internship");
  revalidatePath("/intern");
  revalidatePath("/ambassador/dashboard");

  return { ok: true, ambassadorId, alreadyApproved, emailed, internLinked };
}
