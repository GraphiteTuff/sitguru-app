"use client";

import Link from "next/link";
import FinishPaymentButton from "@/components/customer/FinishPaymentButton";

type CustomerStickyCtaProps = {
  unpaidBookingId?: string | null;
  setupHref?: string | null;
  setupLabel?: string | null;
  findCareHref?: string;
};

/**
 * Thumb-zone primary action for mobile web Pet Parents.
 * Priority: unpaid checkout → next setup step → Find Care.
 */
export default function CustomerStickyCta({
  unpaidBookingId,
  setupHref,
  setupLabel,
  findCareHref = "/search",
}: CustomerStickyCtaProps) {
  if (unpaidBookingId) {
    return (
      <div className="pointer-events-auto fixed inset-x-3 bottom-[5.35rem] z-[55] md:bottom-6 md:left-auto md:right-6 md:w-[min(420px,calc(100vw-3rem))]">
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50/95 p-3 shadow-[0_16px_50px_rgba(15,23,42,0.18)] backdrop-blur">
          <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.14em] text-amber-800">
            Payment needed
          </p>
          <FinishPaymentButton
            bookingId={unpaidBookingId}
            label="Finish payment to confirm care"
          />
        </div>
      </div>
    );
  }

  if (setupHref && setupLabel) {
    return (
      <div className="pointer-events-auto fixed inset-x-3 bottom-[5.35rem] z-[55] md:bottom-6 md:left-auto md:right-6 md:w-[min(420px,calc(100vw-3rem))]">
        <Link
          href={setupHref}
          className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[1.4rem] bg-[#0D5C3A] px-5 text-base font-black text-white shadow-[0_16px_50px_rgba(13,92,58,0.28)] transition hover:bg-[#09462c]"
        >
          {setupLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-[5.35rem] z-[55] md:hidden">
      <Link
        href={findCareHref}
        className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[1.4rem] bg-[#0D5C3A] px-5 text-base font-black text-white shadow-[0_16px_50px_rgba(13,92,58,0.28)] transition hover:bg-[#09462c]"
      >
        Find Care near you
      </Link>
    </div>
  );
}
