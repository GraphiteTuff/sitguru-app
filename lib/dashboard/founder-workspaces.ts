import { isSitGuruSuperUser } from "@/lib/sitguru/display";

export function canUseAllRoleWorkspaces(email: string | null | undefined) {
  return isSitGuruSuperUser(email);
}

export function getFounderAmbassadorPreview(input: {
  userId: string;
  email?: string | null;
  name?: string | null;
}) {
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const isDanette = email.startsWith("nette@");

  return {
    id: input.userId,
    user_id: input.userId,
    full_name:
      input.name ||
      (isDanette ? "Danette" : email.startsWith("jason@") ? "Jason" : "SitGuru Founder"),
    email,
    login_email: email,
    contact_email: email,
    referral_code: isDanette ? "DANETTE" : "JASON",
    dashboard_enabled: true,
    login_enabled: true,
    status: "active",
    referral_status: "active",
    onboarding_status: "complete",
    training_status: "complete",
  };
}
