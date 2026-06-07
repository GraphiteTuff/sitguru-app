"use client";

import { useEffect, useState } from "react";

type GuruLeadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  leadSourceOptions: string[];
  experienceOptions: string[];
  serviceOptions: string[];
  statusOptions: string[];
  assignedToOptions: string[];
};

type ZipLookupResponse = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
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

export default function GuruLeadForm({
  action,
  leadSourceOptions,
  experienceOptions,
  serviceOptions,
  statusOptions,
  assignedToOptions,
}: GuruLeadFormProps) {
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [zipLookupStatus, setZipLookupStatus] = useState<
    "idle" | "loading" | "found" | "not_found" | "error"
  >("idle");

  function handlePhoneChange(value: string) {
    setPhone(formatPhoneNumber(value));
  }

  function handleZipChange(value: string) {
    const cleanZip = normalizeZip(value);
    setZip(cleanZip);

    if (cleanZip.length < 5) {
      setZipLookupStatus("idle");
    }
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

        console.error("Guru Lead ZIP lookup failed:", error);
        setZipLookupStatus("error");
      }
    }

    lookupZip();

    return () => {
      controller.abort();
    };
  }, [zip]);

  return (
    <form action={action} encType="multipart/form-data" className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">First Name *</span>
          <input
            name="first_name"
            required
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Sarah"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Last Name</span>
          <input
            name="last_name"
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Miller"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="sarah@email.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Phone</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => handlePhoneChange(event.target.value)}
          className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="(215) 555-1234"
        />
        <p className="mt-1 text-xs font-medium text-slate-500">
          Phone auto-formats to (XXX) XXX-XXXX.
        </p>
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_90px_110px]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">City</span>
          <input
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="City"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">State</span>
          <input
            name="state"
            value={state}
            onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="PA"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">ZIP</span>
          <input
            name="zip"
            inputMode="numeric"
            value={zip}
            onChange={(event) => handleZipChange(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="18951"
          />
        </label>
      </div>

      {zipLookupStatus === "loading" ? (
        <p className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          Looking up ZIP code...
        </p>
      ) : null}

      {zipLookupStatus === "found" ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          ZIP found. City and state were filled automatically.
        </p>
      ) : null}

      {zipLookupStatus === "not_found" ? (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          ZIP was not found. You can still enter city and state manually.
        </p>
      ) : null}

      {zipLookupStatus === "error" ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          ZIP lookup failed. You can still enter city and state manually.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Lead Source</span>
          <select
            name="lead_source"
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            defaultValue=""
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
          <span className="text-sm font-semibold text-slate-700">Experience</span>
          <select
            name="experience_level"
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            defaultValue=""
          >
            <option value="">Select experience</option>
            {experienceOptions.map((experience) => (
              <option key={experience} value={experience}>
                {experience}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl border border-purple-100 bg-purple-50 p-4">
        <h3 className="text-sm font-bold text-purple-950">Referral Tracking</h3>
        <p className="mt-1 text-xs font-medium text-purple-700">
          Use this when someone refers a future Guru using their SitGuru referral code.
        </p>

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Referral Code</span>
            <input
              name="referral_code"
              className="mt-1 w-full rounded-2xl border border-purple-200 bg-white px-3 py-2 text-sm uppercase text-slate-950 shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="JASON18951"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Referred By Name</span>
            <input
              name="referred_by_name"
              className="mt-1 w-full rounded-2xl border border-purple-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="Jason Graff"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Referred By Email</span>
            <input
              name="referred_by_email"
              type="email"
              className="mt-1 w-full rounded-2xl border border-purple-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              placeholder="jason@sitguru.com"
            />
          </label>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
        <h3 className="text-sm font-bold text-emerald-950">Resume Upload</h3>
        <p className="mt-1 text-xs font-medium text-emerald-700">
          Upload ZipRecruiter or candidate resumes. Supported: PDF, DOC, DOCX.
        </p>

        <input
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="mt-4 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-emerald-800"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">Interested Services</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {serviceOptions.map((service) => (
            <label
              key={service}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <input
                type="checkbox"
                name="interested_services"
                value={service}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              {service}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <select
            name="status"
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            defaultValue="New"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Assigned To</span>
          <select
            name="assigned_to"
            className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            defaultValue=""
          >
            <option value="">Unassigned</option>
            {assignedToOptions.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Follow-Up Date</span>
        <input
          name="follow_up_date"
          type="date"
          className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Notes</span>
        <textarea
          name="notes"
          rows={4}
          className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          placeholder="Met at event, interested in dog walking and drop-ins..."
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
      >
        Add Guru Lead
      </button>
    </form>
  );
}