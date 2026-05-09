"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LifeBuoy,
  Loader2,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type AccountSecurityProfile = {
  id: string;
  email: string | null;
  recovery_email: string | null;
  recovery_email_verified: boolean;
  full_name: string | null;
  first_name: string | null;
};

type PasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

type EmailForm = {
  newEmail: string;
};

type RecoveryEmailForm = {
  recoveryEmail: string;
};

type RawProfileRow = {
  full_name?: string | null;
  first_name?: string | null;
  recovery_email?: string | null;
  recovery_email_verified?: boolean | null;
};

const routes = {
  dashboard: "/customer/dashboard",
  profile: "/customer/dashboard/profile",
  basicInfo: "/customer/dashboard/profile/basic-info",
  messages: "/customer/dashboard/messages",
  supportMessage:
    "/customer/dashboard/messages?to=support@sitguru.com&subject=Account%20Security%20Help",
  login: "/login",
};

const supportEmail = "support@sitguru.com";

const initialPasswordForm: PasswordForm = {
  newPassword: "",
  confirmPassword: "",
};

const initialEmailForm: EmailForm = {
  newEmail: "",
};

const initialRecoveryEmailForm: RecoveryEmailForm = {
  recoveryEmail: "",
};

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  const cleanValue = normalizeEmail(value);

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue);
}

function buildDisplayName(profile: AccountSecurityProfile | null) {
  return (
    profile?.full_name?.trim() ||
    profile?.first_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Pet Parent"
  );
}

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      label: "Not started",
      tone: "bg-slate-200",
      textTone: "text-slate-600",
      width: "0%",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak",
      tone: "bg-red-500",
      textTone: "text-red-700",
      width: "35%",
    };
  }

  if (score <= 4) {
    return {
      label: "Good",
      tone: "bg-amber-500",
      textTone: "text-amber-700",
      width: "70%",
    };
  }

  return {
    label: "Strong",
    tone: "bg-emerald-500",
    textTone: "text-emerald-700",
    width: "100%",
  };
}

async function fetchAccountSecurityProfile(userId: string, email: string | null) {
  const selectAttempts = [
    "full_name, first_name, recovery_email, recovery_email_verified",
    "full_name, first_name",
  ];

  for (const selectColumns of selectAttempts) {
    const { data, error } = await supabase
      .from("profiles")
      .select(selectColumns)
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      const row = (data || null) as RawProfileRow | null;

      return {
        id: userId,
        email,
        recovery_email: readString(row?.recovery_email),
        recovery_email_verified: readBoolean(row?.recovery_email_verified),
        full_name: readString(row?.full_name),
        first_name:
          readString(row?.first_name) ||
          readString(row?.full_name)?.split(" ")[0] ||
          null,
      } satisfies AccountSecurityProfile;
    }
  }

  return {
    id: userId,
    email,
    recovery_email: null,
    recovery_email_verified: false,
    full_name: null,
    first_name: null,
  } satisfies AccountSecurityProfile;
}

async function saveRecoveryEmail(userId: string, recoveryEmail: string) {
  const cleanRecoveryEmail = normalizeEmail(recoveryEmail);

  const { error } = await supabase
    .from("profiles")
    .update({
      recovery_email: cleanRecoveryEmail || null,
      recovery_email_verified: false,
      recovery_email_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(
      `Backup recovery email did not save: ${error.message}. Confirm the recovery_email columns were added to public.profiles.`,
    );
  }
}

export default function CustomerAccountSecurityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountSecurityProfile | null>(null);

  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(initialPasswordForm);
  const [emailForm, setEmailForm] = useState<EmailForm>(initialEmailForm);
  const [recoveryEmailForm, setRecoveryEmailForm] =
    useState<RecoveryEmailForm>(initialRecoveryEmailForm);

  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingRecoveryEmail, setSavingRecoveryEmail] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const displayName = buildDisplayName(profile);

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword],
  );

  const passwordsMatch = useMemo(() => {
    if (!passwordForm.confirmPassword) return false;

    return passwordForm.newPassword === passwordForm.confirmPassword;
  }, [passwordForm.confirmPassword, passwordForm.newPassword]);

  const passwordReady = useMemo(() => {
    return (
      passwordForm.newPassword.length >= 8 &&
      passwordForm.confirmPassword.length >= 8 &&
      passwordsMatch
    );
  }, [
    passwordForm.confirmPassword.length,
    passwordForm.newPassword.length,
    passwordsMatch,
  ]);

  const emailChanged = useMemo(() => {
    const currentEmail = normalizeEmail(profile?.email || "");
    const nextEmail = normalizeEmail(emailForm.newEmail);

    return Boolean(nextEmail && nextEmail !== currentEmail);
  }, [emailForm.newEmail, profile?.email]);

  const recoveryEmailChanged = useMemo(() => {
    const currentRecoveryEmail = normalizeEmail(profile?.recovery_email || "");
    const nextRecoveryEmail = normalizeEmail(recoveryEmailForm.recoveryEmail);

    return nextRecoveryEmail !== currentRecoveryEmail;
  }, [profile?.recovery_email, recoveryEmailForm.recoveryEmail]);

  const recoveryEmailIsSameAsLogin = useMemo(() => {
    const currentEmail = normalizeEmail(profile?.email || "");
    const nextRecoveryEmail = normalizeEmail(recoveryEmailForm.recoveryEmail);

    return Boolean(currentEmail && nextRecoveryEmail === currentEmail);
  }, [profile?.email, recoveryEmailForm.recoveryEmail]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace(routes.login);
      return;
    }

    try {
      const profileData = await fetchAccountSecurityProfile(
        user.id,
        user.email ?? null,
      );

      setProfile(profileData);
      setEmailForm({
        newEmail: user.email || "",
      });
      setRecoveryEmailForm({
        recoveryEmail: profileData.recovery_email || "",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load Account Security.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPage();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace(routes.login);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPage, router]);

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingPassword) return;

    setSavingPassword(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (passwordForm.newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      setSavingPassword(false);
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("Passwords do not match.");
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });

    if (error) {
      setErrorMessage(`Password did not update: ${error.message}`);
      setSavingPassword(false);
      return;
    }

    setPasswordForm(initialPasswordForm);
    setSuccessMessage("Password updated successfully.");
    setSavingPassword(false);
  }

  async function handleEmailUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingEmail) return;

    setSavingEmail(true);
    setSuccessMessage("");
    setErrorMessage("");

    const nextEmail = normalizeEmail(emailForm.newEmail);

    if (!isValidEmail(nextEmail)) {
      setErrorMessage("Please enter a valid login email address.");
      setSavingEmail(false);
      return;
    }

    if (!emailChanged) {
      setErrorMessage("Enter a different email address before saving.");
      setSavingEmail(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      email: nextEmail,
    });

    if (error) {
      setErrorMessage(`Email change did not start: ${error.message}`);
      setSavingEmail(false);
      return;
    }

    setSuccessMessage(
      "Email change started. Check the new email address for the confirmation link.",
    );
    setSavingEmail(false);
  }

  async function handleRecoveryEmailUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile?.id || savingRecoveryEmail) return;

    setSavingRecoveryEmail(true);
    setSuccessMessage("");
    setErrorMessage("");

    const nextRecoveryEmail = normalizeEmail(recoveryEmailForm.recoveryEmail);

    if (!nextRecoveryEmail) {
      setErrorMessage("Please enter a backup recovery email.");
      setSavingRecoveryEmail(false);
      return;
    }

    if (!isValidEmail(nextRecoveryEmail)) {
      setErrorMessage("Please enter a valid backup recovery email address.");
      setSavingRecoveryEmail(false);
      return;
    }

    if (recoveryEmailIsSameAsLogin) {
      setErrorMessage(
        "Backup recovery email must be different from your main login email.",
      );
      setSavingRecoveryEmail(false);
      return;
    }

    try {
      await saveRecoveryEmail(profile.id, nextRecoveryEmail);

      const refreshedProfile = await fetchAccountSecurityProfile(
        profile.id,
        profile.email,
      );

      setProfile(refreshedProfile);
      setRecoveryEmailForm({
        recoveryEmail: refreshedProfile.recovery_email || "",
      });

      setSuccessMessage(
        "Backup recovery email saved. Verification can be added later for assisted recovery.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Backup recovery email did not save.",
      );
    } finally {
      setSavingRecoveryEmail(false);
    }
  }

  async function handleSendPasswordReset() {
    if (sendingReset || !profile?.email) return;

    setSendingReset(true);
    setSuccessMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/customer/dashboard/account-security`
          : undefined,
    });

    if (error) {
      setErrorMessage(`Reset email did not send: ${error.message}`);
      setSendingReset(false);
      return;
    }

    setSuccessMessage(`Password reset email sent to ${profile.email}.`);
    setSendingReset(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)]">
        <Header />
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-bold text-slate-700">
              Loading Account Security...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1250px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.profile}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Profile
          </Link>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            Account Security
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              SitGuru Account Security
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              Login, Password & Recovery
            </h1>

            <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-slate-800/75">
              Manage the login email, password, and backup recovery email for
              your Pet Parent account. Your care profile details stay separate
              from secure login settings.
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            {successMessage || errorMessage ? (
              <div
                className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-black ${
                  errorMessage
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {errorMessage ? (
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                {errorMessage || successMessage}
              </div>
            ) : null}

            <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
              <aside className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                <div className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-7 w-7" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                        Secure account
                      </p>
                      <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">
                        {displayName}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Current login email
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold leading-6 text-slate-600">
                      {profile?.email || "Email not available"}
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-950">
                      Backup recovery email
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold leading-6 text-slate-600">
                      {profile?.recovery_email || "Not added yet"}
                    </p>

                    <div
                      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                        profile?.recovery_email_verified
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {profile?.recovery_email_verified
                        ? "Verified"
                        : "Verification pending"}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ Password changes use Supabase Auth
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ Email changes require confirmation
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ Backup recovery email supports account help
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Security note
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    SitGuru does not store plain-text passwords. Passwords are
                    managed through Supabase Auth. The backup recovery email does
                    not replace your login email. It only gives SitGuru another
                    way to help if you cannot access your main email.
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Need help?
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    Contact SitGuru Support through your Message Center or email
                    support directly.
                  </p>

                  <div className="mt-4 grid gap-2">
                    <Link
                      href={routes.supportMessage}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message SitGuru Support
                    </Link>

                    <a
                      href={`mailto:${supportEmail}?subject=SitGuru%20Account%20Security%20Help`}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                    >
                      <Mail className="h-4 w-4" />
                      Email {supportEmail}
                    </a>
                  </div>
                </div>
              </aside>

              <div className="grid gap-6">
                <form
                  onSubmit={handleEmailUpdate}
                  className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Mail className="h-6 w-6" />
                    </div>

                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-950">
                        Login Email
                      </h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        This email is used as the customer username for signing
                        in to SitGuru.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <label htmlFor="current_email" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        Current email
                      </span>
                      <input
                        id="current_email"
                        value={profile?.email || ""}
                        disabled
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-500 outline-none"
                      />
                    </label>

                    <label htmlFor="new_email" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        New login email
                      </span>
                      <input
                        id="new_email"
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(event) =>
                          setEmailForm({
                            ...emailForm,
                            newEmail: event.target.value,
                          })
                        }
                        placeholder="new-email@example.com"
                        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                      <span className="text-xs font-semibold leading-5 text-slate-500">
                        Supabase may send a confirmation email before the login
                        email changes.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={savingEmail || !emailChanged}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {savingEmail
                        ? "Starting Email Change..."
                        : "Update Login Email"}
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={handleRecoveryEmailUpdate}
                  className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-6 w-6" />
                    </div>

                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-950">
                        Backup Recovery Email
                      </h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        Add an alternate email SitGuru can use to help verify
                        you if you cannot access your main login email.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <label htmlFor="recovery_email" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        Backup recovery email
                      </span>
                      <input
                        id="recovery_email"
                        type="email"
                        value={recoveryEmailForm.recoveryEmail}
                        onChange={(event) =>
                          setRecoveryEmailForm({
                            ...recoveryEmailForm,
                            recoveryEmail: event.target.value,
                          })
                        }
                        placeholder="backup-email@example.com"
                        className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                      />
                      <span className="text-xs font-semibold leading-5 text-slate-500">
                        This does not change your login email. It is only for
                        account recovery support.
                      </span>
                    </label>

                    {recoveryEmailIsSameAsLogin ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">
                        Backup recovery email must be different from your main
                        login email.
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={
                        savingRecoveryEmail ||
                        !recoveryEmailChanged ||
                        recoveryEmailIsSameAsLogin
                      }
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingRecoveryEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {savingRecoveryEmail
                        ? "Saving Backup Email..."
                        : "Save Backup Recovery Email"}
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={handlePasswordUpdate}
                  className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <KeyRound className="h-6 w-6" />
                    </div>

                    <div>
                      <h2 className="text-3xl font-black tracking-tight text-slate-950">
                        Change Password
                      </h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        Create a secure password for your Pet Parent account.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <label htmlFor="new_password" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        New password
                      </span>

                      <div className="relative">
                        <input
                          id="new_password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(event) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: event.target.value,
                            })
                          }
                          placeholder="At least 8 characters"
                          className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 pr-12 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />

                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-emerald-700"
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-950">
                          Password strength
                        </p>
                        <p
                          className={`text-sm font-black ${passwordStrength.textTone}`}
                        >
                          {passwordStrength.label}
                        </p>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                        <div
                          className={`h-full rounded-full ${passwordStrength.tone}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>

                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                        Strong passwords use at least 8 characters with a mix of
                        uppercase letters, lowercase letters, numbers, and
                        symbols.
                      </p>
                    </div>

                    <label htmlFor="confirm_password" className="grid gap-2">
                      <span className="text-sm font-black text-slate-950">
                        Confirm password
                      </span>

                      <div className="relative">
                        <input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(event) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: event.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3.5 pr-12 text-sm font-bold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-emerald-700"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {passwordForm.confirmPassword ? (
                        <span
                          className={`text-xs font-black ${
                            passwordsMatch ? "text-emerald-700" : "text-red-700"
                          }`}
                        >
                          {passwordsMatch
                            ? "Passwords match."
                            : "Passwords do not match."}
                        </span>
                      ) : null}
                    </label>

                    <button
                      type="submit"
                      disabled={savingPassword || !passwordReady}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPassword ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      {savingPassword
                        ? "Updating Password..."
                        : "Update Password"}
                    </button>
                  </div>
                </form>

                <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                        <UserRound className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          Forgot password flow
                        </h2>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          Send a password reset email to the current login email
                          for this account.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={sendingReset || !profile?.email}
                      onClick={handleSendPasswordReset}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingReset ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {sendingReset ? "Sending..." : "Send Reset Email"}
                    </button>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <MessageCircle className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          Contact SitGuru Support
                        </h2>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          Need account recovery help? Contact{" "}
                          <span className="font-black">{supportEmail}</span>{" "}
                          through your Message Center or email support directly.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={routes.supportMessage}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message Support
                      </Link>

                      <a
                        href={`mailto:${supportEmail}?subject=SitGuru%20Account%20Security%20Help`}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Mail className="h-4 w-4" />
                        Email Support
                      </a>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}