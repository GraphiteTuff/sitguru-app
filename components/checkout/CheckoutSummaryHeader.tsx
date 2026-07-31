"use client";

/**
 * Circular pet badge + progress timeline for checkout personalization.
 */

import {
  checkoutHeadline,
  type CheckoutBookingContext,
} from "@/lib/checkout/bookingContext";

type CheckoutSummaryHeaderProps = {
  context: CheckoutBookingContext;
  onClose: () => void;
};

function AvatarBadge({
  src,
  alt,
  fallback,
  size = "lg",
}: {
  src: string | null;
  alt: string;
  fallback: string;
  size?: "lg" | "sm";
}) {
  const sizeClass = size === "sm" ? "h-7 w-7 border-2 text-xs" : "h-14 w-14 border-[3px] text-lg";
  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full border-emerald-300 bg-emerald-50 shadow-md",
        sizeClass,
      ].join(" ")}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-black text-emerald-800">
          {fallback.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function CheckoutSummaryHeader({
  context,
  onClose,
}: CheckoutSummaryHeaderProps) {
  const headline = checkoutHeadline(context);
  const dateLabel =
    context.startDate && context.endDate && context.startDate !== context.endDate
      ? `${context.startDate} → ${context.endDate}`
      : context.startDate || "Schedule confirmed at booking";

  return (
    <header className="relative border-b border-emerald-50 bg-gradient-to-br from-[#ecfdf5] via-white to-[#f0fdfa] px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
      <div className="flex justify-center pt-0 sm:hidden">
        <span className="mb-3 h-1.5 w-12 rounded-full bg-emerald-200" aria-hidden />
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/90 p-2 text-slate-500 shadow-sm transition hover:text-slate-800 sm:right-5 sm:top-5"
        aria-label="Close checkout"
      >
        <span className="block text-sm leading-none">✕</span>
      </button>

      <div className="flex items-start gap-3 pr-10">
        <AvatarBadge
          src={context.petPhotoUrl}
          alt={context.petName}
          fallback={context.petName}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            SitGuru Checkout
          </p>
          <h2
            id="checkout-drawer-title"
            className="mt-1 text-lg font-black leading-snug tracking-tight text-slate-900 sm:text-xl"
          >
            {headline}
          </h2>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100/90 bg-white/90 p-3 shadow-sm shadow-emerald-900/5">
        <ol className="grid grid-cols-3 gap-2">
          <li className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">
              Date
            </p>
            <p className="mt-1 text-xs font-semibold leading-tight text-slate-800">
              {dateLabel}
            </p>
          </li>
          <li className="border-x border-emerald-50 px-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">
              Duration
            </p>
            <p className="mt-1 text-xs font-semibold leading-tight text-slate-800">
              {context.durationLabel}
            </p>
          </li>
          <li className="flex flex-col items-center text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">
              Handler
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <AvatarBadge
                src={context.guruAvatarUrl}
                alt={context.guruName}
                fallback={context.guruName}
                size="sm"
              />
              <p className="max-w-[4.5rem] truncate text-xs font-semibold text-slate-800">
                {context.guruName}
              </p>
            </div>
          </li>
        </ol>

        <div className="mt-3 flex items-center gap-1.5 px-1">
          <span className="h-1.5 flex-1 rounded-full bg-emerald-600" />
          <span className="h-1.5 flex-1 rounded-full bg-emerald-600" />
          <span className="h-1.5 flex-1 rounded-full bg-emerald-200" />
          <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Pay
          </span>
        </div>
      </div>
    </header>
  );
}
