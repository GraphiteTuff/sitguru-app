import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  Mail,
  MapPin,
  MessageSquareText,
  PawPrint,
  Phone,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type SignupLeadStatus =
  | "New"
  | "Contacted"
  | "Warm"
  | "Follow-Up"
  | "Waiting"
  | "Partnered"
  | "Needs CEO Review"
  | "Needs Follow-Up";

type PriorityLevel = "Low" | "Medium" | "High";

type SignupLead = {
  id: string;
  lead_type: string | null;
  lead_status: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  market_area: string | null;
  business_name: string | null;
  website_url: string | null;
  social_handle: string | null;
  relationship_category: string | null;
  ambassador_type: string | null;
  partner_category: string | null;
  growth_channel: string | null;
  interested_as: string | null;
  program_interest: string | null;
  referral_focus: string | null;
  campaign_source: string | null;
  referral_source_name: string | null;
  referral_source_type: string | null;
  pet_parent_interest: boolean | null;
  guru_interest: boolean | null;
  ambassador_interest: boolean | null;
  partner_interest: boolean | null;
  program_interest_flag: boolean | null;
  signup_invite_status: string | null;
  signup_link: string | null;
  signup_completed: boolean | null;
  signup_completed_at: string | null;
  priority_level: string | null;
  referral_potential: string | null;
  ceo_priority: boolean | null;
  next_follow_up: string | null;
  next_action: string | null;
  outcome_goal: string | null;
  notes: string | null;
  ceo_notes: string | null;
  owner_name: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SignupLeadPet = {
  id: string;
  signup_lead_id: string | null;
  pet_order: number | null;
  pet_name: string | null;
  pet_type: string | null;
  pet_breed: string | null;
  pet_birthday_month: string | null;
  pet_birthday_year: string | null;
  pet_notes: string | null;
};

type MarketingReferral = {
  id: string;
  referral_status: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  referrer_phone: string | null;
  referrer_type: string | null;
  referrer_relationship: string | null;
  referred_first_name: string | null;
  referred_last_name: string | null;
  referred_full_name: string | null;
  referred_email: string | null;
  referred_phone: string | null;
  referred_type: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
  market_area: string | null;
  campaign_source: string | null;
  growth_channel: string | null;
  program_interest: string | null;
  referral_focus: string | null;
  reward_eligible: boolean | null;
  reward_type: string | null;
  reward_status: string | null;
  reward_amount: number | null;
  priority_level: string | null;
  ceo_priority: boolean | null;
  next_follow_up: string | null;
  next_action: string | null;
  outcome_goal: string | null;
  notes: string | null;
  ceo_notes: string | null;
  owner_name: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

type InfoPill = {
  label: string;
  value: string | null | undefined;
  tone?: StatusTone;
};

const toneStyles: Record<
  StatusTone,
  {
    card: string;
    icon: string;
    pill: string;
    text: string;
    border: string;
  }
> = {
  emerald: {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    pill: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  amber: {
    card: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    pill: "bg-amber-100 text-amber-800",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  blue: {
    card: "border-sky-200 bg-sky-50",
    icon: "bg-sky-600 text-white",
    pill: "bg-sky-100 text-sky-800",
    text: "text-sky-800",
    border: "border-sky-200",
  },
  rose: {
    card: "border-rose-200 bg-rose-50",
    icon: "bg-rose-600 text-white",
    pill: "bg-rose-100 text-rose-800",
    text: "text-rose-800",
    border: "border-rose-200",
  },
  slate: {
    card: "border-slate-200 bg-slate-50",
    icon: "bg-slate-700 text-white",
    pill: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  purple: {
    card: "border-violet-200 bg-violet-50",
    icon: "bg-violet-600 text-white",
    pill: "bg-violet-100 text-violet-800",
    text: "text-violet-800",
    border: "border-violet-200",
  },
};

const statusToneMap: Record<SignupLeadStatus, StatusTone> = {
  New: "slate",
  Contacted: "blue",
  Warm: "amber",
  "Follow-Up": "purple",
  Waiting: "amber",
  Partnered: "emerald",
  "Needs CEO Review": "rose",
  "Needs Follow-Up": "rose",
};

function normalizeStatus(status: string | null | undefined): SignupLeadStatus {
  const cleanStatus = (status || "New").trim();

  if (
    cleanStatus === "New" ||
    cleanStatus === "Contacted" ||
    cleanStatus === "Warm" ||
    cleanStatus === "Follow-Up" ||
    cleanStatus === "Waiting" ||
    cleanStatus === "Partnered" ||
    cleanStatus === "Needs CEO Review" ||
    cleanStatus === "Needs Follow-Up"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "Follow Up") return "Follow-Up";
  if (cleanStatus === "CEO Review") return "Needs CEO Review";

  return "New";
}

function normalizePriority(priority: string | null | undefined): PriorityLevel {
  const cleanPriority = (priority || "Medium").trim();

  if (
    cleanPriority === "Low" ||
    cleanPriority === "Medium" ||
    cleanPriority === "High"
  ) {
    return cleanPriority;
  }

  return "Medium";
}

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "Not set";

  return new Date(dateValue.includes("T") ? dateValue : `${dateValue}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function formatMoney(value: number | null | undefined) {
  const safeValue = Number(value ?? 0);

  return safeValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function getDisplayName(lead: SignupLead) {
  return (
    lead.full_name ||
    `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
    lead.business_name ||
    "Unnamed lead"
  );
}

function getReferralDisplayName(referral: MarketingReferral) {
  return (
    referral.referred_full_name ||
    `${referral.referred_first_name || ""} ${referral.referred_last_name || ""}`.trim() ||
    "Unnamed referral"
  );
}

async function getSignupLeads(): Promise<SignupLead[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_signup_leads")
    .select(
      [
        "id",
        "lead_type",
        "lead_status",
        "first_name",
        "last_name",
        "full_name",
        "email",
        "phone",
        "zip_code",
        "city",
        "state",
        "market_area",
        "business_name",
        "website_url",
        "social_handle",
        "relationship_category",
        "ambassador_type",
        "partner_category",
        "growth_channel",
        "interested_as",
        "program_interest",
        "referral_focus",
        "campaign_source",
        "referral_source_name",
        "referral_source_type",
        "pet_parent_interest",
        "guru_interest",
        "ambassador_interest",
        "partner_interest",
        "program_interest_flag",
        "signup_invite_status",
        "signup_link",
        "signup_completed",
        "signup_completed_at",
        "priority_level",
        "referral_potential",
        "ceo_priority",
        "next_follow_up",
        "next_action",
        "outcome_goal",
        "notes",
        "ceo_notes",
        "owner_name",
        "created_by_name",
        "created_by_email",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("ceo_priority", { ascending: false })
    .order("next_follow_up", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sales & Marketing signup leads fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as SignupLead[];
}

async function getSignupLeadPets(): Promise<SignupLeadPet[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_signup_lead_pets")
    .select(
      [
        "id",
        "signup_lead_id",
        "pet_order",
        "pet_name",
        "pet_type",
        "pet_breed",
        "pet_birthday_month",
        "pet_birthday_year",
        "pet_notes",
      ].join(", "),
    )
    .order("pet_order", { ascending: true });

  if (error) {
    console.error("Sales & Marketing lead pets fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as SignupLeadPet[];
}

async function getReferrals(): Promise<MarketingReferral[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_referrals")
    .select(
      [
        "id",
        "referral_status",
        "referrer_name",
        "referrer_email",
        "referrer_phone",
        "referrer_type",
        "referrer_relationship",
        "referred_first_name",
        "referred_last_name",
        "referred_full_name",
        "referred_email",
        "referred_phone",
        "referred_type",
        "zip_code",
        "city",
        "state",
        "market_area",
        "campaign_source",
        "growth_channel",
        "program_interest",
        "referral_focus",
        "reward_eligible",
        "reward_type",
        "reward_status",
        "reward_amount",
        "priority_level",
        "ceo_priority",
        "next_follow_up",
        "next_action",
        "outcome_goal",
        "notes",
        "ceo_notes",
        "owner_name",
        "created_by_name",
        "created_by_email",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("ceo_priority", { ascending: false })
    .order("next_follow_up", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sales & Marketing referrals fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as MarketingReferral[];
}

function buildStatCards(
  signupLeads: SignupLead[],
  referrals: MarketingReferral[],
  pets: SignupLeadPet[],
): StatCard[] {
  const ceoPriority =
    signupLeads.filter((lead) => lead.ceo_priority).length +
    referrals.filter((referral) => referral.ceo_priority).length;

  const inviteReady = signupLeads.filter((lead) =>
    (lead.signup_invite_status || "").toLowerCase().includes("ready"),
  ).length;

  return [
    {
      title: "Signup Leads",
      value: String(signupLeads.length),
      description:
        "Pet Parent, Guru, Ambassador, partner, program, and general signup leads captured by Jason or Danette.",
      icon: Users,
      tone: "emerald",
    },
    {
      title: "Referrals",
      value: String(referrals.length),
      description:
        "Referral records captured from Ambassadors, Pet Parents, Gurus, partners, friends, family, or local outreach.",
      icon: HeartHandshake,
      tone: "blue",
    },
    {
      title: "Pets Captured",
      value: String(pets.length),
      description:
        "Optional pet records tied to signup leads, including pet type, breed, and birthday month/year.",
      icon: PawPrint,
      tone: "amber",
    },
    {
      title: "CEO Priority",
      value: String(ceoPriority),
      description:
        "Signup leads or referrals marked for Jason’s review, support, approval, or follow-up.",
      icon: ClipboardCheck,
      tone: "rose",
    },
    {
      title: "Messages Ready",
      value: String(inviteReady),
      description:
        "Leads with email-ready or SMS-ready thank-you / next-step message tracking.",
      icon: Send,
      tone: "purple",
    },
  ];
}

function groupPetsByLeadId(pets: SignupLeadPet[]) {
  return pets.reduce<Record<string, SignupLeadPet[]>>((groups, pet) => {
    if (!pet.signup_lead_id) return groups;

    if (!groups[pet.signup_lead_id]) {
      groups[pet.signup_lead_id] = [];
    }

    groups[pet.signup_lead_id].push(pet);

    return groups;
  }, {});
}

function CardIcon({
  icon: Icon,
  tone,
}: {
  icon: typeof ClipboardCheck;
  tone: StatusTone;
}) {
  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${toneStyles[tone].icon}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

function StatusBadge({ status }: { status: SignupLeadStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  const tone: StatusTone =
    priority === "High" ? "rose" : priority === "Medium" ? "amber" : "slate";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {priority} priority
    </span>
  );
}

function SimpleInfoPill({ label, value, tone = "slate" }: InfoPill) {
  return (
    <div className={`rounded-xl border p-3 ${toneStyles[tone].card}`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${toneStyles[tone].text}`}>
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">
        {value || "Not set"}
      </p>
    </div>
  );
}

function InterestBadges({ lead }: { lead: SignupLead }) {
  const interests = [
    lead.pet_parent_interest ? "Pet Parent" : null,
    lead.guru_interest ? "Guru" : null,
    lead.ambassador_interest ? "Ambassador" : null,
    lead.partner_interest ? "Partner" : null,
    lead.program_interest_flag ? "Program" : null,
  ].filter(Boolean);

  if (interests.length === 0) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
        No interest flags
      </span>
    );
  }

  return (
    <>
      {interests.map((interest) => (
        <span
          key={interest}
          className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"
        >
          {interest}
        </span>
      ))}
    </>
  );
}

function PetCard({ pet }: { pet: SignupLeadPet }) {
  const birthday =
    [pet.pet_birthday_month, pet.pet_birthday_year].filter(Boolean).join(" ") ||
    "Not set";

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <PawPrint className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-extrabold text-amber-950">
            {pet.pet_name || `Pet ${pet.pet_order || ""}`}
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            {[pet.pet_type, pet.pet_breed].filter(Boolean).join(" · ") ||
              "Pet details not set"}
          </p>
          <p className="text-xs font-bold text-amber-800">Birthday: {birthday}</p>
          {pet.pet_notes ? (
            <p className="mt-2 text-sm leading-6 text-amber-950">{pet.pet_notes}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function SalesMarketingSignupLeadsPage() {
  const [signupLeads, signupLeadPets, referrals] = await Promise.all([
    getSignupLeads(),
    getSignupLeadPets(),
    getReferrals(),
  ]);

  const petsByLeadId = groupPetsByLeadId(signupLeadPets);
  const statCards = buildStatCards(signupLeads, referrals, signupLeadPets);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/admin/sales-marketing"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Sales & Marketing
              </Link>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                <Users className="h-4 w-4" aria-hidden="true" />
                Signup Leads & Referrals
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Review field entries from Jason and Danette.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page shows signup leads, referrals, optional pet information,
                message-ready status, CEO priority, next actions, and follow-ups
                captured from the Lead & Signup Entry form.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/sales-marketing/lead-entry"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Add Lead / Referral
                </Link>

                <Link
                  href="/admin/sales-marketing/outreach"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  Outreach Log
                  <Target className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Lead review
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Field entries
                  </h2>
                </div>
                <CardIcon icon={ShieldCheck} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                These are Admin marketing records only. People still complete
                their own verified Pet Parent, Guru, Ambassador, or partner signup
                through the proper SitGuru flow.
              </p>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {signupLeads.length} signup leads · {referrals.length} referrals
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[1.5rem] border p-5 shadow-sm ${toneStyles[card.tone].card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{card.title}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950">
                    {card.value}
                  </p>
                </div>
                <CardIcon icon={card.icon} tone={card.tone} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Signup Leads
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Pet Parent, Guru, Ambassador, Partner, and Program leads
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                These records come from the Lead & Signup Entry page and may include
                optional pet details, source information, thank-you message status,
                and CEO priority flags.
              </p>
            </div>

            <Link
              href="/admin/sales-marketing/lead-entry"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              Add Signup Lead
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {signupLeads.length > 0 ? (
              signupLeads.map((lead) => {
                const status = normalizeStatus(lead.lead_status);
                const priority = normalizePriority(lead.priority_level);
                const pets = petsByLeadId[lead.id] ?? [];

                return (
                  <article
                    key={lead.id}
                    className={`rounded-2xl border p-4 ${
                      lead.ceo_priority
                        ? "border-rose-200 bg-rose-50/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200">
                          <Users className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={status} />
                            <PriorityBadge priority={priority} />
                            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                              {lead.lead_type || "General Contact"}
                            </span>
                            {lead.ceo_priority ? (
                              <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                                CEO Priority
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                            {getDisplayName(lead)}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {lead.business_name || lead.relationship_category || "No business/category entered"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Owner: {lead.owner_name || "Danette"} · Created by:{" "}
                            {lead.created_by_name || "Not set"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:min-w-[17rem]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Next Follow-Up
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(lead.next_follow_up)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-4">
                      <SimpleInfoPill label="Email" value={lead.email} tone="blue" />
                      <SimpleInfoPill label="Phone" value={lead.phone} tone="emerald" />
                      <SimpleInfoPill
                        label="Location"
                        value={
                          [lead.city, lead.state].filter(Boolean).join(", ") ||
                          lead.market_area ||
                          lead.zip_code
                        }
                        tone="slate"
                      />
                      <SimpleInfoPill
                        label="Invite Status"
                        value={lead.signup_invite_status}
                        tone="purple"
                      />

                      <SimpleInfoPill
                        label="Ambassador Type"
                        value={lead.ambassador_type}
                        tone="purple"
                      />
                      <SimpleInfoPill
                        label="Partner Category"
                        value={lead.partner_category}
                        tone="blue"
                      />
                      <SimpleInfoPill
                        label="Growth Channel"
                        value={lead.growth_channel}
                        tone="amber"
                      />
                      <SimpleInfoPill
                        label="Campaign Source"
                        value={lead.campaign_source}
                        tone="emerald"
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <InterestBadges lead={lead} />
                    </div>

                    {pets.length > 0 ? (
                      <div className="mt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Pets captured
                        </p>
                        <div className="grid gap-3 lg:grid-cols-3">
                          {pets.map((pet) => (
                            <PetCard key={pet.id} pet={pet} />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Next Action
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {lead.next_action || "No next action entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Outcome Goal
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {lead.outcome_goal || "No outcome goal entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          CEO Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {lead.ceo_notes || "No CEO notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:col-span-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {lead.notes || "No notes entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/admin/sales-marketing/lead-entry"
                        className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                      >
                        Add Related Entry
                      </Link>
                      <span className="inline-flex rounded-full bg-purple-100 px-4 py-2 text-xs font-bold text-purple-800">
                        Future button: Send Invite
                      </span>
                      <span className="inline-flex rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800">
                        Future button: Needs Jason
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-extrabold text-amber-950">
                  No signup leads found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Add a Pet Parent, Guru, Ambassador, partner, or program lead from
                  the Lead & Signup Entry page.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Referrals
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Referral records captured by Jason or Danette
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                These records can later connect into PawPerks, Ambassador rewards,
                partner commissions, Growth & Referrals, and Marketing ROI reporting.
              </p>
            </div>

            <Link
              href="/admin/sales-marketing/lead-entry"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <HeartHandshake className="h-4 w-4" aria-hidden="true" />
              Add Referral
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {referrals.length > 0 ? (
              referrals.map((referral) => {
                const status = normalizeStatus(referral.referral_status);
                const priority = normalizePriority(referral.priority_level);

                return (
                  <article
                    key={referral.id}
                    className={`rounded-2xl border p-4 ${
                      referral.ceo_priority
                        ? "border-rose-200 bg-rose-50/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200">
                          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={status} />
                            <PriorityBadge priority={priority} />
                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                              {referral.referred_type || "Pet Parent"}
                            </span>
                            {referral.ceo_priority ? (
                              <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                                CEO Priority
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                            {getReferralDisplayName(referral)}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            Referred by {referral.referrer_name || "Not entered"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Owner: {referral.owner_name || "Danette"} · Created by:{" "}
                            {referral.created_by_name || "Not set"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:min-w-[17rem]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Next Follow-Up
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(referral.next_follow_up)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-4">
                      <SimpleInfoPill
                        label="Referred Email"
                        value={referral.referred_email}
                        tone="blue"
                      />
                      <SimpleInfoPill
                        label="Referred Phone"
                        value={referral.referred_phone}
                        tone="emerald"
                      />
                      <SimpleInfoPill
                        label="Referrer Type"
                        value={referral.referrer_type}
                        tone="purple"
                      />
                      <SimpleInfoPill
                        label="Reward Status"
                        value={referral.reward_status}
                        tone="amber"
                      />

                      <SimpleInfoPill
                        label="Reward Amount"
                        value={formatMoney(referral.reward_amount)}
                        tone="emerald"
                      />
                      <SimpleInfoPill
                        label="Campaign Source"
                        value={referral.campaign_source}
                        tone="blue"
                      />
                      <SimpleInfoPill
                        label="Growth Channel"
                        value={referral.growth_channel}
                        tone="purple"
                      />
                      <SimpleInfoPill
                        label="Referral Focus"
                        value={referral.referral_focus}
                        tone="slate"
                      />
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Next Action
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {referral.next_action || "No next action entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Outcome Goal
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {referral.outcome_goal || "No outcome goal entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          CEO Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {referral.ceo_notes || "No CEO notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:col-span-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {referral.notes || "No notes entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/admin/sales-marketing/lead-entry"
                        className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                      >
                        Add Related Entry
                      </Link>
                      <span className="inline-flex rounded-full bg-purple-100 px-4 py-2 text-xs font-bold text-purple-800">
                        Future button: Mark Eligible
                      </span>
                      <span className="inline-flex rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-800">
                        Future button: Needs Jason
                      </span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="font-extrabold text-amber-950">
                  No referrals found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Add a referral from the Lead & Signup Entry page.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-1 h-5 w-5 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Supabase Wiring Note
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page reads from admin_marketing_signup_leads,
                admin_marketing_signup_lead_pets, and admin_marketing_referrals.
                It is read-only and does not affect public pages, customer flows,
                Guru flows, auth, bookings, payments, or financial logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}