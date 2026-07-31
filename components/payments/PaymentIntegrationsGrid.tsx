// components/payments/PaymentIntegrationsGrid.tsx
"use client";

import { useState } from "react";

type PaymentPartner = {
  name: string;
  label: string;
  logoSrc?: string;
  logoClassName: string;
  /** Custom inline mark when no local asset exists (e.g. Plaid). */
  useInlinePlaid?: boolean;
};

type PaymentIntegrationsGridProps = {
  heading: string;
  description: string;
  ariaLabel: string;
};

/** Plaid wordmark — Plus Jakarta Sans text so spelling stays exact: Plaid. */
function PlaidLogoMark({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center font-sans font-black tracking-[-0.04em] text-[#111111] ${className}`}
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      Plaid
    </span>
  );
}

/**
 * Local SVG assets served from /public/images/payments/
 * (referenced at runtime as /images/payments/*).
 * Plaid uses an inline wordmark because no asset file exists.
 */
const PAYMENT_PARTNERS: PaymentPartner[] = [
  {
    name: "stripe",
    label: "Stripe",
    logoSrc: "/images/payments/stripe.svg",
    logoClassName:
      "h-7 w-auto max-w-[88px] sm:h-8 sm:max-w-[96px] lg:h-9 lg:max-w-[104px]",
  },
  {
    name: "paypal",
    label: "PayPal",
    logoSrc: "/images/payments/paypal.svg",
    logoClassName:
      "h-9 w-auto max-w-[40px] sm:h-10 sm:max-w-[44px] lg:h-11 lg:max-w-[48px]",
  },
  {
    name: "applepay",
    label: "Apple Pay",
    logoSrc: "/images/payments/apple-pay.svg",
    logoClassName:
      "h-7 w-auto max-w-[78px] sm:h-8 sm:max-w-[86px] lg:h-9 lg:max-w-[94px]",
  },
  {
    name: "googlepay",
    label: "Google Pay",
    logoSrc: "/images/payments/google-pay.svg",
    logoClassName:
      "h-5 w-auto max-w-[92px] sm:h-6 sm:max-w-[104px] lg:h-7 lg:max-w-[112px]",
  },
  {
    name: "venmo",
    label: "Venmo",
    logoSrc: "/images/payments/venmo.svg",
    logoClassName:
      "h-9 w-auto max-w-[40px] sm:h-10 sm:max-w-[44px] lg:h-11 lg:max-w-[48px]",
  },
  {
    name: "plaid",
    label: "Plaid",
    logoClassName:
      "h-6 text-[1.05rem] leading-none sm:h-7 sm:text-[1.15rem] lg:h-8 lg:text-[1.25rem]",
    useInlinePlaid: true,
  },
];

function PartnerLogo({
  label,
  logoSrc,
  logoClassName,
  useInlinePlaid,
}: {
  label: string;
  logoSrc?: string;
  logoClassName: string;
  useInlinePlaid?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (useInlinePlaid) {
    return <PlaidLogoMark className={logoClassName} />;
  }

  if (!logoSrc || failed) {
    return (
      <span className="font-sans text-sm font-black tracking-tight text-slate-800">
        {label}
      </span>
    );
  }

  return (
    <img
      src={logoSrc}
      alt=""
      className={`block object-contain ${logoClassName}`}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default function PaymentIntegrationsGrid({
  heading,
  description,
  ariaLabel,
}: PaymentIntegrationsGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="mx-auto w-full max-w-5xl bg-transparent px-4 py-8 font-sans"
      style={{ fontFamily: "var(--font-sans), var(--sitguru-font-sans)" }}
    >
      <header className="mb-8 text-center sm:mb-10">
        <h2 className="font-sans text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-3xl">
          {heading}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl font-sans text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
          {description}
        </p>
      </header>

      {/* 2 cols mobile → 3 tablet/webapp → 6 desktop */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {PAYMENT_PARTNERS.map((partner, index) => (
          <div
            key={partner.name}
            title={partner.label}
            className={`flex min-h-[4.75rem] cursor-pointer items-center justify-center rounded-2xl border border-slate-200/80 bg-transparent px-3 py-4 transition-all duration-300 ease-out sm:min-h-[5.25rem] sm:rounded-[1.25rem] sm:px-4 ${
              hoveredIndex === index
                ? "-translate-y-1 scale-[1.03] border-emerald-300/90"
                : ""
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="sr-only">{partner.label}</span>
            <PartnerLogo
              label={partner.label}
              logoSrc={partner.logoSrc}
              logoClassName={partner.logoClassName}
              useInlinePlaid={partner.useInlinePlaid}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
