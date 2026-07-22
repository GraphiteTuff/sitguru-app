import type { ReactNode } from "react";

import {
  SITEWIDE_PAYMENT_AVAILABILITY_NOTE,
  SITEWIDE_PAYMENT_HEADING,
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

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

function PaymentMethodIcon({
  iconKey,
  label,
}: {
  iconKey: PaymentIconKey;
  label: string;
}) {
  const sharedClassName =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-black leading-none text-slate-800 shadow-sm";

  const icons: Record<PaymentIconKey, ReactNode> = {
    card: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 9h18" />
        <path d="M7 15h4" />
      </svg>
    ),
    apple: (
      <span aria-hidden="true" className="text-sm">
        ●
      </span>
    ),
    google: (
      <span aria-hidden="true" className="text-[12px]">
        G
      </span>
    ),
    paypal: (
      <span aria-hidden="true" className="text-[12px]">
        P
      </span>
    ),
    venmo: (
      <span aria-hidden="true" className="text-[12px]">
        V
      </span>
    ),
    pay_later: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </svg>
    ),
    link: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M10.5 13.5l3-3" />
        <path d="M8.25 16.75l-1 .95a4 4 0 01-5.65-5.65l3.2-3.2a4 4 0 015.65 0" />
        <path d="M15.75 7.25l1-.95a4 4 0 015.65 5.65l-3.2 3.2a4 4 0 01-5.65 0" />
      </svg>
    ),
    cash_app: (
      <span aria-hidden="true" className="text-[13px]">
        $
      </span>
    ),
    bank: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
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
    ),
    stripe: (
      <span aria-hidden="true" className="text-[11px]">
        S
      </span>
    ),
  };

  return (
    <span className={sharedClassName} title={label}>
      {icons[iconKey]}
      <span className="sr-only">{label}</span>
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
        "inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm",
        "transition hover:border-emerald-200 hover:bg-emerald-50/60",
        variant === "default" && "px-3 py-2",
        variant === "compact" && "px-2.5 py-1.5",
        variant === "minimal" && "border-transparent bg-transparent px-1 py-1 shadow-none",
      )}
    >
      <PaymentMethodIcon iconKey={method.iconKey} label={method.label} />

      <span
        className={joinClassNames(
          "truncate font-black",
          variant === "default" && "text-xs sm:text-sm",
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
  heading = SITEWIDE_PAYMENT_HEADING,
  description,
  showHeading = true,
  showAvailabilityNote = true,
  className,
  ariaLabel = "Available SitGuru payment methods",
}: PaymentMethodStripProps) {
  const methods = getCustomerPaymentMethodsForPlacement(placement);

  if (!methods.length) return null;

  return (
    <section
      aria-label={ariaLabel}
      className={joinClassNames(
        "w-full",
        variant === "default" &&
          "rounded-[24px] border border-emerald-100 bg-white/95 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5",
        variant === "compact" &&
          "rounded-2xl border border-slate-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-4",
        variant === "minimal" && "bg-transparent",
        className,
      )}
    >
      {showHeading ? (
        <div
          className={joinClassNames(
            variant === "default" && "mb-4",
            variant === "compact" && "mb-3",
            variant === "minimal" && "mb-2",
          )}
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={joinClassNames(
                "flex shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800",
                variant === "default" && "h-9 w-9 text-base",
                variant !== "default" && "h-8 w-8 text-sm",
              )}
            >
              ✓
            </span>

            <div className="min-w-0">
              <h2
                className={joinClassNames(
                  "font-black leading-tight tracking-[-0.025em] text-slate-950",
                  variant === "default" && "text-base sm:text-lg",
                  variant !== "default" && "text-sm sm:text-base",
                )}
              >
                {heading}
              </h2>

              {description ? (
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ul
        role="list"
        className={joinClassNames(
          "flex flex-wrap items-center",
          variant === "default" && "gap-2.5",
          variant === "compact" && "gap-2",
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

      {showAvailabilityNote ? (
        <p
          className={joinClassNames(
            "font-semibold leading-5 text-slate-500",
            variant === "default" && "mt-4 text-[11px] sm:text-xs",
            variant === "compact" && "mt-3 text-[10px] sm:text-[11px]",
            variant === "minimal" && "mt-2 text-[10px] sm:text-[11px]",
          )}
        >
          {SITEWIDE_PAYMENT_AVAILABILITY_NOTE}
        </p>
      ) : null}
    </section>
  );
}