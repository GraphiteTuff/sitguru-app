"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import SupportFilterBar from "@/components/admin/support/SupportFilterBar";
import SupportQueueGrid from "@/components/admin/support/SupportQueueGrid";
import SupportTicketDrawer from "@/components/admin/support/SupportTicketDrawer";
import {
  SupportToastStack,
  useSupportToasts,
} from "@/components/admin/support/SupportToast";
import { createClient } from "@/lib/supabase/client";
import type { SupportAdminOption } from "@/lib/admin/support/data";
import type {
  SupportCase,
  SupportFilters,
  SupportSenderProfile,
} from "@/lib/admin/support/types";
import {
  filterAndSortCases,
  normalizeSupportCase,
} from "@/lib/admin/support/utils";

type SupportDashboardClientProps = {
  initialCases: SupportCase[];
  assignees: SupportAdminOption[];
  filters: SupportFilters;
  filteredTotal: number;
  total: number;
};

export default function SupportDashboardClient({
  initialCases,
  assignees,
  filters,
  filteredTotal,
  total,
}: SupportDashboardClientProps) {
  const [cases, setCases] = useState(initialCases);
  const [selectedId, setSelectedId] = useState<string | null>(
    filters.caseId
      ? initialCases.find(
          (item) =>
            item.id === filters.caseId ||
            item.intakeNumber.toLowerCase() === filters.caseId.toLowerCase()
        )?.id || null
      : null
  );
  const [sender, setSender] = useState<SupportSenderProfile | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [liveState, setLiveState] = useState<"connecting" | "live" | "idle">(
    "connecting"
  );
  const [, startTransition] = useTransition();
  const { toasts, pushToast, dismissToast } = useSupportToasts();

  const visibleCases = useMemo(
    () => filterAndSortCases(cases, filters),
    [cases, filters]
  );

  const selectedCase =
    visibleCases.find((item) => item.id === selectedId) ||
    cases.find((item) => item.id === selectedId) ||
    null;

  const upsertCase = useCallback((next: SupportCase) => {
    startTransition(() => {
      setCases((current) => {
        const index = current.findIndex((item) => item.id === next.id);
        if (index === -1) return [next, ...current];
        const copy = [...current];
        copy[index] = next;
        return copy;
      });
    });
  }, []);

  const patchCase = useCallback(
    async (
      caseId: string,
      payload: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        notes?: string;
        replyBody?: string;
        sendEmail?: boolean;
      }
    ) => {
      setPendingId(caseId);

      try {
        const response = await fetch(`/api/admin/support/cases/${caseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as {
          ok?: boolean;
          case?: SupportCase;
          sender?: SupportSenderProfile | null;
          emailStatus?: string;
          error?: string;
          message?: string;
        };

        if (!response.ok || !data.case) {
          pushToast(data.error || "Update failed. Try again.", "error");
          return;
        }

        upsertCase(data.case);
        if (data.sender !== undefined) setSender(data.sender || null);

        const emailNote =
          data.emailStatus === "sent"
            ? " Email sent."
            : data.emailStatus === "failed"
              ? " Email failed."
              : "";

        pushToast(`${data.message || "Case updated."}${emailNote}`, "success");
      } catch (error) {
        console.warn("Support patch failed:", error);
        pushToast("Network error while updating the ticket.", "error");
      } finally {
        setPendingId(null);
      }
    },
    [pushToast, upsertCase]
  );

  const openTicket = useCallback(
    async (item: SupportCase) => {
      setSelectedId(item.id);
      setSender(null);

      try {
        const response = await fetch(`/api/admin/support/cases/${item.id}`);
        const data = (await response.json()) as {
          case?: SupportCase;
          sender?: SupportSenderProfile | null;
          error?: string;
        };

        if (!response.ok || !data.case) {
          pushToast(data.error || "Could not load ticket workspace.", "error");
          return;
        }

        upsertCase(data.case);
        setSender(data.sender || null);
      } catch (error) {
        console.warn("Support case load failed:", error);
        pushToast("Could not load ticket workspace.", "error");
      }
    },
    [pushToast, upsertCase]
  );

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<
      ReturnType<typeof createClient>["channel"]
    > | null = null;
    let client: ReturnType<typeof createClient> | null = null;

    try {
      client = createClient();
      channel = client
        .channel("admin-support-intake")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_intake_cases",
          },
          (payload) => {
            if (!active) return;

            if (payload.eventType === "DELETE") {
              const deletedId = String(
                (payload.old as { id?: string } | null)?.id || ""
              );
              if (!deletedId) return;
              setCases((current) =>
                current.filter((item) => item.id !== deletedId)
              );
              return;
            }

            const row = payload.new as Record<string, unknown> | null;
            if (!row) return;
            const next = normalizeSupportCase(row, 0);
            upsertCase({
              ...next,
              messageBody:
                next.messageBody.length > 280
                  ? `${next.messageBody.slice(0, 280)}…`
                  : next.messageBody,
              replyThread: [],
            });
          }
        )
        .subscribe((status) => {
          if (!active) return;
          setLiveState(status === "SUBSCRIBED" ? "live" : "connecting");
        });
    } catch (error) {
      console.warn("Support realtime unavailable:", error);
      if (active) setLiveState("idle");
    }

    return () => {
      active = false;
      setLiveState("idle");
      if (client && channel) {
        void client.removeChannel(channel);
      }
    };
  }, [upsertCase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Live ticket queue
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Click a card to open the ticket workspace. Quick actions update
            without a full page reload.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
            liveState === "live"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              liveState === "live" ? "bg-emerald-600" : "bg-amber-500"
            }`}
          />
          {liveState === "live" ? "Realtime live" : "Connecting…"}
        </span>
      </div>

      <SupportFilterBar
        filters={filters}
        filteredTotal={filteredTotal || visibleCases.length}
        total={total || cases.length}
      />

      <SupportQueueGrid
        cases={visibleCases}
        assignees={assignees}
        selectedId={selectedId}
        pendingId={pendingId}
        highlightCaseId={filters.caseId}
        onOpen={openTicket}
        onResolve={(item) => patchCase(item.id, { status: "closed" })}
        onEscalate={(item) => patchCase(item.id, { priority: "urgent" })}
        onReassign={(item, assignee) =>
          patchCase(item.id, { assignedTo: assignee })
        }
      />

      <SupportTicketDrawer
        open={Boolean(selectedCase)}
        item={selectedCase}
        sender={sender}
        assignees={assignees}
        pending={pendingId === selectedCase?.id}
        onClose={() => setSelectedId(null)}
        onPatch={(payload) =>
          selectedCase
            ? patchCase(selectedCase.id, payload)
            : Promise.resolve()
        }
      />

      <SupportToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
