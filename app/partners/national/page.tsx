import Link from "next/link";
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm";

const categories = [
  {
    title: "Pet Insurance",
    description:
      "Trusted insurance partners for accident, illness, and wellness coverage.",
    icon: "🛡️",
  },
  {
    title: "Pet Wellness",
    description:
      "Supplements, grooming, preventive care, and wellness education.",
    icon: "🌿",
  },
  {
    title: "Pet Food & Supplies",
    description: "Food, treats, toys, and everyday essentials pet parents love.",
    icon: "🥣",
  },
  {
    title: "Pet Tech",
    description: "Smart collars, apps, tracking tools, and pet-parent technology.",
    icon: "📱",
  },
  {
    title: "Pet Pharmacy",
    description: "Medication, pharmacy, and health support services for pets.",
    icon: "💊",
  },
  {
    title: "Lifestyle Brands",
    description: "Home, travel, apparel, cleaning, and pet-friendly lifestyle brands.",
    icon: "💚",
  },
];

const reasons = [
  {
    title: "High-Intent Pet Parents",
    description:
      "Reach pet parents while they are actively creating pet profiles, booking care, and thinking about pet safety.",
    icon: "👥",
  },
  {
    title: "Trusted Marketplace Environment",
    description:
      "SitGuru can position partner offers inside a pet-care experience built around trust, communication, and care.",
    icon: "✅",
  },
  {
    title: "Co-Branded Campaigns",
    description:
      "Launch educational content, exclusive offers, landing pages, and partner cards across the SitGuru experience.",
    icon: "📣",
  },
  {
    title: "Measurable Conversion Tracking",
    description:
      "Track partner clicks, signups, leads, bookings, conversions, and campaign performance.",
    icon: "📊",
  },
];

const opportunities = [
  {
    title: "Co-Branded Landing Pages",
    description: "Custom pages built to explain partner offers and drive action.",
  },
  {
    title: "Sponsored Offers",
    description: "Promote limited-time offers to relevant SitGuru customers.",
  },
  {
    title: "Affiliate Placements",
    description: "Place partner links in dashboards, content, and resource hubs.",
  },
  {
    title: "Email Features",
    description: "Feature partner offers in targeted pet-parent communications.",
  },
  {
    title: "Dashboard Partner Cards",
    description: "Show curated partner offers inside customer and partner dashboards.",
  },
];

const stats = [
  {
    value: "1.2M+",
    label: "Monthly Visits",
    description: "Potential pet-parent audience",
    icon: "🌐",
  },
  {
    value: "420K+",
    label: "Profile Creations",
    description: "Pet and parent profiles",
    icon: "👤",
  },
  {
    value: "24K+",
    label: "First Bookings",
    description: "Care moments that create partner intent",
    icon: "📅",
  },
  {
    value: "210K+",
    label: "Partner Clicks",
    description: "High-intent offer engagement",
    icon: "🖱️",
  },
];

export default function NationalPartnersPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 text-sm font-semibold text-green-800">
              <Link href="/partners" className="hover:text-green-950">
                Partners
              </Link>
              <span className="mx-2 text-slate-400">/</span>
              National Partner Program
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              National Partners for Modern Pet Care
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              Work with SitGuru to reach pet parents through trusted care,
              education, and curated partner offers.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#apply"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Apply as a National Partner
              </Link>

              <Link
                href="#opportunities"
                className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                View Opportunities
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-amber-50 p-4 shadow-2xl shadow-green-950/10">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-[1.25rem] border border-green-100 bg-green-50 p-5">
                  <p className="text-sm font-black text-green-950">
                    Pet Insurance
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Protect every paw with trusted partner education and offers.
                  </p>
                  <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-500">
                      Partner Offer
                    </p>
                    <p className="mt-1 text-2xl font-black text-green-950">
                      Get a Quote
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] bg-[radial-gradient(circle_at_70%_20%,#bbf7d0,transparent_28%),linear-gradient(135deg,#f0fdf4,#fff7ed)] p-5">
                  <p className="text-sm font-black text-green-950">
                    Partner Dashboard
                  </p>
                  <div className="mt-5 rounded-2xl bg-white/90 p-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-black text-green-950">
                          12.4K
                        </p>
                        <p className="text-[11px] text-slate-500">Clicks</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-green-950">
                          1.1K
                        </p>
                        <p className="text-[11px] text-slate-500">Leads</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-green-950">
                          8.9%
                        </p>
                        <p className="text-[11px] text-slate-500">CVR</p>
                      </div>
                    </div>
                    <div className="mt-5 h-24 rounded-xl bg-[linear-gradient(135deg,#dcfce7,#ffffff)]" />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {["Wellness", "Food", "Pet Tech"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 text-center"
                  >
                    <p className="text-2xl">
                      {item === "Wellness" ? "🌿" : item === "Food" ? "🥣" : "📱"}
                    </p>
                    <p className="mt-2 text-sm font-black text-green-950">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                  🐾
                </div>
                <div>
                  <p className="text-sm font-black text-green-950">
                    Partner offers should feel helpful, not pushy.
                  </p>
                  <p className="text-xs text-slate-600">
                    SitGuru can curate brands around trust, value, and pet care.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            Partner categories
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            National brands that support pet parents
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => (
            <div
              key={category.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                {category.icon}
              </div>
              <h3 className="mt-4 text-lg font-black text-green-950">
                {category.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {category.description}
              </p>
              <p className="mt-4 text-sm font-black text-green-800">
                Explore →
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              Why brands partner with SitGuru
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
              Reach pet parents in moments that matter
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                  {reason.icon}
                </div>
                <h3 className="mt-5 text-xl font-black text-green-950">
                  {reason.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid overflow-hidden rounded-[1.5rem] bg-green-950 text-white shadow-xl shadow-green-950/15 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border-b border-white/10 p-6 md:border-b-0 md:border-r last:md:border-r-0"
              >
                <p className="text-3xl">{stat.icon}</p>
                <p className="mt-3 text-3xl font-black">{stat.value}</p>
                <p className="mt-1 text-sm font-bold text-green-100">
                  {stat.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-green-200">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="opportunities"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"
      >
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            Partnership opportunities
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Flexible placements for trusted brands
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {opportunities.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-black text-green-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              Brand examples
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
              Partner offers SitGuru could support
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              These are example categories and brand-style placements. SitGuru
              should use approved affiliate or partnership agreements before
              publishing live offers.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {["Pets Best", "Embrace", "Chewy", "Petco", "Pumpkin", "Fetch"].map(
              (name) => (
                <div
                  key={name}
                  className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-5 text-center shadow-sm"
                >
                  <p className="text-xl font-black text-green-950">{name}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Example partner category
                  </p>
                </div>
              )
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-5 text-center text-sm font-semibold text-green-900">
            SitGuru may earn compensation from approved partner links.
          </div>
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <PartnerApplicationForm
          applicantType="national_partner"
          title="Apply as a national partner"
          description="Apply to become a SitGuru National Partner. SitGuru Admin will review your brand, offer, and partnership fit."
          businessLabel="Brand Name"
          businessPlaceholder="Your brand name"
          typeLabel="Partner Category"
          typeOptions={[
            "Pet Insurance",
            "Pet Wellness",
            "Pet Food & Supplies",
            "Pet Tech",
            "Pet Pharmacy",
            "Lifestyle Brand",
            "Pet Travel",
            "Pet Safety",
            "Other National Brand",
          ]}
          websiteLabel="Brand Website"
          websitePlaceholder="https://yourbrand.com"
          submitLabel="Apply as National Partner"
        />
      </section>
    </main>
  );
}
