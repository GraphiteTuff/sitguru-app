"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  Bell,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import DeleteAccountFlow from "@/components/account/DeleteAccountFlow";
import { AccountRoleSwitcher } from "@/components/sitguru/AccountRoleSwitcher";
import {
  resolveAuthorizedRolesFromProfile,
  resolveDashboardRoleFromPath,
  type DashboardSwitchRole,
} from "@/lib/dashboard/role-switch";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function resolveDisplayName(profile: ProfileRow | null, user: User | null) {
  const fromProfile =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
  if (fromProfile) return fromProfile;

  const meta = user?.user_metadata || {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  if (fromMeta) return fromMeta;

  return user?.email?.split("@")[0] || "SitGuru member";
}

function providerLabel(provider: string) {
  const value = provider.toLowerCase();
  if (value === "email") return "Email";
  if (value === "phone") return "SMS";
  if (value === "apple") return "Apple";
  if (value === "google") return "Google";
  return provider;
}

export default function ProfileAndAccountPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [emailDraft, setEmailDraft] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [authorizedRoles, setAuthorizedRoles] = useState<DashboardSwitchRole[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      router.replace("/login?next=/account");
      return;
    }

    setUser(authUser);
    setEmailDraft(authUser.email || "");

    const email = authUser.email || "";
    const [{ data: profileRow }, { data: roleRows }, { data: guru }, { data: ambassador }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, first_name, last_name, phone, avatar_url, profile_photo_url, role, account_type",
          )
          .eq("id", authUser.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", authUser.id),
        email
          ? supabase
              .from("gurus")
              .select("id")
              .or(`user_id.eq.${authUser.id},email.eq.${email}`)
              .maybeSingle()
          : supabase
              .from("gurus")
              .select("id")
              .eq("user_id", authUser.id)
              .maybeSingle(),
        supabase
          .from("ambassadors")
          .select("id")
          .eq("user_id", authUser.id)
          .maybeSingle(),
      ]);

    const profileRecord = (profileRow as Record<string, unknown> | null) || null;
    setProfile(
      profileRow
        ? {
            id: String(profileRow.id),
            full_name: profileRow.full_name ?? null,
            first_name: profileRow.first_name ?? null,
            last_name: profileRow.last_name ?? null,
            phone: profileRow.phone ?? null,
            avatar_url: profileRow.avatar_url ?? null,
            profile_photo_url: profileRow.profile_photo_url ?? null,
          }
        : { id: authUser.id },
    );

    setAuthorizedRoles(
      resolveAuthorizedRolesFromProfile({
        profile: profileRecord,
        roleRows: ((roleRows || []) as Array<{ role?: string | null }>).map(
          (row) => row.role,
        ),
        metadata: {
          ...(authUser.app_metadata || {}),
          ...(authUser.user_metadata || {}),
        },
        email,
        hasGuruRecord: Boolean(guru?.id),
        hasAmbassadorRecord: Boolean(ambassador?.id),
      }),
    );
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
        return;
      }
      if (
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_IN"
      ) {
        void load();
      }
    });

    return () => subscription.unsubscribe();
  }, [load, router]);

  const displayName = resolveDisplayName(profile, user);
  const avatarUrl =
    profile?.avatar_url ||
    profile?.profile_photo_url ||
    (typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null);
  const authEmail = user?.email || "";
  const authPhone = user?.phone || "";
  const profilePhone = profile?.phone?.trim() || "";
  const hasEmailIdentity = Boolean(
    user?.identities?.some((identity) => identity.provider === "email") ||
      authEmail,
  );
  const hasPasswordProvider = Boolean(
    user?.identities?.some((identity) => identity.provider === "email"),
  );
  const signInMethods = useMemo(() => {
    const methods = new Set<string>();
    for (const identity of user?.identities || []) {
      methods.add(providerLabel(identity.provider));
    }
    if (authEmail) methods.add("Email");
    if (authPhone) methods.add("SMS");
    return Array.from(methods);
  }, [authEmail, authPhone, user?.identities]);

  async function handleEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingEmail || !user) return;

    setSavingEmail(true);
    setErrorMessage("");
    setSuccessMessage("");

    const nextEmail = normalizeEmail(emailDraft);
    if (!isValidEmail(nextEmail)) {
      setErrorMessage("Enter a valid email address.");
      setSavingEmail(false);
      return;
    }
    if (nextEmail === normalizeEmail(authEmail)) {
      setErrorMessage("Enter a different email before saving.");
      setSavingEmail(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) {
      setErrorMessage(`Email change did not start: ${error.message}`);
      setSavingEmail(false);
      return;
    }

    setSuccessMessage(
      "Confirmation sent to the new email. Your login email updates only after you verify that message.",
    );
    setSavingEmail(false);
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPassword || !user) return;

    setSavingPassword(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      setSavingPassword(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMessage(`Password did not update: ${error.message}`);
      setSavingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage(
      hasPasswordProvider
        ? "Password updated."
        : "Password created. You can now sign in with email and password.",
    );
    setSavingPassword(false);
    void load();
  }

  async function handleSendReset() {
    if (sendingReset || !authEmail) return;

    setSendingReset(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined,
    });

    if (error) {
      setErrorMessage(`Reset email did not send: ${error.message}`);
      setSendingReset(false);
      return;
    }

    setSuccessMessage(`Password reset email sent to ${authEmail}.`);
    setSendingReset(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-emerald-100 bg-white px-6 py-16 shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Loading Profile & Account…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="grid gap-5">
      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{successMessage}</p>
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          Profile & Account
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
          Personal information
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Account-level identity shared across Pet Parent, Guru, Ambassador, and
          Intern workspaces. Role service details stay on each role profile.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-50 text-lg font-black text-emerald-800 shadow-sm ring-1 ring-emerald-100">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${displayName} profile photo`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <UserRound className="h-8 w-8" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xl font-black tracking-[-0.03em] text-slate-950">
              {displayName}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-slate-500">
              {authEmail || "No login email on file"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Workspaces
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Switch between Pet Parent, Guru, Ambassador, Intern, and Admin using
          the same SitGuru login. Admin appears only when this account is
          authorized.
        </p>
        <div className="mt-5">
          <AccountRoleSwitcher
            currentRole={resolveDashboardRoleFromPath(pathname)}
            authorizedRoles={authorizedRoles}
            includeAdmin
          />
        </div>
      </section>

      {authorizedRoles.includes("admin") ? (
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Admin
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Account updates
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This login has Admin access. Use these tools when a member needs
            account status, role, or lifecycle updates.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link
              href="/admin/accounts"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Manage accounts
            </Link>
            <Link
              href="/admin/account-lifecycle"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Account lifecycle
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Admin settings
            </Link>
            <Link
              href="/admin"
              className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Admin dashboard
            </Link>
          </div>
        </section>
      ) : null}

      <section
        id="login-security"
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
              Login & security
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Change login credentials here — not inside a Pet Parent, Guru, or
              Ambassador role profile.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <Mail className="h-4 w-4 text-emerald-700" />
              Email address
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {authEmail || "Not added"}
            </p>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={handleEmailChange}
            >
              <label className="sr-only" htmlFor="account-new-email">
                New email
              </label>
              <input
                id="account-new-email"
                type="email"
                autoComplete="email"
                value={emailDraft}
                onChange={(event) => setEmailDraft(event.target.value)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-200 focus:ring-4"
                placeholder="New email address"
              />
              <button
                type="submit"
                disabled={savingEmail}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingEmail ? "Sending…" : "Change"}
              </button>
            </form>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              SitGuru uses Supabase email verification. The login email updates
              only after the new inbox is confirmed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <Phone className="h-4 w-4 text-emerald-700" />
              Mobile number
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {authPhone
                ? authPhone
                : profilePhone
                  ? `${profilePhone} (profile contact only)`
                  : "Not added"}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Verified login-phone changes are not available in this release.
              SMS sign-in still uses SitGuru&apos;s existing login OTP flow.
              Numbers saved on role profiles are contact fields, not verified
              auth phone numbers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <KeyRound className="h-4 w-4 text-emerald-700" />
              Password
            </div>
            {hasEmailIdentity ? (
              <form className="mt-4 grid gap-3" onSubmit={handlePasswordChange}>
                <label className="sr-only" htmlFor="account-new-password">
                  {hasPasswordProvider ? "New password" : "Create password"}
                </label>
                <input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-200 focus:ring-4"
                  placeholder={
                    hasPasswordProvider ? "New password" : "Create password"
                  }
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-200 focus:ring-4"
                  placeholder="Confirm password"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingPassword
                      ? "Saving…"
                      : hasPasswordProvider
                        ? "Change password"
                        : "Create password"}
                  </button>
                  {authEmail ? (
                    <button
                      type="button"
                      disabled={sendingReset}
                      onClick={() => void handleSendReset()}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      {sendingReset ? "Sending…" : "Email reset link"}
                    </button>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This account signs in with a connected provider and does not use
                a SitGuru email password.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800">
              <LockKeyhole className="h-4 w-4 text-emerald-700" />
              Sign-in methods
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {signInMethods.length ? (
                signInMethods.map((method) => (
                  <li
                    key={method}
                    className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-black text-emerald-800"
                  >
                    {method}
                  </li>
                ))
              ) : (
                <li className="text-sm text-slate-600">
                  No methods detected yet.
                </li>
              )}
            </ul>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Only methods SitGuru already supports for this account are shown.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/customer/dashboard/account-security"
            className="text-sm font-bold text-emerald-700 hover:underline"
          >
            Open classic Account Security page
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Quick links
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Link
            href="/account/settings"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            <Settings className="h-4 w-4 text-emerald-700" />
            Settings
          </Link>
          <Link
            href="/customer/dashboard/profile/notifications"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            <Bell className="h-4 w-4 text-emerald-700" />
            Notifications
          </Link>
          <Link
            href="/help/account"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            <LifeBuoy className="h-4 w-4 text-emerald-700" />
            Help & Support
          </Link>
        </div>
      </section>

      <section
        id="privacy-account"
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Privacy & account
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Deactivate or permanently delete your SitGuru account. These actions
          use SitGuru&apos;s production account APIs.
        </p>
        <div className="mt-5">
          <DeleteAccountFlow />
        </div>
      </section>
    </div>
  );
}
