"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type GuruLeadForEdit = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lead_source: string | null;
  referral_code: string | null;
  referred_by_name: string | null;
  referred_by_email: string | null;
  interested_services: string[] | null;
  experience_level: string | null;
  status: string;
  notes: string | null;
  follow_up_date: string | null;
  assigned_to: string | null;
  resume_signed_url?: string | null;
};

type ZipLookupResponse = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
};

type GuruLeadEditFormProps = {
  lead: GuruLeadForEdit;
  updateAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  statusOptions: string[];
  leadSourceOptions: string[];
  experienceOptions: string[];
  serviceOptions: string[];
  assignedToOptions: string[];
  becomeGuruHref: string;
  emailHref: string | null;
};

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function normalizeZip(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

export default function GuruLeadEditForm({
  lead,
  updateAction,
  deleteAction,
  statusOptions,
  leadSourceOptions,
  experienceOptions,
  serviceOptions,
  assignedToOptions,
  becomeGuruHref,
  emailHref,
}: GuruLeadEditFormProps) {
  const [isPending, startTransition] = useTransition();

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [zipLookupStatus, setZipLookupStatus] = useState<
    "idle" | "loading" | "found" | "not_found" | "error"
  >("idle");

  const [phone, setPhone] = useState(lead.phone || "");
  const [city, setCity] = useState(lead.city || "");
  const [state, setState] = useState(lead.state || "");
  const [zip, setZip] = useState(lead.zip || "");

  const services = lead.interested_services || [];

  function handlePhoneChange(value: string) {
    setSaveState("idle");
    setPhone(formatPhoneNumber(value));
  }

  function handleZipChange(value: string) {
    const cleanZip = normalizeZip(value);
    setSaveState("idle");
    setZip(cleanZip);

    if (cleanZip.length < 5) {
      setZipLookupStatus("idle");
    }
  }

  function handleManualChange() {
    setSaveState("idle");
  }

  useEffect(() => {
    if (zip.length !== 5) {
      return;
    }

    const controller = new AbortController();

    async function lookupZip() {
      try {
        setZipLookupStatus("loading");

        const response = await fetch(`/api/zip-lookup?zip=${zip}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setZipLookupStatus("not_found");
          return;
        }

        const data = (await response.json()) as ZipLookupResponse;

        if (data.city && data.state) {
          setCity(data.city);
          setState(data.state);
          setZipLookupStatus("found");
          return;
        }

        setZipLookupStatus("not_found");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Guru Lead edit ZIP lookup failed:", error);
        setZipLookupStatus("error");
      }
    }

    lookupZip();

    return () => {
      controller.abort();
    };
  }, [zip]);

  async function handleUpdate(formData: FormData) {
    setSaveState("saving");

    startTransition(async () => {
      try {
        await updateAction(formData);
        setSaveState("saved");

        window.setTimeout(() => {
          setSaveState("idle");
        }, 3500);
      } catch (error) {
        console.error("Guru Lead save failed:", error);
        setSaveState("error");
      }
    });
  }

  const saveButtonClass =
    saveState === "saved"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : saveState === "error"
        ? "bg-red-600 hover:bg-red-700"
        : "bg-slate-900 hover:bg-slate-800";

  const saveButtonText =
    saveState === "saved"
      ? "Saved"
      : saveState === "saving" || isPending
        ? "Saving..."
        : saveState === "error"
          ? "Save Failed"
          : "Save Lead Changes";

  return (
    <div className="space-y-3">
      <form action={handleUpdate} encType="multipart/form-data" className="rounded-2xl bg-slate-50 p-4">
        <input type="hidden" name="id" value={lead.id} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Edit Lead Information
          </h4>

          {saveState === "saved" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Information saved
            </span>
          ) : null}

          {saveState === "error" ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
              Save failed
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              First Name *
            </span>
            <input
              name="first_name"
              required
              defaultValue={lead.first_name || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Last Name
            </span>
            <input
              name="last_name"
              defaultValue={lead.last_name || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Email
            </span>
            <input
              name="email"
              type="email"
              defaultValue={lead.email || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Phone
            </span>
            <input
              name="phone"
              type="tel"
              value={phone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="(215) 555-1234"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              City
            </span>
            <input
              name="city"
              value={city}
              onChange={(event) => {
                handleManualChange();
                setCity(event.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="grid grid-cols-[90px_1fr] gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                State
              </span>
              <input
                name="state"
                value={state}
                maxLength={2}
                onChange={(event) => {
                  handleManualChange();
                  setState(event.target.value.toUpperCase().slice(0, 2));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                ZIP
              </span>
              <input
                name="zip"
                inputMode="numeric"
                value={zip}
                onChange={(event) => handleZipChange(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="md:col-span-2">
            {zipLookupStatus === "loading" ? (
              <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                Looking up ZIP code...
              </p>
            ) : null}

            {zipLookupStatus === "found" ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                ZIP found. City and state were filled automatically.
              </p>
            ) : null}

            {zipLookupStatus === "not_found" ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                ZIP was not found. You can still enter city and state manually.
              </p>
            ) : null}

            {zipLookupStatus === "error" ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                ZIP lookup failed. You can still enter city and state manually.
              </p>
            ) : null}
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              name="status"
              defaultValue={lead.status}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Lead Source
            </span>
            <select
              name="lead_source"
              defaultValue={lead.lead_source || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Select source</option>
              {leadSourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Experience
            </span>
            <select
              name="experience_level"
              defaultValue={lead.experience_level || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Select experience</option>
              {experienceOptions.map((experience) => (
                <option key={experience} value={experience}>
                  {experience}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Referral Code
            </span>
            <input
              name="referral_code"
              defaultValue={lead.referral_code || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm uppercase text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Referred By Name
            </span>
            <input
              name="referred_by_name"
              defaultValue={lead.referred_by_name || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Referred By Email
            </span>
            <input
              name="referred_by_email"
              type="email"
              defaultValue={lead.referred_by_email || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Assigned To
            </span>
            <select
              name="assigned_to"
              defaultValue={lead.assigned_to || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Unassigned</option>
              {assignedToOptions.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Follow-Up Date
            </span>
            <input
              name="follow_up_date"
              type="date"
              defaultValue={lead.follow_up_date || ""}
              onChange={handleManualChange}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Replace / Upload Resume
            </span>
            <input
              name="resume"
              type="file"
              onChange={handleManualChange}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-2 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-800"
            />
          </label>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Interested Services
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {serviceOptions.map((service) => (
              <label
                key={service}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  name="interested_services"
                  value={service}
                  defaultChecked={services.includes(service)}
                  onChange={handleManualChange}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {service}
              </label>
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Notes
          </span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={lead.notes || ""}
            onChange={handleManualChange}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saveState === "saving" || isPending}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-80 ${saveButtonClass}`}
          >
            {saveButtonText}
          </button>

          <div className="flex flex-wrap gap-2">
            {emailHref ? (
              <a
                href={emailHref}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                Email Lead
              </a>
            ) : null}

            <Link
              href={becomeGuruHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Become-a-Guru Page
            </Link>

            {lead.resume_signed_url ? (
              <a
                href={lead.resume_signed_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
              >
                View Resume
              </a>
            ) : null}
          </div>
        </div>
      </form>

      <form action={deleteAction} className="flex justify-end">
        <input type="hidden" name="id" value={lead.id} />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
        >
          Delete Lead
        </button>
      </form>
    </div>
  );
}
