"use client";

/**
 * Mobile-first booking checkout drawer.
 * Personalized pet/guru header + PawPerks redemption + Express wallets.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import {
  calculateBookingTotal,
  formatUsd,
  type BookingPricingBreakdown,
  type BookingPricingOptions,
} from "@/lib/billing/pricingCalculator";
import {
  extractCheckoutBookingContext,
  type CheckoutBookingContext,
} from "@/lib/checkout/bookingContext";
import { clampRedeemablePoints } from "@/lib/pawperks/constants";
import { getStripeBrowser } from "@/lib/stripe/browser";
import CheckoutCostBreakdown from "@/components/checkout/CheckoutCostBreakdown";
import CheckoutPaymentForm from "@/components/checkout/CheckoutPaymentForm";
import CheckoutPawPerksCard from "@/components/checkout/CheckoutPawPerksCard";
import CheckoutSummaryHeader from "@/components/checkout/CheckoutSummaryHeader";

export type CheckoutDrawerProps = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  baseRate: number;
  daysCount: number;
  options?: Partial<BookingPricingOptions>;
  bookingContext?: Partial<CheckoutBookingContext>;
  returnUrl?: string;
  onPaymentSuccess?: (paymentIntentId: string) => void;
};

type CreateIntentResponse = {
  ok: boolean;
  error?: string;
  clientSecret?: string;
  paymentIntentId?: string;
  pricing?: BookingPricingBreakdown;
  bookingContext?: CheckoutBookingContext;
  pawperks?: {
    availablePoints?: number;
    pointsBalance?: number;
    pointsRedeemed?: number;
  };
};

const stripePromise = getStripeBrowser();

export default function CheckoutDrawer({
  open,
  onClose,
  bookingId,
  baseRate,
  daysCount,
  options,
  bookingContext: bookingContextProp,
  returnUrl,
  onPaymentSuccess,
}: CheckoutDrawerProps) {
  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemEnabled, setRedeemEnabled] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [serverPricing, setServerPricing] =
    useState<BookingPricingBreakdown | null>(null);
  const [context, setContext] = useState<CheckoutBookingContext>(() =>
    extractCheckoutBookingContext(null, { daysCount, ...bookingContextProp }),
  );
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [costExpanded, setCostExpanded] = useState(true);
  const [saveCard, setSaveCard] = useState(false);

  const debounceRef = useRef<number | null>(null);

  const pricingOptions: BookingPricingOptions = useMemo(
    () => ({
      additionalPets: Math.max(0, Math.floor(options?.additionalPets ?? 0)),
      holidaySurge: Boolean(options?.holidaySurge),
      ambassadorCode: options?.ambassadorCode,
      pawperksAvailablePoints: availablePoints,
      pawperksPointsToRedeem: redeemEnabled ? pointsToRedeem : 0,
    }),
    [
      options?.additionalPets,
      options?.holidaySurge,
      options?.ambassadorCode,
      availablePoints,
      redeemEnabled,
      pointsToRedeem,
    ],
  );

  const preview = useMemo(
    () => calculateBookingTotal(baseRate, daysCount, pricingOptions),
    [baseRate, daysCount, pricingOptions],
  );

  const maxRedeemable = useMemo(() => {
    const withoutPerks = calculateBookingTotal(baseRate, daysCount, {
      additionalPets: pricingOptions.additionalPets,
      holidaySurge: pricingOptions.holidaySurge,
      ambassadorCode: pricingOptions.ambassadorCode,
      pawperksAvailablePoints: availablePoints,
      pawperksPointsToRedeem: 0,
    });
    return clampRedeemablePoints({
      availablePoints,
      payableCentsBeforePerks: withoutPerks.amountCents,
    });
  }, [
    baseRate,
    daysCount,
    pricingOptions.additionalPets,
    pricingOptions.holidaySurge,
    pricingOptions.ambassadorCode,
    availablePoints,
  ]);

  const fallbackContext = useMemo(
    () =>
      extractCheckoutBookingContext(null, {
        daysCount,
        ...bookingContextProp,
      }),
    [bookingContextProp, daysCount],
  );

  const display = serverPricing || preview;
  const amountLabel = formatUsd(display.total);

  const createIntent = useCallback(
    async (nextSaveCard: boolean, nextPoints: number) => {
      setLoadingIntent(true);
      setError(null);

      try {
        const response = await fetch("/api/checkout/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            baseRate,
            daysCount,
            additionalPets: pricingOptions.additionalPets,
            holidaySurge: pricingOptions.holidaySurge,
            ambassadorCode: pricingOptions.ambassadorCode,
            saveCard: nextSaveCard,
            pawperksPointsToRedeem: nextPoints,
            petName: bookingContextProp?.petName,
            petPhotoUrl: bookingContextProp?.petPhotoUrl,
            guruName: bookingContextProp?.guruName,
            guruAvatarUrl: bookingContextProp?.guruAvatarUrl,
            startDate: bookingContextProp?.startDate,
            endDate: bookingContextProp?.endDate,
          }),
        });

        const data = (await response.json()) as CreateIntentResponse;
        if (!response.ok || !data.ok || !data.clientSecret) {
          throw new Error(data.error || "Unable to start checkout.");
        }

        setClientSecret(data.clientSecret);
        if (data.pricing) setServerPricing(data.pricing);
        if (data.bookingContext) setContext(data.bookingContext);
        if (typeof data.pawperks?.pointsBalance === "number") {
          // Balance after hold — for display of remaining vault, add back redeemed
          const redeemed = data.pawperks.pointsRedeemed || 0;
          setAvailablePoints((data.pawperks.pointsBalance || 0) + redeemed);
        } else if (typeof data.pawperks?.availablePoints === "number") {
          setAvailablePoints(data.pawperks.availablePoints);
        }
      } catch (err) {
        setClientSecret(null);
        setError(err instanceof Error ? err.message : "Checkout failed.");
      } finally {
        setLoadingIntent(false);
      }
    },
    [
      bookingId,
      baseRate,
      daysCount,
      pricingOptions.additionalPets,
      pricingOptions.holidaySurge,
      pricingOptions.ambassadorCode,
      bookingContextProp?.petName,
      bookingContextProp?.petPhotoUrl,
      bookingContextProp?.guruName,
      bookingContextProp?.guruAvatarUrl,
      bookingContextProp?.startDate,
      bookingContextProp?.endDate,
    ],
  );

  const scheduleIntentRefresh = useCallback(
    (nextSaveCard: boolean, nextPoints: number) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        void createIntent(nextSaveCard, nextPoints);
      }, 350);
    },
    [createIntent],
  );

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setServerPricing(null);
      setError(null);
      setLoadingIntent(false);
      setPaid(false);
      setCostExpanded(true);
      setSaveCard(false);
      setRedeemEnabled(false);
      setPointsToRedeem(0);
      setAvailablePoints(0);
      setContext(fallbackContext);
      return;
    }

    setContext(fallbackContext);

    // Load vault, then create PaymentIntent
    void (async () => {
      try {
        const res = await fetch("/api/parent/perks");
        const data = (await res.json()) as {
          ok?: boolean;
          balance?: { pointsBalance?: number };
        };
        if (res.ok && data.ok) {
          setAvailablePoints(Math.max(0, data.balance?.pointsBalance || 0));
        }
      } catch {
        // Non-fatal — checkout still works without perks
      }
      void createIntent(false, 0);
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- open-gated bootstrap

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSaveCardChange(value: boolean) {
    setSaveCard(value);
    void createIntent(value, redeemEnabled ? pointsToRedeem : 0);
  }

  function handleRedeemEnabled(value: boolean) {
    setRedeemEnabled(value);
    const nextPoints = value ? maxRedeemable : 0;
    setPointsToRedeem(nextPoints);
    scheduleIntentRefresh(saveCard, nextPoints);
  }

  function handlePointsChange(value: number) {
    const clamped = Math.min(maxRedeemable, Math.max(0, value));
    setPointsToRedeem(clamped);
    setRedeemEnabled(clamped > 0);
    scheduleIntentRefresh(saveCard, clamped);
  }

  if (!open) return null;

  const resolvedReturnUrl =
    returnUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/bookings/success?bookingId=${encodeURIComponent(bookingId)}`
      : "/bookings/success");

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-drawer-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="checkout-drawer-panel relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-emerald-100/80 bg-white shadow-[0_-18px_50px_rgba(6,78,59,0.22)] sm:max-w-lg sm:rounded-[1.75rem] sm:shadow-2xl">
        <CheckoutSummaryHeader context={context} onClose={onClose} />

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          {paid ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
              <p className="text-lg font-black text-emerald-900">
                {context.petName}&apos;s adventure is secured
              </p>
              <p className="mt-1 text-sm text-emerald-800/80">
                Guru {context.guruName} is locked in. Confirmation is on the way.
              </p>
            </div>
          ) : (
            <>
              <CheckoutPawPerksCard
                petName={context.petName}
                availablePoints={availablePoints}
                maxRedeemablePoints={maxRedeemable}
                pointsToRedeem={pointsToRedeem}
                enabled={redeemEnabled}
                onEnabledChange={handleRedeemEnabled}
                onPointsChange={handlePointsChange}
              />

              <CheckoutCostBreakdown
                pricing={display}
                expanded={costExpanded}
                onToggle={() => setCostExpanded((value) => !value)}
              />

              <div className="flex items-end justify-between gap-3 rounded-2xl bg-[#065f46] px-4 py-3.5 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100/90">
                    Total due today
                  </p>
                  <p className="text-2xl font-black tabular-nums">{amountLabel}</p>
                </div>
                {display.discountTotal > 0 ? (
                  <p className="text-right text-xs font-semibold text-emerald-100">
                    Saved {formatUsd(display.discountTotal)}
                  </p>
                ) : null}
              </div>

              {error ? (
                <p className="text-sm font-medium text-rose-700" role="alert">
                  {error}
                </p>
              ) : null}

              {loadingIntent && !clientSecret ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-6 text-center text-sm font-semibold text-emerald-800">
                  Preparing express wallets…
                </div>
              ) : null}

              {clientSecret ? (
                <Elements
                  key={`${clientSecret}:${saveCard ? "save" : "once"}`}
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#065f46",
                        colorBackground: "#ffffff",
                        colorText: "#0f172a",
                        colorDanger: "#be123c",
                        borderRadius: "12px",
                        fontFamily: "inherit",
                      },
                    },
                  }}
                >
                  <CheckoutPaymentForm
                    amountLabel={amountLabel}
                    returnUrl={resolvedReturnUrl}
                    clientSecret={clientSecret}
                    saveCard={saveCard}
                    onSaveCardChange={handleSaveCardChange}
                    onError={setError}
                    onSuccess={(paymentIntentId) => {
                      setPaid(true);
                      onPaymentSuccess?.(paymentIntentId);
                    }}
                  />
                </Elements>
              ) : null}
            </>
          )}
        </div>

        <footer className="border-t border-emerald-50 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-[11px] text-slate-400 sm:px-6">
          Wallets & cards are processed by Stripe. SitGuru never stores full card
          numbers.
        </footer>
      </div>

      <style jsx>{`
        .checkout-drawer-panel {
          animation: checkout-drawer-rise 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes checkout-drawer-rise {
          from {
            opacity: 0.4;
            transform: translateY(18%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (min-width: 640px) {
          .checkout-drawer-panel {
            animation-name: checkout-drawer-pop;
          }
          @keyframes checkout-drawer-pop {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        }
      `}</style>
    </div>
  );
}
