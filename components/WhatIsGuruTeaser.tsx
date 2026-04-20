export default function WhatIsGuruTeaser() {
  const roles = [
    "Pet Sitting",
    "Dog Walking",
    "Training",
    "Drop-In Care",
    "Overnight Care",
    "Specialized Support",
  ];

  const people = [
    "Students",
    "Professionals",
    "Neighbors",
    "Retirees",
    "Pet Lovers",
    "Trainers",
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-white">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            More Than a Sitter. Meet the SitGuru Standard.
          </h2>

          <p className="mt-5 text-lg text-slate-300">
            A Guru is someone pet parents trust — whether they provide sitting,
            walking, training, or everyday pet care support.
          </p>
        </div>

        {/* Content Grid */}
        <div className="mt-14 grid gap-10 md:grid-cols-2">
          {/* Roles */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h3 className="mb-6 text-xl font-semibold text-emerald-300">
              A Guru Can Be
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <div
                  key={role}
                  className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white"
                >
                  {role}
                </div>
              ))}
            </div>
          </div>

          {/* People */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h3 className="mb-6 text-xl font-semibold text-emerald-300">
              Gurus Come From
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {people.map((person) => (
                <div
                  key={person}
                  className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white"
                >
                  {person}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Statement */}
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <p className="text-xl font-medium text-slate-200">
            A Guru is not defined by one role — but by how they care, show up,
            and earn trust.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="/what-is-a-guru"
            className="rounded-2xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02] hover:bg-emerald-400"
          >
            What Is a Guru?
          </a>

          <a
            href="/become-a-guru"
            className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
          >
            Become a Guru
          </a>
        </div>
      </div>
    </section>
  );
}