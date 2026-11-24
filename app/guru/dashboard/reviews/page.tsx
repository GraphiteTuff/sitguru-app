import Link from "next/link";
import { ArrowRight, MessageSquareHeart, Star, UserRound } from "lucide-react";
import GuruPageHero from "@/components/guru/GuruPageHero";

export default function GuruDashboardReviewsPage() {
  return (
    <main className="min-h-[70svh] bg-[#F7FFFB] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <GuruPageHero
          eyebrow="PET PARENT FEEDBACK"
          title="Your Reviews"
          description="Build trust through great care and meaningful Pet Parent feedback. Review totals will appear here when the live reporting source is connected."
          action={{ href: "/guru/dashboard/profile", label: "Edit My Guru Profile" }}
        />
        <section aria-label="Review summary" className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Star className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="mt-4 text-xl font-black text-slate-950">Average rating</h2>
            <p className="mt-3 text-4xl font-black text-slate-950" aria-label="Average rating not available yet">—</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">We won’t show a guessed rating or a placeholder zero.</p>
          </article>
          <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><MessageSquareHeart className="h-6 w-6" aria-hidden="true" /></span>
            <h2 className="mt-4 text-xl font-black text-slate-950">Pet Parent feedback</h2>
            <p className="mt-3 text-lg font-black text-emerald-900">Reporting connection pending</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Verified feedback will appear here when the review feed is available.</p>
          </article>
        </section>
        <section className="rounded-[1.6rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <UserRound className="mt-1 h-6 w-6 shrink-0 text-emerald-800" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Make your profile stand out</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Complete your services and add clear, friendly photos so local Pet Parents can get to know you.</p>
            </div>
          </div>
          <Link href="/guru/dashboard/promote" className="mt-5 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-center text-base font-black !text-white transition hover:bg-emerald-800 sm:w-auto">
            Promote My Guru Profile <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
