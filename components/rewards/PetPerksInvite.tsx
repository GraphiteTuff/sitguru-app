"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Mail, QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { fetchCustomerProfile, fetchReferralStats, type ReferralStats } from "@/lib/rewards/member-referral";
import { bumpSharedLinkCounter } from "@/lib/rewards/perks-broker";
import SitGuruPortalLoading from "@/components/sitguru/SitGuruPortalLoading";

const primary = "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-3 font-black !text-white";
const secondary = "flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0D5C3A] bg-white px-3 font-black text-[#0D5C3A]";

export default function PetPerksInvite({ portal }: { portal: "Guru" | "Pet Parent" }) {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [name, setName] = useState("");
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        router.replace(portal === "Guru" ? "/guru/login" : "/login");
        return;
      }
      const profile = await fetchCustomerProfile(user.id, user.email ?? null);
      const rewards = await fetchReferralStats(user.id, profile);
      if (!active) return;
      setName(profile.first_name || profile.full_name?.split(" ")[0] || "");
      setStats(rewards);
      const image = await QRCode.toDataURL(rewards.referral_link, { width: 512, margin: 4 });
      if (active) setQr(image);
    }
    load().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [router, portal]);

  if (!stats) return error
    ? <p className="p-5">Couldn’t load your invite. <button className="underline" onClick={() => window.location.reload()}>Try again</button></p>
    : <SitGuruPortalLoading portal={portal} message="Loading your PetPerks invite…" />;

  const invite = stats;
  const inviteText = "Here’s my SitGuru invite for $10 toward eligible pet care.";
  async function copy() {
    try {
      await navigator.clipboard.writeText(invite.referral_link);
      bumpSharedLinkCounter(invite.referral_code);
      setMessage("Invite link copied.");
    } catch {
      setMessage(invite.referral_link);
    }
  }
  async function share() {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title: "SitGuru PetPerks", text: inviteText, url: invite.referral_link });
      bumpSharedLinkCounter(invite.referral_code);
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) await copy();
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 bg-white p-4 text-slate-950 sm:my-6 sm:rounded-3xl sm:p-6">
      {showQr ? (
        <>
          <button autoFocus onClick={() => setShowQr(false)} className="flex min-h-12 items-center gap-2 font-bold text-emerald-800"><ChevronLeft aria-hidden /> PetPerks</button>
          <h1 className="text-center text-3xl font-black">Scan for $10 toward pet care</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} width={512} height={512} alt="Scan this personal SitGuru referral code" className="mx-auto w-full max-w-80" />
          <h2 className="text-center text-xl font-black">{name ? name + "’s SitGuru invite" : "My SitGuru invite"}</h2>
          <p className="text-center">Scan with your phone camera to open the invite.</p>
          <button onClick={share} className={secondary}><Share2 aria-hidden /> Share link instead</button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-black">PetPerks</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/petperks/petperks-hero-sharing.jpg" alt="" className="aspect-[2/1] w-full rounded-2xl object-cover" />
          <h2 className="text-3xl font-black tracking-tight">Give a friend $10 toward pet care</h2>
          <p>Earn $10 in care credit after their first eligible paid booking is completed.</p>
          <button onClick={share} className={primary}><Share2 aria-hidden /> Share invite</button>
          <button disabled={!qr} onClick={() => { setMessage(""); setShowQr(true); }} className={secondary}><QrCode aria-hidden /> Show my QR code</button>
          {error && <p role="status">Couldn’t load the QR code. You can still share your invite link.</p>}
          <div className="grid grid-cols-2 gap-2 text-emerald-800">
            <a className="flex min-h-12 items-center justify-center gap-2 font-bold" href={"mailto:?subject=Your%20SitGuru%20invite&body=" + encodeURIComponent(inviteText + "\n\n" + invite.referral_link)}><Mail aria-hidden /> Email invite</a>
            <button onClick={copy} className="flex min-h-12 items-center justify-center gap-2 font-bold"><Copy aria-hidden /> Copy link</button>
          </div>
          <Link href="/customer/dashboard/pawperks" className="flex items-center justify-between rounded-2xl border p-4 font-bold">
            <span>My rewards<br /><span className="text-emerald-800">{invite.available_credit.toLocaleString("en-US", { style: "currency", currency: "USD" })} available</span></span><ChevronRight aria-hidden />
          </Link>
        </>
      )}
      <p role="status" className="break-all text-sm">{message}</p>
    </section>
  );
}
