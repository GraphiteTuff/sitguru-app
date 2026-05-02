import Link from "next/link";
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm";

const audienceSegments = [
  {
    title: "Influencers",
    description: "Create pet content and share SitGuru with your audience.",
    icon: "🎥",
  },
  {
    title: "Bloggers",
    description: "Recommend SitGuru through articles, guides, and newsletters.",
    icon: "✍️",
  },
  {
    title: "Gurus",
    description: "Refer pet parents and other trusted caregivers.",
    icon: "🐾",
  },
  {
    title: "Customers",
    description: "Love SitGuru? Share it with friends and earn rewards.",
    icon: "💚",
  },
  {
    title: "Community Leaders",
    description: "Promote SitGuru through local groups and pet communities.",
    icon: "📣",
  },
];

const commissionPlans = [
  {
    title: "Give $25 / Get $25",
    description:
      "Your referral gets $25 off their first booking and you earn $25 after the booking is completed.",
    icon: "🎁",
    accent: "green",
  },
  {
    title: "$20–$35 per First Booking",
    description:
      "Earn for qualified new pet parents who complete their first SitGuru booking through your link.",
    icon: "📈",
    accent: "blue",
  },
  {
    title: "$75+ per Approved Guru",
    description:
      "Earn when a new Guru you refer is approved and completes the required first booking milestone.",
    icon: "⭐",
    accent: "orange",
  },
];

const affiliateTools = [
  {
    title: "Unique Affiliate Link",
    description: "Personalized links with referral tracking.",
    icon: "🔗",
  },
  {
    title: "QR Codes",
    description: "Custom QR codes for flyers, cards, and events.",
    icon: "▦",
  },
  {
    title: "Social Templates",
    description: "Ready-to-post captions and visual content.",
    icon: "📱",
  },
  {
    title: "Performance Dashboard",
    description: "Track clicks, signups, bookings, and rewards.",
    icon: "📊",
  },
  {
    title: "Monthly Payouts",
    description: "Simple payout tracking for approved rewards.",
    icon: "💵",
  },
];

const steps = [
  {
    step: "1",
    title: "Join",
    description: "Apply in minutes and get approved by SitGuru Admin.",
    icon: "📝",
  },
  {
    step: "2",
    title: "Share",
    description: "Promote your unique links across your content and community.",
    icon: "📣",
  },
  {
    step: "3",
    title: "Track",
    description: "Watch clicks, signups, bookings, and rewards in your dashboard.",
    icon: "📊",
  },
  {
    step: "4",
    title: "Earn",
    description: "Get rewarded for verified bookings and approved Guru referrals.",
    icon: "🎁",
  },
];

function planClasses(accent: string) {
  switch (accent) {
    case "blue":
      return {
        card: "border-blue-200 bg-blue-50/70",
        icon: "bg-blue-100 text-blue-900",
        link: "text-blue-800",
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

export default function GrowthAffiliatesPage() {
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
              Growth Affiliate Program
            </div>

            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-800">
              <span>📈</span>
              Growth Affiliate Program
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              Share SitGuru. Earn Growth Rewards.
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              Perfect for influencers, bloggers, Gurus, pet communities, and
              promoters who can bring pet parents and trusted caregivers to
              SitGuru.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#apply"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Join as an Affiliate
              </Link>

              <Link
                href="#commission-plans"
                className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                See Commission Plans
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["🤝", "Trusted affiliate growth"],
                ["📊", "Simple tracking"],
                ["💵", "Reward-based payouts"],
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

          <div className="rounded-[2rem] border border-green-100 bg-gradient-to-br from-green-50 via-white to-purple-50 p-4 shadow-2xl shadow-green-950/10">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[1.25rem] bg-[radial-gradient(circle_at_35%_25%,#ddd6fe,transparent_28%),linear-gradient(135deg,#faf5ff,#f0fdf4)] p-5">
                  <p className="text-sm font-black text-green-950">
                    Creator Campaign
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Share helpful pet-care content with a SitGuru referral link.
                  </p>

                  <div className="mt-8 rounded-2xl bg-white/90 p-4 shadow-sm">
                    <p className="text-xs font-bold text-slate-500">
                      Your Link
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-green-950">
                      sitguru.com/r/sarahm
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-green-100 bg-green-50 p-5">
                  <p className="text-sm font-black text-green-950">
                    Affiliate Snapshot
                  </p>

                  <div className="mt-5 grid gap-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500">
                        Clicks
                      </p>
                      <p className="text-2xl font-black text-green-950">
                        12,450
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs font-bold text-slate-500">
                        Pending Rewards
                      </p>
                      <p className="text-2xl font-black text-green-950">
                        $4,876
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-green-100 bg-[#fbfaf6] p-5">
                <p className="text-sm font-black text-green-950">
                  Help more pets. Grow together.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Affiliates should promote SitGuru with approved messaging,
                  helpful content, and transparent partner disclosures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            Who can join?
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Built for people who already influence pet decisions
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {audienceSegments.map((segment) => (
            <div
              key={segment.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                {segment.icon}
              </div>
              <h3 className="mt-4 text-lg font-black text-green-950">
                {segment.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {segment.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="commission-plans"
        className="border-y border-green-100 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              Commission plans
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
              Generous growth commissions
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Rewards should be tied to verified activity: completed first
              bookings, approved Gurus, and qualified conversions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {commissionPlans.map((plan) => {
              const classes = planClasses(plan.accent);

              return (
                <div
                  key={plan.title}
                  className={`rounded-[1.5rem] border p-6 shadow-sm ${classes.card}`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${classes.icon}`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-green-950">
                    {plan.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {plan.description}
                  </p>
                  <p className={`mt-5 text-sm font-black ${classes.link}`}>
                    See plan details →
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            What affiliates get
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Tools to promote, track, and earn
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {affiliateTools.map((tool) => (
            <div
              key={tool.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                {tool.icon}
              </div>
              <h3 className="mt-4 text-lg font-black text-green-950">
                {tool.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10">
          <div className="rounded-[2rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                Tracking & reporting
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950">
                See performance clearly
              </h2>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ["Clicks", "12,450"],
                ["Signups", "2,384"],
                ["Bookings", "1,106"],
                ["Conversion Rate", "8.89%"],
                ["Pending Rewards", "$4,876"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-green-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-green-950">
                  Clicks Over Time
                </p>
                <p className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                  Last 30 days
                </p>
              </div>
              <div className="mt-5 h-44 rounded-xl bg-[linear-gradient(135deg,#dcfce7,#ffffff)]" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-green-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950">
              Join, share, track, earn
            </h2>

            <div className="mt-8 space-y-4">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-black text-white">
                    {item.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <h3 className="text-lg font-black text-green-950">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            Affiliate stories
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Designed for creators and community promoters
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            [
              "Jessica M.",
              "Pet Influencer",
              "SitGuru is the kind of pet-care brand my audience actually wants to hear about.",
            ],
            [
              "David P.",
              "Pet Blogger",
              "The tracking dashboard makes it easy to see what is working and where rewards are pending.",
            ],
            [
              "Priya S.",
              "Community Leader",
              "I can help my local pet community while earning rewards for verified referrals.",
            ],
          ].map(([name, role, quote]) => (
            <div
              key={name}
              className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-xl font-black text-green-900">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-green-950">{name}</p>
                  <p className="text-sm text-slate-500">{role}</p>
                </div>
              </div>
              <p className="mt-4 text-green-700">★★★★★</p>
              <p className="mt-4 text-base font-semibold leading-7 text-slate-800">
                “{quote}”
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr] lg:px-10">
          <div className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Affiliate Program FAQ
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <p className="font-black text-green-950">
                  When do payouts happen?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Approved rewards can be reviewed and paid on a monthly payout
                  cycle once payout workflows are connected.
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-5">
                <p className="font-black text-green-950">
                  How are referrals verified?
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Referrals should be tied to completed bookings, approved
                  Gurus, or qualified conversions before rewards are approved.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">Resources</h2>

            <div className="mt-5 space-y-3">
              {[
                "Affiliate Terms & Conditions",
                "Brand Assets & Guidelines",
                "Best Practices Guide",
                "Contact Affiliate Support",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-green-100 bg-white p-4 text-sm font-bold text-green-900"
                >
                  {item} →
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-3xl font-black tracking-tight">
              Ready to grow with SitGuru?
            </h2>
            <p className="mt-4 text-sm leading-6 text-green-100">
              Join our Growth Affiliate Program and earn while making a
              difference for pets and the people who love them.
            </p>
            <Link
              href="#apply"
              className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-green-950 transition hover:bg-green-50"
            >
              Join as an Affiliate
            </Link>
          </div>
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <PartnerApplicationForm
          applicantType="affiliate"
          title="Join as a growth affiliate"
          description="Apply to become a SitGuru Growth Affiliate. SitGuru Admin will review your audience, promotional fit, and referral opportunity."
          typeLabel="Affiliate Type"
          typeOptions={[
            "Influencer",
            "Blogger",
            "Guru",
            "Customer",
            "Community Leader",
            "Newsletter Owner",
            "Facebook Group Admin",
            "Pet Event Host",
            "Other Promoter",
          ]}
          websiteLabel="Website or Social"
          websitePlaceholder="https://instagram.com/yourhandle"
          submitLabel="Apply as Affiliate"
        />
      </section>
    </main>
  );
}
