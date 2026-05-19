"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Heart,
  Loader2,
  Lock,
  Mail,
  PawPrint,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  User,
} from "lucide-react";

import PhoneCodeLogin from "@/components/auth/PhoneCodeLogin";
import { supabase } from "@/lib/supabase";

type SignupAccountType = "pet_parent" | "future_guru" | "both";
type SignupMethod = "phone" | "email";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
  accountType: SignupAccountType;
  signupMethod: SignupMethod;
};

const initialForm: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  referralCode: "",
  accountType: "pet_parent",
  signupMethod: "phone",
};

function getAccountTypeLabel(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "Future Guru";
  if (accountType === "both") return "Pet Parent + Guru";
  return "Pet Parent";
}

function getAccountTypeShortLabel(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "Guru";
  if (accountType === "both") return "Both";
  return "Pet Parent";
}

function getProfileRole(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "guru";
  if (accountType === "both") return "both";
  return "customer";
}

function getEmailSignupRedirect(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "/guru/dashboard/profile";
  if (accountType === "both") return "/customer/dashboard/profile";
  return "/customer/dashboard/profile";
}

function getPhoneSignupRole(accountType: SignupAccountType): "customer" | "guru" {
  if (accountType === "future_guru") return "guru";
  return "customer";
}

function getPhoneSignupRedirect(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "/guru/dashboard/profile";
  if (accountType === "both") return "/customer/dashboard/profile";
  return "/customer/dashboard/profile";
}

function getPhoneHeading(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "Continue as a Future Guru";
  if (accountType === "both") return "Start with your Pet Parent account";
  return "Continue as a Pet Parent";
}

function getPhoneDescription(accountType: SignupAccountType) {
  if (accountType === "future_guru") {
    return "Enter your U.S. mobile number and we’ll text you a secure SitGuru code to start your Guru profile.";
  }

  if (accountType === "both") {
    return "Enter your U.S. mobile number and we’ll text you a secure SitGuru code. You’ll start in Pet Parent setup and can switch to Guru access.";
  }

  return "Enter your U.S. mobile number and we’ll text you a secure SitGuru code to start your Pet Parent profile.";
}

function getFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function getSafeReferralFromSearch(value: string | null) {
  return String(value || "").trim().slice(0, 80);
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const referralFromUrl = useMemo(
    () =>
      getSafeReferralFromSearch(
        searchParams.get("ref") ||
          searchParams.get("referral") ||
          searchParams.get("referral_code") ||
          searchParams.get("invite"),
      ),
    [searchParams],
  );

  const [form, setForm] = useState<SignupForm>({
    ...initialForm,
    referralCode: referralFromUrl,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedAccountTypeLabel = getAccountTypeLabel(form.accountType);
  const selectedAccountTypeShortLabel = getAccountTypeShortLabel(
    form.accountType,
  );
  const phoneSignupRole = getPhoneSignupRole(form.accountType);
  const phoneSignupRedirect = getPhoneSignupRedirect(form.accountType);
  const emailSignupRedirect = getEmailSignupRedirect(form.accountType);

  function updateForm<K extends keyof SignupForm>(
    key: K,
    value: SignupForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const fullName = getFullName(firstName, lastName);
    const role = getProfileRole(form.accountType);

    if (!firstName || !lastName) {
      setErrorMessage("Please enter your first and last name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match yet.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          role,
          account_type: role,
          signup_selection: form.accountType,
          signup_method: "email",
          referral_code: form.referralCode.trim() || null,
          source: "signup_page_email_password",
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message || "Unable to create your account.");
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          role,
        },
        {
          onConflict: "id",
        },
      );

      if (profileError) {
        console.error("Signup profile upsert failed:", profileError.message);
      }

      const rolesToInsert =
        form.accountType === "both"
          ? ["customer", "guru"]
          : form.accountType === "future_guru"
            ? ["guru"]
            : ["customer"];

      for (const roleToInsert of rolesToInsert) {
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: roleToInsert,
        });
      }
    }

    setIsSubmitting(false);
    setSuccessMessage("Account created. Taking you to SitGuru...");

    router.replace(emailSignupRedirect);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfff2_0%,#f8fffc_42%,#ffffff_100%)] px-3 py-4 text-slate-950 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="rounded-[1.75rem] border border-emerald-100 bg-white/85 p-5 shadow-[0_18px_54px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:sticky lg:top-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
            <Gift className="h-4 w-4" />
            Join SitGuru Free
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
            Create your free SitGuru account
          </h1>

          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
            Join as a Pet Parent, Future Guru, or both. Phone sign-up is now
            fast, secure, and ready to use.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <Phone className="h-6 w-6 text-emerald-700" />
              </div>
              <h2 className="mt-3 text-base font-black text-slate-950">
                Phone First
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Get a secure 6-digit SitGuru code.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50">
                <Search className="h-6 w-6 text-sky-600" />
              </div>
              <h2 className="mt-3 text-base font-black text-slate-950">
                Book Care
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Pet Parents can find trusted local care.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="mt-3 text-base font-black text-slate-950">
                Offer Care
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Gurus can build a trusted care profile.
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-[1.6rem] border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                <PawPrint className="h-6 w-6 text-emerald-700" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  SitGuru PetPerks
                </p>

                <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] text-slate-950">
                  Join free. Refer friends. Earn rewards.
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  If you arrived through a referral link, your signup will
                  connect to PetPerks. Rewards are earned after eligible first
                  paid booking activity is completed.
                </p>

                <Link
                  href="/petperks"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  Learn more about PetPerks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-7 hidden overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 lg:block">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🐶</div>
              <div>
                <p className="text-sm font-black text-green-900">
                  Trusted Pet Care. Simplified.
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Built for Pet Parents, Gurus, and the SitGuru community.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-[0_18px_54px_rgba(15,23,42,0.10)] sm:p-8 lg:p-10">
          <div className="mx-auto max-w-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
                <Sparkles className="h-4 w-4" />
                Free Account
              </div>

              <Link
                href="/"
                className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-green-900 transition hover:bg-white"
              >
                Home
              </Link>
            </div>

            <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Start using SitGuru for free
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Choose your account type, pick phone or email, then SitGuru will
              send you to the correct setup dashboard.
            </p>

            <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-black text-slate-950">
                  1. Choose your account type
                </p>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                  {selectedAccountTypeLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateForm("accountType", "pet_parent")}
                  className={`relative min-h-[150px] rounded-2xl border p-4 text-center transition ${
                    form.accountType === "pet_parent"
                      ? "border-emerald-500 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                >
                  {form.accountType === "pet_parent" ? (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}

                  <div className="text-3xl">🐶</div>
                  <p className="mt-3 text-base font-black text-emerald-800">
                    Pet Parent
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Find, book, and save trusted pet care.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm("accountType", "future_guru")}
                  className={`relative min-h-[150px] rounded-2xl border p-4 text-center transition ${
                    form.accountType === "future_guru"
                      ? "border-emerald-500 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                >
                  {form.accountType === "future_guru" ? (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}

                  <div className="text-3xl">⭐</div>
                  <p className="mt-3 text-base font-black text-slate-950">
                    Future Guru
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Offer pet care services and earn with SitGuru.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm("accountType", "both")}
                  className={`relative min-h-[150px] rounded-2xl border p-4 text-center transition ${
                    form.accountType === "both"
                      ? "border-emerald-500 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                >
                  {form.accountType === "both" ? (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : null}

                  <div className="text-3xl">🐾</div>
                  <p className="mt-3 text-base font-black text-slate-950">
                    Both
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Book care and also offer services as a Guru.
                  </p>
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-lg font-black text-slate-950">
                2. Choose how to create your account
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateForm("signupMethod", "phone")}
                  className={`relative rounded-[1.35rem] border p-4 text-left transition ${
                    form.signupMethod === "phone"
                      ? "border-emerald-500 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Phone className="h-6 w-6 text-emerald-700" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-slate-950">
                          Continue with phone
                        </p>
                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                          Fast
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        We’ll text you a secure 6-digit SitGuru code.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm("signupMethod", "email")}
                  className={`relative rounded-[1.35rem] border p-4 text-left transition ${
                    form.signupMethod === "email"
                      ? "border-emerald-500 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                      : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Mail className="h-6 w-6 text-sky-600" />
                    </div>

                    <div>
                      <p className="text-base font-black text-slate-950">
                        Continue with email
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        Create a password-based SitGuru account.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {form.signupMethod === "phone" ? (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ShieldCheck className="h-6 w-6 text-emerald-700" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-black text-slate-950">
                        3. Verify with your mobile number
                      </p>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                        Signing in as: {selectedAccountTypeShortLabel}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      This is the quickest way to create or log into your
                      SitGuru account.
                    </p>

                    <div className="mt-4 rounded-[1.35rem] border border-emerald-200 bg-white p-4">
                      <PhoneCodeLogin
                        role={phoneSignupRole}
                        nextPath={phoneSignupRedirect}
                        heading={getPhoneHeading(form.accountType)}
                        description={getPhoneDescription(form.accountType)}
                        submitLabel="Text me a SitGuru code"
                        verifyLabel="Verify & continue"
                        compact
                      />
                    </div>

                    {form.accountType === "both" ? (
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-emerald-100">
                        You selected Both. SitGuru will start you in the Pet
                        Parent setup first, then you can switch into your Guru
                        setup from the dashboard.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {form.signupMethod === "email" ? (
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="mb-4 text-lg font-black text-slate-950">
                  3. Create your account with email
                </p>

                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="mb-2 block text-sm font-black text-slate-900"
                      >
                        First name
                      </label>

                      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <User className="h-5 w-5 shrink-0 text-slate-400" />
                        <input
                          id="first-name"
                          value={form.firstName}
                          onChange={(event) =>
                            updateForm("firstName", event.target.value)
                          }
                          placeholder="First name"
                          className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="last-name"
                        className="mb-2 block text-sm font-black text-slate-900"
                      >
                        Last name
                      </label>

                      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                        <User className="h-5 w-5 shrink-0 text-slate-400" />
                        <input
                          id="last-name"
                          value={form.lastName}
                          onChange={(event) =>
                            updateForm("lastName", event.target.value)
                          }
                          placeholder="Last name"
                          className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-black text-slate-900"
                    >
                      Email address
                    </label>

                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                      <Mail className="h-5 w-5 shrink-0 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateForm("email", event.target.value)
                        }
                        placeholder="you@example.com"
                        className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-black text-slate-900"
                    >
                      Password
                    </label>

                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                      <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(event) =>
                          updateForm("password", event.target.value)
                        }
                        placeholder="Create a password"
                        className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="ml-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-green-800"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Use at least 8 characters.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-sm font-black text-slate-900"
                    >
                      Confirm password
                    </label>

                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                      <Lock className="h-5 w-5 shrink-0 text-slate-400" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(event) =>
                          updateForm("confirmPassword", event.target.value)
                        }
                        placeholder="Confirm your password"
                        className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        className="ml-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-green-800"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirmed password"
                            : "Show confirmed password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="referral-code"
                      className="mb-2 block text-sm font-black text-slate-900"
                    >
                      Referral code{" "}
                      <span className="font-bold text-slate-400">
                        optional
                      </span>
                    </label>

                    <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                      <Tag className="h-5 w-5 shrink-0 text-slate-400" />
                      <input
                        id="referral-code"
                        value={form.referralCode}
                        onChange={(event) =>
                          updateForm("referralCode", event.target.value)
                        }
                        placeholder="Referral code or invite link"
                        className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                      PetPerks rewards are earned after eligible first paid
                      booking activity is completed.
                    </p>
                  </div>

                  {successMessage ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {successMessage}
                    </div>
                  ) : null}

                  {errorMessage ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                      {errorMessage}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-500 px-5 py-4 text-base font-black text-white shadow-[0_16px_35px_rgba(14,165,233,0.22)] transition hover:from-emerald-700 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {isSubmitting
                      ? "Creating account..."
                      : `Create my ${selectedAccountTypeLabel} account`}
                  </button>

                  <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                    By creating an account, you agree to SitGuru’s{" "}
                    <Link
                      href="/terms"
                      className="font-black text-green-800 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="font-black text-green-800 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-center sm:p-5">
              <p className="text-sm font-black text-slate-900">
                Already part of SitGuru?
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <User className="h-4 w-4" />
                  Pet Parent Login
                </Link>

                <Link
                  href="/guru/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Guru Login
                </Link>
              </div>

              <Link
                href="/admin/login"
                className="mt-4 inline-flex text-xs font-black text-green-800 hover:underline"
              >
                Admin Login
              </Link>

              <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
                Choose the login that matches the dashboard you want to enter.
              </p>
            </div>

            <div className="mt-5 grid gap-3 text-center text-xs font-black text-slate-500 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                Free to join
              </div>
              <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                Secure phone codes
              </div>
              <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                Pet Parent + Guru ready
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}