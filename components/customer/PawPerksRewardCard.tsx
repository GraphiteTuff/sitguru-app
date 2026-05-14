"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Camera,
  Clipboard,
  GraduationCap,
  Link2,
  Mail,
  MessageCircle,
  PawPrint,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import type { PawPerksAudience } from "@/components/customer/PawPerksRewardStates";

type PawPerksRewardCardProps = {
  selectedAudience: PawPerksAudience;
  referralCode?: string;
};

const PETPERKS_TERMS_HREF = "/petperks";

const audienceContent = {
  "pet-parent": {
    badge: "Pet Parent PetPerk",
    title: "Give $10. Get $10.",
    subtitle:
      "Your friend or family member gets $10 toward eligible SitGuru care, and you earn $10 after they complete their first eligible paid booking with a Guru.",
    urlType: "customer",
    icon: PawPrint,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    panelClass: "border-emerald-100 bg-emerald-50/70",
  },
  "future-guru": {
    badge: "Future Guru PetPerk",
    title: "Refer a Guru. Earn $20.",
    subtitle:
      "Invite a trusted sitter, walker, trainer, or pet-care pro. You earn $20 after they are approved and complete their first eligible paid booking.",
    urlType: "guru",
    icon: GraduationCap,
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    panelClass: "border-sky-100 bg-sky-50/70",
  },
};

const shareButtons = [
  {
    label: "Facebook",
    icon: "f",
  },
  {
    label: "WhatsApp",
    icon: "💬",
  },
  {
    label: "Email",
    icon: "email",
  },
  {
    label: "Text",
    icon: "text",
  },
  {
    label: "X",
    icon: "𝕏",
  },
  {
    label: "LinkedIn",
    icon: "in",
  },
];

function buildSignupHref({
  referralCode,
  type,
}: {
  referralCode: string;
  type: "customer" | "guru" | "both";
}) {
  const params = new URLSearchParams();

  params.set("ref", referralCode || "COMMUNITY");
  params.set("type", type);
  params.set("source", "petperks");
  params.set("utm_source", "petperks");
  params.set("utm_medium", "homepage");
  params.set("utm_campaign", "sitguru_petperks");

  return `/signup?${params.toString()}`;
}

export default function PawPerksRewardCard({
  selectedAudience,
  referralCode = "COMMUNITY",
}: PawPerksRewardCardProps) {
  const selected = audienceContent[selectedAudience];
  const SelectedIcon = selected.icon;

  const referralUrl = `https://sitguru.com/signup?ref=${encodeURIComponent(
    referralCode,
  )}&type=${selected.urlType}&source=direct&utm_medium=social&utm_campaign=sitguru_petperks`;

  const petParentSignupHref = buildSignupHref({
    referralCode,
    type: "customer",
  });

  const guruSignupHref = buildSignupHref({
    referralCode,
    type: "guru",
  });

  const bothSignupHref = buildSignupHref({
    referralCode,
    type: "both",
  });

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch (error) {
      console.error("Unable to copy PetPerks link:", error);
    }
  }

  async function shareReferralInvite() {
    const shareText =
      selectedAudience === "pet-parent"
        ? "Join SitGuru with my PetPerks link. Your friend or family member gets $10 toward eligible SitGuru care, and I earn $10 after their first eligible paid booking with a Guru."
        : "Know someone who would make a great SitGuru Guru? Refer them to join the pack. You earn $20 after they are approved and complete their first eligible paid booking.";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join SitGuru",
          text: shareText,
          url: referralUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
    } catch (error) {
      console.error("Unable to share PetPerks invite:", error);
    }
  }

  async function copyCaption(platform: "instagram" | "tiktok") {
    const caption =
      selectedAudience === "pet-parent"
        ? `I’m sharing SitGuru with Pet Parents who need trusted pet care. Your friend or family member gets $10 toward eligible SitGuru care, and you earn $10 after they complete their first eligible paid booking with a Guru. Join here: ${referralUrl}`
        : `Know someone who would make a great SitGuru Guru? Refer a trusted sitter, walker, trainer, or pet-care pro. You earn $20 after they are approved and complete their first eligible paid booking. ${referralUrl}`;

    try {
      await navigator.clipboard.writeText(caption);
    } catch (error) {
      console.error(`Unable to copy ${platform} caption:`, error);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StepCard
          number="1"
          title="Choose"
          description="Pick how to join."
          icon={<Users className="h-7 w-7" aria-hidden="true" />}
        />

        <StepCard
          number="2"
          title="Sign up"
          description="Create your free account."
          icon={<PawPrint className="h-7 w-7" aria-hidden="true" />}
        />

        <StepCard
          number="3"
          title="Share"
          description="Refer and earn later."
          icon={<Send className="h-7 w-7" aria-hidden="true" />}
        />
      </div>

      <div
        className={[
          "mb-7 rounded-[1.75rem] border p-5 sm:flex sm:items-center sm:justify-between sm:gap-6",
          selected.panelClass,
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white text-emerald-700 shadow-sm">
            <SelectedIcon className="h-9 w-9" aria-hidden="true" />
          </div>

          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Selected Invite
            </p>

            <h2 className="text-3xl font-black leading-tight text-slate-950">
              {selected.title}
            </h2>

            <p className="mt-1 text-base leading-7 text-slate-600">
              {selected.subtitle}
            </p>
          </div>
        </div>

        <div
          className={[
            "mt-5 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black sm:mt-0",
            selected.badgeClass,
          ].join(" ")}
        >
          <PawPrint className="h-4 w-4" aria-hidden="true" />
          {selected.badge}
        </div>
      </div>

      <div className="mb-7 rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
          Join SitGuru with PetPerks
        </p>

        <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
          Choose how you want to join the pack.
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign up as a Pet Parent, a future Guru, or both. PetPerks rewards are
          earned only after eligible first paid booking activity is completed.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Link
            href={petParentSignupHref}
            className="inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            Join as Pet Parent
          </Link>

          <Link
            href={guruSignupHref}
            className="inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-sky-600/20 transition hover:-translate-y-0.5 hover:bg-sky-700"
          >
            Join as Future Guru
          </Link>

          <Link
            href={bothSignupHref}
            className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
          >
            Join as Both
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <label
          htmlFor="pawperks-referral-link"
          className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-slate-500"
        >
          Your PetPerks link
        </label>

        <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <input
            id="pawperks-referral-link"
            readOnly
            value={referralUrl}
            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm font-semibold text-slate-600 outline-none"
          />

          <button
            type="button"
            onClick={copyReferralLink}
            className="flex w-14 items-center justify-center border-l border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            aria-label="Copy referral link"
          >
            <Clipboard className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={copyReferralLink}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <Link2 className="h-5 w-5" aria-hidden="true" />
          Copy PetPerks link
        </button>

        <button
          type="button"
          onClick={shareReferralInvite}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          Share PetPerks invite
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {shareButtons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={shareReferralInvite}
            className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
          >
            <ShareButtonIcon icon={button.icon} />
            {button.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => copyCaption("instagram")}
          className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-600 transition hover:bg-white"
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
          Copy Instagram caption
        </button>

        <button
          type="button"
          onClick={() => copyCaption("tiktok")}
          className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-black text-slate-600 transition hover:bg-white"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Copy TikTok caption
        </button>
      </div>

      <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
          aria-hidden="true"
        />
        <p>
          PetPerks rewards apply after the referred friend or family member
          signs up with your PetPerks link and completes the required eligible
          first paid booking activity.{" "}
          <Link
            href={PETPERKS_TERMS_HREF}
            className="font-bold text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline"
          >
            Terms may apply.
          </Link>
        </p>
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-base font-black text-emerald-700">
          {number}
        </div>

        <div className="text-slate-900">{icon}</div>
      </div>

      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function ShareButtonIcon({ icon }: { icon: string }) {
  if (icon === "email") {
    return <Mail className="h-5 w-5" aria-hidden="true" />;
  }

  if (icon === "text") {
    return <MessageCircle className="h-5 w-5" aria-hidden="true" />;
  }

  return (
    <span className="flex h-5 w-5 items-center justify-center text-base font-black leading-none">
      {icon}
    </span>
  );
}