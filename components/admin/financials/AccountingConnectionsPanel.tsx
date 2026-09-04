"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SafeAccountingConnection, AccountingBusiness, TaxProfessionalRecord } from "@/lib/admin/financials/accounting/types";

type QboSetup = {
  configured: boolean;
  environment: string;
  redirectUri: string;
  hasClientId: boolean;
  hasClientSecret: boolean;
};

type QboConnection = {
  companyName: string;
  environment: string;
  lastPushedAt: string | null;
  lastPushDocNumber: string | null;
  lastPushError: string | null;
} | null;

type WaveSetup = {
  configured: boolean;
  redirectUri: string;
  hasClientId: boolean;
  hasClientSecret: boolean;
};

function syncBadge(label: string, tone: "ok" | "warn" | "err" | "idle") {
  const classes =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "err"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${classes}`}
    >
      {label}
    </span>
  );
}

export function AccountingConnectionsPanel({
  qboSetup,
  qboConnection,
  waveSetup,
  waveEnabled,
  waveConnection,
  waveBusinesses,
  waveNotice,
  taxProfessional,
  taxYear,
}: {
  qboSetup: QboSetup;
  qboConnection: QboConnection;
  waveSetup: WaveSetup;
  waveEnabled: boolean;
  waveConnection: SafeAccountingConnection | null;
  waveBusinesses: AccountingBusiness[];
  waveNotice?: string;
  taxProfessional: TaxProfessionalRecord;
  taxYear: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState(waveNotice || "");
  const [failed, setFailed] = useState(
    Boolean(waveNotice && !["connected", "pick", "coming_soon"].includes(waveNotice)),
  );

  const waveComingSoon = !waveEnabled || !waveSetup.configured;
  const waveConnected = Boolean(waveConnection && waveConnection.status === "connected");
  const needsBusiness = Boolean(
    waveConnection && waveConnection.status === "action_required",
  );

  const toast = useMemo(() => {
    if (waveNotice === "connected") return "Wave connected successfully.";
    if (waveNotice === "pick") return "Choose the Wave business SitGuru should keep books for.";
    if (waveNotice === "coming_soon") {
      return "Wave is ready in Tax Center. Add WAVE_CLIENT_ID and WAVE_CLIENT_SECRET, then enable WAVE_ACCOUNTING_ENABLED.";
    }
    return message;
  }, [message, waveNotice]);

  async function postJson(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      detail?: string;
    } | null;
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || payload?.detail || "Request failed.");
    }
    return payload;
  }

  async function disconnectWave() {
    setBusy("wave-disconnect");
    setFailed(false);
    try {
      await postJson("/api/tax/wave/disconnect");
      setMessage("Wave disconnected.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Disconnect failed.");
    } finally {
      setBusy(null);
    }
  }

  async function syncWave() {
    setBusy("wave-sync");
    setFailed(false);
    try {
      const payload = await postJson("/api/tax/wave/sync");
      setMessage(payload?.detail || "Wave read-only check finished.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Wave sync failed.");
    } finally {
      setBusy(null);
    }
  }

  async function chooseBusiness(business: AccountingBusiness) {
    setBusy(`wave-biz-${business.id}`);
    setFailed(false);
    try {
      await postJson("/api/tax/wave/businesses", {
        businessId: business.id,
        businessName: business.name,
      });
      setMessage("Wave connected successfully.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save Wave business.");
    } finally {
      setBusy(null);
    }
  }

  async function disconnectQbo() {
    setBusy("qbo-disconnect");
    setFailed(false);
    try {
      const response = await fetch("/api/admin/financials/quickbooks/disconnect", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Could not disconnect QuickBooks.");
      setMessage("QuickBooks disconnected.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Disconnect failed.");
    } finally {
      setBusy(null);
    }
  }

  async function markSent() {
    setBusy("tax-sent");
    setFailed(false);
    try {
      await postJson("/api/tax/professional");
      setMessage("Marked sent to tax professional. Hand the CSV to Block Advisors or your CPA.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not update tax professional.");
    } finally {
      setBusy(null);
    }
  }

  const cardClass =
    "rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6";
  const titleClass = "mt-1 text-xl font-black !text-slate-950";
  const bodyClass = "mt-2 text-sm font-semibold leading-6 !text-slate-700";
  const kickerClass =
    "text-[10px] font-black uppercase tracking-[0.18em] !text-emerald-800";

  return (
    <section className="space-y-4">
      <div className={cardClass}>
        <p className="text-xs font-black uppercase tracking-[0.28em] !text-emerald-800">
          Accounting & Tax Prep Connections
        </p>
        <p className="mt-2 text-2xl font-black leading-tight !text-slate-950">
          Keep books in QuickBooks, Wave, or a manual tax package.
        </p>
        <p className={`max-w-3xl ${bodyClass}`}>
          SitGuru stays the source of truth for marketplace activity. QuickBooks is
          the premium books path. Wave is the lower-cost bookkeeping path H&amp;R
          Block promotes, so Block Advisors can prepare returns from tax-ready
          records. There is no H&amp;R Block filing API — 2025 cleanup still goes
          to Block Advisors by hand.
        </p>
      </div>

      {toast ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            failed
              ? "border-rose-200 bg-rose-50 !text-rose-800"
              : "border-emerald-100 bg-emerald-50 !text-emerald-900"
          }`}
        >
          {toast}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <article className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={kickerClass}>Premium option</p>
              <p className={titleClass}>QuickBooks Online</p>
            </div>
            {qboConnection
              ? syncBadge("Connected to QuickBooks", "ok")
              : syncBadge("Not connected", "idle")}
          </div>
          <p className={bodyClass}>
            Keep the current Intuit company for businesses that already live in
            QuickBooks. Existing SitGuru journal push is unchanged.
          </p>
          {qboConnection ? (
            <p className="mt-3 text-xs font-semibold !text-slate-600">
              {qboConnection.companyName} · {qboConnection.environment}
              {qboConnection.lastPushedAt
                ? ` · Last push ${new Date(qboConnection.lastPushedAt).toLocaleString()}`
                : " · No journal pushed yet"}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            {qboConnection ? (
              <>
                <a
                  href="/admin/financials/tax-reports/quickbooks"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white"
                  style={{ background: "#0D5C3A" }}
                >
                  Sync Now
                </a>
                <a
                  href="https://qbo.intuit.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
                >
                  Open QuickBooks
                </a>
                <a
                  href="/api/admin/financials/quickbooks/connect"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
                >
                  Reconnect
                </a>
                <button
                  type="button"
                  onClick={() => void disconnectQbo()}
                  disabled={busy !== null}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 disabled:opacity-60"
                >
                  {busy === "qbo-disconnect" ? "Disconnecting…" : "Disconnect"}
                </button>
              </>
            ) : qboSetup.configured ? (
              <a
                href="/api/admin/financials/quickbooks/connect"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-black !text-white"
                style={{ background: "#0D5C3A" }}
              >
                Connect QuickBooks
              </a>
            ) : (
              <span className="inline-flex min-h-12 items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-950">
                Coming soon · add Intuit keys
              </span>
            )}
          </div>
        </article>

        <article className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={kickerClass}>Lower-cost option</p>
              <p className={titleClass}>Wave Accounting</p>
            </div>
            {waveConnected
              ? syncBadge("Connected to Wave", "ok")
              : needsBusiness
                ? syncBadge("Action required", "warn")
                : syncBadge("Not connected", "idle")}
          </div>
          <p className={bodyClass}>
            Affordable bookkeeping and tax-ready financial records. Wave is H&amp;R
            Block&apos;s self-service books tool — not a tax filing service.
          </p>
          <p className="mt-2 text-xs font-semibold !text-slate-600">
            Wave Pro subscription required for direct SitGuru connection. Check
            Wave for current pricing.
          </p>
          {waveConnection ? (
            <p className="mt-3 text-xs font-semibold !text-slate-600">
              {waveConnection.businessName || "Business not selected"}
              {waveConnection.lastSyncAt
                ? ` · Last synchronized ${waveConnection.lastSyncLabel}`
                : " · Never synchronized"}
            </p>
          ) : null}

          {needsBusiness || (waveNotice === "pick" && waveBusinesses.length > 0) ? (
            <div className="mt-4 space-y-2">
              {waveBusinesses.map((business) => (
                <button
                  key={business.id}
                  type="button"
                  onClick={() => void chooseBusiness(business)}
                  disabled={busy !== null}
                  className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-emerald-100 bg-[#f7fffb] px-4 text-left text-sm font-black text-emerald-950"
                >
                  <span>{business.name}</span>
                  <span className="text-xs font-bold text-emerald-700">Use this business</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {waveComingSoon ? (
              <span className="inline-flex min-h-12 items-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-950">
                Coming soon
              </span>
            ) : waveConnected || needsBusiness ? (
              <>
                <button
                  type="button"
                  onClick={() => void syncWave()}
                  disabled={busy !== null}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white disabled:opacity-60"
                  style={{ background: "#0D5C3A" }}
                >
                  {busy === "wave-sync" ? "Checking…" : "Sync Now"}
                </button>
                <a
                  href="https://www.waveapps.com/tax-season"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
                >
                  Open Wave
                </a>
                <a
                  href="/api/tax/wave/connect?reconnect=1"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
                >
                  Reconnect
                </a>
                <button
                  type="button"
                  onClick={() => void disconnectWave()}
                  disabled={busy !== null}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 disabled:opacity-60"
                >
                  {busy === "wave-disconnect" ? "Disconnecting…" : "Disconnect"}
                </button>
              </>
            ) : (
              <a
                href="/api/tax/wave/connect"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-black !text-white"
                style={{ background: "#0D5C3A" }}
              >
                Connect Wave
              </a>
            )}
          </div>
        </article>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <article className={cardClass}>
          <p className={kickerClass}>Works with any CPA</p>
          <p className={titleClass}>Prepare Tax Package</p>
          <p className={bodyClass}>
            Export SitGuru records even if neither QuickBooks nor Wave is
            connected. Give the file to Block Advisors, a CPA, or an Enrolled
            Agent. This is not an IRS return.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`/api/tax/package?year=${taxYear}`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-black !text-white"
              style={{ background: "#0D5C3A" }}
            >
              Export for Tax Professional
            </a>
            <a
              href="/api/admin/financials/tax-reports/export?format=pdf"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
            >
              Tax Center PDF
            </a>
          </div>
        </article>

        <article className={cardClass}>
          <p className={kickerClass}>Tax professional</p>
          <p className={titleClass}>
            {taxProfessional.name || taxProfessional.firm || "Not assigned"}
          </p>
          <p className={bodyClass}>
            {taxYear} status:{" "}
            {taxProfessional.returnStatus.replace(/_/g, " ")}. For 2025 cleanup,
            send the package to Block Advisors manually. SitGuru does not connect
            to an H&amp;R Block filing API.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={`/api/tax/package?year=${taxYear}`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800"
            >
              Export Tax Package
            </a>
            <button
              type="button"
              onClick={() => void markSent()}
              disabled={busy !== null}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-black !text-white disabled:opacity-60"
              style={{ background: "#0D5C3A" }}
            >
              {busy === "tax-sent" ? "Saving…" : "Mark Sent to Tax Professional"}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
