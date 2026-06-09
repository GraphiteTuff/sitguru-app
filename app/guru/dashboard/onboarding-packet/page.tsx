import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_FONT_STYLE = {
  fontFamily:
    '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 300,
};

export default async function GuruOnboardingPacketPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/guru/login");
  }

  const packetUrl = process.env.NEXT_PUBLIC_GURU_ONBOARDING_PACKET_URL || "";

  return (
    <main
      className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fffc_45%,#ecfdf5_100%)] px-5 py-10 text-slate-900 sm:px-6 lg:px-8"
      style={SITE_FONT_STYLE}
    >
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="bg-[radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.92),transparent_22%),linear-gradient(110deg,#05c997_0%,#80e7d2_48%,#b9e6ff_100%)] p-7 sm:p-9">
          <p className="text-sm font-black uppercase tracking-[0.3em] !text-[#07132f]">
            SitGuru Guru Onboarding
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.045em] !text-[#07132f] sm:text-6xl">
            Complete Your Guru Onboarding Packet
          </h1>

          <p className="mt-4 max-w-3xl text-lg font-bold leading-8 !text-slate-700">
            This secure packet helps SitGuru document your Guru setup,
            contractor acknowledgment, W-9 tax information acknowledgment,
            safety expectations, and onboarding requirements.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-3xl font-black tracking-[-0.035em] !text-[#07132f]">
              What to do next
            </h2>

            <div className="mt-6 grid gap-4">
              {[
                {
                  title: "Watch the Guru onboarding video",
                  body: "Review the short Guru Opportunity video so you understand the SitGuru role and expectations.",
                },
                {
                  title: "Complete SitGuru University",
                  body: "Finish the quick Guru Academy onboarding. It usually takes about 9–15 minutes.",
                },
                {
                  title: "Complete your Guru profile",
                  body: "Add your profile photo, bio, services, availability, service area, and experience.",
                },
                {
                  title: "Complete your Guru Onboarding Packet",
                  body: "SitGuru will send your secure PandaDoc packet directly to your email so you can review, complete, and sign it.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-[1.25rem] border border-emerald-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-base font-black !text-white">
                      {index + 1}
                    </span>

                    <div>
                      <p className="text-lg font-black !text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 !text-slate-700">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-black uppercase tracking-[0.18em] !text-amber-800">
                Secure document note
              </p>
              <p className="mt-2 text-sm font-bold leading-6 !text-amber-900">
                Please do not email tax forms or sensitive information directly.
                SitGuru will use PandaDoc or another secure method for required
                onboarding paperwork.
              </p>
            </div>
          </section>

          <aside className="rounded-[1.75rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black !text-[#07132f]">
              Packet Status
            </h2>

            <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] !text-amber-700">
                Current Status
              </p>

              <p className="mt-2 text-2xl font-black !text-amber-900">
                Packet Sent by SitGuru
              </p>

              <p className="mt-2 text-sm font-bold leading-6 !text-amber-900">
                SitGuru will send your secure PandaDoc packet directly to the
                email on your Guru account. Please check your inbox and spam
                folder for a PandaDoc email from SitGuru.
              </p>
            </div>

            {packetUrl ? (
              <a
                href={packetUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex min-h-[54px] items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-3 text-base font-black !text-white shadow-[0_12px_26px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
              >
                Open Secure Packet →
              </a>
            ) : (
              <div className="mt-5 rounded-[1rem] border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] !text-emerald-700">
                  No action button needed
                </p>
                <p className="mt-2 text-sm font-bold leading-6 !text-emerald-900">
                  Your packet is sent separately by SitGuru through PandaDoc.
                  Once completed, SitGuru will review and update your onboarding
                  status.
                </p>
              </div>
            )}

            <Link
              href="/guru/dashboard/university"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] border border-emerald-200 bg-white px-6 py-3 text-base font-black !text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Continue Guru Academy
            </Link>

            <Link
              href="/guru/dashboard/profile"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] border border-slate-200 bg-white px-6 py-3 text-base font-black !text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Update My Profile
            </Link>

            <Link
              href="/guru/dashboard"
              className="mt-3 flex min-h-[54px] items-center justify-center rounded-[1rem] bg-[#07132f] px-6 py-3 text-base font-black !text-white shadow-[0_12px_26px_rgba(7,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b1436]"
            >
              Back to Dashboard
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}