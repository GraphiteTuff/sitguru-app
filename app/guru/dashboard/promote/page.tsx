import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadGuruProfileForUser } from "@/lib/gurus/load-guru-profile-for-user";
import { guruPromoCaption, guruPublicUrl } from "@/lib/guru/promote";
import GuruPromoteActions from "@/components/guru/GuruPromoteActions";
import AskScoutButton from "@/components/guru/AskScoutButton";

export const dynamic = "force-dynamic";

export default async function GuruPromotePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/guru/login");

  const profile = await loadGuruProfileForUser(user.id, user.email);
  const slug = String(profile?.slug || "").trim();
  const url = guruPublicUrl(slug);
  if (!url) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black text-slate-950">Promote your care</h1>
        <p className="mt-3 text-sm font-semibold text-slate-600">Your public profile link is not ready yet. Finish your Guru profile, then come back to share it.</p>
        <Link href="/guru/dashboard/profile" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">Edit profile</Link>
      </main>
    );
  }

  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const name = text(profile?.display_name) || text(profile?.full_name) || text(profile?.name) || "SitGuru Guru";
  const location = [text(profile?.city), text(profile?.state)].filter(Boolean).join(", ");
  const services = Array.isArray(profile?.services)
    ? profile.services.map((item) => String(item)).filter(Boolean)
    : text(profile?.services).split(",").map((item) => item.trim()).filter(Boolean);
  const caption = guruPromoCaption({ name, location, services, url });
  const photo = text(profile?.profile_photo_url) || text(profile?.photo_url) || text(profile?.avatar_url) || text(profile?.image_url);
  const qrHref = `/api/guru/profile-qr?slug=${encodeURIComponent(slug)}`;

  return (
    <main className="min-h-screen bg-[#F7FFFB] px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/guru/dashboard" className="text-sm font-bold text-[#0D5C3A]">← Guru dashboard</Link>
        <h1 className="text-3xl font-black">Promote your care</h1>
        <p className="text-sm font-semibold text-slate-600">Your flyer uses your real profile. SitGuru does not post it for you.</p>
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#0D5C3A]">Need loving pet care in your neighborhood?</p>
          <h2 className="mt-2 text-2xl font-black">Meet {name.split(" ")[0]}</h2>
          {location ? <p className="text-sm font-semibold text-slate-500">{location}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-28 w-28 rounded-full bg-white object-cover object-center ring-1 ring-emerald-100" />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrHref} alt="QR code to this Guru profile" className="h-40 w-40 rounded-2xl bg-white" />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-700">Scan to book me</p>
          <p className="text-xs font-semibold text-slate-500">The QR opens {url}. The photo sits beside the code so the code stays easy to scan.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {services.slice(0, 6).map((service) => (
              <li key={service} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#0D5C3A]">{service}</li>
            ))}
          </ul>
        </section>
        <GuruPromoteActions url={url} caption={caption} qrHref={qrHref} />
        <AskScoutButton label="Ask Scout for a caption" />
      </div>
    </main>
  );
}
