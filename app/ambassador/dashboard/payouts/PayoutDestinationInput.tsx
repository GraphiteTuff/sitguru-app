"use client";

import { useState } from "react";

type PayoutDestinationInputProps = {
  provider: "paypal" | "venmo";
  defaultPayPalEmail?: string;
};

function formatUsPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (!digits) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function PayoutDestinationInput({
  provider,
  defaultPayPalEmail = "",
}: PayoutDestinationInputProps) {
  const isPayPal = provider === "paypal";
  const [value, setValue] = useState(
    isPayPal ? defaultPayPalEmail : "",
  );

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] !text-slate-600">
        {isPayPal ? "PayPal email" : "Venmo mobile"}
      </span>

      <input
        type={isPayPal ? "email" : "tel"}
        name="destinationValue"
        inputMode={isPayPal ? "email" : "numeric"}
        autoComplete={isPayPal ? "email" : "tel-national"}
        value={value}
        onChange={(event) => {
          setValue(
            isPayPal
              ? event.target.value
              : formatUsPhone(event.target.value),
          );
        }}
        placeholder={isPayPal ? "you@example.com" : "(555) 555-1234"}
        maxLength={isPayPal ? 254 : 14}
        pattern={isPayPal ? undefined : "\\(\\d{3}\\) \\d{3}-\\d{4}"}
        title={
          isPayPal
            ? "Enter the email address on your PayPal account."
            : "Enter a 10-digit U.S. mobile number."
        }
        aria-label={isPayPal ? "PayPal email" : "Venmo mobile number"}
        required
        className="min-h-[52px] w-full rounded-2xl border border-slate-300 bg-white px-4 text-base font-bold !text-slate-950 outline-none transition placeholder:font-semibold placeholder:!text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}