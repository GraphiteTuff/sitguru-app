"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { credentialIcon } from "@/components/credentials/credential-icons";
import { credentialAnalyticsSlug, formatValidThrough, GURU_EMPTY_CREDENTIAL_COPY } from "@/lib/credentials/model";

type Provider = {
  id: string;
  slug: string;
  provider_name: string;
  description: string | null;
  exploreUrl: string | null;
  is_partner: boolean;
};

type CredentialType = {
  id: string;
  slug: string;
  display_name: string;
  description: string;
  icon: string;
  public_badge_label: string;
  explore_label: string | null;
  add_label: string;
  default_provider_slug: string | null;
  requires_expiration: boolean;
};

type OwnedCredential = {
  id: string;
  typeSlug: string;
  typeName: string;
  credentialName: string;
  providerName: string | null;
  reference: string | null;
  issueDate: string | null;
  expirationDate: string | null;
  verificationUrl: string | null;
  hasDocument: boolean;
  submissionNotes: string | null;
  status: string;
  rejectionReason: string | null;
  expiringSoon: boolean;
};

type Workspace = {
  enabled: boolean;
  unavailable?: boolean;
  types: CredentialType[];
  providers: Provider[];
  credentials: OwnedCredential[];
};

const STATUS_COPY: Record<string, string> = {
  draft: "Saved on your profile.",
  submitted: "Submitted — we're reviewing it.",
  under_review: "Submitted — we're reviewing it.",
  verified: "Verified 🐾",
  rejected: "We need a little more information.",
  expired: "Time for a quick credential refresh.",
  revoked: "This highlight is no longer shown publicly.",
  archived: "Replaced by a newer highlight.",
};

export default function GuruTrustCredentialsPanel() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeSlug, setActiveSlug] = useState("");
  const [detailId, setDetailId] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/guru/credentials", { cache: "no-store" });
    const payload = (await response.json()) as Workspace & { error?: string };
    if (!response.ok) {
      setError(payload.error || "SitGuru could not open Trust & Credentials.");
      return;
    }
    setWorkspace(payload);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/guru/credentials", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ ok: response.ok, payload })))
      .then(({ ok, payload }: { ok: boolean; payload: Workspace & { error?: string } }) => {
        if (cancelled) return;
        if (!ok) {
          setError(payload.error || "SitGuru could not open Trust & Credentials.");
          return;
        }
        setWorkspace(payload);
        void trackEvent({
          eventName: "credentials_section_viewed",
          eventType: "credentials",
          role: "guru",
          source: "guru_dashboard",
          metadata: { source_surface: "guru_dashboard", platform: "web" },
        });
      })
      .catch(() => {
        if (!cancelled) setError("SitGuru could not open Trust & Credentials.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeType = useMemo(
    () => workspace?.types.find((type) => type.slug === activeSlug) || null,
    [activeSlug, workspace?.types],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeType) return;
    setBusy(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const body = {
      typeSlug: activeType.slug,
      providerId: String(form.get("providerId") || ""),
      customProviderName: String(form.get("customProviderName") || ""),
      credentialName: String(form.get("credentialName") || activeType.display_name),
      reference: String(form.get("reference") || ""),
      issueDate: String(form.get("issueDate") || ""),
      expirationDate: String(form.get("expirationDate") || ""),
      verificationUrl: String(form.get("verificationUrl") || ""),
      submissionNotes: String(form.get("submissionNotes") || ""),
      metadata: {
        named_insured: String(form.get("namedInsured") || ""),
        general_liability: form.get("generalLiability") === "on",
        care_custody_control: form.get("careCustodyControl") === "on",
        coverage_limit: String(form.get("coverageLimit") || ""),
      },
    };

    void trackEvent({
      eventName: "credential_submission_started",
      eventType: "credentials",
      role: "guru",
      source: "guru_dashboard",
      metadata: { credential_type: activeType.slug, platform: "web", source_surface: "guru_dashboard" },
    });

    const response = await fetch("/api/guru/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string; credential?: { id: string } };
    if (!response.ok || !payload.credential?.id) {
      setBusy(false);
      setError(payload.error || "SitGuru could not save this highlight.");
      return;
    }

    if (file instanceof File && file.size > 0) {
      const upload = new FormData();
      upload.set("file", file);
      const uploadResponse = await fetch(`/api/guru/credentials/${payload.credential.id}/document`, {
        method: "POST",
        body: upload,
      });
      if (!uploadResponse.ok) {
        const uploadPayload = (await uploadResponse.json()) as { error?: string };
        setBusy(false);
        setError(uploadPayload.error || "The highlight was saved, but the document needs another try.");
        await load();
        return;
      }
    }

    setBusy(false);
    setMessage("Submitted — we're reviewing it.");
    setActiveSlug("");
    void trackEvent({
      eventName: "credential_submitted",
      eventType: "credentials",
      role: "guru",
      source: "guru_dashboard",
      metadata: { credential_type: activeType.slug, platform: "web", source_surface: "guru_dashboard" },
    });
    await load();
  }

  if (error && !workspace) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6">
        <p className="font-bold text-slate-800">{error}</p>
        <button type="button" className="mt-4 min-h-11 rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  }

  if (!workspace) {
    return <div className="h-40 animate-pulse rounded-3xl bg-emerald-50" aria-hidden="true" />;
  }

  if (!workspace.enabled) return null;

  return (
    <div className="trust-credentials trust-surface space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0D5C3A]">Trust & Credentials</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Show Pet Parents what makes you, you. 🐾
        </h1>
        <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-600">
          Add professional credentials you already have, or explore optional training and resources that can be displayed on your Guru profile.
        </p>
      </header>

      {workspace.credentials.length === 0 ? (
        <div className="rounded-3xl border border-emerald-100 bg-[#F7FBF8] p-6">
          <h2 className="text-xl font-black text-slate-950">{GURU_EMPTY_CREDENTIAL_COPY.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{GURU_EMPTY_CREDENTIAL_COPY.body}</p>
        </div>
      ) : null}

      {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-[#0D5C3A]">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
      {workspace.unavailable ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          Trust & Credentials is ready in the app and will appear after the database update is applied.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {workspace.types.map((type) => {
          const owned = workspace.credentials.filter((item) => item.typeSlug === type.slug);
          const provider = workspace.providers.find((item) => item.slug === type.default_provider_slug);
          return (
            <article key={type.slug} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                <span aria-hidden="true">{credentialIcon(type.icon)} </span>
                {type.display_name}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{type.description}</p>
              <div className="mt-4 space-y-2">
                {owned.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[#F7FBF8] px-3 py-3 text-sm">
                    <p className="font-black text-slate-900">{STATUS_COPY[item.status] || item.status}</p>
                    {item.providerName ? <p className="font-semibold text-slate-600">{item.providerName}</p> : null}
                    {item.status === "verified" ? (
                      <p className="font-black text-[#0D5C3A]">Verified by SitGuru</p>
                    ) : null}
                    {item.expirationDate ? (
                      <p className="font-semibold text-slate-600">
                        Valid through {formatValidThrough(item.expirationDate)}
                      </p>
                    ) : null}
                    {item.rejectionReason ? <p className="mt-1 font-semibold text-slate-600">{item.rejectionReason}</p> : null}
                    {item.expiringSoon ? (
                      <p className="mt-1 font-semibold text-slate-600">Time for a quick credential refresh.</p>
                    ) : null}
                    {item.status === "verified" ? (
                      <button type="button" className="mt-2 min-h-11 text-sm font-black text-[#0D5C3A]" onClick={() => setDetailId(detailId === item.id ? "" : item.id)}>
                        View Details
                      </button>
                    ) : null}
                    {detailId === item.id ? (
                      <dl className="mt-2 grid gap-1 text-sm text-slate-700">
                        <div><dt className="font-black">Credential</dt><dd>{item.credentialName}</dd></div>
                        {item.issueDate ? <div><dt className="font-black">Completed</dt><dd>{item.issueDate}</dd></div> : null}
                        {item.reference ? <div><dt className="font-black">Reference, private to you</dt><dd>{item.reference}</dd></div> : null}
                      </dl>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {provider?.exploreUrl ? (
                  <a
                    href={provider.exploreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white"
                    onClick={() => {
                      void trackEvent({
                        eventName: "credential_provider_explore_clicked",
                        eventType: "credentials",
                        role: "guru",
                        source: "guru_dashboard",
                        metadata: {
                          credential_type: credentialAnalyticsSlug(type.slug),
                          provider: credentialAnalyticsSlug(provider.slug),
                          platform: "web",
                          source_surface: "guru_dashboard",
                        },
                      });
                    }}
                  >
                    {type.explore_label || "Learn More"}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full border border-[#0D5C3A] px-4 text-sm font-black text-[#0D5C3A]"
                  onClick={() => {
                    setActiveSlug(type.slug);
                    void trackEvent({
                      eventName: "credential_add_started",
                      eventType: "credentials",
                      role: "guru",
                      source: "guru_dashboard",
                      metadata: {
                        credential_type: credentialAnalyticsSlug(type.slug),
                        provider: credentialAnalyticsSlug(provider?.slug),
                        platform: "web",
                        source_surface: "guru_dashboard",
                      },
                    });
                  }}
                >
                  {type.add_label}
                </button>
              </div>
              <a href="/help/trust-credentials" className="mt-3 inline-flex text-xs font-bold text-slate-500 underline">
                How Trust & Credentials works
              </a>
            </article>
          );
        })}
      </div>

      {activeType ? (
        <form key={activeType.slug} onSubmit={onSubmit} className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Add {activeType.public_badge_label}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Have something worth showing off? Share what you already have. SitGuru reviews it before it appears publicly.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-800">
              Provider
              <select
                name="providerId"
                className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3"
                defaultValue={workspace.providers.find((item) => item.slug === activeType.default_provider_slug)?.id || ""}
              >
                <option value="">Choose a provider</option>
                {workspace.providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.provider_name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-800">
              Other provider name
              <input name="customProviderName" className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
            </label>
            <label className="text-sm font-bold text-slate-800 sm:col-span-2">
              Credential name
              <input name="credentialName" defaultValue={activeType.public_badge_label} className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Reference number
              <input name="reference" autoComplete="off" className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Verification link
              <input name="verificationUrl" type="url" className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Issue date
              <input name="issueDate" type="date" className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
            </label>
            <label className="text-sm font-bold text-slate-800">
              Expiration date
              <input name="expirationDate" type="date" required={activeType.requires_expiration} className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
              {activeType.requires_expiration ? null : (
                <span className="mt-1 block text-xs font-semibold text-slate-500">Only if the certificate shows an expiration date.</span>
              )}
            </label>
            {activeType.slug === "liability-insurance" || activeType.slug === "bonding" ? (
              <>
                <label className="text-sm font-bold text-slate-800 sm:col-span-2">
                  Named insured or business
                  <input name="namedInsured" className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
                </label>
                {activeType.slug === "liability-insurance" ? (
                  <label className="text-sm font-bold text-slate-800 sm:col-span-2">
                    Coverage limit, if you want SitGuru to see it privately
                    <input name="coverageLimit" className="mt-1 min-h-12 w-full rounded-2xl border border-slate-300 px-3" />
                  </label>
                ) : null}
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <input name="generalLiability" type="checkbox" /> General liability
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <input name="careCustodyControl" type="checkbox" /> Care, custody, and control
                </label>
              </>
            ) : null}
            <label className="text-sm font-bold text-slate-800 sm:col-span-2">
              Supporting document
              <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" className="mt-1 block w-full text-sm" />
            </label>
            <label className="text-sm font-bold text-slate-800 sm:col-span-2">
              Notes for the reviewer
              <textarea name="submissionNotes" rows={3} className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={busy} className="min-h-11 rounded-full bg-[#0D5C3A] px-5 text-sm font-black text-white disabled:opacity-60">
              {busy ? "Sending…" : "Submit for review"}
            </button>
            <button type="button" className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-bold text-slate-700" onClick={() => setActiveSlug("")}>
              Close
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
