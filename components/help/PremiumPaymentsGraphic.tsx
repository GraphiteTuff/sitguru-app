import {
  PREMIUM_PAYMENTS_CUSTOMER_SENTENCE,
  PREMIUM_PAYMENTS_STACK_SENTENCE,
} from "@/lib/help/premium-payments";

export default function PremiumPaymentsGraphic({
  src,
}: {
  src: string;
}) {
  return (
    <figure className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="SitGuru premium payments: Stripe, PayPal, Apple Pay, Google Pay, Venmo, and Plaid, with Trust & Safety built into every booking"
        className="w-full"
      />
      <figcaption className="space-y-2 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
        <p>{PREMIUM_PAYMENTS_CUSTOMER_SENTENCE}</p>
        <p>{PREMIUM_PAYMENTS_STACK_SENTENCE}</p>
      </figcaption>
    </figure>
  );
}
