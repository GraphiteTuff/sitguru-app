import Link from "next/link";

const summaryCards = [
  {
    label: "Upcoming bookings",
    value: "3",
    note: "Next visit starts tomorrow",
  },
  {
    label: "Saved sitters",
    value: "8",
    note: "Compare trusted caregivers faster",
  },
  {
    label: "Unread messages",
    value: "2",
    note: "Stay updated with booking details",
  },
];

const quickActions = [
  {
    title: "Search for pet care",
    description:
      "Browse local sitters, walkers, and boarding providers with clearer trust signals and easier comparison.",
    href: "/search",
    button: "Find sitters",
  },
  {
    title: "Review upcoming bookings",
    description:
      "Check your upcoming reservations, service details, and booking status in one place.",
    href: "/bookings",
    button: "View bookings",
  },
  {
    title: "Manage your account",
    description:
      "Update profile details, review activity, and keep your PawNecto experience organized.",
    href: "/signup",
    button: "Update account",
  },
];

const upcomingActivity = [
  {
    title: "Dog Walking with Sarah J.",
    date: "Tomorrow · 10:00 AM",
    status: "Confirmed",
    details: "30-minute walk · Quakertown, Pennsylvania",
  },
  {
    title: "Drop-In Visit with Emily R.",
    date: "Apr 14 · 2:00 PM",
    status: "Pending",
    details: "Cat care visit · Allentown, Pennsylvania",
  },
  {
    title: "Boarding with Marcus T.",
    date: "Apr 18 · 9:00 AM",
    status: "Confirmed",
    details: "Weekend stay · Bethlehem, Pennsylvania",
  },
];

const recentUpdates = [
  "Your last booking has been marked complete.",
  "A sitter sent a message about pickup timing.",
  "A new review was added to one of your saved sitters.",
  "Your account details were recently updated.",
];

const accountTips = [
  "Keep pet care preferences updated before booking.",
  "Save favorite sitters to compare services later.",
  "Review upcoming booking times and notes in advance.",
  "Use clear messages to share routines and care instructions.",
];

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "Confirmed"
      ? "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
      : "inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700";

  return <span className={classes}>{status}</span>;
}

export default function DashboardPage() {
  return (
    <main className="page-shell bg-slate-50 min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="page-container py-10 sm:py-12 lg:py-14">
          <div className="max-w-3xl">
            <div className="section-kicker">Dashboard</div>
            <h1 className="mt-4">Manage your PawNecto activity in one place</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Keep track of bookings, saved sitters, messages, and account
              activity through a cleaner, mobile-first dashboard experience.
            </p>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="card-grid-3">
            {summaryCards.map((card) => (
              <div key={card.label} className="panel p-5 sm:p-6">
                <p className="text-sm font-semibold text-slate-500">{card.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                  {card.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space pt-0">
        <div className="page-container">
          <div className="max-w-3xl">
            <div className="section-kicker">Quick actions</div>
            <h2 className="mt-4">Jump into the most important tasks</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Keep common actions easy to reach so the dashboard feels useful
              immediately on both mobile and desktop.
            </p>
          </div>

          <div className="card-grid-3 mt-8">
            {quickActions.map((action) => (
              <div key={action.title} className="panel p-6">
                <h3>{action.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {action.description}
                </p>
                <div className="mt-6">
                  <Link href={action.href} className="btn-primary w-full sm:w-auto">
                    {action.button}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space border-t border-slate-200 bg-white">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_380px]">
            <div className="panel p-6 sm:p-7">
              <div className="section-kicker">Upcoming activity</div>
              <h2 className="mt-4">Bookings and reservations</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Review what is coming up next and quickly confirm which bookings
                are confirmed or still pending.
              </p>

              <div className="mt-6 grid gap-4">
                {upcomingActivity.map((item) => (
                  <div key={`${item.title}-${item.date}`} className="muted-panel p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.date}</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                          {item.details}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Link href="/bookings" className="btn-secondary w-full sm:w-auto">
                  View all bookings
                </Link>
              </div>
            </div>

            <aside className="grid gap-6">
              <div className="panel p-6">
                <div className="section-kicker">Recent updates</div>
                <h3 className="mt-4">What changed recently</h3>
                <div className="mt-5 grid gap-3">
                  {recentUpdates.map((update) => (
                    <div key={update} className="muted-panel p-4">
                      <p className="text-sm font-medium text-slate-700 sm:text-base">
                        {update}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel p-6">
                <div className="section-kicker">Helpful reminders</div>
                <h3 className="mt-4">Keep your account organized</h3>
                <div className="mt-5 grid gap-3">
                  {accountTips.map((tip) => (
                    <div key={tip} className="flex items-start gap-3 rounded-2xl bg-slate-100 p-4">
                      <span className="mt-0.5 text-emerald-600">✔</span>
                      <p className="text-sm font-medium text-slate-700 sm:text-base">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-container">
          <div className="rounded-[2rem] bg-slate-900 px-6 py-10 text-white shadow-xl sm:px-8 sm:py-12 lg:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                Keep moving quickly
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Make dashboard actions easy to reach on every screen size.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Standardized UI gives PawNecto a cleaner experience, stronger
                readability, and more consistent user flow across every page.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/search" className="btn-primary w-full sm:w-auto">
                  Find pet care
                </Link>
                <Link
                  href="/bookings"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-500 px-5 text-sm font-semibold text-white transition hover:border-white"
                >
                  Review bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
