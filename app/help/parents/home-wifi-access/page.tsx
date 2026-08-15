import type { Metadata } from "next";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList, HelpNumberedSteps } from "@/components/help/HelpFaqList";
import {
  homeWifiAccessFaqs,
  homeWifiApproveSteps,
} from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Can’t Open SitGuru on Home Wi‑Fi?",
  description:
    "If SitGuru works on cellular but not on home Wi‑Fi, your provider’s security filter may be pausing access. Allow the site in your Wi‑Fi app and contact support@sitguru.com.",
};

export default function HomeWifiAccessPage() {
  return (
    <HelpArticleChrome
      eyebrow="Pet Parent Support"
      title="Can’t open SitGuru on home Wi‑Fi?"
      summary="Home internet security tools sometimes pause access to everyday websites for technical reasons — not because of content, subject matter, or ownership. Use the steps below, then email support@sitguru.com if you still need help."
      backHref="/help/parents"
      backLabel="Back to Pet Parent Support"
      jumps={[
        { href: "#quick-checks", label: "Quick checks" },
        { href: "#approve-site", label: "Allow the site" },
        { href: "#faqs", label: "FAQs" },
      ]}
    >
      <section id="quick-checks">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Quick checks
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
          <li>
            Try SitGuru on <strong>cellular data</strong> (turn Wi‑Fi off for a
            moment). If it opens there, the pause is on your home network
            filter.
          </li>
          <li>
            Try a different browser or an Incognito/Private window on the same
            Wi‑Fi.
          </li>
          <li>
            Note your internet provider name if you know it — that helps Support
            guide you faster.
          </li>
        </ul>
      </section>

      <section id="approve-site">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          How to allow a site your Wi‑Fi security paused
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Provider apps use different labels (Allow Access, Allow, Approved
          Sites, Safe Browsing). The idea is the same: open the security/threat
          list for your home network and allow the website so your devices can
          reach it again.
        </p>
        <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
          Sites are not flagged because of their content, subject matter, or
          ownership. Automated filters sometimes pause access for technical
          reasons (for example a newer domain or incomplete reputation data)
          even when the site is a normal business website.
        </p>
        <div className="mt-4">
          <HelpNumberedSteps steps={homeWifiApproveSteps} />
        </div>
      </section>

      <section id="faqs">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Common questions
        </h2>
        <div className="mt-3">
          <HelpFaqList items={homeWifiAccessFaqs} />
        </div>
      </section>

      <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-950">
        Still can’t get in? Email{" "}
        <a
          href="mailto:support@sitguru.com?subject=Home%20Wi-Fi%20access%20help"
          className="font-black text-emerald-800 underline"
        >
          support@sitguru.com
        </a>{" "}
        with a screenshot of any warning page, your internet provider (if
        known), and whether SitGuru works on cellular. We’re happy to help.
      </p>
    </HelpArticleChrome>
  );
}
