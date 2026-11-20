"use client";

import { useEffect, useState } from "react";

type Credential = {
  id: string;
  typeName: string;
  credentialName: string;
  providerName: string | null;
  reference: string | null;
  referenceMasked: string;
  issueDate: string | null;
  expirationDate: string | null;
  verificationUrl: string | null;
  hasDocument: boolean;
  submissionNotes: string | null;
  verificationNotes: string | null;
  rejectionReason: string | null;
  status: string;
  createdAt: string;
  guruId: string | null;
  ownerUserId: string;
  expiringSoon: boolean;
};

type Provider = {
  id: string;
  provider_name: string;
  slug: string;
  public_url: string | null;
  training_url: string | null;
  partner_url: string | null;
  promo_code: string | null;
  active: boolean;
  is_partner: boolean;
  logo_authorized: boolean;
};

const TABS = [
  ["pending", "Pending Review"],
  ["verified", "Verified"],
  ["expiring", "Expiring Soon"],
  ["expired", "Expired"],
  ["rejected", "Rejected"],
  ["all", "All"],
] as const;

const REASONS = [
  "Unable to verify",
  "Document unclear",
  "Expired",
  "Information mismatch",
  "Unsupported credential",
  "Other",
];

export default function GuruCredentialReview() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("pending");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load(nextTab = tab) {
    const response = await fetch(`/api/admin/credentials?tab=${nextTab}`, { cache: "no-store" });
    const payload = (await response.json()) as {
      credentials?: Credential[];
      providers?: Provider[];
      settings?: Record<string, string>;
      error?: string;
    };
    if (!response.ok) {
      setError(payload.error || "Unable to load the review queue.");
      return;
    }
    setCredentials(payload.credentials || []);
    setProviders(payload.providers || []);
    setSettings(payload.settings || {});
    setError("");
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/credentials?tab=${tab}`, { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
      .then((result: {
        ok: boolean;
        payload: {
          credentials?: Credential[];
          providers?: Provider[];
          settings?: Record<string, string>;
          error?: string;
        };
      }) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(result.payload.error || "Unable to load the review queue.");
          return;
        }
        setCredentials(result.payload.credentials || []);
        setProviders(result.payload.providers || []);
        setSettings(result.payload.settings || {});
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load the review queue.");
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  async function review(id: string, action: "verify" | "reject" | "revoke", reason?: string) {
    const note = window.prompt(action === "verify" ? "Optional internal note" : "Internal note") || "";
    setBusyId(id);
    const response = await fetch(`/api/admin/credentials/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note, rejectionReason: reason }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusyId("");
    if (!response.ok) {
      setError(payload.error || "Review did not save.");
      return;
    }
    setMessage(action === "verify" ? "Credential verified." : "Credential updated.");
    await load();
  }

  async function openDocument(id: string) {
    const response = await fetch(`/api/admin/credentials/${id}`);
    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setError(payload.error || "No document is attached.");
      return;
    }
    window.open(payload.url, "_blank", "noopener,noreferrer");
  }

  async function saveProvider(provider: Provider) {
    const response = await fetch("/api/admin/credentials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: {
          id: provider.id,
          publicUrl: provider.public_url,
          trainingUrl: provider.training_url,
          partnerUrl: provider.partner_url,
          promoCode: provider.promo_code,
          active: provider.active,
          logoAuthorized: provider.logo_authorized,
          isPartner: provider.is_partner,
        },
      }),
    });
    if (!response.ok) {
      setError("Provider link did not save.");
      return;
    }
    setMessage("Provider settings saved.");
  }

  async function saveSettings() {
    const response = await fetch("/api/admin/credentials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) {
      setError("Settings did not save.");
      return;
    }
    setMessage("Rollout settings saved.");
  }

  return (
    <div className="trust-credentials trust-surface space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0D5C3A]">Admin</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Guru Credentials</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
          Review optional professional highlights. Verification only confirms the document SitGuru reviewed.
        </p>
      </header>

      {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-[#0D5C3A]">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Credential queues">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`min-h-11 rounded-full px-4 text-sm font-black ${tab === key ? "bg-[#0D5C3A] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {credentials.length === 0 ? (
          <p className="rounded-3xl bg-white p-6 text-sm font-semibold text-slate-600">Nothing in this queue.</p>
        ) : null}
        {credentials.map((credential) => (
          <article key={credential.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black text-slate-950">{credential.typeName}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {credential.providerName || "Provider not listed"} · {credential.status}
              {credential.expiringSoon ? " · expiring soon" : ""}
            </p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <div><dt className="font-black">Guru</dt><dd>{credential.ownerUserId}</dd></div>
              <div><dt className="font-black">Submitted</dt><dd>{credential.createdAt.slice(0, 10)}</dd></div>
              <div><dt className="font-black">Reference</dt><dd>{credential.reference || "Not provided"}</dd></div>
              <div><dt className="font-black">Dates</dt><dd>{credential.issueDate || "—"} to {credential.expirationDate || "no expiration"}</dd></div>
            </dl>
            {credential.submissionNotes ? <p className="mt-3 text-sm text-slate-600">{credential.submissionNotes}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {credential.guruId ? (
                <a className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold" href={`/admin/gurus/${credential.guruId}`}>Guru profile</a>
              ) : null}
              {credential.hasDocument ? (
                <button type="button" className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-bold" onClick={() => void openDocument(credential.id)}>View Document</button>
              ) : null}
              {credential.verificationUrl ? (
                <a className="min-h-11 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold" href={credential.verificationUrl} target="_blank" rel="noreferrer">Open Verification Link</a>
              ) : null}
              <button type="button" disabled={busyId === credential.id} className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white" onClick={() => void review(credential.id, "verify")}>Verify</button>
              <button type="button" className="min-h-11 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-800" onClick={() => void review(credential.id, "reject", window.prompt(`Reason:\n${REASONS.join("\n")}`) || REASONS[0])}>Reject</button>
              <button type="button" className="min-h-11 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-800" onClick={() => void review(credential.id, "revoke")}>Revoke</button>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">Provider links</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Explore links stay configurable. Partner wording stays off unless you mark a real partnership.
        </p>
        <div className="mt-4 space-y-4">
          {providers.map((provider) => (
            <form
              key={provider.id}
              className="grid gap-2 rounded-2xl bg-slate-50 p-3 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                void saveProvider({
                  ...provider,
                  public_url: String(data.get("publicUrl") || ""),
                  training_url: String(data.get("trainingUrl") || ""),
                  partner_url: String(data.get("partnerUrl") || ""),
                  promo_code: String(data.get("promoCode") || ""),
                  active: data.get("active") === "on",
                  is_partner: data.get("isPartner") === "on",
                  logo_authorized: data.get("logoAuthorized") === "on",
                });
              }}
            >
              <p className="font-black text-slate-900 md:col-span-2">{provider.provider_name}</p>
              <input name="trainingUrl" defaultValue={provider.training_url || ""} placeholder="Training or explore URL" className="min-h-11 rounded-xl border px-3" />
              <input name="publicUrl" defaultValue={provider.public_url || ""} placeholder="Public URL" className="min-h-11 rounded-xl border px-3" />
              <input name="partnerUrl" defaultValue={provider.partner_url || ""} placeholder="Partner URL" className="min-h-11 rounded-xl border px-3" />
              <input name="promoCode" defaultValue={provider.promo_code || ""} placeholder="Promo code" className="min-h-11 rounded-xl border px-3" />
              <label className="text-sm font-bold"><input name="active" type="checkbox" defaultChecked={provider.active} /> Active</label>
              <label className="text-sm font-bold"><input name="isPartner" type="checkbox" defaultChecked={provider.is_partner} /> Real partnership</label>
              <label className="text-sm font-bold"><input name="logoAuthorized" type="checkbox" defaultChecked={provider.logo_authorized} /> Logo authorized</label>
              <button type="submit" className="min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white">Save provider</button>
            </form>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <h2 className="text-xl font-black text-slate-950">Rollout</h2>
        <div className="mt-3 grid gap-3">
          {Object.entries(settings).map(([key, value]) => (
            <label key={key} className="text-sm font-bold text-slate-800">
              {key}
              <input
                className="mt-1 min-h-11 w-full rounded-xl border px-3 font-semibold"
                value={value}
                onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))}
              />
            </label>
          ))}
          <button type="button" className="min-h-11 w-fit rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white" onClick={() => void saveSettings()}>
            Save rollout settings
          </button>
        </div>
      </section>
    </div>
  );
}
