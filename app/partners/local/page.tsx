import Link from "next/link";
import PartnerApplicationForm from "@/components/partners/PartnerApplicationForm";

const partnerTypes = [
  {
    title: "Pet Stores",
    description: "Retail and boutique pet supply stores.",
    icon: "🏪",
  },
  {
    title: "Groomers",
    description: "Salons, mobile groomers, and grooming pros.",
    icon: "✂️",
  },
  {
    title: "Trainers",
    description: "Dog trainers and behavior specialists.",
    icon: "🦮",
  },
  {
    title: "Rescues",
    description: "Animal rescues, shelters, and adoption groups.",
    icon: "💚",
  },
  {
    title: "Vets",
    description: "Veterinary clinics, hospitals, and pet health teams.",
    icon: "🩺",
  },
  {
    title: "Apartments",
    description: "Pet-friendly apartment communities and property teams.",
    icon: "🏢",
  },
];

const rewards = [
  {
    value: "$25–$40",
    label: "per first completed booking",
    icon: "💵",
  },
  {
    value: "$50–$100",
    label: "per referred Guru",
    icon: "👤",
  },
  {
    value: "$10–$25",
    label: "rescue donation option",
    icon: "🐾",
  },
];

const receiveItems = [
  {
    title: "Custom Landing Page",
    description: "A branded SitGuru page that highlights your business.",
    icon: "🌐",
  },
  {
    title: "QR Signage",
    description: "Counter cards, flyers, and QR links for easy promotion.",
    icon: "▦",
  },
  {
    title: "Monthly Payouts",
    description: "Trackable rewards with simple payout reporting.",
    icon: "📅",
  },
  {
    title: "Admin Support",
    description: "SitGuru Admin can help manage setup and partner questions.",
    icon: "🎧",
  },
  {
    title: "Marketing Kit",
    description: "Co-branded content, copy, and local promotion tools.",
    icon: "📣",
  },
];

const processSteps = [
  {
    step: "1",
    title: "Apply",
    description: "Submit a quick application about your business.",
    icon: "📝",
  },
  {
    step: "2",
    title: "Get Approved",
    description: "SitGuru reviews and activates your partner account.",
    icon: "✅",
  },
  {
    step: "3",
    title: "Receive QR Code & Link",
    description: "Use your unique QR code and link to promote SitGuru.",
    icon: "▦",
  },
  {
    step: "4",
    title: "Earn Rewards",
    description: "Earn when qualified referrals complete real bookings.",
    icon: "🎁",
  },
];

export default function LocalPartnersPage() {
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
              Local Partner Program
            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight text-green-950 sm:text-6xl lg:text-7xl">
              Grow Locally with SitGuru
            </h1>

            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-800">
              Partner your pet store, grooming salon, training business, rescue,
              vet office, or apartment community with SitGuru.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#apply"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Become a Local Partner
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-6 py-3 text-sm font-bold text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Schedule a Demo
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["🤝", "Trusted by local businesses"],
                ["🛡️", "No fees to join"],
                ["💵", "Rewards paid monthly"],
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-h-56 rounded-[1.5rem] bg-[radial-gradient(circle_at_30%_25%,#bbf7d0,transparent_28%),linear-gradient(135deg,#f0fdf4,#fff7ed)] p-5">
                <p className="text-sm font-black text-green-950">
                  Pet boutique partner
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  QR signs at checkout help pet parents discover SitGuru.
                </p>
              </div>

              <div className="min-h-56 rounded-[1.5rem] bg-[radial-gradient(circle_at_70%_25%,#fed7aa,transparent_28%),linear-gradient(135deg,#fff7ed,#f8fafc)] p-5">
                <p className="text-sm font-black text-green-950">
                  Grooming partner
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Groomers can recommend sitting and walking support.
                </p>
              </div>

              <div className="min-h-56 rounded-[1.5rem] bg-[radial-gradient(circle_at_35%_35%,#bfdbfe,transparent_28%),linear-gradient(135deg,#eff6ff,#f8fafc)] p-5">
                <p className="text-sm font-black text-green-950">
                  Training partner
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Trainers can refer families who need trusted daily care.
                </p>
              </div>

              <div className="min-h-56 rounded-[1.5rem] bg-[radial-gradient(circle_at_70%_35%,#dcfce7,transparent_28%),linear-gradient(135deg,#f0fdf4,#ffffff)] p-5">
                <p className="text-sm font-black text-green-950">
                  Rescue partner
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Donation-based rewards can support rescue missions.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                  🐾
                </div>
                <div>
                  <p className="text-sm font-black text-green-950">
                    Better care. Stronger communities. Happier pets.
                  </p>
                  <p className="text-xs text-slate-600">
                    Local partners help SitGuru grow city by city.
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
            Partner with us
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Built for local pet businesses
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {partnerTypes.map((type) => (
            <div
              key={type.title}
              className="rounded-[1.5rem] border border-green-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                {type.icon}
              </div>
              <h3 className="mt-4 text-lg font-black text-green-950">
                {type.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-green-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
          <div className="rounded-[2rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm sm:p-8">
            <h2 className="text-center text-3xl font-black tracking-tight text-green-950 sm:text-4xl">
              How Local Partnerships Work
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {processSteps.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-800 text-sm font-black text-white">
                    {item.step}
                  </div>
                  <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
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
          </div>

          <div className="rounded-[2rem] border border-green-100 bg-green-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-black tracking-tight text-green-950">
              Earn Great Rewards
            </h2>

            <div className="mt-6 space-y-4">
              {rewards.map((reward) => (
                <div
                  key={reward.value}
                  className="flex items-center gap-4 rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                    {reward.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-green-950">
                      {reward.value}
                    </p>
                    <p className="text-sm text-slate-600">{reward.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm font-bold text-green-800">
              Rewards should be paid only after qualified, completed activity.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
            What you receive
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
            Everything needed to promote SitGuru locally
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {receiveItems.map((item) => (
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
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
              Local examples
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
              Proud to partner with local businesses
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              "Dogs & Cats Rule",
              "Pawsitive Pet Supply",
              "Happy Pup Grooming",
              "Fetch & Learn",
              "Bucks County Rescue",
              "CityView Apartments",
            ].map((name) => (
              <div
                key={name}
                className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-5 text-center shadow-sm"
              >
                <p className="text-lg font-black text-green-950">{name}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Example local partner
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm">
              <p className="text-lg text-green-700">★★★★★</p>
              <p className="mt-4 text-lg font-semibold leading-8 text-slate-800">
                “SitGuru gives local pet businesses a simple way to recommend
                trusted care while creating new customer value.”
              </p>
              <p className="mt-4 text-sm font-black text-green-950">
                Jamie L. — Pet Store Partner
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-green-100 bg-[#fbfaf6] p-6 shadow-sm">
              <p className="text-lg text-green-700">★★★★★</p>
              <p className="mt-4 text-lg font-semibold leading-8 text-slate-800">
                “The rescue donation option makes this a win for pet parents,
                pets, and community organizations.”
              </p>
              <p className="mt-4 text-sm font-black text-green-950">
                Maria S. — Rescue Partner
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <PartnerApplicationForm
          applicantType="local_partner"
          title="Ready to grow your business?"
          description="Apply to become a SitGuru Local Partner. SitGuru Admin will review your application and follow up with next steps."
          businessLabel="Business Name"
          businessPlaceholder="Your business name"
          typeLabel="Partner Type"
          typeOptions={[
            "Pet Store",
            "Groomer",
            "Trainer",
            "Rescue",
            "Vet",
            "Apartment Community",
            "Dog Daycare",
            "Pet Photographer",
            "Pet Event Organizer",
            "Other Local Business",
          ]}
          websiteLabel="Business Website"
          websitePlaceholder="https://yourbusiness.com"
          submitLabel="Apply as Local Partner"
        />
      </section>
    </main>
  );
}
