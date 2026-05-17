import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Handshake,
  HeartHandshake,
  HelpCircle,
  Mail,
  MapPin,
  Megaphone,
  MessageSquareText,
  Phone,
  PlusCircle,
  Star,
  Store,
  Target,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

type StatusTone = "emerald" | "amber" | "blue" | "rose" | "slate" | "purple";

type OutreachStatus =
  | "New"
  | "Contacted"
  | "Warm"
  | "Follow-Up"
  | "Partnered"
  | "Waiting"
  | "Not Interested";

type PartnerType =
  | "Groomer"
  | "Trainer"
  | "Veterinarian"
  | "Vet Tech"
  | "Apartment"
  | "Pet Store"
  | "School"
  | "Community"
  | "Friends & Family"
  | "Other";

type PriorityLevel = "Low" | "Medium" | "High";

type OutreachContact = {
  id: string;
  contact_name: string | null;
  business_name: string | null;
  partner_type: string | null;
  city_state: string | null;
  contact_method: string | null;
  status: string | null;
  referral_potential: string | null;
  last_contacted: string | null;
  next_follow_up: string | null;
  notes: string | null;
  ceo_help: string | null;
  owner_name: string | null;
  relationship_category: string | null;
  ambassador_type: string | null;
  partner_category: string | null;
  growth_channel: string | null;
  interested_as: string | null;
  program_interest: string | null;
  referral_focus: string | null;
  campaign_source: string | null;
  market_area: string | null;
  social_handle: string | null;
  website_url: string | null;
  priority_level: string | null;
  ceo_priority: boolean | null;
  outcome_goal: string | null;
  next_action: string | null;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
};

type OutreachPlay = {
  title: string;
  description: string;
  icon: typeof ClipboardCheck;
  tone: StatusTone;
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

const statusToneMap: Record<OutreachStatus, StatusTone> = {
  New: "slate",
  Contacted: "blue",
  Warm: "amber",
  "Follow-Up": "purple",
  Partnered: "emerald",
  Waiting: "amber",
  "Not Interested": "rose",
};

const partnerTypeToneMap: Record<PartnerType, StatusTone> = {
  Groomer: "emerald",
  Trainer: "blue",
  Veterinarian: "purple",
  "Vet Tech": "purple",
  Apartment: "amber",
  "Pet Store": "emerald",
  School: "blue",
  Community: "slate",
  "Friends & Family": "rose",
  Other: "slate",
};

const outreachPlays: OutreachPlay[] = [
  {
    title: "Track every relationship path",
    description:
      "One contact can be an Ambassador lead, Guru candidate, partner, Pet Parent referral source, or program lead.",
    icon: Target,
    tone: "emerald",
  },
  {
    title: "Use official SitGuru categories",
    description:
      "Capture Ambassador Type, Partner Category, Growth Channel, Program Interest, and Referral Focus on every outreach record.",
    icon: ClipboardCheck,
    tone: "blue",
  },
  {
    title: "Always set the next action",
    description:
      "Every contact should have a next action so warm conversations do not disappear after the first touchpoint.",
    icon: CalendarCheck,
    tone: "purple",
  },
  {
    title: "Escalate CEO priorities",
    description:
      "High-trust or high-value contacts like veterinarians, trainers, groomers, and major partners should be easy for Jason to spot.",
    icon: MessageSquareText,
    tone: "amber",
  },
];

function normalizeOutreachStatus(status: string | null | undefined): OutreachStatus {
  const cleanStatus = (status || "New").trim();

  if (
    cleanStatus === "New" ||
    cleanStatus === "Contacted" ||
    cleanStatus === "Warm" ||
    cleanStatus === "Follow-Up" ||
    cleanStatus === "Partnered" ||
    cleanStatus === "Waiting" ||
    cleanStatus === "Not Interested"
  ) {
    return cleanStatus;
  }

  if (cleanStatus === "Follow Up") return "Follow-Up";
  if (cleanStatus === "Not interested") return "Not Interested";

  return "New";
}

function normalizePartnerType(partnerType: string | null | undefined): PartnerType {
  const cleanType = (partnerType || "Other").trim();

  if (
    cleanType === "Groomer" ||
    cleanType === "Trainer" ||
    cleanType === "Veterinarian" ||
    cleanType === "Vet Tech" ||
    cleanType === "Apartment" ||
    cleanType === "Pet Store" ||
    cleanType === "School" ||
    cleanType === "Community" ||
    cleanType === "Friends & Family" ||
    cleanType === "Other"
  ) {
    return cleanType;
  }

  if (cleanType === "Friends and Family") return "Friends & Family";
  if (cleanType === "VetTech") return "Vet Tech";

  return "Other";
}

function normalizeReferralPotential(
  referralPotential: string | null | undefined,
): PriorityLevel {
  const cleanPotential = (referralPotential || "Medium").trim();

  if (
    cleanPotential === "Low" ||
    cleanPotential === "Medium" ||
    cleanPotential === "High"
  ) {
    return cleanPotential;
  }

  return "Medium";
}

function normalizePriorityLevel(priorityLevel: string | null | undefined): PriorityLevel {
  const cleanPriority = (priorityLevel || "Medium").trim();

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

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getOutreachContacts(): Promise<OutreachContact[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_marketing_outreach_contacts")
    .select(
      [
        "id",
        "contact_name",
        "business_name",
        "partner_type",
        "city_state",
        "contact_method",
        "status",
        "referral_potential",
        "last_contacted",
        "next_follow_up",
        "notes",
        "ceo_help",
        "owner_name",
        "relationship_category",
        "ambassador_type",
        "partner_category",
        "growth_channel",
        "interested_as",
        "program_interest",
        "referral_focus",
        "campaign_source",
        "market_area",
        "social_handle",
        "website_url",
        "priority_level",
        "ceo_priority",
        "outcome_goal",
        "next_action",
      ].join(", "),
    )
    .order("ceo_priority", { ascending: false })
    .order("next_follow_up", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Sales & Marketing Outreach fetch error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as OutreachContact[];
}

function buildStatCards(contacts: OutreachContact[]): StatCard[] {
  const ambassadorLeads = contacts.filter((contact) =>
    (contact.relationship_category || "").includes("Ambassador"),
  ).length;

  const partnerLeads = contacts.filter((contact) =>
    (contact.relationship_category || "").includes("Partner"),
  ).length;

  const ceoPriority = contacts.filter((contact) => contact.ceo_priority === true).length;

  return [
    {
      title: "Outreach Contacts",
      value: String(contacts.length),
      description:
        "Live Supabase count across Ambassadors, partners, programs, and referral sources.",
      icon: Users,
      tone: "emerald",
    },
    {
      title: "Ambassador Leads",
      value: String(ambassadorLeads),
      description:
        "Guru, Student, Vet Tech, Veterinarian, Trainer, Groomer, Veteran, and Rescue/Shelter leads.",
      icon: Star,
      tone: "amber",
    },
    {
      title: "Partner Leads",
      value: String(partnerLeads),
      description:
        "Local, national, veterinary, retail, school, nonprofit, military, and brand partners.",
      icon: Handshake,
      tone: "purple",
    },
    {
      title: "CEO Priority",
      value: String(ceoPriority),
      description:
        "High-value contacts that Jason should keep visible for decisions or relationship support.",
      icon: HelpCircle,
      tone: "rose",
    },
  ];
}

function StatusBadge({ status }: { status: OutreachStatus }) {
  const tone = statusToneMap[status];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {status}
    </span>
  );
}

function PartnerTypeBadge({ partnerType }: { partnerType: PartnerType }) {
  const tone = partnerTypeToneMap[partnerType];

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {partnerType}
    </span>
  );
}

function PriorityBadge({ priorityLevel }: { priorityLevel: PriorityLevel }) {
  const tone: StatusTone =
    priorityLevel === "High"
      ? "rose"
      : priorityLevel === "Medium"
        ? "amber"
        : "slate";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {priorityLevel} priority
    </span>
  );
}

function ReferralPotentialBadge({
  referralPotential,
}: {
  referralPotential: PriorityLevel;
}) {
  const tone: StatusTone =
    referralPotential === "High"
      ? "emerald"
      : referralPotential === "Medium"
        ? "amber"
        : "slate";

  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${toneStyles[tone].pill}`}
    >
      {referralPotential} potential
    </span>
  );
}

function SimpleInfoPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | null | undefined;
  tone?: StatusTone;
}) {
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

function ContactIcon({ partnerType }: { partnerType: PartnerType }) {
  if (partnerType === "Groomer" || partnerType === "Pet Store") return Store;
  if (partnerType === "Apartment") return Building2;
  if (partnerType === "Friends & Family") return HeartHandshake;
  return Handshake;
}

export default async function SalesMarketingOutreachPage() {
  const outreachContacts = await getOutreachContacts();
  const statCards = buildStatCards(outreachContacts);

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
                <Handshake className="h-4 w-4" aria-hidden="true" />
                Outreach & Partnerships
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Track Ambassador leads, partner leads, program pathways, and referral sources.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                This page now shows SitGuru’s expanded outreach taxonomy:
                Ambassador Type, Partner Category, Growth Channel, Program
                Interest, Interested As, Referral Focus, Campaign Source,
                Outcome Goal, and Next Action.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin/sales-marketing/lead-entry"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Add Lead / Signup Entry
                </Link>

                <Link
                  href="/admin/sales-marketing/ceo-review"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  CEO Review
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 lg:w-[22rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                    Field entry ready
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-emerald-950">
                    Add contacts fast
                  </h2>
                </div>
                <CardIcon icon={PlusCircle} tone="emerald" />
              </div>

              <p className="mt-4 text-sm leading-6 text-emerald-900">
                Jason and Danette can add Pet Parent leads, Guru leads, Ambassador
                leads, partner leads, referrals, and points of contact from the
                Lead & Signup Entry form.
              </p>

              <Link
                href="/admin/sales-marketing/lead-entry"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Open Lead Entry
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="mt-5 rounded-2xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Supabase status
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  Connected · {outreachContacts.length} outreach rows loaded
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Outreach Playbook
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Simple rules for Danette
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Outreach should stay focused, categorized, and tied to a next action.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {outreachPlays.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-4 ${toneStyles[item.tone].card}`}
                >
                  <div className="flex items-start gap-3">
                    <CardIcon icon={item.icon} tone={item.tone} />
                    <div>
                      <h3 className="font-extrabold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                  CEO Outreach View
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                  What Jason should watch
                </h2>
              </div>

              <Link
                href="/admin/sales-marketing/ceo-review"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                CEO Review
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-1 h-5 w-5 text-emerald-700"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-extrabold text-emerald-950">
                      Ambassador and partner pipeline
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-emerald-900">
                      Watch which contacts can become Ambassadors, Gurus, Pet Parents,
                      referral sources, partners, or program applicants.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-rose-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-rose-950">
                      CEO priority contacts
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-rose-900">
                      Contacts marked CEO Priority may need approval, direct support,
                      a relationship decision, or final outreach copy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <Megaphone className="mt-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="font-extrabold text-sky-950">
                      Campaign source tracking
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-sky-900">
                      Use Campaign Source and Referral Focus to connect outreach back
                      to marketing performance later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">
                Outreach Contact Log
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                Expanded live outreach records
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Use Lead & Signup Entry to add new contacts, referrals, Pet Parent leads,
                Guru leads, Ambassador leads, and partner leads from the field.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/sales-marketing/lead-entry"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                Add Lead
              </Link>

              <Link
                href="/admin/sales-marketing/weekly-review"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Weekly Review
                <Flag className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {outreachContacts.length > 0 ? (
              outreachContacts.map((contact) => {
                const status = normalizeOutreachStatus(contact.status);
                const partnerType = normalizePartnerType(contact.partner_type);
                const referralPotential = normalizeReferralPotential(
                  contact.referral_potential,
                );
                const priorityLevel = normalizePriorityLevel(contact.priority_level);
                const Icon = ContactIcon({ partnerType });

                return (
                  <article
                    key={contact.id}
                    className={`rounded-2xl border p-4 ${
                      contact.ceo_priority
                        ? "border-rose-200 bg-rose-50/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={status} />
                            <PartnerTypeBadge partnerType={partnerType} />
                            <ReferralPotentialBadge
                              referralPotential={referralPotential}
                            />
                            <PriorityBadge priorityLevel={priorityLevel} />
                            {contact.ceo_priority ? (
                              <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                                CEO Priority
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-xl font-extrabold text-slate-950">
                            {contact.contact_name || "Unnamed contact"}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {contact.business_name || "No business name entered"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Owner: {contact.owner_name || "Danette"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:min-w-[17rem]">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Follow-Up
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(contact.next_follow_up)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-4">
                      <SimpleInfoPill
                        label="Relationship"
                        value={contact.relationship_category}
                        tone="emerald"
                      />
                      <SimpleInfoPill
                        label="Ambassador Type"
                        value={contact.ambassador_type}
                        tone="purple"
                      />
                      <SimpleInfoPill
                        label="Partner Category"
                        value={contact.partner_category}
                        tone="blue"
                      />
                      <SimpleInfoPill
                        label="Growth Channel"
                        value={contact.growth_channel}
                        tone="amber"
                      />

                      <SimpleInfoPill
                        label="Interested As"
                        value={contact.interested_as}
                        tone="slate"
                      />
                      <SimpleInfoPill
                        label="Program Interest"
                        value={contact.program_interest}
                        tone="emerald"
                      />
                      <SimpleInfoPill
                        label="Referral Focus"
                        value={contact.referral_focus}
                        tone="blue"
                      />
                      <SimpleInfoPill
                        label="Campaign Source"
                        value={contact.campaign_source}
                        tone="purple"
                      />
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          Location / Market
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {contact.city_state || "No location entered"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Market: {contact.market_area || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                          Contact Method
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {contact.contact_method || "No contact method entered"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Social: {contact.social_handle || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          Last Contacted
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {formatDate(contact.last_contacted)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Website: {contact.website_url || "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white bg-white p-3 lg:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Notes
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          {contact.notes || "No notes entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-rose-700">
                          CEO Help / Decision
                        </p>
                        <p className="mt-1 text-sm leading-6 text-rose-950">
                          {contact.ceo_help || "No CEO help needed yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 lg:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Outcome Goal
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-950">
                          {contact.outcome_goal || "No outcome goal entered yet."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                          Next Action
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-950">
                          {contact.next_action || "No next action entered yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/admin/sales-marketing/lead-entry"
                        className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                      >
                        Add Related Lead
                      </Link>
                      <span className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
                        Future button: Warm Lead
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
                  No outreach contacts found.
                </h3>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  The page is connected to Supabase, but there are no rows in
                  admin_marketing_outreach_contacts yet.
                </p>

                <Link
                  href="/admin/sales-marketing/lead-entry"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  Add First Lead
                </Link>
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
                This page now reads the expanded outreach taxonomy from
                admin_marketing_outreach_contacts. New contacts, referrals, signup
                leads, and optional pet details can be entered from Lead & Signup
                Entry without affecting public pages, customer flows, Guru flows,
                auth, bookings, payments, or financial logic.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}