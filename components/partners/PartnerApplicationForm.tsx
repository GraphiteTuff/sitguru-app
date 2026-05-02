"use client";

import { useActionState, useMemo } from "react";
import {
  PartnerApplicantType,
  PartnerApplicationState,
  submitPartnerApplication,
} from "@/app/partners/actions";

type PartnerApplicationFormProps = {
  applicantType: PartnerApplicantType;
  title: string;
  description: string;
  businessLabel?: string;
  businessPlaceholder?: string;
  typeLabel?: string;
  typeOptions: string[];
  websiteLabel?: string;
  websitePlaceholder?: string;
  submitLabel?: string;
};

const initialState: PartnerApplicationState = {
  ok: false,
  message: "",
};

function applicantTypeLabel(type: PartnerApplicantType) {
  switch (type) {
    case "local_partner":
      return "Local Partner";
    case "national_partner":
      return "National Partner";
    case "affiliate":
      return "Growth Affiliate";
    case "ambassador":
      return "SitGuru Ambassador";
  }
}

export default function PartnerApplicationForm({
  applicantType,
  title,
  description,
  businessLabel,
  businessPlaceholder,
  typeLabel = "Type",
  typeOptions,
  websiteLabel = "Website or Social",
  websitePlaceholder = "https://",
  submitLabel = "Apply Now",
}: PartnerApplicationFormProps) {
  const [state, formAction, pending] = useActionState(
    submitPartnerApplication,
    initialState
  );

  const showBusinessField = useMemo(() => {
    return applicantType === "local_partner" || applicantType === "national_partner";
  }, [applicantType]);

  return (
    <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-xl shadow-green-950/5 sm:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
          Apply now
        </p>

        <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
          {title}
        </h2>

        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>

        <div className="mx-auto mt-5 inline-flex rounded-full border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-green-800">
          Application Type: {applicantTypeLabel(applicantType)}
        </div>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="applicant_type" value={applicantType} />

        <div className="grid gap-4 lg:grid-cols-2">
          {showBusinessField ? (
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                {businessLabel ?? "Business / Brand Name"}
              </span>
              <input
                required
                name="business_name"
                type="text"
                placeholder={businessPlaceholder ?? "Your business or brand name"}
                className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Your Name</span>
            <input
              required
              name="contact_name"
              type="text"
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Contact Email
            </span>
            <input
              required
              name="email"
              type="email"
              placeholder="you@email.com"
              className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Phone</span>
            <input
              name="phone"
              type="tel"
              placeholder="Optional"
              className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              {typeLabel}
            </span>
            <select
              required
              name="business_type"
              className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              defaultValue=""
            >
              <option value="" disabled>
                Select type
              </option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              {websiteLabel}
            </span>
            <input
              name="website"
              type="text"
              placeholder={websitePlaceholder}
              className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Social URL</span>
            <input
              name="social_url"
              type="text"
              placeholder="Instagram, Facebook, LinkedIn, TikTok, etc."
              className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">City</span>
              <input
                required
                name="city"
                type="text"
                placeholder="City"
                className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">State</span>
              <input
                name="state"
                type="text"
                placeholder="PA"
                maxLength={2}
                className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm uppercase outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">ZIP Code</span>
              <input
                name="zip_code"
                type="text"
                placeholder="18901"
                className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>
          </div>

          <label className="block lg:col-span-2">
            <span className="text-sm font-bold text-slate-700">
              Tell us how you want to partner with SitGuru
            </span>
            <textarea
              name="message"
              rows={5}
              placeholder="Tell us about your business, audience, community, outreach ideas, or why you want to partner with SitGuru."
              className="mt-2 w-full resize-none rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
            />
          </label>
        </div>

        {state.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              state.ok
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 sm:flex-row">
          <p className="text-sm font-semibold text-green-800">
            Applications are reviewed by SitGuru Admin before approval.
          </p>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-green-800 px-6 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Submitting..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}