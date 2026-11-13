"use client";

/**
 * Account controls to view, correct, and forget AI companion memories.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MemoryRow = {
  id: string;
  key: string;
  value: string;
  category: string;
  scope: string;
  companion_id: string | null;
  is_active: boolean;
  updated_at: string;
};

type Settings = {
  memory_enabled: boolean;
};

export default function CompanionMemoriesPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [settings, setSettings] = useState<Settings>({ memory_enabled: true });
  const [draftKey, setDraftKey] = useState("preferred_care_type");
  const [draftValue, setDraftValue] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSignedIn(false);
        setMemories([]);
        setLoading(false);
        return;
      }
      setSignedIn(true);
      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };
      const [memRes, setRes] = await Promise.all([
        fetch("/api/companions/memories", { headers, credentials: "include" }),
        fetch("/api/companions/memory-settings", {
          headers,
          credentials: "include",
        }),
      ]);
      const memJson = (await memRes.json().catch(() => ({}))) as {
        memories?: MemoryRow[];
        error?: string;
      };
      const setJson = (await setRes.json().catch(() => ({}))) as {
        settings?: Settings;
        error?: string;
      };
      if (!memRes.ok) {
        setError(memJson.error || "Unable to load memories.");
      } else {
        setMemories(
          (memJson.memories || []).filter((row) => row.is_active !== false),
        );
      }
      if (setRes.ok && setJson.settings) {
        setSettings(setJson.settings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load memories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function withAuthHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Sign in required.");
    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }

  async function toggleMemoryEnabled(next: boolean) {
    setSaving(true);
    setError(null);
    try {
      const headers = await withAuthHeaders();
      const res = await fetch("/api/companions/memory-settings", {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ memoryEnabled: next }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        settings?: Settings;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Update failed.");
      setSettings(json.settings || { memory_enabled: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function forgetMemory(memoryId: string) {
    setSaving(true);
    setError(null);
    try {
      const headers = await withAuthHeaders();
      const res = await fetch("/api/companions/memories", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ action: "forget", memoryId }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Forget failed.");
      setMemories((current) => current.filter((row) => row.id !== memoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forget failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMemory() {
    const value = draftValue.trim();
    if (!value) return;
    setSaving(true);
    setError(null);
    try {
      const headers = await withAuthHeaders();
      const res = await fetch("/api/companions/memories", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          key: draftKey.trim() || "preference",
          value,
          category: "preference",
          scope: "shared",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        memory?: MemoryRow;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Save failed.");
      setDraftValue("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!signedIn && !loading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Companion memories
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in to view, correct, or forget preferences saved with Rogue,
          Scout, Taco, and Delilah.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
        Companion memories
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Explicit preferences you asked companions to remember. This is separate
        from your pet profiles and bookings — forgetting a preference never
        deletes a pet or booking.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#0D5C3A]"
            checked={settings.memory_enabled}
            disabled={saving || loading}
            onChange={(event) => void toggleMemoryEnabled(event.target.checked)}
          />
          Allow companions to save lasting memories
        </label>
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-[44px] rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          disabled={loading || saving}
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading memories…</p>
        ) : memories.length === 0 ? (
          <p className="text-sm text-slate-500">
            No saved preferences yet. In chat, say “Remember that I prefer
            boarding.”
          </p>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                  {memory.category}
                  {memory.scope === "companion" && memory.companion_id
                    ? ` · ${memory.companion_id}`
                    : " · shared"}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {memory.key.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {memory.value}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void forgetMemory(memory.id)}
                disabled={saving}
                className="min-h-[44px] shrink-0 rounded-full border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Forget
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-900">
          Save or correct a preference
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
          <input
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="key"
            className="min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
            aria-label="Memory key"
          />
          <input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            placeholder="I prefer boarding within 10 miles"
            className="min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
            aria-label="Memory value"
          />
          <button
            type="button"
            onClick={() => void saveMemory()}
            disabled={saving || !draftValue.trim() || !settings.memory_enabled}
            className="min-h-[44px] rounded-full bg-[#0D5C3A] px-5 text-sm font-semibold text-white hover:bg-[#0a4a2e] disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </section>
  );
}
