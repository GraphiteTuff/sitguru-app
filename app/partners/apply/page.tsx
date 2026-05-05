"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Mail,
  Megaphone,
  PawPrint,
  Phone,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";

const interestTypes = [
  "Partner Network",
  "Affiliate Program",
  "Ambassador Program",
  "Veterinary / Pet Care Partner",
  "Pet Store / Pet Retail",
  "School / Campus Partner",
  "Community / Nonprofit Partner",
  "Workforce Partner",
  "Military / Veteran Partner",
  "Business / Brand Partner",
  "Local Partner",
  "National Partner",
  "Other",
];

const organizationTypes = [
  "For-profit organization",
  "Nonprofit organization",
  "Veterinarian / animal hospital",
  "Pet store / pet retail",
  "Groomer / trainer / pet care business",
  "School / college / university",
  "Student organization",
  "Workforce organization",
  "Community organization",
  "Military / veteran organization",
  "Brand / business",
  "Creator / influencer / blogger",
  "Affiliate / promotional partner",
  "Individual ambassador",
  "Other",
];

const audienceTypes = [
  "Pet parents",
  "Students",
  "Gurus / pet care providers",
  "Veterans / military-connected community",
  "Local residents",
  "Employees / members / clients",
  "Social media audience",
  "Newsletter / blog / podcast audience",
  "Retail shoppers",
  "Community program participants",
  "National audience",
  "Other",
];

const partnerPathways = [
  {
    title: "Partner Network",
    description:
      "For organizations, pet care businesses, schools, nonprofits, local businesses, national brands, and community groups.",
    icon: <Handshake size={24} />,
  },
  {
    title: "Affiliate Program",
    description:
      "For creators, influencers, bloggers, promotional partners, newsletters, podcasts, and social media channels.",
    icon: <Megaphone size={24} />,
  },
  {
    title: "Ambassador Program",
    description:
      "For Gurus, students, military-connected advocates, community voices, campus leaders, and referral champions.",
    icon: <Star size={24} />,
  },
];

const fitCards = [
  {
    title: "Veterinarians & pet care businesses",
    description:
      "Add trusted care resources for clients while growing referral and community visibility.",
    icon: <PawPrint size={22} />,
  },
  {
    title: "Pet stores & retail",
    description:
      "Connect shoppers with trusted local pet care and create co-marketing opportunities.",
    icon: <ShoppingBag size={22} />,
  },
  {
    title: "Schools & campuses",
    description:
      "Help students discover flexible earning pathways around class, breaks, weekends, and summer.",
    icon: <GraduationCap size={22} />,
  },
  {
    title: "Community organizations",
    description:
      "Support workforce readiness, local opportunity access, and trusted pet care connections.",
    icon: <HeartHandshake size={22} />,
  },
  {
    title: "Military-connected groups",
    description:
      "Support veterans, spouses, transitioning service members, Guard, reserve, and military families.",
    icon: <ShieldCheck size={22} />,
  },
  {
    title: "Creators & affiliates",
    description:
      "Promote SitGuru through content, campaigns, referrals, promo opportunities, and audience reach.",
    icon: <UsersRound size={22} />,
  },
];

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-sm">
      {children}
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-black text-slate-900">
      {children}
      {required ? <span className="text-emerald-700"> *</span> : null}
    </label>
  );
}

function SelectField({
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function TextField({
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      value={value}
      required={required}
      type={type}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
    />
  );
}

function TextArea({
  name,
  value,
  onChange,
  placeholder,
  required,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <textarea
      name={name}
      value={value}
      required={required}
      placeholder={placeholder}
      rows={5}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full resize-none rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
    />
  );
}

export default function PartnerApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    interestType: "",
    organizationType: "",
    organizationName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    audienceType: "",
    reach: "",
    goals: "",
    partnershipIdea: "",
    notes: "",
  });

  const inquiryId = useMemo(() => {
    return `SG-PARTNER-${Date.now().toString().slice(-6)}`;
  }, [submitted]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const emailBody = useMemo(() => {
    return [
      "New SitGuru partner / affiliate / ambassador inquiry",
      "",
      `Interest Type: ${form.interestType}`,
      `Organization Type: ${form.organizationType}`,
      `Organization / Channel Name: ${form.organizationName}`,
      `Contact Name: ${form.contactName}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Website / Social Link: ${form.website}`,
      `City: ${form.city}`,
      `State: ${form.state}`,
      `Audience Type: ${form.audienceType}`,
      `Audience / Reach: ${form.reach}`,
      "",
      "Goals:",
      form.goals,
      "",
      "Partnership Idea:",
      form.partnershipIdea,
      "",
      "Additional Notes:",
      form.notes,
    ].join("\n");
  }, [form]);

  const mailtoHref = `mailto:hello@sitguru.com?subject=${encodeURIComponent(
    `SitGuru Partnership Inquiry - ${form.interestType || "New Inquiry"}`,
  )}&body=${encodeURIComponent(emailBody)}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="overflow-hidden border-b border-emerald-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
          <div className="flex flex-col justify-center">
            <Link
              href="/partners"
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-900 transition hover:bg-emerald-100"
            >
              <ArrowLeft size={16} />
              Back to Partner Network
            </Link>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              <Sparkles size={15} />
              Partner, Affiliate & Ambassador Interest
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Grow with SitGuru through partnerships, promotion, referrals, and
              community reach.
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              Tell us how you want to connect with SitGuru. This inquiry flow is
              for organizations, veterinarians, pet stores, schools, nonprofits,
              workforce groups, military-connected organizations, local and
              national brands, affiliates, creators, and ambassadors.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Partner Network",
                "Affiliate Program",
                "Ambassador Program",
                "Pet stores",
                "Veterinarians",
                "Schools",
                "Nonprofits",
                "Military groups",
                "Creators",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/60 blur-3xl" />

            <div className="relative rounded-[2rem] border border-emerald-100 bg-[#f8fff9] p-5 shadow-2xl shadow-emerald-950/10">
              <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1100&q=80"
                    alt="Dog and cat together representing pet-friendly partnerships"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                      Build pet-friendly reach
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Help more pets, people, and communities connect.
                    </h2>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {[
                    ["Organizations", "Partner through community or business reach"],
                    ["Affiliates", "Promote through content and campaigns"],
                    ["Ambassadors", "Represent SitGuru through trusted circles"],
                    ["Pet care", "Connect pet parents with trusted resources"],
                  ].map(([title, description]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                    >
                      <p className="text-sm font-black text-emerald-950">
                        {title}
                      </p>
                      <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="inquiry-form"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"
      >
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
                <Trophy size={15} />
                Choose your best path
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                One inquiry. Multiple SitGuru growth paths.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                SitGuru will review your inquiry and route it toward the right
                relationship type: partner, affiliate, ambassador, hiring
                program, or a combined opportunity.
              </p>

              <div className="mt-6 space-y-4">
                {partnerPathways.map((pathway) => (
                  <div
                    key={pathway.title}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white">
                        {pathway.icon}
                      </div>
                      <div>
                        <p className="text-sm font-black text-emerald-950">
                          {pathway.title}
                        </p>
                        <p className="mt-1 text-xs font-bold leading-5 text-emerald-800">
                          {pathway.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
              <IconBadge>
                <ClipboardCheck size={24} />
              </IconBadge>

              <h3 className="mt-5 text-2xl font-black text-slate-950">
                What happens next?
              </h3>

              <div className="mt-5 space-y-3">
                {[
                  "SitGuru reviews your interest type and audience.",
                  "We look at local, national, affiliate, ambassador, or partner fit.",
                  "We follow up with next steps if there is a strong fit.",
                  "Future partner tools can route this into admin tracking.",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" />
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
            {!submitted ? (
              <>
                <div className="mb-7">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                    Start your inquiry
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    Tell SitGuru how you want to grow with us.
                  </h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    This form is designed to capture enough information to
                    understand your fit. Required fields are marked with an
                    asterisk.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <FieldLabel required>Primary interest</FieldLabel>
                      <SelectField
                        name="interestType"
                        value={form.interestType}
                        required
                        placeholder="Choose a SitGuru growth path"
                        options={interestTypes}
                        onChange={(value) => update("interestType", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Organization / channel type</FieldLabel>
                      <SelectField
                        name="organizationType"
                        value={form.organizationType}
                        required
                        placeholder="Choose the best match"
                        options={organizationTypes}
                        onChange={(value) => update("organizationType", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Organization / channel name</FieldLabel>
                      <TextField
                        name="organizationName"
                        value={form.organizationName}
                        required
                        placeholder="Business, school, channel, group, or your name"
                        onChange={(value) => update("organizationName", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Contact name</FieldLabel>
                      <TextField
                        name="contactName"
                        value={form.contactName}
                        required
                        placeholder="Your full name"
                        onChange={(value) => update("contactName", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Email</FieldLabel>
                      <TextField
                        name="email"
                        value={form.email}
                        required
                        type="email"
                        placeholder="you@example.com"
                        onChange={(value) => update("email", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <TextField
                        name="phone"
                        value={form.phone}
                        type="tel"
                        placeholder="Best phone number"
                        onChange={(value) => update("phone", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel>Website / social link</FieldLabel>
                      <TextField
                        name="website"
                        value={form.website}
                        placeholder="Website, Instagram, TikTok, LinkedIn, etc."
                        onChange={(value) => update("website", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel required>Audience type</FieldLabel>
                      <SelectField
                        name="audienceType"
                        value={form.audienceType}
                        required
                        placeholder="Who do you reach?"
                        options={audienceTypes}
                        onChange={(value) => update("audienceType", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel>City</FieldLabel>
                      <TextField
                        name="city"
                        value={form.city}
                        placeholder="City"
                        onChange={(value) => update("city", value)}
                      />
                    </div>

                    <div>
                      <FieldLabel>State</FieldLabel>
                      <TextField
                        name="state"
                        value={form.state}
                        placeholder="State"
                        onChange={(value) => update("state", value)}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Audience / reach</FieldLabel>
                    <TextArea
                      name="reach"
                      value={form.reach}
                      placeholder="Tell us about your audience, customer base, members, followers, students, local reach, national reach, or community network."
                      onChange={(value) => update("reach", value)}
                    />
                  </div>

                  <div>
                    <FieldLabel required>Goals</FieldLabel>
                    <TextArea
                      name="goals"
                      value={form.goals}
                      required
                      placeholder="What are you hoping to grow, promote, support, or connect through SitGuru?"
                      onChange={(value) => update("goals", value)}
                    />
                  </div>

                  <div>
                    <FieldLabel>Partnership idea</FieldLabel>
                    <TextArea
                      name="partnershipIdea"
                      value={form.partnershipIdea}
                      placeholder="Share any ideas for referrals, co-marketing, events, student outreach, pet store campaigns, affiliate content, military/community pathways, or partner growth."
                      onChange={(value) => update("partnershipIdea", value)}
                    />
                  </div>

                  <div>
                    <FieldLabel>Anything else we should know?</FieldLabel>
                    <TextArea
                      name="notes"
                      value={form.notes}
                      placeholder="Optional notes, questions, or details."
                      onChange={(value) => update("notes", value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
                  >
                    Review Inquiry
                    <ArrowRight size={17} />
                  </button>

                  <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                    Submitting here prepares the inquiry for review. The next
                    screen gives you a mail option until this page is connected
                    to admin storage.
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-800 text-white">
                  <BadgeCheck size={32} />
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  Inquiry ready
                </p>

                <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                  Your SitGuru growth inquiry is ready to send.
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                  Inquiry ID:{" "}
                  <span className="font-black text-emerald-800">
                    {inquiryId}
                  </span>
                  . Use the button below to email this inquiry to SitGuru. When
                  we connect this page to admin storage, this same flow can save
                  directly into a partner inquiry dashboard.
                </p>

                <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
                  {[
                    ["Interest", form.interestType || "Not provided"],
                    ["Type", form.organizationType || "Not provided"],
                    ["Name", form.organizationName || "Not provided"],
                    ["Contact", form.contactName || "Not provided"],
                    ["Email", form.email || "Not provided"],
                    ["Audience", form.audienceType || "Not provided"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-black text-emerald-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-900"
                  >
                    <Mail size={17} />
                    Email Inquiry to SitGuru
                  </a>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-6 py-4 text-sm font-black text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                  >
                    Edit Inquiry
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Who this is for
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              SitGuru is building many ways to grow together.
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-600">
              This inquiry page is intentionally broad so we can support
              partners, affiliates, ambassadors, and future growth channels
              without forcing every relationship into the same box.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {fitCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[1.75rem] border border-emerald-100 bg-[#fbfaf6] p-6 shadow-sm"
              >
                <IconBadge>{card.icon}</IconBadge>
                <h3 className="mt-5 text-xl font-black text-slate-950">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[2rem] border border-emerald-100 bg-emerald-950 p-6 text-white shadow-sm sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                  Program clarity
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">
                  Partners collaborate. Affiliates promote. Ambassadors
                  represent.
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Partners", "Organizations and businesses"],
                  ["Affiliates", "Creators and promotional channels"],
                  ["Ambassadors", "People with trusted community reach"],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/15 bg-white/10 p-4"
                  >
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-emerald-50">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}