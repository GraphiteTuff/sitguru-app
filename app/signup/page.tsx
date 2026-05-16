"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Loader2,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import PhoneCodeLogin from "@/components/auth/PhoneCodeLogin";
import { supabase } from "@/lib/supabase";

type SignupAccountType = "pet_parent" | "future_guru" | "both";

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  referralCode: string;
  accountType: SignupAccountType;
};

const initialForm: SignupForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  referralCode: "",
  accountType: "pet_parent",
};

function getAccountTypeLabel(accountType: SignupAccountType) {
  if (accountType === "future_guru") return "Future Guru";
  if (accountType === "both") return "Pet Parent + Future Guru";
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
  return "/customer/dashboard/profile";
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

  const selectedAccountTypeLabel = getAccountTypeLabel(form.accountType);
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d9fff1_0%,#f8fffc_38%,#ffffff_100%)] px-5 py-12 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
            <Sparkles className="h-4 w-4" />
            Join SitGuru Free
          </div>

          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-6xl">
            Create your free account and get started with trusted pet care.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-7 text-slate-600">
            Join for free as a Pet Parent, a future Guru, or both with a
            cleaner, more modern experience built to grow with SitGuru.
          </p>

          <div className="mt-7 rounded-[1.6rem] border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
            <div className="inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-black uppercase tracking-[0.28em] text-emerald-700 ring-1 ring-emerald-100">
              SitGuru PetPerks
            </div>

            <h2 className="mt-4 text-3xl font-black leading-[0.95] tracking-[-0.045em] text-slate-950 sm:text-4xl">
              Join free, refer others, and help the SitGuru community grow.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              If you arrived through a SitGuru referral link, your signup will
              connect to PetPerks. Rewards are earned only after eligible first
              paid booking activity is completed.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Heart className="h-6 w-6 text-purple-600" />
                <h3 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em]">
                  Give $10. Get $10.
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Pet Parent rewards are earned after the referred Pet Parent
                  completes their first eligible paid booking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <h3 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em]">
                  Refer a Guru. Earn $20.
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Guru referral rewards are earned after the referred Guru is
                  approved and completes their first eligible paid booking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Heart className="h-6 w-6 fill-emerald-400 text-emerald-500" />
                <h3 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em]">
                  Join as Both
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Pet Parents can also become Gurus. PetPerks can track both
                  paths after eligible activity.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Sparkles className="h-5 w-5 text-orange-400" />
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                Free Account
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Join SitGuru for free and get started today.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Search className="h-5 w-5 text-sky-500" />
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                Book Care
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Pet Parents can find trusted pet care nearby.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                Earn as a Guru
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Future Gurus can offer pet care services.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
            Free Account
          </div>

          <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-5xl">
            Start using SitGuru for free
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create your free account to book pet care, save favorite Gurus, or
            begin offering services.
          </p>

          <div className="mt-6">
            <p className="mb-3 text-sm font-black text-slate-900">
              Account type
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => updateForm("accountType", "pet_parent")}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.accountType === "pet_parent"
                    ? "border-emerald-400 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                }`}
              >
                <div className="text-xl">🐶</div>
                <p className="mt-2 text-sm font-black text-slate-950">
                  Pet Parent
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I want to find, book, and share trusted pet care.
                </p>
              </button>

              <button
                type="button"
                onClick={() => updateForm("accountType", "future_guru")}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.accountType === "future_guru"
                    ? "border-emerald-400 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                }`}
              >
                <div className="text-xl">⭐</div>
                <p className="mt-2 text-sm font-black text-slate-950">
                  Future Guru
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I want to offer pet care services and earn with SitGuru.
                </p>
              </button>

              <button
                type="button"
                onClick={() => updateForm("accountType", "both")}
                className={`rounded-2xl border p-4 text-left transition ${
                  form.accountType === "both"
                    ? "border-emerald-400 bg-emerald-50 shadow-[0_14px_35px_rgba(16,185,129,0.12)]"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                }`}
              >
                <div className="text-xl">🐾</div>
                <p className="mt-2 text-sm font-black text-slate-950">Both</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  I want to book pet care and also offer services as a Guru.
                </p>
              </button>
            </div>
          </div>

          <PhoneCodeLogin
            role={phoneSignupRole}
            nextPath={phoneSignupRedirect}
            heading="Continue with phone"
            description="Enter your mobile number and we’ll text you a secure 6-digit SitGuru code."
            submitLabel="Text me a code"
            verifyLabel="Verify & continue"
            compact
          />

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              or finish the quick form
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first-name"
                  className="mb-2 block text-sm font-black text-slate-900"
                >
                  First name
                </label>
                <input
                  id="first-name"
                  value={form.firstName}
                  onChange={(event) =>
                    updateForm("firstName", event.target.value)
                  }
                  placeholder="First name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="last-name"
                  className="mb-2 block text-sm font-black text-slate-900"
                >
                  Last name
                </label>
                <input
                  id="last-name"
                  value={form.lastName}
                  onChange={(event) =>
                    updateForm("lastName", event.target.value)
                  }
                  placeholder="Last name"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="referral-code"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Referral code{" "}
                <span className="font-bold text-slate-400">optional</span>
              </label>
              <input
                id="referral-code"
                value={form.referralCode}
                onChange={(event) =>
                  updateForm("referralCode", event.target.value)
                }
                placeholder="Referral code or invite link code"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                PetPerks rewards are only earned after eligible first paid
                booking activity is completed.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-black text-slate-900"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateForm("password", event.target.value)
                }
                placeholder="Create a password"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Use at least 8 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-sky-400 px-5 py-4 text-sm font-black text-white shadow-[0_16px_35px_rgba(14,165,233,0.22)] transition hover:from-emerald-600 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isSubmitting
                ? "Creating account..."
                : `Create free ${selectedAccountTypeLabel} account`}
            </button>

            {successMessage ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}
          </form>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-900">
              Already have an account?
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link
                href="/customer/login"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                Pet Parent Login
              </Link>

              <Link
                href="/guru/login"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
              >
                Guru Login
              </Link>
            </div>

            <p className="mt-3 rounded-xl bg-white px-4 py-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-slate-200">
              You selected {selectedAccountTypeLabel}. Your login route and
              dashboard will match the account mode you choose.
            </p>
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