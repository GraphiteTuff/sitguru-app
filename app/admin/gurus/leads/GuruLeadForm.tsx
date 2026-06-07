"use client";

import { useMemo, useState } from "react";

type GuruLeadFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  leadSourceOptions: string[];
  experienceOptions: string[];
  serviceOptions: string[];
  statusOptions: string[];
  assignedToOptions: string[];
};

const zipCityMap: Record<string, { city: string; state: string }> = {
  "18951": { city: "Quakertown", state: "PA" },
  "18901": { city: "Doylestown", state: "PA" },
  "18902": { city: "Doylestown", state: "PA" },
  "18914": { city: "Chalfont", state: "PA" },
  "18917": { city: "Dublin", state: "PA" },
  "18923": { city: "Fountainville", state: "PA" },
  "18925": { city: "Furlong", state: "PA" },
  "18929": { city: "Jamison", state: "PA" },
  "18938": { city: "New Hope", state: "PA" },
  "18940": { city: "Newtown", state: "PA" },
  "18944": { city: "Perkasie", state: "PA" },
  "18947": { city: "Pipersville", state: "PA" },
  "18954": { city: "Richboro", state: "PA" },
  "18955": { city: "Richlandtown", state: "PA" },
  "18960": { city: "Sellersville", state: "PA" },
  "18966": { city: "Southampton", state: "PA" },
  "18969": { city: "Telford", state: "PA" },
  "18974": { city: "Warminster", state: "PA" },
  "18976": { city: "Warrington", state: "PA" },
  "19002": { city: "Ambler", state: "PA" },
  "19006": { city: "Huntingdon Valley", state: "PA" },
  "19007": { city: "Bristol", state: "PA" },
  "19020": { city: "Bensalem", state: "PA" },
  "19021": { city: "Croydon", state: "PA" },
  "19030": { city: "Fairless Hills", state: "PA" },
  "19040": { city: "Hatboro", state: "PA" },
  "19044": { city: "Horsham", state: "PA" },
  "19047": { city: "Langhorne", state: "PA" },
  "19053": { city: "Feasterville-Trevose", state: "PA" },
  "19054": { city: "Levittown", state: "PA" },
  "19056": { city: "Levittown", state: "PA" },
  "19057": { city: "Levittown", state: "PA" },
  "19067": { city: "Yardley", state: "PA" },
  "19090": { city: "Willow Grove", state: "PA" },
  "19446": { city: "Lansdale", state: "PA" },
  "18036": { city: "Coopersburg", state: "PA" },
  "18049": { city: "Emmaus", state: "PA" },
  "18052": { city: "Whitehall", state: "PA" },
  "18054": { city: "Green Lane", state: "PA" },
  "18073": { city: "Pennsburg", state: "PA" },
  "18074": { city: "Perkiomenville", state: "PA" },
  "18076": { city: "Red Hill", state: "PA" },
  "18077": { city: "Riegelsville", state: "PA" },
  "18101": { city: "Allentown", state: "PA" },
  "18102": { city: "Allentown", state: "PA" },
  "18103": { city: "Allentown", state: "PA" },
  "18018": { city: "Bethlehem", state: "PA" },
  "18020": { city: "Bethlehem", state: "PA" },
};

const cityZipMap: Record<string, string> = Object.entries(zipCityMap).reduce(
  (map, [zip, location]) => {
    const key = `${location.city.toLowerCase()},${location.state.toLowerCase()}`;

    if (!map[key]) {
      map[key] = zip;
    }

    return map;
  },
  {} as Record<string, string>,
);

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
  const [state, setState] = useState("PA");
  const [zip, setZip] = useState("");

  const cityStateKey = useMemo(
    () => `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`,
    [city, state],
  );

  function handlePhoneChange(value: string) {
    setPhone(formatPhoneNumber(value));
  }

  function handleZipChange(value: string) {
    const cleanZip = normalizeZip(value);
    setZip(cleanZip);

    const location = zipCityMap[cleanZip];

    if (location) {
      setCity(location.city);
      setState(location.state);
    }
  }

  function handleCityBlur() {
    if (zip.trim()) {
      return;
    }

    const matchedZip = cityZipMap[cityStateKey];

    if (matchedZip) {
      setZip(matchedZip);
    }
  }

  function handleStateBlur() {
    if (zip.trim()) {
      return;
    }

    const matchedZip = cityZipMap[cityStateKey];

    if (matchedZip) {
      setZip(matchedZip);
    }
  }

  return (
    <form action={action} className="mt-5 space-y-4">
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
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_90px_110px]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">City</span>
          <input
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            onBlur={handleCityBlur}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Quakertown"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">State</span>
          <input
            name="state"
            value={state}
            onChange={(event) => setState(event.target.value.toUpperCase().slice(0, 2))}
            onBlur={handleStateBlur}
            className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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