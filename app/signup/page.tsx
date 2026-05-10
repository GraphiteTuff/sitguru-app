"use client";

import { Open_Sans } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import WelcomeConfetti from "@/components/WelcomeConfetti";
import { supabase } from "@/lib/supabase";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

type AccountType = "customer" | "guru";

type SignupFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: AccountType;
  referralCode: string;
};

const initialSignupFormState: SignupFormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  accountType: "customer",
  referralCode: "",
};

const rewardsHighlights = [
  {
    title: "Refer Pet Parents",
    description:
      "Invite Pet Parents to join SitGuru and help them discover trusted local care.",
    icon: "🐾",
  },
  {
    title: "Refer Future Gurus",
    description:
      "Share SitGuru with walkers, sitters, students, veterans, and local pet lovers.",
    icon: "⭐",
  },
  {
    title: "Track Rewards",
    description:
      "Referral details can be connected to your account after signup.",
    icon: "🎁",
  },
];

const signupBenefits = [
  {
    title: "Free Account",
    description: "Join SitGuru for free and get started today.",
    icon: "✨",
  },
  {
    title: "Book Care",
    description: "Pet Parents can find trusted pet care nearby.",
    icon: "🔎",
  },
  {
    title: "Earn as a Guru",
    description: "Future Gurus can offer pet care services.",
    icon: "💚",
  },
];

const accountTypeOptions: {
  value: AccountType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "customer",
    label: "Pet Parent",
    description: "I want to find and book trusted pet care.",
    icon: "🐶",
  },
  {
    value: "guru",
    label: "Future Guru",
    description: "I want to offer pet care services.",
    icon: "⭐",
  },
];

function getReferralFromUrl() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);

  return (
    params.get("ref") ||
    params.get("referral") ||
    params.get("referralCode") ||
    params.get("invite") ||
    ""
  );
}

function getSignupSourceFromUrl() {
  if (typeof window === "undefined") return "direct";

  const params = new URLSearchParams(window.location.search);
  const source =
    params.get("source") ||
    params.get("utm_source") ||
    params.get("ref_source") ||
    "";

  return source.trim() || "direct";
}

function getPostSignupPath(accountType: AccountType) {
  return accountType === "guru"
    ? "/guru/dashboard/profile"
    : "/customer/dashboard/profile";
}

function buildLoginHref(accountType: AccountType) {
  const nextPath = getPostSignupPath(accountType);
  const loginPath = accountType === "guru" ? "/guru/login" : "/login";

  return `${loginPath}?next=${encodeURIComponent(nextPath)}`;
}

function getAccountTypeFromUrl(): AccountType | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const value = String(
    params.get("accountType") ||
      params.get("account_type") ||
      params.get("role") ||
      params.get("type") ||
      "",
  )
    .trim()
    .toLowerCase();

  if (value === "guru" || value === "provider" || value === "sitter") {
    return "guru";
  }

  if (
    value === "customer" ||
    value === "pet-parent" ||
    value === "pet_parent" ||
    value === "parent"
  ) {
    return "customer";
  }

  return null;
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState<SignupFormState>(initialSignupFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [shouldCelebrateSignup, setShouldCelebrateSignup] = useState(false);
  const [hasSeenWelcomeConfetti, setHasSeenWelcomeConfetti] = useState(false);

  const fullName = useMemo(() => {
    return `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  }, [form.firstName, form.lastName]);

  const passwordIsLongEnough = form.password.length >= 8;
  const passwordHasValue = form.password.length > 0;

  const loginHref = buildLoginHref(form.accountType);
  const loginLabel =
    form.accountType === "guru" ? "Guru Login" : "Pet Parent Login";

  const alternateAccountType: AccountType =
    form.accountType === "guru" ? "customer" : "guru";
  const alternateLoginHref = buildLoginHref(alternateAccountType);
  const alternateLoginLabel =
    form.accountType === "guru" ? "Pet Parent Login" : "Guru Login";

  useEffect(() => {
    const referralCode = getReferralFromUrl();
    const accountTypeFromUrl = getAccountTypeFromUrl();

    setForm((prev) => ({
      ...prev,
      referralCode: referralCode || prev.referralCode,
      accountType: accountTypeFromUrl || prev.accountType,
    }));
  }, []);

  function updateField<K extends keyof SignupFormState>(
    key: K,
    value: SignupFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSignupError("");
    setSignupSuccess("");
    setShouldCelebrateSignup(false);

    if (!form.firstName.trim()) {
      setSignupError("Please enter your first name.");
      return;
    }

    if (!form.lastName.trim()) {
      setSignupError("Please enter your last name.");
      return;
    }

    if (!form.email.trim()) {
      setSignupError("Please enter your email address.");
      return;
    }

    if (!passwordIsLongEnough) {
      setSignupError("Please create a password with at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const selectedAccountType = form.accountType;
      const postSignupPath = getPostSignupPath(selectedAccountType);
      const callbackPath = `/auth/callback?next=${encodeURIComponent(
        postSignupPath,
      )}`;

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: origin ? `${origin}${callbackPath}` : undefined,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: fullName,
            account_type: form.accountType,
            role: form.accountType,
            referral_code: form.referralCode.trim(),
            signup_source: getSignupSourceFromUrl(),
          },
        },
      });

      if (error) {
        throw error;
      }

      setSignupSuccess(
        selectedAccountType === "guru"
          ? "Your free Guru account has been created. Continue to your Guru profile setup to finish becoming bookable."
          : "Your free Pet Parent account has been created. Continue to your My Profile setup to complete your care profile.",
      );

      setShouldCelebrateSignup(true);

      setForm((prev) => ({
        ...initialSignupFormState,
        accountType: prev.accountType,
        referralCode: prev.referralCode,
      }));

      if (data.session) {
        window.setTimeout(() => {
          router.replace(postSignupPath);
        }, 900);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while creating your account.";

      setSignupError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className={`${openSans.className} min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,216,166,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_34%),linear-gradient(180deg,#f8fffb_0%,#effaf3_55%,#ffffff_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8`}
    >
      <WelcomeConfetti
        shouldCelebrate={shouldCelebrateSignup}
        hasSeenWelcomeConfetti={hasSeenWelcomeConfetti}
        message={
          form.accountType === "guru"
            ? "Your free Guru account was created successfully."
            : "Your free SitGuru account was created successfully."
        }
        onCelebrate={() => {
          setHasSeenWelcomeConfetti(true);
        }}
      />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              Join SitGuru Free
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
              Create your free account and get started with trusted pet care.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Join for free as a Pet Parent or begin your path as a Guru with a
              cleaner, more modern experience built to grow with SitGuru.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/80 p-5 sm:p-6">
              <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                SitGuru Circle Rewards
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Join free, refer others, and help the SitGuru community grow.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                If you arrived through a SitGuru referral link, we’ll connect
                your signup to that referral after your account is created.
                Members can help grow the SitGuru community by inviting Pet
                Parents, future Gurus, and local partners.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {rewardsHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <h3 className="mt-3 text-sm font-black text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {signupBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="text-xl">{benefit.icon}</div>
                  <h3 className="mt-3 text-sm font-black text-slate-950">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
              Free Account
            </div>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Start using SitGuru for free
            </h2>

            <p className="mt-2 text-base leading-7 text-slate-600">
              Create your free account to book pet care, save favorite Gurus, or
              begin offering services.
            </p>

            <form onSubmit={handleSignup} className="mt-7 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                    className="input w-full"
                    placeholder="First name"
                    autoComplete="given-name"
                    suppressHydrationWarning
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                    className="input w-full"
                    placeholder="Last name"
                    autoComplete="family-name"
                    suppressHydrationWarning
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="input w-full"
                  placeholder="you@example.com"
                  autoComplete="email"
                  suppressHydrationWarning
                  required
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-slate-800">
                  Account type
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {accountTypeOptions.map((option) => {
                    const selected = form.accountType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateField("accountType", option.value)
                        }
                        className={`rounded-3xl border p-4 text-left transition ${
                          selected
                            ? "border-emerald-400 bg-emerald-50 shadow-sm ring-4 ring-emerald-100"
                            : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{option.icon}</span>
                          <span className="text-sm font-black text-slate-950">
                            {option.label}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="referralCode"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Referral code{" "}
                  <span className="font-medium text-slate-400">optional</span>
                </label>

                <input
                  id="referralCode"
                  type="text"
                  value={form.referralCode}
                  onChange={(event) =>
                    updateField("referralCode", event.target.value)
                  }
                  className="input w-full"
                  placeholder="Referral code or invite link code"
                  autoComplete="off"
                  suppressHydrationWarning
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Referral details help connect this signup to the SitGuru
                  Circle Rewards program.
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  className="input w-full"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  suppressHydrationWarning
                  required
                />

                <p
                  className={`mt-2 text-xs font-semibold ${
                    !passwordHasValue
                      ? "text-slate-500"
                      : passwordIsLongEnough
                        ? "text-emerald-700"
                        : "text-amber-700"
                  }`}
                >
                  Use at least 8 characters.
                </p>
              </div>

              {signupError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {signupError}
                </div>
              ) : null}

              {signupSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <p>{signupSuccess}</p>
                  <Link
                    href={getPostSignupPath(form.accountType)}
                    className="mt-3 inline-flex min-h-[42px] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    {form.accountType === "guru"
                      ? "Continue to Guru Profile"
                      : "Continue to My Profile"}
                  </Link>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-12 w-full text-base disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating free account..." : "Create free account"}
              </button>
            </form>

            <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-700">
                Already have an account?
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  href={loginHref}
                  className="flex min-h-[52px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  {loginLabel}
                </Link>

                <Link
                  href={alternateLoginHref}
                  className="flex min-h-[52px] items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  {alternateLoginLabel}
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-sm font-bold leading-6 text-slate-600">
                  {form.accountType === "guru"
                    ? "You selected Future Guru, so your main login button goes to the Guru portal. Need to book care instead? Use Pet Parent Login."
                    : "You selected Pet Parent, so your main login button goes to the Pet Parent portal. Want to offer pet care? Use Guru Login."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}