"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SafeConnection = {
  companyName: string;
  environment: string;
  realmId: string;
  connectedEmail: string;
  lastPushedAt: string | null;
  lastPushDocNumber: string | null;
  lastPushJournalId: string | null;
  lastPushError: string | null;
} | null;

type Setup = {
  configured: boolean;
  environment: string;
  redirectUri: string;
  hasClientId: boolean;
  hasClientSecret: boolean;
};

export function QuickBooksConnectPanel({
  setup,
  connection,
  lineCount,
  queryError,
  justConnected,
}: {
  setup: Setup;
  connection: SafeConnection;
  lineCount: number;
  queryError?: string;
  justConnected?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"push" | "disconnect" | null>(null);
  const [message, setMessage] = useState(
    justConnected
      ? "QuickBooks is connected. You can push the tax journal now."
      : queryError || "",
  );
  const [failed, setFailed] = useState(Boolean(queryError));

  async function pushJournal() {
    setBusy("push");
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/admin/financials/quickbooks/push", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        alreadyPushed?: boolean;
        journalId?: string;
        docNumber?: string;
        companyName?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "QuickBooks push failed.");
      }
      setMessage(
        payload.alreadyPushed
          ? `Already in QuickBooks as ${payload.docNumber}.`
          : `Pushed ${payload.docNumber} into ${payload.companyName || "QuickBooks"}.`,
      );
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "QuickBooks push failed.");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    setMessage("");
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

  return (
    <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-800">
        Live QuickBooks push
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">
        {connection ? `Connected to ${connection.companyName}` : "Connect SitGuru to QuickBooks"}
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {connection
          ? `Environment ${connection.environment}. ${lineCount.toLocaleString()} journal line${lineCount === 1 ? "" : "s"} ready to post. Sales tax stays a payable.`
          : setup.configured
            ? "Intuit keys are on the server. Connect the sandbox or live company, then push the tax journal."
            : "Add QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET on the server, plus the matching redirect URI in Intuit."}
      </p>

      {!setup.configured ? (
        <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
          Missing {setup.hasClientId ? "" : "Client ID"}
          {!setup.hasClientId && !setup.hasClientSecret ? " and " : ""}
          {setup.hasClientSecret ? "" : "Client Secret"}. Set them in Vercel /
          .env.local, then register this redirect URI in Intuit:
          <span className="mt-2 block break-all font-black">{setup.redirectUri}</span>
        </div>
      ) : null}

      {connection?.lastPushError ? (
        <p className="mt-4 text-sm font-bold text-rose-700">{connection.lastPushError}</p>
      ) : null}

      {message ? (
        <p className={`mt-4 text-sm font-bold ${failed ? "text-rose-700" : "text-emerald-800"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {connection ? (
          <>
            <button
              type="button"
              onClick={pushJournal}
              disabled={busy !== null || lineCount === 0}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-black !text-white disabled:opacity-60"
              style={{ background: "#0D5C3A" }}
            >
              {busy === "push" ? "Pushing…" : "Push to QuickBooks"}
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={busy !== null}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800"
            >
              {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
            </button>
          </>
        ) : setup.configured ? (
          <a
            href="/api/admin/financials/quickbooks/connect"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-black !text-white"
            style={{ background: "#0D5C3A" }}
          >
            Connect QuickBooks
          </a>
        ) : null}
      </div>

      {connection?.lastPushedAt ? (
        <p className="mt-4 text-xs font-semibold text-slate-500">
          Last push {new Date(connection.lastPushedAt).toLocaleString()} ·{" "}
          {connection.lastPushDocNumber}
          {connection.lastPushJournalId ? ` · QBO ${connection.lastPushJournalId}` : ""}
        </p>
      ) : null}
    </div>
  );
}
