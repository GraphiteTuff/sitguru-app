import type Stripe from "stripe";
import { normalizeUsState } from "@/lib/gurus/guru-chat-snapshot";

/** Stripe Tax: General - Services. Used for pet care and the SitGuru fee. */
export const STRIPE_TAX_CODE_PET_SERVICES = "txcd_20030000";

/** Stripe Tax: Optional Gratuity. Voluntary tips stay nontaxable. */
export const STRIPE_TAX_CODE_OPTIONAL_GRATUITY = "txcd_90020001";

export type StripeTaxAddress = {
  line1: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
};

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildStripeServiceTaxAddress(input: {
  line1?: unknown;
  city?: unknown;
  state?: unknown;
  postalCode?: unknown;
  country?: unknown;
}): StripeTaxAddress | null {
  const state = normalizeUsState(asTrimmed(input.state));
  const postalCode = asTrimmed(input.postalCode);
  const city = asTrimmed(input.city);

  if (!state && !postalCode) return null;

  return {
    line1: asTrimmed(input.line1) || "Service location",
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(postalCode ? { postal_code: postalCode } : {}),
    country: (asTrimmed(input.country) || "US").toUpperCase().slice(0, 2),
  };
}

export function stripeCheckoutTaxCollectionParams(options?: {
  customerId?: string;
}): Pick<
  Stripe.Checkout.SessionCreateParams,
  | "automatic_tax"
  | "billing_address_collection"
  | "shipping_address_collection"
  | "customer_update"
> {
  return {
    automatic_tax: { enabled: true },
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    ...(options?.customerId
      ? {
          customer_update: {
            address: "auto",
            name: "auto",
            shipping: "auto",
          },
        }
      : {}),
  };
}

export async function createStripeTaxCustomer(params: {
  stripe: Stripe;
  email?: string | null;
  name?: string | null;
  address: StripeTaxAddress;
}): Promise<string> {
  const displayName = asTrimmed(params.name) || "Pet parent";
  const customer = await params.stripe.customers.create({
    email: asTrimmed(params.email) || undefined,
    name: displayName,
    address: params.address,
    shipping: {
      name: displayName,
      address: params.address,
    },
    metadata: {
      sitguru_tax_source: "booking_care_address",
    },
  });

  return customer.id;
}

export function getCheckoutSessionTaxAddress(
  session: Stripe.Checkout.Session,
): StripeTaxAddress | null {
  const collected = session.collected_information?.shipping_details?.address;
  const legacyShipping = (
    session as Stripe.Checkout.Session & {
      shipping_details?: { address?: Stripe.Address | null } | null;
    }
  ).shipping_details?.address;
  const customer = session.customer_details?.address;
  const source = collected || legacyShipping || customer;

  if (!source) return null;

  return buildStripeServiceTaxAddress({
    line1: source.line1,
    city: source.city,
    state: source.state,
    postalCode: source.postal_code,
    country: source.country,
  });
}
