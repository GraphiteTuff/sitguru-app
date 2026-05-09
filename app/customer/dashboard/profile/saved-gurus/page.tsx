"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Gift,
  Handshake,
  Heart,
  Loader2,
  Megaphone,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type SetupStatus = {
  basicInfoComplete: boolean;
  serviceLocationComplete: boolean;
  petPassportsComplete: boolean;
  careNotesComplete: boolean;
  emergencyContactComplete: boolean;
  notificationsComplete: boolean;
};

type SetupStepStatus = "complete" | "required" | "recommended";

type CustomerProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  service_city: string | null;
  service_state: string | null;
  service_zip: string | null;
};

const routes = {
  setupHub: "/customer/dashboard/profile",
  basicInfo: "/customer/dashboard/profile/basic-info",
  serviceLocation: "/customer/dashboard/profile/service-location",
  pets: "/customer/pets",
  careNotes: "/customer/dashboard/profile/care-notes",
  emergencyContact: "/customer/dashboard/profile/emergency-contact",
  notifications: "/customer/dashboard/profile/notifications",
  savedGurus: "/customer/dashboard/profile/saved-gurus",
  search: "/search",
  dashboard: "/customer/dashboard",
  messages: "/customer/dashboard/messages",
  pawperks: "/customer/dashboard/pawperks",
  referrals: "/referrals",
  guruApplication: "/guru/application",
  partners: "/partners",
  login: "/login",
};

function getStepBadgeClassName(status: SetupStepStatus) {
  if (status === "complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "required") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

async function fetchCustomerProfile(userId: string, email: string | null) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, service_city, service_state, service_zip",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Step 7 could not load: ${error.message}`);
  }

  return {
    id: userId,
    email,
    full_name: data?.full_name ?? null,
    first_name: data?.first_name ?? null,
    service_city: data?.service_city ?? null,
    service_state: data?.service_state ?? null,
    service_zip: data?.service_zip ?? null,
  } satisfies CustomerProfile;
}

async function fetchSetupStatus(userId: string): Promise<SetupStatus> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, first_name, phone, service_address, service_city, service_state, service_zip, care_preferences, emergency_contact, emergency_contact_name, emergency_contact_phone, email_notifications, push_notifications, text_notifications",
    )
    .eq("id", userId)
    .maybeSingle();

  const { data: pets } = await supabase
    .from("pets")
    .select("id")
    .eq("owner_id", userId)
    .limit(1);

  return {
    basicInfoComplete: Boolean(
      profile && (profile.full_name || profile.first_name) && profile.phone,
    ),
    serviceLocationComplete: Boolean(
      profile &&
        profile.service_address &&
        profile.service_city &&
        profile.service_state &&
        profile.service_zip,
    ),
    petPassportsComplete: Boolean(pets && pets.length > 0),
    careNotesComplete: Boolean(profile?.care_preferences),
    emergencyContactComplete: Boolean(
      profile?.emergency_contact ||
        (profile?.emergency_contact_name && profile?.emergency_contact_phone),
    ),
    notificationsComplete: Boolean(
      profile?.email_notifications ||
        profile?.push_notifications ||
        profile?.text_notifications,
    ),
  };
}

function SetupNavigation({ setupStatus }: { setupStatus: SetupStatus }) {
  const steps = [
    {
      number: 1,
      label: "Basic Info",
      href: routes.basicInfo,
      status: setupStatus.basicInfoComplete ? "complete" : "required",
    },
    {
      number: 2,
      label: "Service Location",
      href: routes.serviceLocation,
      status: setupStatus.serviceLocationComplete ? "complete" : "required",
    },
    {
      number: 3,
      label: "Pet Passports",
      href: routes.pets,
      status: setupStatus.petPassportsComplete ? "complete" : "required",
    },
    {
      number: 4,
      label: "Care Notes",
      href: routes.careNotes,
      status: setupStatus.careNotesComplete ? "complete" : "recommended",
    },
    {
      number: 5,
      label: "Emergency",
      href: routes.emergencyContact,
      status: setupStatus.emergencyContactComplete
        ? "complete"
        : "recommended",
    },
    {
      number: 6,
      label: "Notifications",
      href: routes.notifications,
      status: setupStatus.notificationsComplete ? "complete" : "recommended",
    },
  ] satisfies Array<{
    number: number;
    label: string;
    href: string;
    status: SetupStepStatus;
  }>;

  return (
    <div className="grid gap-2 md:grid-cols-6">
      {steps.map((step) => (
        <Link
          key={step.number}
          href={step.href}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          <span
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${getStepBadgeClassName(
              step.status,
            )}`}
          >
            {step.status === "complete" ? "✓" : step.number}
          </span>
          <span className="mt-2 block text-xs font-black text-slate-800">
            {step.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        {icon}
      </div>

      <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  description,
  href,
  action,
  primary = false,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[1.75rem] border p-5 transition hover:-translate-y-1 hover:shadow-xl ${
        primary
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        {icon}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        {eyebrow}
      </p>

      <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {description}
      </p>

      <div
        className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${
          primary
            ? "bg-emerald-600 text-white group-hover:bg-emerald-700"
            : "bg-white text-emerald-700 ring-1 ring-emerald-200 group-hover:bg-emerald-600 group-hover:text-white"
        }`}
      >
        {action}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function CustomerSavedGurusSetupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    basicInfoComplete: false,
    serviceLocationComplete: false,
    petPassportsComplete: false,
    careNotesComplete: false,
    emergencyContactComplete: false,
    notificationsComplete: false,
  });
  const [errorMessage, setErrorMessage] = useState("");

  const setupCompleteCount = useMemo(() => {
    return [
      setupStatus.basicInfoComplete,
      setupStatus.serviceLocationComplete,
      setupStatus.petPassportsComplete,
      setupStatus.careNotesComplete,
      setupStatus.emergencyContactComplete,
      setupStatus.notificationsComplete,
    ].filter(Boolean).length;
  }, [setupStatus]);

  const firstName =
    profile?.first_name || profile?.full_name?.split(" ")[0] || "there";

  const setupPercent = Math.round((setupCompleteCount / 6) * 100);

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
      const [profileData, setupData] = await Promise.all([
        fetchCustomerProfile(user.id, user.email ?? null),
        fetchSetupStatus(user.id),
      ]);

      setProfile(profileData);
      setSetupStatus(setupData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not load Step 7.",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)]">
        <Header />
        <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-16">
          <div className="rounded-[2rem] border border-emerald-100 bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-base font-bold text-slate-700">
              Loading Step 7...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_42%,#ecfdf5_100%)] text-slate-950">
      <Header />

      <section className="mx-auto max-w-[1350px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={routes.setupHub}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Setup Hub
          </Link>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
            Optional Step 7
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="bg-[linear-gradient(120deg,#10b981_0%,#34d399_52%,#a7f3d0_100%)] px-6 py-8 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-950/80">
              Optional Step 7 · Explore More with SitGuru
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.065em] text-slate-950 md:text-6xl">
              PawPerks & Circle Rewards
            </h1>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-800/75">
              All Pet Parents are automatically enrolled in PawPerks. Through
              PawPerks Circle Rewards, you can invite Pet Parents, refer future
              Gurus, help grow the SitGuru pet community, and track eligible
              rewards.
            </p>
          </div>

          <div className="p-5 sm:p-6 lg:p-8">
            <SetupNavigation setupStatus={setupStatus} />

            {errorMessage ? (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_220px] lg:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Profile completion
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    Your 6-step Pet Parent care profile is{" "}
                    {setupPercent === 100 ? "complete" : "almost ready"}.
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                    Step 7 is optional. It does not lower your setup score. It is
                    designed to help you get more value from SitGuru, invite
                    others, track rewards, and explore earning as a Guru.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                    Setup Progress
                  </p>
                  <p className="mt-2 text-5xl font-black text-slate-950">
                    {setupCompleteCount}/6
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-700">
                    {setupPercent}% complete
                  </p>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${setupPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                <div className="rounded-[1.7rem] border border-emerald-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Gift className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                        PawPerks
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-950">
                        Automatically Included
                      </h2>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ All Pet Parents are enrolled
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ Circle Rewards tracks referrals
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ Refer Pet Parents and future Gurus
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      ✓ Help grow the SitGuru pet community
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Program naming
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    PawPerks is the main Pet Parent rewards program. PawPerks
                    Circle Rewards is the referral and reward tracking part
                    inside PawPerks.
                  </p>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-emerald-100 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Handshake className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      Commissions
                    </p>
                  </div>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    Commission-based opportunities belong under SitGuru&apos;s
                    Partner Program for businesses, creators, affiliates,
                    rescues, veterinarians, pet stores, groomers, trainers, and
                    community partners.
                  </p>
                </div>
              </div>

              <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-950">
                      Grow with SitGuru
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Hi {firstName}, use Step 7 to find trusted Gurus, refer
                      people you know, track eligible rewards, and explore
                      earning opportunities.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <ActionCard
                    icon={<Gift className="h-5 w-5" />}
                    eyebrow="PawPerks"
                    title="View PawPerks"
                    description="See your automatic Pet Parent perks, referral options, and eligible reward tracking."
                    href={routes.pawperks}
                    action="View PawPerks"
                    primary
                  />

                  <ActionCard
                    icon={<Megaphone className="h-5 w-5" />}
                    eyebrow="Circle Rewards"
                    title="Refer Pet Parents"
                    description="Invite friends, family, neighbors, coworkers, and local pet lovers to join SitGuru."
                    href={routes.referrals}
                    action="Refer Pet Parents"
                    primary
                  />

                  <ActionCard
                    icon={<UserPlus className="h-5 w-5" />}
                    eyebrow="Future Gurus"
                    title="Refer Future Gurus"
                    description="Share SitGuru with walkers, sitters, students, veterans, retirees, and animal lovers who may want to earn."
                    href={routes.referrals}
                    action="Refer Future Gurus"
                  />

                  <ActionCard
                    icon={<Trophy className="h-5 w-5" />}
                    eyebrow="Track Rewards"
                    title="Track Circle Rewards"
                    description="Follow eligible referrals, community growth rewards, and future PawPerks activity."
                    href={routes.pawperks}
                    action="Track Rewards"
                  />

                  <ActionCard
                    icon={<Search className="h-5 w-5" />}
                    eyebrow="Find care"
                    title="Find & Save Gurus"
                    description="Search local Gurus, compare fit, save favorites, and return to trusted providers."
                    href={routes.search}
                    action="Find a Guru"
                  />

                  <ActionCard
                    icon={<Star className="h-5 w-5" />}
                    eyebrow="Earn"
                    title="Become a Guru"
                    description="Interested in earning with SitGuru? Start your Guru application and offer care services."
                    href={routes.guruApplication}
                    action="Become a Guru"
                  />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-center gap-3">
                    <PawPrint className="h-5 w-5 text-emerald-700" />
                    <p className="text-sm font-black text-slate-950">
                      SitGuru pet community impact
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Referrals help SitGuru grow trusted local care supply and
                    demand together. More Pet Parents create more booking
                    opportunities, and more Gurus create better local coverage.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <FeatureCard
                    icon={<Heart className="h-5 w-5" />}
                    title="Save trusted Gurus"
                    description="Favorite Gurus so trusted providers are easier to find and rebook later."
                  />

                  <FeatureCard
                    icon={<MessageCircle className="h-5 w-5" />}
                    title="Message before booking"
                    description="Ask questions, confirm care needs, and make sure the Guru feels like a good fit."
                  />

                  <FeatureCard
                    icon={<UserRoundCheck className="h-5 w-5" />}
                    title="Build your circle"
                    description="Invite reliable Pet Parents and future Gurus to strengthen the SitGuru community."
                  />

                  <FeatureCard
                    icon={<Handshake className="h-5 w-5" />}
                    title="Partner opportunities"
                    description="Businesses, creators, and community partners can participate in commission-based partner programs."
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={routes.pawperks}
                    className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    <Gift className="h-4 w-4" />
                    View PawPerks
                  </Link>

                  <Link
                    href={routes.dashboard}
                    className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Finish Setup
                    <CheckCircle2 className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-emerald-50 pt-5">
                  <Link
                    href={routes.notifications}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous: Notifications
                  </Link>

                  <Link
                    href={routes.dashboard}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                    Step 7 summary
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    Step 7 helps Pet Parents grow with SitGuru.
                  </h3>
                  <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-700">
                    PawPerks is automatic. PawPerks Circle Rewards supports
                    referrals, reward tracking, and community growth. The SitGuru
                    Partner Program is where commission-based opportunities
                    belong for affiliates, creators, businesses, and community
                    partners.
                  </p>
                </div>

                <Link
                  href={routes.pawperks}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Open PawPerks
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}