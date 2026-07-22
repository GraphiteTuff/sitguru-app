"use client";

import { useState, type ReactNode } from "react";

import {
  getCustomerPaymentMethodsForPlacement,
  type CustomerPaymentMethod,
  type PaymentIconKey,
  type PaymentPlacement,
} from "@/lib/payments/payment-methods";

export type PaymentMethodStripVariant = "default" | "compact" | "minimal";

export type PaymentMethodStripProps = {
  placement?: PaymentPlacement;
  variant?: PaymentMethodStripVariant;
  heading?: string;
  description?: string;
  showHeading?: boolean;
  showAvailabilityNote?: boolean;
  className?: string;
  ariaLabel?: string;
};

const DEFAULT_HEADING = "Pay your way";

const DEFAULT_DESCRIPTION =
  "Paying for your booking is simple. Choose the secure payment option that works best for you.";

const DEFAULT_AVAILABILITY_NOTE =
  "You’ll see the payment options available for your booking at checkout.";

const PAYMENT_LOGO_PATHS: Partial<Record<PaymentIconKey, string>> = {
  apple: "/images/payments/apple-pay.svg",
  google: "/images/payments/google-pay.svg",
  paypal: "/images/payments/paypal.svg",
  venmo: "/images/payments/venmo.svg",
  pay_later: "/images/payments/paypal-pay-later.svg",
  link: "/images/payments/link-by-stripe.svg",
  cash_app: "/images/payments/cash-app-pay.svg",
  stripe: "/images/payments/stripe.svg",
};

const PAYMENT_LOGO_CLASSES: Partial<Record<PaymentIconKey, string>> = {
  apple: "h-[18px] w-auto max-w-[54px]",
  google: "h-[18px] w-auto max-w-[60px]",
  paypal: "h-[18px] w-auto max-w-[56px]",
  venmo: "h-[18px] w-auto max-w-[52px]",
  pay_later: "h-[18px] w-auto max-w-[66px]",
  link: "h-[18px] w-auto max-w-[48px]",
  cash_app: "h-[18px] w-auto max-w-[60px]",
  stripe: "h-[18px] w-auto max-w-[52px]",
};

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

function GenericIcon({
  iconKey,
}: {
  iconKey: PaymentIconKey;
}): ReactNode {
  if (iconKey === "card") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 9h18" />
        <path d="M7 15h4" />
      </svg>
    );
  }

  if (iconKey === "bank") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 10h16" />
        <path d="M6 10v7" />
        <path d="M10 10v7" />
        <path d="M14 10v7" />
        <path d="M18 10v7" />
        <path d="M3 19h18" />
        <path d="M12 4l9 4H3l9-4z" />
      </svg>
    );
  }

  if (iconKey === "link") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M10.5 13.5l3-3" />
        <path d="M8.25 16.75l-1 .95a4 4 0 01-5.65-5.65l3.2-3.2a4 4 0 015.65 0" />
        <path d="M15.75 7.25l1-.95a4 4 0 015.65 5.65l-3.2 3.2a4 4 0 01-5.65 0" />
      </svg>
    );
  }

  if (iconKey === "pay_later") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    );
  }

  if (iconKey === "cash_app") {
    return (
      <span aria-hidden="true" className="text-base font-black">
        $
      </span>
    );
  }

  const fallbackLetters: Partial<Record<PaymentIconKey, string>> = {
    apple: "A",
    google: "G",
    paypal: "P",
    venmo: "V",
    stripe: "S",
  };

  return (
    <span aria-hidden="true" className="text-xs font-black">
      {fallbackLetters[iconKey] || "✓"}
    </span>
  );
}

function PaymentMethodIcon({
  iconKey,
  label,
}: {
  iconKey: PaymentIconKey;
  label: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoPath = PAYMENT_LOGO_PATHS[iconKey];

  if (logoPath && !logoFailed) {
    return (
      <span
        aria-hidden="true"
        className="flex h-7 min-w-8 shrink-0 items-center justify-center"
      >
        <img
          src={logoPath}
          alt=""
          className={joinClassNames(
            "block object-contain",
            PAYMENT_LOGO_CLASSES[iconKey] || "h-[18px] w-auto max-w-[52px]",
          )}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm"
    >
      <GenericIcon iconKey={iconKey} />
    </span>
  );
}

function PaymentMethodPill({
  method,
  variant,
}: {
  method: CustomerPaymentMethod;
  variant: PaymentMethodStripVariant;
}) {
  return (
    <li
      title={`${method.description} ${method.availabilityNote}`}
      className={joinClassNames(
        "inline-flex min-h-10 shrink-0 snap-start items-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm",
        "select-none touch-manipulation transition active:scale-[0.98] sm:shrink sm:snap-none sm:hover:border-emerald-200 sm:hover:bg-emerald-50/60",
        variant === "default" && "gap-2 px-3 py-1.5",
        variant === "compact" && "gap-1.5 px-2.5 py-1.5",
        variant === "minimal" &&
          "gap-1.5 border-transparent bg-transparent px-1 py-1 shadow-none",
      )}
    >
      <PaymentMethodIcon iconKey={method.iconKey} label={method.label} />

      <span
        className={joinClassNames(
          "whitespace-nowrap font-black",
          variant === "default" && "text-xs sm:text-[13px]",
          variant === "compact" && "text-[11px] sm:text-xs",
          variant === "minimal" && "text-[11px] sm:text-xs",
        )}
      >
        {method.shortLabel}
      </span>
    </li>
  );
}

export default function PaymentMethodStrip({
  placement = "homepage",
  variant = "default",
  heading = DEFAULT_HEADING,
  description = DEFAULT_DESCRIPTION,
  showHeading = true,
  showAvailabilityNote = true,
  className,
  ariaLabel = "Secure payment options available for your booking",
}: PaymentMethodStripProps) {
  const methods = getCustomerPaymentMethodsForPlacement(placement);

  const resolvedHeading =
    heading === "Flexible ways to pay" ? DEFAULT_HEADING : heading;

  const resolvedDescription =
    description ===
    "Pet Parents can choose from multiple secure payment options available for their booking."
      ? DEFAULT_DESCRIPTION
      : description;

  if (!methods.length) return null;

  return (
    <section
      aria-label={ariaLabel}
      className={joinClassNames(
        "w-full min-w-0 overflow-hidden",
        variant === "default" &&
          "rounded-[20px] border border-emerald-100 bg-white/95 px-3 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)] backdrop-blur sm:rounded-[22px] sm:px-5 sm:py-4",
        variant === "compact" &&
          "rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-4",
        variant === "minimal" && "bg-transparent",
        className,
      )}
    >
      {showHeading ? (
        <div
          className={joinClassNames(
            variant === "default" && "mb-2.5 sm:mb-3",
            variant === "compact" && "mb-2.5",
            variant === "minimal" && "mb-2",
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={joinClassNames(
                "mt-0.5 flex shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-800",
                variant === "default" && "h-8 w-8 text-sm",
                variant !== "default" && "h-7 w-7 text-xs",
              )}
            >
              ✓
            </span>

            <div className="min-w-0 flex-1">
              <h2
                className={joinClassNames(
                  "!m-0 font-black !leading-tight tracking-[-0.03em] text-slate-950",
                  variant === "default" && "!text-lg sm:!text-2xl",
                  variant !== "default" && "!text-base sm:!text-lg",
                )}
              >
                {resolvedHeading}
              </h2>

              {resolvedDescription ? (
                <p
                  className={joinClassNames(
                    "!mb-0 mt-1 max-w-3xl font-semibold text-slate-600",
                    variant === "default" &&
                      "text-[12px] leading-5 sm:text-sm sm:leading-6",
                    variant !== "default" &&
                      "text-[11px] leading-4 sm:text-xs sm:leading-5",
                  )}
                >
                  {resolvedDescription}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative min-w-0">
        <ul
          role="list"
          aria-label="Swipe to view your available payment options"
          className={joinClassNames(
            "sitguru-payment-scrollbar flex min-w-0 snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain pb-1",
            "[-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:pb-0",
            variant === "default" && "gap-2",
            variant === "compact" && "gap-1.5",
            variant === "minimal" && "gap-x-3 gap-y-1.5",
          )}
        >
          {methods.map((method) => (
            <PaymentMethodPill
              key={method.id}
              method={method}
              variant={variant}
            />
          ))}
        </ul>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/85 to-transparent sm:hidden"
        />
      </div>

      {methods.length > 4 ? (
        <p className="!mb-0 mt-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 sm:hidden">
          Swipe to see more payment options
        </p>
      ) : null}

      {showAvailabilityNote ? (
        <p
          className={joinClassNames(
            "!mb-0 font-semibold leading-5 text-slate-500",
            variant === "default" && "mt-2 text-[11px] sm:text-xs",
            variant === "compact" && "mt-2 text-[10px] sm:text-[11px]",
            variant === "minimal" && "mt-2 text-[10px] sm:text-[11px]",
          )}
        >
          {DEFAULT_AVAILABILITY_NOTE}
        </p>
      ) : null}

      <style>{`
        .sitguru-payment-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sitguru-payment-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .sitguru-payment-scrollbar {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </section>
  );
}