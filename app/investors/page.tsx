import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  GraduationCap,
  Handshake,
  HeartHandshake,
  LineChart,
  Mail,
  Medal,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";

type InvestorHighlight = {
  title: string;
  description: string;
  icon: ReactNode;
};

type GrowthArea = {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  items: string[];
};

const investorHighlights: InvestorHighlight[] = [
  {
    title: "Pet care marketplace",
    description:
      "SitGuru is building a modern marketplace connecting pet parents with trusted local Gurus for walking, sitting, boarding, drop-ins, day care, training support, and specialty care.",
    icon: <PawPrint size={24} />,
  },
  {
    title: "Guru supply growth",
    description:
      "SitGuru Programs help create guided pathways for qualified people to train, receive support, and grow into full SitGuru Gurus.",
    icon: <UsersRound size={24} />,
  },
  {
    title: "Partner network",
    description:
      "SitGuru can grow through local partners, national partners, affiliates, ambassadors, workforce programs, schools, and community organizations.",
    icon: <Handshake size={24} />,
  },
  {
    title: "Trust-first positioning",
    description:
      "SitGuru is focused on safety, onboarding, background checks, profile readiness, communication, and quality care standards.",
    icon: <ShieldCheck size={24} />,
  },
];

const growthAreas: GrowthArea[] = [
  {
    title: "Marketplace Revenue",
    eyebrow: "Booking growth",
    description:
      "Core marketplace growth comes from pet care bookings, repeat customers, stronger Guru coverage, and higher trust in local care.",
    icon: <TrendingUp size={26} />,
    items: [
      "Dog walking",
      "Pet sitting",
      "Boarding",
      "Drop-in visits",
      "Day care",
      "Training support",
      "Specialty care",
    ],
  },
  {
    title: "Guru Programs",
    eyebrow: "Supply expansion",
    description:
      "Military Hire, Student Hire, and Community Hire programs help SitGuru attract, train, support, and graduate more qualified Gurus.",
    icon: <HeartHandshake size={26} />,
    items: [
      "Military-connected applicants",
      "Current students",
      "Recent graduates",
      "Summer work applicants",
      "Community workforce participants",
      "Partner referrals",
    ],
  },
  {
    title: "Partner Network",
    eyebrow: "Distribution channels",
    description:
      "Partners can help SitGuru reach more pet parents, recruit more Gurus, strengthen local markets, and create referral-driven growth.",
    icon: <Building2 size={26} />,
    items: [
      "Local businesses",
      "National brands",
      "Affiliate partners",
      "Ambassadors",
      "Workforce programs",
      "Schools and universities",
      "Community organizations",
    ],
  },
  {
    title: "Data and Operations",
    eyebrow: "Admin intelligence",
    description:
      "SitGuru’s admin dashboards are being built to track customers, Gurus, bookings, financials, messages, programs, partners, and quality signals.",
    icon: <BarChart3 size={26} />,
    items: [
      "Customer intelligence",
      "Guru performance",
      "Message insights",
      "Program KPIs",
      "Partner reporting",
      "Financial tracking",
      "Exportable reports",
    ],
  },
];

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-black text-green-900">
      {children}
    </span>
  );
}

function HighlightCard({ item }: { item: InvestorHighlight }) {
  return (
    <div className="rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {item.icon}
      </div>

      <h3 className="text-lg font-black text-slate-950">{item.title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {item.description}
      </p>
    </div>
  );
}

function GrowthCard({ area }: { area: GrowthArea }) {
  return (
    <article className="rounded-[32px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-green-800 text-white shadow-lg shadow-emerald-900/15">
        {area.icon}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-green-700">
        {area.eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black tracking-tight text-green-950">
        {area.title}
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        {area.description}
      </p>

      <div className="mt-5 space-y-2">
        {area.items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-green-800">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-800">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-[#f9faf5]">
      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-[-80px] top-[-80px] h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              <BriefcaseBusiness size={15} />
              SitGuru Investors
            </div>

            <h1 className="max-w-5xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Building a trusted pet care marketplace with scalable Guru growth.
            </h1>

            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-white/85">
              SitGuru is building a modern pet care platform focused on trusted
              local Gurus, quality care, customer confidence, program-driven Guru
              supply, partner distribution, and operational intelligence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-green-950 shadow-xl shadow-black/20 transition hover:bg-green-50"
              >
                Investor Inquiry
                <Mail size={18} />
              </Link>

              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                View Guru Programs
                <HeartHandshake size={18} />
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Pet care marketplace
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Guru supply programs
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Partner network
              </span>
              <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-green-950">
                Trust-first care
              </span>
            </div>
          </div>

          <div className="rounded-[34px] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="rounded-[28px] bg-white p-6 text-slate-950">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-800 text-white">
                  <LineChart size={24} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-green-700">
                    Investment Thesis
                  </p>
                  <h2 className="text-2xl font-black text-green-950">
                    Trust, supply, and repeat pet care.
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Pet parents need trusted, convenient local care.",
                  "Guru supply can grow through programs and partnerships.",
                  "Repeat bookings can create stronger customer lifetime value.",
                  "Admin intelligence can support quality, operations, and growth.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#edf3ee] bg-[#fbfcf9] p-4 text-sm font-bold text-slate-600"
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-green-700"
                      size={17}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/contact"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
              >
                Contact Investor Relations
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {investorHighlights.map((item) => (
            <HighlightCard key={item.title} item={item} />
          ))}
        </section>

        <section className="rounded-[32px] border border-green-100 bg-white p-5 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Why SitGuru
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                SitGuru is positioned around care, trust, and marketplace growth.
              </h2>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                Pet care is personal. Families want caregivers they can trust,
                while providers need a clear way to show their services, build
                confidence, and connect with local demand. SitGuru combines a
                pet care marketplace with structured Guru growth programs,
                partner channels, and operational dashboards.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Pill>Trusted local care</Pill>
                <Pill>Program-driven Guru growth</Pill>
                <Pill>Partner distribution</Pill>
                <Pill>Admin KPI reporting</Pill>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="Marketplace opportunity"
                items={[
                  "Pet parents need reliable care",
                  "Care decisions depend on trust",
                  "Repeat bookings matter",
                  "Local supply coverage is critical",
                  "Mobile-first booking experience",
                ]}
              />

              <InfoList
                title="SitGuru differentiation"
                items={[
                  "Guru identity and profile clarity",
                  "Program pathways into Guru status",
                  "Partner and referral network",
                  "Message and quality intelligence",
                  "Admin reporting and exports",
                ]}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              Growth Strategy
            </p>

            <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
              Multiple channels for marketplace expansion.
            </h2>

            <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-slate-600">
              SitGuru can grow through customer demand, Guru supply programs,
              partner channels, referrals, quality care, and data-driven
              operations.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {growthAreas.map((area) => (
              <GrowthCard key={area.title} area={area} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Target size={22} />}
            label="Primary Focus"
            value="Trust"
            detail="Quality care, safety, and customer confidence"
          />

          <MetricCard
            icon={<UsersRound size={22} />}
            label="Supply Engine"
            value="Gurus"
            detail="Become-a-Guru path plus program pathways"
          />

          <MetricCard
            icon={<Handshake size={22} />}
            label="Growth Channel"
            value="Partners"
            detail="Local, national, affiliate, ambassador, and workforce partners"
          />

          <MetricCard
            icon={<BarChart3 size={22} />}
            label="Operating Model"
            value="KPIs"
            detail="Admin dashboards, reporting, exports, and intelligence"
          />
        </section>

        <section className="rounded-[32px] border border-[#e3ece5] bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Program-Driven Supply
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                SitGuru Programs help build the Guru network.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                SitGuru’s Military Hire, Student Hire, and Community Hire
                programs are designed to welcome qualified applicants, provide
                onboarding and training support, and help productive participants
                graduate into full Guru status.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/programs"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  View Programs
                  <HeartHandshake size={17} />
                </Link>

                <Link
                  href="/careers"
                  className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Careers
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InfoList
                title="Military"
                items={[
                  "Veterans",
                  "Service members",
                  "Guard and reservists",
                  "Military spouses",
                  "Qualified dependents 18+",
                ]}
              />
              <InfoList
                title="Student"
                items={[
                  "Current students",
                  "Recent graduates",
                  "Summer work",
                  "Part-time schedules",
                  "Career centers",
                ]}
              />
              <InfoList
                title="Community"
                items={[
                  "Workforce programs",
                  "Job training",
                  "Nonprofit referrals",
                  "Community partners",
                  "People needing work",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[#e3ece5] bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Investor Materials
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-green-950">
                Request SitGuru investor information.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                Investor materials can include SitGuru’s market direction,
                growth model, product roadmap, Guru acquisition strategy, partner
                network strategy, admin KPI architecture, and future capital
                needs.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
                >
                  Request Investor Materials
                  <Download size={17} />
                </Link>

                <Link
                  href="/press"
                  className="inline-flex items-center justify-center rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:bg-green-50"
                >
                  Press Page
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoList
                title="What investors may request"
                items={[
                  "Company overview",
                  "Market positioning",
                  "Product roadmap",
                  "Guru growth model",
                  "Partner strategy",
                  "Financial model",
                ]}
              />

              <InfoList
                title="Strategic conversations"
                items={[
                  "Capital partners",
                  "Pet care partners",
                  "Technology partners",
                  "Workforce partners",
                  "Local market expansion",
                  "Brand partnerships",
                ]}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-green-100 bg-green-950 p-6 text-white shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
                Investor and Strategic Partner Inquiries
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight">
                Interested in SitGuru’s growth?
              </h2>

              <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-white/75">
                Contact SitGuru for investor conversations, strategic
                partnerships, market expansion, pet care growth opportunities,
                and platform development discussions.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
              >
                Contact Investors
                <Mail size={17} />
              </Link>

              <Link
                href="/partners"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
              >
                Partner Network
                <Handshake size={17} />
              </Link>
            </div>
          </div>
        </section>

        <div className="rounded-[26px] border border-green-100 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
          <span className="font-black text-green-900">Investor note:</span>{" "}
          this page is informational and does not constitute an offer to sell
          securities or a solicitation to invest. Investor materials should be
          shared only through the appropriate SitGuru review process.
        </div>
      </div>
    </main>
  );
}