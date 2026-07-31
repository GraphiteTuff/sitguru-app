"use client";

/**
 * Express wallet checkout (Apple Pay / Google Pay / Link) + frictionless card fallback.
 */

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  StripeCardNumberElementChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import CardBrandIcons, {
  normalizeCardBrand,
} from "@/components/checkout/CardBrandIcons";

const ZIP_STORAGE_KEY = "sitguru_checkout_zip";

const stripeFieldStyle = {
  base: {
    color: "#0f172a",
    fontFamily: "inherit",
    fontSize: "16px",
    fontWeight: "600",
    "::placeholder": { color: "#94a3b8" },
  },
  invalid: { color: "#be123c" },
};

type CheckoutPaymentFormProps = {
  amountLabel: string;
  returnUrl: string;
  clientSecret: string;
  saveCard: boolean;
  onSaveCardChange: (value: boolean) => void;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (message: string) => void;
};

function isValidUsZip(value: string) {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

export default function CheckoutPaymentForm({
  amountLabel,
  returnUrl,
  clientSecret,
  saveCard,
  onSaveCardChange,
  onSuccess,
  onError,
}: CheckoutPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [expressMounted, setExpressMounted] = useState(false);
  const [cardBrand, setCardBrand] = useState(normalizeCardBrand(undefined));
  const [postalCode, setPostalCode] = useState("");
  const [postalTouched, setPostalTouched] = useState(false);
  const [cardComplete, setCardComplete] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });

  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(ZIP_STORAGE_KEY) || "";
      if (remembered) setPostalCode(remembered);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (walletAvailable) return;
    const timer = window.setTimeout(() => {
      elements?.getElement(CardNumberElement)?.focus();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [elements, walletAvailable, clientSecret]);

  const postalValid = useMemo(() => isValidUsZip(postalCode), [postalCode]);
  const cardReady =
    cardComplete.number &&
    cardComplete.expiry &&
    cardComplete.cvc &&
    postalValid;

  function rememberZip() {
    try {
      if (postalValid) {
        window.localStorage.setItem(ZIP_STORAGE_KEY, postalCode.trim());
      }
    } catch {
      // ignore
    }
  }

  async function handleExpressConfirm(
    _event: StripeExpressCheckoutElementConfirmEvent,
  ) {
    if (!stripe || !elements) return;

    setSubmitting(true);
    setMessage(null);

    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (result.error) {
      const text =
        result.error.message || "Wallet payment could not be completed.";
      setMessage(text);
      onError?.(text);
      setSubmitting(false);
      return;
    }

    const intent = result.paymentIntent;
    if (intent?.status === "succeeded" || intent?.status === "processing") {
      onSuccess?.(intent.id);
    } else {
      const text =
        "Payment is still processing. Check your email for confirmation.";
      setMessage(text);
      onError?.(text);
    }
    setSubmitting(false);
  }

  async function handleCardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    if (!postalValid) {
      setPostalTouched(true);
      const text = "Enter a valid ZIP code (12345 or 12345-6789).";
      setMessage(text);
      onError?.(text);
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      const text = "Card form is still loading.";
      setMessage(text);
      onError?.(text);
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: {
          address: {
            postal_code: postalCode.trim(),
            country: "US",
          },
        },
      },
    });

    if (result.error) {
      const text =
        result.error.message || "Payment could not be completed. Try again.";
      setMessage(text);
      onError?.(text);
      setSubmitting(false);
      return;
    }

    const intent = result.paymentIntent;
    if (intent?.status === "succeeded" || intent?.status === "processing") {
      rememberZip();
      onSuccess?.(intent.id);
      setSubmitting(false);
      return;
    }

    setMessage("Payment is still processing. Check your email for confirmation.");
    setSubmitting(false);
  }

  function onCardNumberChange(event: StripeCardNumberElementChangeEvent) {
    setCardBrand(normalizeCardBrand(event.brand));
    setCardComplete((prev) => ({ ...prev, number: event.complete }));
  }

  function onExpressReady(event: StripeExpressCheckoutElementReadyEvent) {
    setExpressMounted(true);
    const methods = event.availablePaymentMethods;
    setWalletAvailable(
      Boolean(
        methods &&
          (methods.applePay ||
            methods.googlePay ||
            methods.link ||
            methods.paypal ||
            methods.amazonPay),
      ),
    );
  }

  return (
    <div className="space-y-4">
      {/* Always mounted so Stripe can probe Apple Pay / Google Pay / Link */}
      <div className={walletAvailable ? "space-y-4" : "pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"}>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Express one-tap wallet
          </p>
          <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm">
            <ExpressCheckoutElement
              options={{
                buttonHeight: 48,
                buttonTheme: {
                  applePay: "black",
                  googlePay: "black",
                },
                layout: {
                  maxColumns: 2,
                  maxRows: 2,
                  overflow: "auto",
                },
                paymentMethodOrder: ["applePay", "googlePay", "link"],
              }}
              onReady={onExpressReady}
              onConfirm={handleExpressConfirm}
              onCancel={() => setSubmitting(false)}
            />
          </div>
        </div>
        {walletAvailable ? (
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-emerald-100" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              or pay with card
            </span>
            <div className="h-px flex-1 bg-emerald-100" />
          </div>
        ) : null}
      </div>

      {!expressMounted ? (
        <p className="text-xs font-medium text-slate-400">
          Checking for Apple Pay / Google Pay / Link…
        </p>
      ) : null}

      <form onSubmit={handleCardSubmit} className="space-y-3">
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/40 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
              Card number
            </label>
            <CardBrandIcons activeBrand={cardBrand} />
          </div>

          <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3 shadow-inner shadow-emerald-900/5">
            <CardNumberElement
              options={{
                style: stripeFieldStyle,
                showIcon: true,
                disableLink: false,
              }}
              onChange={onCardNumberChange}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                Expiry
              </label>
              <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3">
                <CardExpiryElement
                  options={{ style: stripeFieldStyle }}
                  onChange={(event) =>
                    setCardComplete((prev) => ({
                      ...prev,
                      expiry: event.complete,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                CVC
              </label>
              <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3">
                <CardCvcElement
                  options={{ style: stripeFieldStyle }}
                  onChange={(event) =>
                    setCardComplete((prev) => ({
                      ...prev,
                      cvc: event.complete,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label
              htmlFor="checkout-zip"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800"
            >
              ZIP / postal code
            </label>
            <input
              id="checkout-zip"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="12345"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              onBlur={() => setPostalTouched(true)}
              className={[
                "w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2",
                postalTouched && !postalValid
                  ? "border-rose-300 focus:ring-rose-200"
                  : "border-emerald-100 focus:ring-emerald-200",
              ].join(" ")}
            />
            {postalTouched && !postalValid ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                Use a valid US ZIP so we can verify the card.
              </p>
            ) : null}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-100 bg-white px-3.5 py-3 transition hover:border-emerald-200">
          <input
            type="checkbox"
            checked={saveCard}
            onChange={(event) => onSaveCardChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium leading-snug text-slate-700">
            🔒 Save this card securely to SitGuru profile for instant future
            scheduling.
          </span>
        </label>

        {message ? (
          <p className="text-sm font-medium text-rose-700" role="alert">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!stripe || !elements || submitting || !cardReady}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#065f46] px-4 py-4 text-base font-black tracking-wide text-white shadow-lg shadow-emerald-900/25 transition hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Authorizing…" : `Confirm & Pay ${amountLabel}`}
        </button>
      </form>
    </div>
  );
}
