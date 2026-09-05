import { isSitGuruSuperUser } from "@/lib/sitguru/display";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";

export const FOUNDER_PERSONAL_MARKETPLACE_ROLES = [
  "parent",
  "guru",
  "ambassador",
] as const;

export function canUseAllRoleWorkspaces(email: string | null | undefined) {
  return isSitGuruSuperUser(email);
}

/** Pet Parent + Guru + Ambassador — HQ founders and Jason's personal marketplace login. */
export function canUseMarketplaceRoleWorkspaces(
  email: string | null | undefined,
) {
  return (
    isSitGuruSuperUser(email) || isFounderPersonalMarketplaceEmail(email)
  );
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
      (isDanette
        ? "Danette"
        : email.startsWith("jason@") || email.startsWith("jasongraff")
          ? "Jason Graff"
          : "SitGuru Founder"),
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
    training_percent: 100,
    onboarding_step: 1,
    onboarding_percent: 100,
  } as {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    login_email: string;
    contact_email: string;
    referral_code: string;
    dashboard_enabled: boolean;
    login_enabled: boolean;
    status: string;
    referral_status: string;
    onboarding_status: string;
    training_status: string;
    training_percent: number;
    onboarding_step: number;
    onboarding_percent: number;
    [key: string]: unknown;
  };
}
