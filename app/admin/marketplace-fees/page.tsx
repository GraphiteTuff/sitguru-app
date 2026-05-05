"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type MarketplaceFeeRule = {
  id: string;
  locality_name: string;
  description: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_miles: number | null;
  fee_percent: number;
  priority: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type FeeRuleForm = {
  locality_name: string;
  description: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  radius_miles: string;
  fee_percent: string;
  priority: string;
  is_active: boolean;
};

const emptyForm: FeeRuleForm = {
  locality_name: "",
  description: "",
  country: "US",
  state: "",
  city: "",
  postal_code: "",
  latitude: "",
  longitude: "",
  radius_miles: "",
  fee_percent: "15",
  priority: "100",
  is_active: true,
};

const stateOptions = [
  "", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
  "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
];

function cleanNullableString(value: string) {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function toNullableNumber(value: string) {
  const cleaned = value.trim();

  if (!cleaned) return null;

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return parsed;
}

function clampFeePercent(value: string) {
  const parsed = toNumber(value, 15);
  return Math.min(20, Math.max(15, parsed));
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ruleTypeLabel(rule: MarketplaceFeeRule) {
  if (rule.postal_code) return "ZIP rule";
  if (rule.latitude !== null && rule.longitude !== null && rule.radius_miles !== null) {
    return "Radius rule";
  }
  if (rule.city && rule.state) return "City/state rule";
  if (rule.state) return "State rule";
  return "Default rule";
}

function ruleLocationLabel(rule: MarketplaceFeeRule) {
  if (rule.postal_code) {
    return [rule.postal_code, rule.city, rule.state].filter(Boolean).join(" · ");
  }

  if (rule.latitude !== null && rule.longitude !== null && rule.radius_miles !== null) {
    return `${rule.radius_miles} mi around ${rule.latitude}, ${rule.longitude}`;
  }

  if (rule.city || rule.state) {
    return [rule.city, rule.state].filter(Boolean).join(", ");
  }

  return "All unmatched bookings";
}

function formFromRule(rule: MarketplaceFeeRule): FeeRuleForm {
  return {
    locality_name: rule.locality_name || "",
    description: rule.description || "",
    country: rule.country || "US",
    state: rule.state || "",
    city: rule.city || "",
    postal_code: rule.postal_code || "",
    latitude: rule.latitude === null ? "" : String(rule.latitude),
    longitude: rule.longitude === null ? "" : String(rule.longitude),
    radius_miles: rule.radius_miles === null ? "" : String(rule.radius_miles),
    fee_percent: String(rule.fee_percent || 15),
    priority: String(rule.priority || 100),
    is_active: Boolean(rule.is_active),
  };
}

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
}

function labelClass() {
  return "mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-600";
}

export default function AdminMarketplaceFeesPage() {
  const [rules, setRules] = useState<MarketplaceFeeRule[]>([]);
  const [form, setForm] = useState<FeeRuleForm>(emptyForm);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.is_active),
    [rules],
  );

  const defaultRule = useMemo(
    () =>
      rules.find(
        (rule) =>
          !rule.postal_code &&
          !rule.city &&
          !rule.state &&
          rule.latitude === null &&
          rule.longitude === null &&
          rule.radius_miles === null,
      ) || null,
    [rules],
  );

  async function loadRules() {
    setLoading(true);
    setPageError("");
    setMessage("");

    const { data, error } = await supabase
      .from("marketplace_fee_rules")
      .select(
        "id,locality_name,description,country,state,city,postal_code,latitude,longitude,radius_miles,fee_percent,priority,is_active,starts_at,ends_at,created_at,updated_at",
      )
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setPageError(error.message || "Unable to load marketplace fee rules.");
      setRules([]);
      setLoading(false);
      return;
    }

    setRules((data || []) as MarketplaceFeeRule[]);
    setLoading(false);
  }

  useEffect(() => {
    loadRules();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingRuleId(null);
    setMessage("");
    setPageError("");
  }

  function validateForm() {
    const feePercent = clampFeePercent(form.fee_percent);

    if (!form.locality_name.trim()) {
      return "Locality name is required.";
    }

    if (feePercent < 15 || feePercent > 20) {
      return "Fee percent must be between 15 and 20.";
    }

    const hasAnyRadiusField =
      form.latitude.trim() || form.longitude.trim() || form.radius_miles.trim();

    const hasAllRadiusFields =
      form.latitude.trim() && form.longitude.trim() && form.radius_miles.trim();

    if (hasAnyRadiusField && !hasAllRadiusFields) {
      return "Radius rules need latitude, longitude, and radius miles.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setPageError("");
    setMessage("");

    const validationMessage = validateForm();

    if (validationMessage) {
      setPageError(validationMessage);
      setSaving(false);
      return;
    }

    const payload = {
      locality_name: form.locality_name.trim(),
      description: cleanNullableString(form.description),
      country: cleanNullableString(form.country) || "US",
      state: cleanNullableString(form.state.toUpperCase()),
      city: cleanNullableString(form.city),
      postal_code: cleanNullableString(form.postal_code),
      latitude: toNullableNumber(form.latitude),
      longitude: toNullableNumber(form.longitude),
      radius_miles: toNullableNumber(form.radius_miles),
      fee_percent: clampFeePercent(form.fee_percent),
      priority: Math.round(toNumber(form.priority, 100)),
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    const result = editingRuleId
      ? await supabase
          .from("marketplace_fee_rules")
          .update(payload)
          .eq("id", editingRuleId)
      : await supabase.from("marketplace_fee_rules").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

    if (result.error) {
      setPageError(result.error.message || "Unable to save marketplace fee rule.");
      setSaving(false);
      return;
    }

    setMessage(editingRuleId ? "Marketplace fee rule updated." : "Marketplace fee rule created.");
    setSaving(false);
    resetForm();
    await loadRules();
  }

  async function handleDelete(ruleId: string) {
    const confirmed = window.confirm(
      "Delete this marketplace fee rule? Existing bookings keep their locked fee values.",
    );

    if (!confirmed) return;

    setPageError("");
    setMessage("");

    const { error } = await supabase
      .from("marketplace_fee_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      setPageError(error.message || "Unable to delete marketplace fee rule.");
      return;
    }

    setMessage("Marketplace fee rule deleted.");
    await loadRules();
  }

  async function handleToggleActive(rule: MarketplaceFeeRule) {
    setPageError("");
    setMessage("");

    const { error } = await supabase
      .from("marketplace_fee_rules")
      .update({
        is_active: !rule.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rule.id);

    if (error) {
      setPageError(error.message || "Unable to update rule status.");
      return;
    }

    setMessage(rule.is_active ? "Rule disabled." : "Rule enabled.");
    await loadRules();
  }

  function handleEdit(rule: MarketplaceFeeRule) {
    setEditingRuleId(rule.id);
    setForm(formFromRule(rule));
    setMessage("");
    setPageError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_40%,#ecfdf5_100%)] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50"
          >
            ← Back to Admin
          </Link>

          <button
            type="button"
            onClick={loadRules}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Rules
          </button>
        </div>

        <section className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.96),transparent_18%),linear-gradient(120deg,#d1fae5_0%,#a7f3d0_48%,#bae6fd_100%)] px-6 py-8 md:px-10 md:py-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-800">
                SitGuru Admin
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-6xl">
                Marketplace fee rules
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
                Manage SitGuru’s locality-based customer marketplace fee. Rules can match by ZIP,
                city/state, state, radius, or default fallback.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-emerald-800 ring-1 ring-white/70">
                  <ShieldCheck className="h-4 w-4" />
                  Tips pass through 100%
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-slate-800 ring-1 ring-white/70">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                  15%–20% fee range
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-slate-800 ring-1 ring-white/70">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  ZIP + radius support
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Active rules
              </p>
              <p className="mt-2 text-5xl font-black text-slate-950">
                {activeRules.length}
              </p>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                Default fallback:{" "}
                <span className="text-emerald-700">
                  {defaultRule ? `${defaultRule.fee_percent}%` : "Not found"}
                </span>
              </p>
            </div>
          </div>
        </section>

        {pageError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="flex items-start gap-2 text-sm font-bold text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {pageError}
            </p>
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-start gap-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {message}
            </p>
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
                  {editingRuleId ? "Edit rule" : "Create rule"}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {editingRuleId ? "Update locality pricing" : "Add locality pricing"}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                {editingRuleId ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div>
                <label className={labelClass()} htmlFor="locality_name">
                  Locality name
                </label>
                <input
                  id="locality_name"
                  value={form.locality_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      locality_name: event.target.value,
                    }))
                  }
                  className={inputClass()}
                  placeholder="Quakertown ZIP 18951"
                />
              </div>

              <div>
                <label className={labelClass()} htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClass()}
                  rows={3}
                  placeholder="Internal admin note for this fee rule."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass()} htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    value={form.country}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        country: event.target.value.toUpperCase(),
                      }))
                    }
                    className={inputClass()}
                    placeholder="US"
                  />
                </div>

                <div>
                  <label className={labelClass()} htmlFor="state">
                    State
                  </label>
                  <select
                    id="state"
                    value={form.state}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        state: event.target.value,
                      }))
                    }
                    className={inputClass()}
                  >
                    {stateOptions.map((state) => (
                      <option key={state || "blank"} value={state}>
                        {state || "Any"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass()} htmlFor="postal_code">
                    ZIP
                  </label>
                  <input
                    id="postal_code"
                    value={form.postal_code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        postal_code: event.target.value.replace(/\D/g, "").slice(0, 5),
                      }))
                    }
                    className={inputClass()}
                    placeholder="18951"
                    inputMode="numeric"
                    maxLength={5}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass()} htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  className={inputClass()}
                  placeholder="Quakertown"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">
                  Optional radius rule
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Use latitude, longitude, and radius miles for metro or city-core pricing.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelClass()} htmlFor="latitude">
                      Latitude
                    </label>
                    <input
                      id="latitude"
                      value={form.latitude}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          latitude: event.target.value,
                        }))
                      }
                      className={inputClass()}
                      placeholder="39.9526"
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="longitude">
                      Longitude
                    </label>
                    <input
                      id="longitude"
                      value={form.longitude}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          longitude: event.target.value,
                        }))
                      }
                      className={inputClass()}
                      placeholder="-75.1652"
                    />
                  </div>

                  <div>
                    <label className={labelClass()} htmlFor="radius_miles">
                      Radius miles
                    </label>
                    <input
                      id="radius_miles"
                      value={form.radius_miles}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          radius_miles: event.target.value,
                        }))
                      }
                      className={inputClass()}
                      placeholder="25"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass()} htmlFor="fee_percent">
                    Fee %
                  </label>
                  <input
                    id="fee_percent"
                    value={form.fee_percent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fee_percent: event.target.value,
                      }))
                    }
                    className={inputClass()}
                    placeholder="15"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className={labelClass()} htmlFor="priority">
                    Priority
                  </label>
                  <input
                    id="priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                    className={inputClass()}
                    placeholder="100"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className={labelClass()} htmlFor="is_active">
                    Status
                  </label>
                  <select
                    id="is_active"
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_active: event.target.value === "active",
                      }))
                    }
                    className={inputClass()}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingRuleId ? "Save changes" : "Create rule"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Rules
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  Locality fee table
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Lower priority numbers win first. Exact ZIP rules should usually have the lowest
                  priority number.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-4 text-sm font-black text-slate-700">
                  Loading marketplace fee rules...
                </p>
              </div>
            ) : rules.length === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <p className="text-lg font-black text-slate-950">
                  No fee rules yet
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Create a default 15% rule first, then add ZIP, city, state, or radius rules.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
                <div className="hidden grid-cols-[1.3fr_1fr_0.6fr_0.5fr_0.6fr_0.8fr] gap-4 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-500 lg:grid">
                  <div>Rule</div>
                  <div>Location</div>
                  <div>Fee</div>
                  <div>Priority</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                <div className="divide-y divide-slate-200">
                  {rules.map((rule) => (
                    <article
                      key={rule.id}
                      className="grid gap-4 bg-white px-5 py-5 lg:grid-cols-[1.3fr_1fr_0.6fr_0.5fr_0.6fr_0.8fr] lg:items-center"
                    >
                      <div>
                        <p className="text-base font-black text-slate-950">
                          {rule.locality_name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          {ruleTypeLabel(rule)}
                        </p>
                        {rule.description ? (
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            {rule.description}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950 lg:hidden">
                          Location
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-700 lg:mt-0">
                          {ruleLocationLabel(rule)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Updated {formatDate(rule.updated_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950 lg:hidden">
                          Fee
                        </p>
                        <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800 ring-1 ring-emerald-100 lg:mt-0">
                          {rule.fee_percent}%
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950 lg:hidden">
                          Priority
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-700 lg:mt-0">
                          {rule.priority}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950 lg:hidden">
                          Status
                        </p>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule)}
                          className={[
                            "mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 transition lg:mt-0",
                            rule.is_active
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-100 hover:bg-emerald-100"
                              : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {rule.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(rule)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                          title="Edit rule"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                          title="Delete rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Matching priority used by checkout
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["1", "Locked booking fee", "Existing booking marketplace fee is preserved."],
              ["2", "Exact ZIP", "Best for ZIP-level city or suburb control."],
              ["3", "Radius", "Best for metro and dense city-core pricing."],
              ["4", "City + state", "Good fallback when ZIP is not configured."],
              ["5", "State", "Broad regional fallback."],
              ["6", "Default", "Usually 15% for unmatched bookings."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-2xl border border-emerald-100 bg-white p-4"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                  {number}
                </span>
                <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}