"use client";

import { useState, type FormEvent } from "react";
import TurnstileWidget from "@/components/TurnstileWidget";
import ActionFeedback, {
  type ActionFeedbackState,
} from "@/components/reads/ActionFeedback";
import { READS_PARTNER_TYPES } from "@/lib/reads/types";

export default function PartnerForm() {
  const [feedback, setFeedback] = useState<ActionFeedbackState>({
    status: "idle",
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const busy = feedback.status === "loading";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setFeedback({ status: "loading", message: "Sending your partnership request…" });

    try {
      const payload = {
        name: String(data.get("name") || ""),
        organization: String(data.get("organization") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        partner_type: String(data.get("partner_type") || "other"),
        website: String(data.get("website") || ""),
        work_title: String(data.get("work_title") || ""),
        description: String(data.get("description") || ""),
        topics: String(data.get("topics") || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        publication_date: String(data.get("publication_date") || ""),
        publisher: String(data.get("publisher") || ""),
        isbn: String(data.get("isbn") || ""),
        interested_interview: data.get("interested_interview") === "on",
        interested_giveaway: data.get("interested_giveaway") === "on",
        review_copy_available: data.get("review_copy_available") === "on",
        interested_social: data.get("interested_social") === "on",
        interested_partnership: data.get("interested_partnership") === "on",
        message: String(data.get("message") || ""),
        permission_agreed: data.get("permission_agreed") === "on",
        privacy_acknowledged: data.get("privacy_acknowledged") === "on",
        turnstileToken,
      };

      const res = await fetch("/api/reads/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Unable to submit partnership request.");
      }
      setFeedback({
        status: "success",
        message: "Thanks! Our team will review your partnership request.",
      });
      form.reset();
      setTurnstileToken("");
    } catch (error) {
      setFeedback({
        status: "error",
        message:
          error instanceof Error ? error.message : "Submission failed.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Organization" name="organization" />
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone (optional)" name="phone" />
        <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
          Partner type
          <select
            name="partner_type"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold"
            defaultValue="author"
          >
            {READS_PARTNER_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <Field label="Website" name="website" />
        <Field label="Book / publication / podcast title" name="work_title" />
        <Field label="Publisher" name="publisher" />
        <Field label="ISBN (if relevant)" name="isbn" />
        <Field label="Publication date" name="publication_date" />
        <Field
          label="Topics (comma-separated)"
          name="topics"
          className="sm:col-span-2"
        />
        <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
          Description
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold"
          />
        </label>
        <label className="block text-sm font-bold text-slate-700 sm:col-span-2">
          Message
          <textarea
            name="message"
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Check label="Interested in interview?" name="interested_interview" />
        <Check label="Interested in giveaway?" name="interested_giveaway" />
        <Check label="Review copy available?" name="review_copy_available" />
        <Check label="Interested in social collaboration?" name="interested_social" />
        <Check
          label="Interested in SitGuru partnership?"
          name="interested_partnership"
        />
      </div>

      <Check
        label="I have permission to share this work and metadata with SitGuru."
        name="permission_agreed"
        required
      />
      <Check
        label="I acknowledge SitGuru’s privacy practices for partnership inquiries."
        name="privacy_acknowledged"
        required
      />

      <TurnstileWidget
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
        action="reads_partner"
      />

      <button
        type="submit"
        disabled={busy}
        className="inline-flex rounded-full bg-[#E86A17] px-5 py-3 text-sm font-black text-white transition hover:brightness-105 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Become a Featured Partner"}
      </button>
      <ActionFeedback state={feedback} />
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-bold text-slate-700 ${className}`}>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold"
      />
    </label>
  );
}

function Check({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-2 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        name={name}
        required={required}
        className="mt-1 h-4 w-4 rounded border-slate-300"
      />
      <span>{label}</span>
    </label>
  );
}
