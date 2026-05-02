import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, PawPrint } from "lucide-react";

const pillars = [
  {
    title: "Trust Before Transactions",
    description:
      "SitGuru is being built to help Pet Parents feel confident in who they choose, not rushed into a decision. We believe trust, clarity, and consistency should come before convenience alone.",
  },
  {
    title: "Community-Centered Care",
    description:
      "We want SitGuru to feel more connected than a typical online marketplace. Our vision is to support meaningful relationships between Pet Parents and Gurus so care feels personal, reliable, and rooted in real connection.",
  },
  {
    title: "Pet-Parent Perspective",
    description:
      "Every part of SitGuru is being shaped around the real concerns Pet Parents carry — communication, reliability, transparency, and peace of mind when placing their pets in someone else’s care.",
  },
];

const values = [
  {
    title: "Trust",
    description:
      "We believe pet care begins with confidence in the people, the process, and the platform behind the experience.",
  },
  {
    title: "Care",
    description:
      "Every decision should reflect the well-being of pets and the peace of mind of the people who love them.",
  },
  {
    title: "Community",
    description:
      "SitGuru is being built to strengthen local care relationships and create a more connected pet care experience.",
  },
  {
    title: "Clarity",
    description:
      "Pet Parents and Gurus deserve a platform that feels transparent, organized, and easy to navigate.",
  },
  {
    title: "Connection",
    description:
      "The best care grows through communication, consistency, and relationships that build over time.",
  },
];

const steps = [
  {
    number: "01",
    title: "Discover trusted care",
    description:
      "Explore Gurus, review services, and find care options that feel aligned with your pet’s needs, routine, and personality.",
  },
  {
    number: "02",
    title: "Share what matters most",
    description:
      "Keep important pet details visible and organized so care can feel more informed, personalized, and reassuring from the beginning.",
  },
  {
    number: "03",
    title: "Build lasting relationships",
    description:
      "Use communication and booking tools designed to support continuity, trust, and stronger long-term care connections.",
  },
];

const audience = [
  {
    title: "For Pet Parents",
    description:
      "SitGuru is being built to make finding care feel more reassuring and less overwhelming. It is designed for Pet Parents who want more than convenience — they want trust, communication, and confidence in the people caring for their pets.",
    points: [
      "Find care with greater confidence",
      "Keep pet details organized in one place",
      "Stay connected throughout the care journey",
      "Build trusted relationships over time",
    ],
  },
  {
    title: "For Gurus",
    description:
      "SitGuru is also being built for caregivers who lead with heart. We want Gurus to have a platform where professionalism, communication, and genuine care can stand out in a meaningful way.",
    points: [
      "Build a trusted professional presence",
      "Show services and availability clearly",
      "Connect with the right families",
      "Grow through consistency, communication, and care",
    ],
  },
];

const pets = [
  {
    name: "Scout",
    type: "German Shorthaired Pointer",
    image: "/about/scout.jpeg",
    alt: "Scout the German Shorthaired Pointer",
  },
  {
    name: "Rogue",
    type: "German Shorthaired Pointer",
    image: "/about/rogue.jpeg",
    alt: "Rogue the German Shorthaired Pointer",
  },
  {
    name: "Delilah",
    type: "American Cocker Spaniel",
    image: "/about/delilah.jpeg",
    alt: "Delilah the American Cocker Spaniel",
  },
  {
    name: "Taco",
    type: "Cat",
    image: "/about/Taco.jpeg",
    alt: "Taco the cat",
  },
  {
    name: "Belle",
    type: "Cat",
    image: "/about/belle.jpeg",
    alt: "Belle the cat",
  },
];

function SectionEyebrow({
  icon = "paw",
  children,
}: {
  icon?: "paw" | "heart";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon === "heart" ? (
          <Heart className="h-4 w-4" />
        ) : (
          <PawPrint className="h-4 w-4" />
        )}
      </span>
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
        {children}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fffb_0%,#f3fbf7_48%,#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <PawPrint className="absolute left-[6%] top-28 h-10 w-10 rotate-[-18deg] text-emerald-200/70" />
        <Heart className="absolute right-[8%] top-44 h-8 w-8 text-emerald-200/70" />
        <PawPrint className="absolute right-[10%] top-[24%] h-12 w-12 rotate-[12deg] text-emerald-100" />
        <Heart className="absolute left-[8%] top-[42%] h-8 w-8 text-emerald-100" />
        <PawPrint className="absolute left-[12%] top-[64%] h-10 w-10 rotate-[8deg] text-emerald-100" />
        <Heart className="absolute right-[12%] top-[78%] h-8 w-8 text-emerald-200/70" />
        <PawPrint className="absolute right-[6%] bottom-24 h-12 w-12 rotate-[-10deg] text-emerald-100" />
      </div>

      <section className="relative border-b border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_34%),linear-gradient(180deg,_#f7fffb_0%,_#effcf5_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Heart className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-700">
                About SitGuru
              </p>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <PawPrint className="h-4 w-4" />
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              A more trusted, community-centered future for pet care.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              SitGuru is being built to help Pet Parents find dependable care
              with greater confidence, while giving caring Gurus a platform
              where trust, connection, professionalism, and heart can stand
              out. Our goal is to create an experience that feels more personal
              than transactional and more supportive than impersonal.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Join the Waitlist
              </Link>

              <Link
                href="/become-a-guru"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Become a Guru
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.title}
              className="relative rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
              <span className="absolute right-5 top-5 text-emerald-200">
                {index === 1 ? (
                  <Heart className="h-5 w-5" />
                ) : (
                  <PawPrint className="h-5 w-5" />
                )}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
            <SectionEyebrow icon="paw">Why SitGuru Exists</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Pet care should feel personal, supported, and informed.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Choosing care for a beloved pet should never feel rushed,
              unclear, or disconnected. Pet Parents deserve a better
              experience — one where they can feel more confident in who they
              choose, more supported throughout the process, and more at ease
              knowing their pets are at the center of the experience.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600">
              SitGuru is being built to create that better standard. We want
              to make it easier for Pet Parents to discover trusted care while
              also giving Gurus a platform where genuine compassion,
              communication, and professionalism can be seen and valued.
            </p>
          </div>

          <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-8 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
            <SectionEyebrow icon="heart">
              What Makes SitGuru Different
            </SectionEyebrow>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
              <li>Built to support trust, not just transactions</li>
              <li>Community-centered and relationship-driven by design</li>
              <li>Focused on what Pet Parents actually worry about</li>
              <li>Created to elevate Gurus who truly care</li>
              <li>Committed to a more human, connected experience</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
          <div className="max-w-3xl">
            <SectionEyebrow icon="heart">
              Care Starts with the Right People
            </SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built for Gurus who lead with heart.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              At SitGuru, we believe the best pet care begins with genuine
              compassion. Great caregivers are not simply available — they are
              attentive, dependable, communicative, and invested in the comfort
              and well-being of the pets they serve.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600">
              That belief is part of what shapes SitGuru. We want to create a
              platform where Gurus who truly care can stand out, and where Pet
              Parents can feel that the person they choose is not just offering
              a service, but showing real heart, responsibility, and care.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
          <div className="max-w-2xl">
            <SectionEyebrow icon="paw">How SitGuru Works</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Thoughtful steps for a more connected care experience.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-6"
              >
                <p className="text-sm font-black tracking-[0.24em] text-emerald-700">
                  {step.number}
                </p>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {audience.map((group, index) => (
            <div
              key={group.title}
              className="rounded-[28px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
            >
              <SectionEyebrow icon={index === 0 ? "heart" : "paw"}>
                {group.title}
              </SectionEyebrow>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {group.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
                {group.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_50%,#ffffff_100%)] p-8 shadow-[0_10px_30px_rgba(16,185,129,0.08)] lg:p-10">
          <SectionEyebrow icon="heart">Built on Human Connection</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Real questions deserve real people.
          </h2>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
            At SitGuru, we believe pet care should feel personal at every
            level. That includes not only the relationship between Pet Parents
            and Gurus, but also the support behind the platform itself. When
            questions or concerns arise, customers should never feel like they
            are navigating the experience alone.
          </p>
          <p className="mt-5 max-w-4xl text-base leading-8 text-slate-700">
            While technology can help make the experience smoother and more
            organized, we believe it should never replace genuine human
            communication. SitGuru is being built with a commitment to real
            contact, thoughtful support, and the comfort of knowing there is a
            human being ready to listen, respond, and help.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
          <div className="max-w-3xl">
            <SectionEyebrow icon="paw">Our Values</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              The principles shaping SitGuru.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="relative rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-6"
              >
                <span className="absolute right-4 top-4 text-emerald-200">
                  {index % 2 === 0 ? (
                    <PawPrint className="h-4 w-4" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
          <div className="sr-only">
            <h2>The People Behind SitGuru</h2>
            <p>
              Built by pet parents who believe care should feel more human.
              SitGuru is being built by husband-and-wife founders Jason and
              Danette. Their shared vision is to create a more trusted,
              thoughtful, and community-centered experience for pet care — one
              where pets come first, communication matters, and people who
              truly care can stand out.
            </p>
          </div>

          <Image
            src="/about/people-behind-sitguru.png"
            alt="The People Behind SitGuru graphic featuring founders Jason and Danette, their roles, and the SitGuru mission."
            width={1600}
            height={1000}
            priority
            className="h-auto w-full rounded-[24px] border border-emerald-100"
          />
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] lg:p-10">
          <div className="max-w-3xl">
            <SectionEyebrow icon="paw">Meet the Pets Behind the Mission</SectionEyebrow>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Our own pet family helps shape the heart behind SitGuru.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              SitGuru is personal to us because we are pet parents, too. Our
              family includes Scout and Rogue, our German Shorthaired Pointers,
              Delilah, our American Cocker Spaniel, and our cats, Taco and
              Belle. Living with a full and beloved pet family continues to
              remind us that every pet has a unique personality, routine, and
              need for thoughtful care.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {pets.map((pet) => (
              <div
                key={pet.name}
                className="overflow-hidden rounded-[24px] border border-emerald-100 bg-emerald-50/40"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={pet.image}
                    alt={pet.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-950">
                    {pet.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{pet.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-8 text-center shadow-[0_10px_30px_rgba(16,185,129,0.08)] sm:p-10">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Heart className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Join SitGuru
            </p>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <PawPrint className="h-4 w-4" />
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Be part of a more trusted and connected future for pet care.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            SitGuru is being built for Pet Parents who want greater confidence
            and for Gurus who want to grow through meaningful care
            relationships. Join us as we build a platform centered on trust,
            communication, and care that feels personal.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Join the Waitlist
            </Link>

            <Link
              href="/become-a-guru"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Become a Guru
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
