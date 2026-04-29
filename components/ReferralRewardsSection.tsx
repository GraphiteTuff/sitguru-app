"use client";

import { useMemo, useState } from "react";

type ReferralType = "customer" | "guru";

type SharePlatform = "facebook" | "x" | "linkedin" | "whatsapp" | "email" | "sms";

type ReferralRewardsSectionProps = {
  source: string;
  onShare?: (platform: string, referralType: ReferralType) => void;
};

const SITGURU_SITE_ORIGIN = "https://sitguru.com";
const DEFAULT_REF_CODE = "COMMUNITY";

function getSiteOrigin() {
  return SITGURU_SITE_ORIGIN;
}

function buildTrackedReferralUrl(
  type: ReferralType,
  source: string,
  refCode = DEFAULT_REF_CODE
) {
  const basePath = type === "customer" ? "/signup" : "/become-a-guru";
  const url = new URL(basePath, getSiteOrigin());

  url.searchParams.set("ref", refCode);
  url.searchParams.set("type", type);
  url.searchParams.set("source", source);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "sitguru_petperks");

  return url.toString();
}

function buildShareCopy(referralUrl: string, type: ReferralType) {
  if (type === "guru") {
    return `I found SitGuru — a new trusted pet care community for pet parents and local caregivers. If you'd make a great pet care Guru, join here: ${referralUrl}`;
  }

  return `I found SitGuru — a new trusted pet care community for pet parents. Get connected with trusted local Gurus for walking, sitting, boarding, drop-ins, and more: ${referralUrl}`;
}

function buildShareHref(
  platform: SharePlatform,
  referralUrl: string,
  type: ReferralType
) {
  const text = buildShareCopy(referralUrl, type);
  const encodedUrl = encodeURIComponent(referralUrl);
  const encodedText = encodeURIComponent(text);
  const subject = encodeURIComponent("Join me on SitGuru");

  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}`;
    case "email":
      return `mailto:?subject=${subject}&body=${encodedText}`;
    case "sms":
      return `sms:?&body=${encodedText}`;
    default:
      return referralUrl;
  }
}

async function trackReferralEvent({
  platform,
  referralType,
  source,
  referralUrl,
  eventAction,
}: {
  platform: string;
  referralType: ReferralType;
  source: string;
  referralUrl: string;
  eventAction: "copy_link" | "native_share" | "share_click" | "copy_caption";
}) {
  try {
    await fetch("/api/referrals/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        eventAction,
        platform,
        referralType,
        source,
        referralUrl,
        refCode: DEFAULT_REF_CODE,
        campaign: "sitguru_petperks",
        location: "petperks_section",
      }),
    });
  } catch {
    // Tracking should never block the customer sharing experience.
  }
}

export default function ReferralRewardsSection({
  source,
  onShare,
}: ReferralRewardsSectionProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const [shareAudience, setShareAudience] = useState<ReferralType>("customer");

  const safeSource = source || "homepage";

  const customerLink = useMemo(
    () => buildTrackedReferralUrl("customer", safeSource),
    [safeSource]
  );

  const guruLink = useMemo(
    () => buildTrackedReferralUrl("guru", safeSource),
    [safeSource]
  );

  const selectedLink = shareAudience === "customer" ? customerLink : guruLink;

  const audienceMeta =
    shareAudience === "customer"
      ? {
          shortLabel: "pet parents",
          title: "Give $20. Get $20.",
          reward: "Pet parent PetPerk",
          buttonLabel: "Copy PetPerks link",
          shareLabel: "Share PetPerks invite",
          selectedClass: "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-100",
        }
      : {
          shortLabel: "future Gurus",
          title: "Refer a Guru. Earn $50.",
          reward: "Guru PetPerk",
          buttonLabel: "Copy Guru PetPerks link",
          shareLabel: "Share Guru PetPerks invite",
          selectedClass: "border-sky-500 bg-sky-50 ring-4 ring-sky-100",
        };

  const shareButtons: { label: string; platform: SharePlatform }[] = [
    { label: "Facebook", platform: "facebook" },
    { label: "WhatsApp", platform: "whatsapp" },
    { label: "Email", platform: "email" },
    { label: "Text", platform: "sms" },
    { label: "X", platform: "x" },
    { label: "LinkedIn", platform: "linkedin" },
  ];

  async function copyText(
    text: string,
    platform: string,
    referralType: ReferralType,
    eventAction: "copy_link" | "copy_caption"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${platform} copied. Ready to share.`);
      onShare?.(platform, referralType);

      await trackReferralEvent({
        platform,
        referralType,
        source: safeSource,
        referralUrl: referralType === "customer" ? customerLink : guruLink,
        eventAction,
      });
    } catch {
      setCopyMessage(
        "Copy was blocked by the browser. You can still use the share buttons."
      );
    }
  }

  async function copyReferralLink(referralType: ReferralType) {
    const link = referralType === "customer" ? customerLink : guruLink;
    await copyText(link, audienceMeta.buttonLabel, referralType, "copy_link");
  }

  async function trackShare(platform: string, referralType: ReferralType) {
    onShare?.(platform, referralType);

    await trackReferralEvent({
      platform,
      referralType,
      source: safeSource,
      referralUrl: referralType === "customer" ? customerLink : guruLink,
      eventAction: "share_click",
    });
  }

  async function nativeShare(referralType: ReferralType) {
    const link = referralType === "customer" ? customerLink : guruLink;
    const text = buildShareCopy(link, referralType);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join me on SitGuru",
          text,
          url: link,
        });

        onShare?.("Native share", referralType);

        await trackReferralEvent({
          platform: "Native share",
          referralType,
          source: safeSource,
          referralUrl: link,
          eventAction: "native_share",
        });

        return;
      } catch {
        return;
      }
    }

    await copyText(text, "Share message", referralType, "copy_caption");
  }

  async function copyCaption(
    referralType: ReferralType,
    platform: "Instagram" | "TikTok"
  ) {
    const link = referralType === "customer" ? customerLink : guruLink;
    const hashtags =
      referralType === "customer"
        ? "#SitGuru #PetCare #TrustedPetCare #PetPerks"
        : "#SitGuru #PetSitter #DogWalker #PetCare #PetPerks";

    await copyText(
      `${buildShareCopy(link, referralType)} ${hashtags}`,
      `${platform} caption`,
      referralType,
      "copy_caption"
    );
  }

  return (
    <section className="relative mt-12 overflow-hidden rounded-[34px] border border-emerald-200 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_30%)]" />

      <div className="relative p-5 sm:p-7 lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
          <div>
            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              SitGuru PetPerks
            </div>

            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
              Share SitGuru. Earn PetPerks.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Invite pet parents or future Gurus and earn rewards when qualified activity is completed.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShareAudience("customer")}
                className={`rounded-[26px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  shareAudience === "customer"
                    ? audienceMeta.selectedClass
                    : "border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      Pet parents
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-slate-950">
                      Give $20. Get $20.
                    </h3>
                  </div>
                  <span className="rounded-2xl bg-emerald-100 px-3 py-2 text-lg">
                    🐾
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Invite friends or family who need trusted pet care.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setShareAudience("guru")}
                className={`rounded-[26px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  shareAudience === "guru"
                    ? audienceMeta.selectedClass
                    : "border-slate-200 hover:border-sky-200 hover:bg-sky-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
                      Future Gurus
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-slate-950">
                      Refer a Guru. Earn $50.
                    </h3>
                  </div>
                  <span className="rounded-2xl bg-sky-100 px-3 py-2 text-lg">
                    ⭐
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Invite sitters, walkers, trainers, and pet care pros.
                </p>
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                PetPerks terms
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Rewards apply after qualified sign-up and eligible completed activity. Terms may apply.
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-slate-50/90 p-4 shadow-inner sm:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Choose",
                  description: "Pick pet parents or future Gurus.",
                },
                {
                  step: "02",
                  title: "Share",
                  description: "Copy your link or post it socially.",
                },
                {
                  step: "03",
                  title: "Earn",
                  description: "PetPerks are tracked after qualified activity.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Selected invite
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    {audienceMeta.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sharing now with {audienceMeta.shortLabel}. Change the card selection anytime.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                  {audienceMeta.reward}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => copyReferralLink(shareAudience)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                >
                  {audienceMeta.buttonLabel}
                </button>

                <button
                  type="button"
                  onClick={() => nativeShare(shareAudience)}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {audienceMeta.shareLabel}
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-5 text-slate-600 break-all">
                {selectedLink}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {shareButtons.map((button) => (
                  <a
                    key={`${button.platform}-${shareAudience}`}
                    href={buildShareHref(button.platform, selectedLink, shareAudience)}
                    target={button.platform === "email" || button.platform === "sms" ? undefined : "_blank"}
                    rel={button.platform === "email" || button.platform === "sms" ? undefined : "noreferrer"}
                    onClick={() => trackShare(button.label, shareAudience)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {button.label}
                  </a>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => copyCaption(shareAudience, "Instagram")}
                  className="rounded-xl border border-pink-200 bg-pink-50 px-3 py-2.5 text-sm font-bold text-pink-700 transition hover:bg-pink-100"
                >
                  Copy Instagram caption
                </button>

                <button
                  type="button"
                  onClick={() => copyCaption(shareAudience, "TikTok")}
                  className="rounded-xl border border-slate-300 bg-slate-950 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Copy TikTok caption
                </button>
              </div>

              {copyMessage ? (
                <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  {copyMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}