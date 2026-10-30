"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ServiceChoice = {
  label: string;
  price: string;
};

export default function PublicPlanCare({
  firstName,
  services,
  bookHref,
  disabled,
}: {
  firstName: string;
  services: ServiceChoice[];
  bookHref: string;
  disabled: boolean;
}) {
  const [service, setService] = useState(services[0]?.label || "");
  const [stay, setStay] = useState<"one" | "multi" | "overnight">("one");
  const choices = services.length ? services : [{ label: "Pet care", price: "" }];
  const selected = choices.find((item) => item.label === service) || choices[0];

  const href = useMemo(() => {
    const params = new URLSearchParams();
    if (selected?.label && selected.label !== "Pet care") params.set("service", selected.label);
    if (stay === "multi") params.set("stay", "multi");
    if (stay === "overnight") params.set("stay", "overnight");
    const query = params.toString();
    return query ? `${bookHref}?${query}` : bookHref;
  }, [bookHref, selected?.label, stay]);

  return (
    <aside className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-black text-slate-950">Plan care with {firstName}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">Choose a service. {firstName} confirms the request before you are charged.</p>
      <div className="mt-3 grid gap-2">
        {choices.slice(0, 6).map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setService(item.label)}
            className={service === item.label
              ? "flex min-h-11 items-center justify-between rounded-2xl bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
              : "flex min-h-11 items-center justify-between rounded-2xl border border-slate-200 px-3 text-sm font-bold text-slate-700"}
          >
            <span>{item.label}</span>
            {item.price ? <span>{item.price}</span> : null}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type of stay">
        {([
          ["one", "One day"],
          ["multi", "Multiple dates"],
          ["overnight", "Overnight"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={stay === id}
            onClick={() => setStay(id)}
            className={stay === id
              ? "min-h-11 rounded-2xl bg-emerald-50 text-xs font-bold text-[#0D5C3A] ring-1 ring-emerald-200"
              : "min-h-11 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600"}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {stay === "one"
          ? "Pick the date on the next step."
          : "Pick the start and end dates on the next step."}
      </p>
      {disabled ? (
        <p className="mt-4 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-900">Bookings open once this profile is ready.</p>
      ) : (
        <Link href={href} className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-[#0D5C3A] text-sm font-black !text-white">
          Request to book
        </Link>
      )}
      <p className="mt-3 text-center text-xs font-semibold text-slate-500">Dates are chosen on the next step. You are not charged yet.</p>
    </aside>
  );
}
