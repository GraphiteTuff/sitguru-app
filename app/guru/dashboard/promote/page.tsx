import GuruProfileShare from "@/components/guru/GuruProfileShare";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadGuruProfileForUser } from "@/lib/gurus/load-guru-profile-for-user";
import { guruPromoCaption, guruPublicUrl } from "@/lib/guru/promote";
import GuruPromoteActions from "@/components/guru/GuruPromoteActions";
import AskScoutButton from "@/components/guru/AskScoutButton";
import GuruPageHero from "@/components/guru/GuruPageHero";

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
      <main className="min-h-[70svh] bg-[#F7FFFB] px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-4xl space-y-5">
          <GuruPageHero
            eyebrow="GROW YOUR CARE BUSINESS"
            title="Promote Your Guru Profile"
            description="Your public Guru profile link isn't ready yet. Finish your profile so nearby Pet Parents can discover your services."
            action={{ href: "/guru/dashboard/profile", label: "Finish My Profile" }}
          />
        </div>
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
      <div className="mx-auto max-w-4xl space-y-5">
        <GuruPageHero
          eyebrow="GROW YOUR CARE BUSINESS"
          title="Promote Your Guru Profile"
          description="Share your real Guru profile and QR code with local Pet Parents. SitGuru doesn’t post it for you."
          action={{ href: "/guru/dashboard/profile", label: "Edit My Profile" }}
        />
        <GuruProfileShare
          name={name}
          location={location}
          photo={photo}
          services={[...new Set(services)]}
          url={url}
          qrHref={qrHref}
          perksHref="/guru/dashboard/petperks"
        />
        <GuruPromoteActions url={url} caption={caption} qrHref={qrHref} />
        <AskScoutButton label="Ask Scout for a caption" />
      </div>
    </main>
  );
}
