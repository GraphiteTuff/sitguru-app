"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Mail, Phone, Save, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { isApplePrivateRelayEmail } from "@/lib/auth/apple-email";

type AccountFields = {
  email: string;
  contactEmail: string;
  phone: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());
}

export default function GuruDashboardSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [fields, setFields] = useState<AccountFields>({
    email: "",
    contactEmail: "",
    phone: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setError("Please sign in to manage account settings.");
          setLoading(false);
        }
        return;
      }

      // Repair missing profile/guru email from auth (server-side, idempotent).
      try {
        await fetch("/api/auth/sync-auth-email", { method: "POST" });
      } catch {
        // Non-blocking
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, contact_email, phone, phone_number")
        .eq("id", user.id)
        .maybeSingle();

      const { data: guru } = await supabase
        .from("gurus")
        .select("email, contact_email, phone, phone_number")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const loginEmail =
        (typeof profile?.email === "string" && profile.email) ||
        (typeof guru?.email === "string" && guru.email) ||
        user.email ||
        "";

      const contactEmail =
        (typeof profile?.contact_email === "string" && profile.contact_email) ||
        (typeof guru?.contact_email === "string" && guru.contact_email) ||
        "";

      const phone =
        (typeof profile?.phone === "string" && profile.phone) ||
        (typeof profile?.phone_number === "string" && profile.phone_number) ||
        (typeof guru?.phone === "string" && guru.phone) ||
        (typeof guru?.phone_number === "string" && guru.phone_number) ||
        "";

      setUserId(user.id);
      setFields({
        email: loginEmail,
        contactEmail,
        phone,
      });
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    const contactEmail = fields.contactEmail.trim().toLowerCase();
    const phone = fields.phone.trim();

    if (contactEmail && !isValidEmail(contactEmail)) {
      setError("Enter a valid contact email address.");
      setSaving(false);
      return;
    }

    const profilePayload: Record<string, unknown> = {
      phone: phone || null,
      phone_number: phone || null,
      updated_at: new Date().toISOString(),
    };

    if (contactEmail) {
      profilePayload.contact_email = contactEmail;
    } else {
      profilePayload.contact_email = null;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId);

    if (profileError) {
      // Retry without contact_email if column not migrated yet
      const { error: retryError } = await supabase
        .from("profiles")
        .update({
          phone: phone || null,
          phone_number: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (retryError) {
        setError(retryError.message || "Could not save settings.");
        setSaving(false);
        return;
      }
    }

    const guruPayload: Record<string, unknown> = {
      phone: phone || null,
      phone_number: phone || null,
      updated_at: new Date().toISOString(),
    };
    if (contactEmail) guruPayload.contact_email = contactEmail;
    else guruPayload.contact_email = null;

    await supabase.from("gurus").update(guruPayload).eq("user_id", userId);

    setMessage("Account settings saved.");
    setSaving(false);
  }

  const relayLogin = isApplePrivateRelayEmail(fields.email);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Guru Settings
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Account
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Manage phone number and optional contact email. Sign in with Apple
            login addresses can stay private.
          </p>
          <Link
            href="/guru/dashboard"
            className="mt-5 inline-flex text-sm font-semibold text-emerald-300 hover:text-emerald-200"
          >
            ← Back to dashboard
          </Link>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-8">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading account…
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Login email
                </label>
                <input
                  type="email"
                  value={fields.email}
                  readOnly
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200 outline-none"
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {relayLogin
                    ? "Apple Private Relay — your Sign in with Apple address can remain private."
                    : "Managed by your sign-in method. Contact email below is optional for SitGuru notices."}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <Mail className="h-4 w-4 text-emerald-300" />
                  Contact email
                </label>
                <input
                  type="email"
                  value={fields.contactEmail}
                  onChange={(event) =>
                    setFields((prev) => ({
                      ...prev,
                      contactEmail: event.target.value,
                    }))
                  }
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Used for SitGuru communications and account-related notices.
                  Your Sign in with Apple address can remain private.
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  <Phone className="h-4 w-4 text-emerald-300" />
                  Phone number
                </label>
                <input
                  type="tel"
                  value={fields.phone}
                  onChange={(event) =>
                    setFields((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="(555) 555-5555"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none ring-emerald-500/40 focus:ring-2"
                />
              </div>

              {error ? (
                <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save settings
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
