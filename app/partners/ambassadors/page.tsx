import Link from "next/link";
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm";

const ambassadorTypes = [
  {
    title: "Community Ambassador",
    description:
      "Refer pet parents, share SitGuru locally, and help trusted care reach more families.",
    icon: "👥",
    accent: "green",
  },
  {
    title: "Local Partner Ambassador",
    description:
      "Introduce SitGuru to local pet stores, groomers, trainers, vets, rescues, and apartments.",
    icon: "🏪",
    accent: "blue",
  },
  {
    title: "City Captain",
    description:
      "Lead growth in your city by building a local network of partners, Gurus, and ambassadors.",
    icon: "🏙️",
    accent: "purple",
  },
  {
    title: "Campus / Neighborhood Ambassador",
    description:
      "Grow SitGuru in a focused community, neighborhood, apartment area, or campus market.",
    icon: "🎓",
    accent: "orange",
  },
];

const earningCards = [
  {
    title: "First Booking Reward",
    description:
      "Earn when a referred pet parent books and completes a first service.",
    value: "$20–$35",
    icon: "🎁",
  },
  {
    title: "Approved Guru Reward",
    description:
      "Earn when a Guru you refer gets approved and completes a first booking.",
    value: "$75+",
    icon: "🐾",
  },
  {
    title: "Approved Partner Lead",
    description:
      "Earn when a local business you introduce becomes an approved SitGuru partner.",
    value: "$25–$50",
    icon: "🤝",
  },
  {
    title: "Partner Activation Bonus",
    description:
      "Earn a larger bonus when your referred partner produces a first completed booking.",
    value: "$50–$100+",
    icon: "🏆",
  },
];

const toolkitItems = [
  {
    title: "Referral Links",
    description: "Share customer, Guru, and partner referral links.",
    icon: "🔗",
  },
  {
    title: "QR Flyers",
    description: "Download QR flyers for stores, events, and community boards.",
    icon: "▦",
  },
  {
    title: "Business Pitch Script",
    description: "Use approved outreach copy when speaking to local businesses.",
    icon: "📝",
  },
  {
    title: "City Leaderboard",
    description: "Track rankings, points, tiers, and local growth goals.",
    icon: "🏅",
  },
  {
    title: "Reward Dashboard",
    description: "See pending, approved, and paid rewards in one place.",
    icon: "📊",
  },
];

const tiers = [
  {
    title: "Bronze",
    points: "0–999 pts",
    description: "Getting started",
    icon: "🥉",
  },
  {
    title: "Silver",
    points: "1,000–2,499 pts",
    description: "Growing impact",
    icon: "🥈",
  },
  {
    title: "Gold",
    points: "2,500–4,999 pts",
    description: "Leading change",
    icon: "🥇",
  },
  {
    title: "City Captain",
    points: "5,000+ pts",
    description: "City leader",
    icon: "🛡️",
  },
];

const leadStatuses = [
  {
    title: "New Lead",
    description: "Business submitted",
    icon: "➕",
  },
  {
    title: "Contacted",
    description: "Initial outreach made",
    icon: "📞",
  },
  {
    title: "Interested",
    description: "Wants more info",
    icon: "💬",
  },
  {
    title: "Applied",
    description: "Application submitted",
    icon: "📝",
  },
  {
    title: "Active",
    description: "Approved and live",
    icon: "✅",
  },
];

function accentClasses(accent: string) {
  switch (accent) {
    case "blue":
      return {
        card: "border-blue-200 bg-blue-50/70",
        icon: "bg-blue-100 text-blue-900",
        link: "text-blue-800",
      };
    case "purple":
      return {
        card: "border-purple-200 bg-purple-50/70",
        icon: "bg-purple-100 text-purple-900",
        link: "text-purple-800",
      };
    case "orange":
      return {
        card: "border-orange-200 bg-orange-50/70",
        icon: "bg-orange-100 text-orange-900",
        link: "text-orange-800",
      };
    default:
      return {
        card: "border-green-200 bg-green-50/70",
        icon: "bg-green-100 text-green-900",
        link: "text-green-800",
      };
  }
}

export default function SitGuruAmbassadorsPage() {
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
              Ambassador Program
            </div>

            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-800">
              <span>⭐</span>
              Ambassador Program
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              Become a SitGuru Ambassador
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              Help us grow trusted pet care in your community by referring pet
              parents, recruiting Gurus, and introducing local partner
              businesses.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#apply"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Apply to Become an Ambassador
              </Link>

              <Link
                href="#toolkit"
                className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                View Outreach Kit
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["📍", "Make a local impact"],
                ["💵", "Earn verified rewards"],
                ["🐾", "Help pets find care"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 shadow-sm"
                >
                  <p className="text-2xl">{icon}</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-amber-50 p-4 shadow-2xl shadow-green-950/10">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="rounded-[1.25rem] bg-[radial-gradient(circle_at_35%_25%,#bbf7d0,transparent_28%),radial-gradient(circle_at_80%_20%,#fed7aa,transparent_30%),linear-gradient(135deg,#f0fdf4,#fff7ed)] p-6">
                <div className="max-w-md rounded-2xl bg-white/90 p-5 shadow-sm">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
                    Local outreach moment
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-green-950">
                    Introduce SitGuru to your community.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Ambassadors can invite local pet businesses, recruit trusted
                    Gurus, and share SitGuru with pet parents using approved QR
                    codes, flyers, and links.
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["QR Flyer", "▦"],
                    ["Partner Lead", "🏪"],
                    ["City Goal", "🏆"],
                  ].map(([label, icon]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/90 p-4 text-center shadow-sm"
                    >
                      <p className="text-3xl">{icon}</p>
                      <p className="mt-2 text-sm font-black text-green-950">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfaf6] p-5">
                <p className="text-sm font-black text-green-950">
                  Stronger communities. More opportunities. Happier pets.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ambassadors are independent promoters who use approved
                  SitGuru materials and earn from verified results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            Ambassador paths
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Choose how you want to help SitGuru grow
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {ambassadorTypes.map((type) => {
            const classes = accentClasses(type.accent);

            return (
              <div
                key={type.title}
                className={`rounded-[1.5rem] border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${classes.card}`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${classes.icon}`}
                >
                  {type.icon}
                </div>
                <h3 className="mt-5 text-2xl font-black text-green-950">
                  {type.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {type.description}
                </p>
                <p className={`mt-5 text-sm font-black ${classes.link}`}>
                  Learn more →
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              How ambassadors earn
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
              Rewards tied to real SitGuru growth
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Payouts should happen only after qualified, completed, and
              approved milestones.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {earningCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 text-center shadow-sm"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                  {card.icon}
                </div>
                <p className="mt-5 text-3xl font-black text-green-950">
                  {card.value}
                </p>
                <h3 className="mt-3 text-xl font-black text-green-950">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-green-100 bg-green-50 p-5 text-center text-sm font-bold text-green-900">
            Top ambassadors can unlock monthly bonuses, tier upgrades, and City
            Captain eligibility.
          </div>
        </div>
      </section>

      <section
        id="toolkit"
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10"
      >
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            Ambassador toolkit
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Everything needed for local outreach
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {toolkitItems.map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                {item.icon}
              </div>
              <h3 className="mt-4 text-lg font-black text-green-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                Path to City Captain
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Progress from Ambassador to city leader
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Ambassadors can earn points through qualified referrals,
                approved partner leads, Guru recruitment, bookings, and local
                campaign activity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {tiers.map((tier) => (
                <div
                  key={tier.title}
                  className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-5 text-center shadow-sm"
                >
                  <p className="text-4xl">{tier.icon}</p>
                  <h3 className="mt-3 text-xl font-black text-green-950">
                    {tier.title}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-green-800">
                    {tier.points}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {tier.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-green-100 bg-green-50 p-6">
            <div className="h-4 overflow-hidden rounded-full bg-white">
              <div className="h-full w-[43%] rounded-full bg-green-800" />
            </div>
            <p className="mt-4 text-sm font-bold text-green-900">
              Example progress: 2,150 points — 350 points to Gold.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              Lead tracking
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950">
              Track business development from lead to active partner
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-5">
              {leadStatuses.map((status) => (
                <div
                  key={status.title}
                  className="rounded-[1.25rem] border border-green-100 bg-[#fbfaf6] p-4 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                    {status.icon}
                  </div>
                  <h3 className="mt-3 text-sm font-black text-green-950">
                    {status.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {status.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-green-100">
              <div className="grid grid-cols-4 bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-green-900">
                <span>Business</span>
                <span>Type</span>
                <span>Status</span>
                <span>City</span>
              </div>

              {[
                ["Dogs & Cats Rule", "Pet Store", "Contacted", "Doylestown"],
                ["Happy Paws Grooming", "Groomer", "Applied", "Newtown"],
                ["Bucks County Rescue", "Rescue", "Active", "Yardley"],
              ].map(([business, type, status, city]) => (
                <div
                  key={business}
                  className="grid grid-cols-4 border-t border-green-100 bg-white px-4 py-4 text-sm"
                >
                  <span className="font-bold text-green-950">{business}</span>
                  <span className="text-slate-600">{type}</span>
                  <span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                      {status}
                    </span>
                  </span>
                  <span className="text-slate-600">{city}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-green-950 p-6 text-white shadow-xl shadow-green-950/20 sm:p-8">
            <p className="text-5xl">“</p>
            <p className="mt-2 text-2xl font-black leading-9">
              Being a SitGuru Ambassador lets me make a real difference for pets
              and people in my community — while earning rewards doing what I
              love.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-green-950">
                A
              </div>
              <div>
                <p className="font-black">Alyssa M.</p>
                <p className="text-sm text-green-100">
                  City Captain • Top Ambassador
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-3xl font-black">$2,850</p>
                <p className="mt-1 text-sm text-green-100">Rewards earned</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-3xl font-black">18</p>
                <p className="mt-1 text-sm text-green-100">Partners helped</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-5 lg:px-10">
          {[
            ["2,450+", "Active Ambassadors"],
            ["18,600+", "Pet Parents Referred"],
            ["1,250+", "Gurus Recruited"],
            ["860+", "Partner Businesses"],
            ["$420K+", "Rewards Earned"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 text-center shadow-sm"
            >
              <p className="text-3xl font-black text-green-950">{value}</p>
              <p className="mt-2 text-sm font-bold text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <PartnerApplicationForm
          applicantType="ambassador"
          title="Apply to become a SitGuru Ambassador"
          description="Apply to help SitGuru grow through local outreach, Guru referrals, partner introductions, and community promotion."
          typeLabel="Ambassador Type"
          typeOptions={[
            "Community Ambassador",
            "Local Partner Ambassador",
            "City Captain Interest",
            "Campus Ambassador",
            "Neighborhood Ambassador",
            "Pet Event Ambassador",
            "Rescue Ambassador",
            "Other Ambassador",
          ]}
          websiteLabel="Website or Social"
          websitePlaceholder="https://instagram.com/yourhandle"
          submitLabel="Apply as Ambassador"
        />
      </section>
    </main>
  );
}
