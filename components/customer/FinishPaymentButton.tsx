"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FinishPaymentButtonProps = {
  bookingId: string;
  className?: string;
  label?: string;
};

const UNPAID_STATUSES = new Set([
  "unpaid",
  "checkout_started",
  "pending",
  "pending_payment",
]);

export function isUnpaidBookingPayment(paymentStatus: string | null | undefined) {
  return UNPAID_STATUSES.has(String(paymentStatus || "").trim().toLowerCase());
}

export default function FinishPaymentButton({
  bookingId,
  className = "",
  label = "Finish payment",
}: FinishPaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function resumeCheckout() {
    if (!bookingId || loading) return;
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/bookings/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          bookingId,
          payment_method: "card",
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        checkoutUrl?: string;
        url?: string;
        error?: string;
      } | null;

      const checkoutUrl = payload?.checkoutUrl || payload?.url;
      if (!response.ok || !checkoutUrl) {
        throw new Error(
          payload?.error || "Unable to reopen secure checkout. Please try again.",
        );
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout resume failed.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => void resumeCheckout()}
        disabled={loading}
        className={
          className ||
          "inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-base font-black text-white transition hover:bg-[#09462c] disabled:opacity-60"
        }
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Opening checkout…
          </>
        ) : (
          label
        )}
      </button>
      {error ? (
        <p className="mt-2 text-sm font-bold text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
