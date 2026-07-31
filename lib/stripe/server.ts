/**
 * Lazy Stripe Node SDK singleton for server routes.
 */

import Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-03-25.dahlia" as const;

let stripeClient: Stripe | null = null;

export function getStripeServer(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  return stripeClient;
}
