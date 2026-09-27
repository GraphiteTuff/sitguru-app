/**
 * Shared Guru Stripe Connect account create / resume helpers.
 *
 * SitGuru charges Pet Parents on the platform and later transfers to Gurus
 * (separate charges and transfers). New Guru accounts should request
 * `transfers` only — requesting `card_payments` adds website / statement
 * descriptor / heavier KYC requirements that leave abandoned Apple signups
 * in Restricted status.
 */

import type Stripe from "stripe";

import { resolveCanonicalContactEmail } from "@/lib/auth/contact-email";
import { getStripeServer } from "@/lib/stripe/server";

const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.sitguru.com"
)
  .trim()
  .replace(/\/+$/, "");

const STATEMENT_DESCRIPTOR = "SITGURU";

export type GuruConnectProfile = {
  id: string;
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  slug?: string | null;
  stripe_account_id?: string | null;
};

export function isApplePrivateRelayEmail(email: string | null | undefined) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  return normalized.endsWith("@privaterelay.appleid.com");
}

export function resolveGuruPublicProfileUrl(guru: GuruConnectProfile) {
  const slug = String(guru.slug || "")
    .trim()
    .replace(/^\/+/, "");
  if (slug) return `${SITE_ORIGIN}/guru/${encodeURIComponent(slug)}`;
  return `${SITE_ORIGIN}/become-a-guru`;
}

export function resolveGuruDisplayName(guru: GuruConnectProfile) {
  return (
    [guru.full_name, guru.display_name, guru.name]
      .map((value) => String(value || "").trim())
      .find(Boolean) || ""
  );
}

function splitName(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function buildGuruExpressAccountParams({
  guru,
  authEmail,
  metadataEmail,
}: {
  guru: GuruConnectProfile;
  authEmail?: string | null;
  metadataEmail?: string | null;
}): Stripe.AccountCreateParams {
  const email = resolveCanonicalContactEmail({
    profileEmail: guru.email,
    authEmail,
    metadataEmail,
  });
  const displayName = resolveGuruDisplayName(guru);
  const { firstName, lastName } = splitName(displayName);
  const profileUrl = resolveGuruPublicProfileUrl(guru);

  const params: Stripe.AccountCreateParams = {
    type: "express",
    country: "US",
    business_type: "individual",
    // Transfers only — matches separate charges + admin transfer architecture.
    capabilities: {
      transfers: { requested: true },
    },
    business_profile: {
      url: profileUrl,
      product_description:
        "Pet care services (dog walking, sitting, and related care) booked through SitGuru.",
      mcc: "7299",
      ...(displayName ? { name: displayName.slice(0, 100) } : {}),
    },
    settings: {
      payments: {
        statement_descriptor: STATEMENT_DESCRIPTOR,
      },
      payouts: {
        schedule: {
          interval: "manual",
        },
      },
    },
    metadata: {
      guru_id: String(guru.id),
      user_id: String(guru.user_id),
      role: "guru",
      source: "sitguru_guru_payout_setup",
      apple_private_relay: isApplePrivateRelayEmail(email) ? "1" : "0",
      ...(email ? { email } : {}),
    },
  };

  if (email) {
    params.email = email;
  }

  if (firstName || lastName) {
    params.individual = {
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(email ? { email } : {}),
    };
  }

  return params;
}

/**
 * Prefill fields that Stripe marks past-due when Gurus abandon onboarding.
 * Safe for existing Restricted Express accounts (website + descriptor).
 */
export async function prefillGuruConnectedAccount({
  stripeAccountId,
  guru,
  authEmail,
}: {
  stripeAccountId: string;
  guru: GuruConnectProfile;
  authEmail?: string | null;
}) {
  const stripe = getStripeServer();
  const email = resolveCanonicalContactEmail({
    profileEmail: guru.email,
    authEmail,
  });
  const displayName = resolveGuruDisplayName(guru);
  const profileUrl = resolveGuruPublicProfileUrl(guru);

  try {
    await stripe.accounts.update(stripeAccountId, {
      business_profile: {
        url: profileUrl,
        product_description:
          "Pet care services (dog walking, sitting, and related care) booked through SitGuru.",
        mcc: "7299",
        ...(displayName ? { name: displayName.slice(0, 100) } : {}),
      },
      settings: {
        payments: {
          statement_descriptor: STATEMENT_DESCRIPTOR,
        },
      },
      metadata: {
        guru_id: String(guru.id),
        user_id: String(guru.user_id),
        role: "guru",
        apple_private_relay: isApplePrivateRelayEmail(email) ? "1" : "0",
        ...(email ? { email } : {}),
      },
    });
  } catch (error) {
    // Prefill is best-effort — Account Link still collects remaining fields.
    console.warn("Stripe Connect prefill update skipped:", error);
  }
}

export async function createGuruAccountLink({
  stripeAccountId,
  refreshUrl,
  returnUrl,
}: {
  stripeAccountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  const stripe = getStripeServer();

  // Incremental collection reduces abandoned-onboarding overload while still
  // satisfying currently due requirements that cause Restricted status.
  return stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
    collection_options: {
      fields: "currently_due",
    },
  });
}

export function guruConnectUserMessage(input: {
  complete: boolean;
  restricted: boolean;
  appleRelay?: boolean;
}) {
  if (input.complete) {
    return "Your payout setup is ready.";
  }

  if (input.restricted) {
    return input.appleRelay
      ? "Finish your quick secure payout setup to continue. If you used Apple Hide My Email, you can still complete setup — Stripe will walk you through the remaining steps."
      : "Finish your quick secure payout setup to continue. SitGuru will update automatically when you’re done.";
  }

  return "Continue your quick secure payout setup when you’re ready to accept paid bookings.";
}
