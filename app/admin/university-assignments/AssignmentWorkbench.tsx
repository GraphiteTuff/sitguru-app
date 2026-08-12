"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  GraduationCap,
  Loader2,
  PawPrint,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  assignAcademy,
  bulkAssignAcademy,
  toggleAcademyAssignment,
  unassignAcademy,
} from "@/app/admin/university-assignments/actions";
import type { AcademyType } from "@/app/admin/university-assignments/types";

export type WorkbenchPerson = {
  userId: string;
  displayName: string;
  email: string;
  initials: string;
  roleLabel: string;
  role: string;
  guruId: string;
  petParentId: string;
  ambassadorId: string;
};

export type WorkbenchAssignment = {
  id: string;
  userId: string;
  academyType: AcademyType;
  isActive: boolean;
  certificateIssued: boolean;
};

type RoleTab = "pet_parent" | "guru" | "ambassador";
type StatusFilter = "needs" | "assigned" | "all";

const ROLE_TABS: {
  id: RoleTab;
  label: string;
  academy: AcademyType;
  academyLabel: string;
  icon: typeof PawPrint;
}[] = [
  {
    id: "pet_parent",
    label: "Pet Parents",
    academy: "pet_parent",
    academyLabel: "Pet Parent Academy",
    icon: PawPrint,
  },
  {
    id: "guru",
    label: "Gurus",
    academy: "guru",
    academyLabel: "Guru Academy",
    icon: GraduationCap,
  },
  {
    id: "ambassador",
    label: "Ambassadors",
    academy: "ambassador",
    academyLabel: "Ambassador Academy",
    icon: Sparkles,
  },
];

const ACADEMY_CHIPS: {
  value: AcademyType;
  shortLabel: string;
}[] = [
  { value: "pet_parent", shortLabel: "Pet Parent" },
  { value: "guru", shortLabel: "Guru" },
  { value: "ambassador", shortLabel: "Ambassador" },
];

function personInTab(person: WorkbenchPerson, tab: RoleTab) {
  if (tab === "guru") {
    return person.role === "guru" || Boolean(person.guruId);
  }
  if (tab === "pet_parent") {
    return person.role === "pet_parent" || Boolean(person.petParentId);
  }
  return person.role === "ambassador" || Boolean(person.ambassadorId);
}

function matchesQuery(person: WorkbenchPerson, query: string) {
  if (!query) return true;
  const haystack = `${person.displayName} ${person.email} ${person.roleLabel}`
    .toLowerCase()
    .trim();
  return haystack.includes(query.toLowerCase());
}

function getAssignedSet(
  assignmentsByUser: Map<string, Set<AcademyType>>,
  userId: string,
) {
  return assignmentsByUser.get(userId) || new Set<AcademyType>();
}

export default function AssignmentWorkbench({
  people,
  assignments,
  stepCounts,
}: {
  people: WorkbenchPerson[];
  assignments: WorkbenchAssignment[];
  stepCounts: Record<AcademyType, number>;
}) {
  const [tab, setTab] = useState<RoleTab>("guru");
  const [status, setStatus] = useState<StatusFilter>("needs");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [localAssignments, setLocalAssignments] =
    useState<WorkbenchAssignment[]>(assignments);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTab = ROLE_TABS.find((item) => item.id === tab) || ROLE_TABS[1];

  const assignmentsByUser = useMemo(() => {
    const map = new Map<string, Set<AcademyType>>();
    for (const row of localAssignments) {
      if (row.isActive === false) continue;
      const set = map.get(row.userId) || new Set<AcademyType>();
      set.add(row.academyType);
      map.set(row.userId, set);
    }
    return map;
  }, [localAssignments]);

  const tabPeople = useMemo(() => {
    return people.filter((person) => personInTab(person, tab));
  }, [people, tab]);

  const needsCount = useMemo(() => {
    return tabPeople.filter(
      (person) => !getAssignedSet(assignmentsByUser, person.userId).has(activeTab.academy),
    ).length;
  }, [tabPeople, assignmentsByUser, activeTab.academy]);

  const assignedCount = tabPeople.length - needsCount;

  const tabCounts = useMemo(() => {
    const counts: Record<RoleTab, { total: number; needs: number }> = {
      pet_parent: { total: 0, needs: 0 },
      guru: { total: 0, needs: 0 },
      ambassador: { total: 0, needs: 0 },
    };

    for (const roleTab of ROLE_TABS) {
      const cohort = people.filter((person) => personInTab(person, roleTab.id));
      counts[roleTab.id].total = cohort.length;
      counts[roleTab.id].needs = cohort.filter(
        (person) =>
          !getAssignedSet(assignmentsByUser, person.userId).has(roleTab.academy),
      ).length;
    }

    return counts;
  }, [people, assignmentsByUser]);

  const visiblePeople = useMemo(() => {
    return tabPeople
      .filter((person) => matchesQuery(person, query.trim()))
      .filter((person) => {
        const hasAcademy = getAssignedSet(
          assignmentsByUser,
          person.userId,
        ).has(activeTab.academy);
        if (status === "needs") return !hasAcademy;
        if (status === "assigned") return hasAcademy;
        return true;
      })
      .sort((a, b) => {
        const aHas = getAssignedSet(assignmentsByUser, a.userId).has(
          activeTab.academy,
        )
          ? 1
          : 0;
        const bHas = getAssignedSet(assignmentsByUser, b.userId).has(
          activeTab.academy,
        )
          ? 1
          : 0;
        if (aHas !== bHas) return aHas - bHas;
        return a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
          numeric: true,
        });
      });
  }, [tabPeople, query, status, assignmentsByUser, activeTab.academy]);

  const selectedVisibleIds = visiblePeople
    .map((person) => person.userId)
    .filter((id) => selected.has(id));

  function setAssignedLocal(userId: string, academyType: AcademyType, on: boolean) {
    setLocalAssignments((prev) => {
      const without = prev.filter(
        (row) => !(row.userId === userId && row.academyType === academyType),
      );
      if (!on) return without;
      return [
        ...without,
        {
          id: `local-${userId}-${academyType}`,
          userId,
          academyType,
          isActive: true,
          certificateIssued: false,
        },
      ];
    });
  }

  function runAction(
    key: string,
    action: () => Promise<{ ok: boolean; message?: string; assigned?: number }>,
    onSuccess?: () => void,
  ) {
    setMessage(null);
    setPendingKey(key);
    startTransition(async () => {
      const result = await action();
      setPendingKey(null);
      if (!result.ok) {
        setMessage({
          tone: "error",
          text: result.message || "Assignment update failed",
        });
        return;
      }
      onSuccess?.();
      setMessage({
        tone: "success",
        text:
          result.message ||
          (typeof result.assigned === "number"
            ? `Assigned ${result.assigned} people`
            : "Assignment updated"),
      });
    });
  }

  function handlePrimaryToggle(person: WorkbenchPerson, currentlyAssigned: boolean) {
    const academy = activeTab.academy;
    const key = `${person.userId}:${academy}`;
    if (currentlyAssigned) {
      runAction(
        key,
        () => unassignAcademy(person.userId, academy),
        () => setAssignedLocal(person.userId, academy, false),
      );
      return;
    }
    runAction(
      key,
      () => assignAcademy(person.userId, academy),
      () => setAssignedLocal(person.userId, academy, true),
    );
  }

  function handleChipToggle(
    person: WorkbenchPerson,
    academy: AcademyType,
    currentlyAssigned: boolean,
  ) {
    const key = `chip:${person.userId}:${academy}`;
    runAction(
      key,
      () => toggleAcademyAssignment(person.userId, academy, !currentlyAssigned),
      () => setAssignedLocal(person.userId, academy, !currentlyAssigned),
    );
  }

  function handleBulkAssign() {
    const ids = selectedVisibleIds.length
      ? selectedVisibleIds
      : visiblePeople
          .filter(
            (person) =>
              !getAssignedSet(assignmentsByUser, person.userId).has(
                activeTab.academy,
              ),
          )
          .map((person) => person.userId);

    if (!ids.length) {
      setMessage({
        tone: "error",
        text: "No people selected that need this academy",
      });
      return;
    }

    runAction(
      "bulk",
      () => bulkAssignAcademy(ids, activeTab.academy),
      () => {
        for (const id of ids) {
          setAssignedLocal(id, activeTab.academy, true);
        }
        setSelected(new Set());
      },
    );
  }

  function toggleSelected(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    const ids = visiblePeople.map((person) => person.userId);
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        {ROLE_TABS.map((roleTab) => {
          const Icon = roleTab.icon;
          const counts = tabCounts[roleTab.id];
          const active = tab === roleTab.id;
          return (
            <button
              key={roleTab.id}
              type="button"
              onClick={() => {
                setTab(roleTab.id);
                setStatus("needs");
                setSelected(new Set());
              }}
              className={`rounded-[22px] border p-4 text-left transition ${
                active
                  ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-100"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950">
                    {roleTab.label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {counts.needs} need {roleTab.academyLabel.replace(" Academy", "")}
                    {" · "}
                    {counts.total} total
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Assign in one click
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {activeTab.academyLabel}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {stepCounts[activeTab.academy] || 0} required steps ·{" "}
              {needsCount} still need this academy · {assignedCount} already assigned
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-[240px] flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by name or email..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["needs", `Needs (${needsCount})`],
                  ["assigned", `Assigned (${assignedCount})`],
                  ["all", `All (${tabPeople.length})`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={`rounded-full px-3 py-2 text-xs font-black transition ${
                    status === value
                      ? "bg-emerald-700 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {message ? (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
              message.tone === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-900"
                : "border-rose-100 bg-rose-50 text-rose-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={
                visiblePeople.length > 0 &&
                visiblePeople.every((person) => selected.has(person.userId))
              }
              onChange={toggleSelectAllVisible}
              className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            />
            Select visible ({visiblePeople.length})
          </label>

          <button
            type="button"
            onClick={handleBulkAssign}
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {pendingKey === "bulk" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Users size={16} />
            )}
            {selectedVisibleIds.length
              ? `Assign ${selectedVisibleIds.length} selected`
              : `Assign all needing (${needsCount})`}
          </button>
        </div>

        <div className="mt-4 max-h-[62vh] space-y-2 overflow-y-auto pr-1">
          {visiblePeople.length ? (
            visiblePeople.map((person) => {
              const assigned = getAssignedSet(assignmentsByUser, person.userId);
              const hasPrimary = assigned.has(activeTab.academy);
              const rowPending =
                pendingKey === `${person.userId}:${activeTab.academy}` ||
                pendingKey?.startsWith(`chip:${person.userId}:`);

              return (
                <div
                  key={person.userId}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(person.userId)}
                      onChange={() => toggleSelected(person.userId)}
                      className="mt-3 h-4 w-4 rounded border-slate-300 text-emerald-700"
                      aria-label={`Select ${person.displayName}`}
                    />
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-xs font-black text-white">
                      {person.initials || "SG"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {person.displayName}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {person.email || "No email"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ACADEMY_CHIPS.map((chip) => {
                          const on = assigned.has(chip.value);
                          const chipPending =
                            pendingKey === `chip:${person.userId}:${chip.value}`;
                          return (
                            <button
                              key={chip.value}
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleChipToggle(person, chip.value, on)
                              }
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] transition disabled:opacity-60 ${
                                on
                                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                                  : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                              }`}
                              title={
                                on
                                  ? `Remove ${chip.shortLabel} Academy`
                                  : `Add ${chip.shortLabel} Academy`
                              }
                            >
                              {chipPending ? "…" : on ? "✓ " : "+ "}
                              {chip.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePrimaryToggle(person, hasPrimary)}
                    className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition disabled:opacity-60 ${
                      hasPrimary
                        ? "border border-emerald-200 bg-white text-emerald-800 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200"
                        : "bg-emerald-700 text-white hover:bg-emerald-800"
                    }`}
                  >
                    {rowPending &&
                    pendingKey === `${person.userId}:${activeTab.academy}` ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : hasPrimary ? (
                      <CheckCircle2 size={16} />
                    ) : null}
                    {hasPrimary
                      ? "Assigned · click to remove"
                      : `Assign ${activeTab.label.replace(/s$/, "")}`}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center text-sm font-bold text-emerald-900">
              No {activeTab.label.toLowerCase()} match this filter. Switch status
              chips or clear search.
            </div>
          )}
        </div>
      </section>

      {selectedVisibleIds.length > 0 ? (
        <div className="sticky bottom-4 z-10 rounded-[24px] border border-emerald-200 bg-emerald-800 px-4 py-3 text-white shadow-lg shadow-emerald-900/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black">
              {selectedVisibleIds.length} selected · assign {activeTab.academyLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-2xl border border-white/30 px-4 py-2 text-xs font-black text-white transition hover:bg-white/10"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleBulkAssign}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-black text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-60"
              >
                {pendingKey === "bulk" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                Assign selected
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
