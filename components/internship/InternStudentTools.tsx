"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import {
  SITGURU_OFFICIAL_HANDLE,
  SITGURU_OFFICIAL_SOCIAL_LINKS,
} from "@/lib/chat/sitguru-social";
import { saveInternCampaign, saveInternContent } from "@/lib/internship/actions";
import { ATTRIBUTION_RULE } from "@/lib/internship/constants";
import {
  INTERN_HOME_TOOLS,
  INTERN_SOCIAL_PLATFORMS,
  internContentByPlatform,
  internMarketSnapshot,
  type InternHomeToolId,
  type InternPromoteEvent,
} from "@/lib/internship/intern-tools";
import type { InternshipWorkspaceData } from "@/lib/internship/types";
import {
  internGhostBtnClass,
  internPressClass,
  internPrimaryBtnClass,
  SITGURU_BRAND_GREEN,
  SITGURU_BRAND_GREEN_DARK,
  SITGURU_BRAND_GREEN_LIGHT,
} from "@/lib/internship/intern-ui";
import InternWorkAttachments from "@/components/internship/InternWorkAttachments";

function Field({
  name,
  label,
  placeholder,
  required,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
      />
    </label>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className={`${internGhostBtnClass} min-h-11 shrink-0 px-3 text-xs`}
    >
      <Copy size={14} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ToolShell({
  title,
  blurb,
  tool,
  onBack,
  children,
}: {
  title: string;
  blurb: string;
  tool: InternHomeToolId;
  onBack: () => void;
  children: ReactNode;
}) {
  const theme = INTERN_HOME_TOOLS.find((item) => item.id === tool);
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className={`inline-flex min-h-11 items-center gap-2 text-sm font-black text-emerald-800 hover:text-emerald-950 ${internPressClass} shadow-none hover:shadow-none`}
      >
        <ArrowLeft size={16} />
        Home
      </button>
      <div className={`overflow-hidden rounded-[1.6rem] border ${theme?.tile || "border-emerald-100 bg-white"}`}>
        <span className={`block h-2.5 w-full ${theme?.bar || "bg-emerald-700"}`} />
        <div className="px-4 py-4">
          <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${theme?.ink || "text-emerald-800"}`}>
            Intern tool
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">{blurb}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function InternStudentTools({
  data,
  events,
  tool,
  onBack,
  preview = false,
}: {
  data: InternshipWorkspaceData;
  events: InternPromoteEvent[];
  tool: InternHomeToolId;
  onBack: () => void;
  preview?: boolean;
}) {
  const snapshot = internMarketSnapshot(data);
  const platforms = internContentByPlatform(data.content);

  if (tool === "brand") {
    return (
      <ToolShell
        title="Brand kit"
        blurb="Use SitGuru’s logo, green, and @SitGuruOfficial. Upload your Canva or CapCut files here for SitGuru to review. Don’t use school logos unless the school says yes."
        tool={tool}
        onBack={onBack}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div
            className="public-dark-section flex min-h-32 items-center justify-center rounded-[1.4rem] p-5"
            data-brand-green
            style={{ background: SITGURU_BRAND_GREEN }}
          >
            <Image
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              width={180}
              height={48}
              className="h-12 w-auto mix-blend-multiply"
            />
          </div>
          <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              SitGuru Green
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">{SITGURU_BRAND_GREEN}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">RGB 22, 101, 52</p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-11 w-11 rounded-xl border border-emerald-100"
                style={{ background: SITGURU_BRAND_GREEN }}
              />
              <CopyButton value={SITGURU_BRAND_GREEN} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-emerald-100 p-3">
                <span
                  className="block h-8 w-full rounded-lg"
                  style={{ background: SITGURU_BRAND_GREEN_DARK }}
                />
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Dark green
                </p>
                <p className="text-xs font-black text-slate-950">{SITGURU_BRAND_GREEN_DARK}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 p-3">
                <span
                  className="block h-8 w-full rounded-lg border border-emerald-100"
                  style={{ background: SITGURU_BRAND_GREEN_LIGHT }}
                />
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Light green
                </p>
                <p className="text-xs font-black text-slate-950">{SITGURU_BRAND_GREEN_LIGHT}</p>
              </div>
            </div>
          </div>
        </div>
        <article className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
            Handle
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">{SITGURU_OFFICIAL_HANDLE}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Instagram, Facebook, TikTok, X, and YouTube. Rogue is the mascot. Bookings
            stay on SitGuru.
          </p>
        </article>
        <ul className="space-y-2 text-sm font-semibold text-slate-600">
          <li>White type on SitGuru Green. Never dark text on {SITGURU_BRAND_GREEN}.</li>
          <li>Don’t say a university endorses SitGuru.</li>
          <li>Tag {SITGURU_OFFICIAL_HANDLE} when you post about SitGuru.</li>
        </ul>
        <InternWorkAttachments
          internId={data.intern.id}
          itemType="brand"
          itemId={data.intern.id}
          attachments={data.attachments || []}
          preview={preview}
          label="Your brand files"
        />
      </ToolShell>
    );
  }

  if (tool === "tracking") {
    return (
      <ToolShell
        title="Tracking links"
        blurb="Copy your unique link before you post. SitGuru only counts growth from that link."
        tool={tool}
        onBack={onBack}
      >
        {data.campaigns.length ? (
          <ul className="space-y-2">
            {data.campaigns.map((campaign) => (
              <li
                key={campaign.id}
                className="rounded-[1.4rem] border border-emerald-100 bg-white p-4"
              >
                <p className="font-black text-slate-950">{campaign.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {campaign.utmSource && campaign.utmCampaign
                    ? `utm_source=${campaign.utmSource}&utm_campaign=${campaign.utmCampaign}`
                    : "Add tracking before counting results"}
                </p>
                {campaign.referralCode ? (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Code: {campaign.referralCode}
                  </p>
                ) : null}
                {campaign.trackingUrl ? (
                  <div className="mt-3 flex items-start gap-2">
                    <p className="min-w-0 break-all text-sm font-semibold text-emerald-800">
                      {campaign.trackingUrl}
                    </p>
                    <CopyButton value={campaign.trackingUrl} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            No tracking links yet. Create one before you post.
          </p>
        )}
        {preview ? (
          <p className="rounded-[1.4rem] border border-dashed border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Preview is view-only. Interns create tracking links here.
          </p>
        ) : (
          <form
            action={saveInternCampaign}
            className="space-y-3 rounded-[1.4rem] border border-emerald-100 bg-white p-4"
          >
            <h3 className="font-black text-slate-950">New tracking link</h3>
            <input type="hidden" name="internId" value={data.intern.id} />
            <input type="hidden" name="mode" value="intern" />
            <Field name="name" label="Campaign name" required />
            <Field name="utmSource" label="utm_source" placeholder="instagram" />
            <Field name="utmCampaign" label="utm_campaign" placeholder="spring27_growth" />
            <Field name="referralCode" label="Referral code" />
            <Field name="objective" label="Business objective" />
            <p className="text-xs font-semibold leading-5 text-slate-500">{ATTRIBUTION_RULE}</p>
            <button className={`${internPrimaryBtnClass} w-full`}>
              Save tracking link
            </button>
          </form>
        )}
      </ToolShell>
    );
  }

  if (tool === "snapshot") {
    return (
      <ToolShell
        title="Market snapshot"
        blurb="Your market totals. No names, emails, or payouts."
        tool={tool}
        onBack={onBack}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Market
            </p>
            <p className="mt-1 text-lg font-black text-slate-950">{snapshot.marketLabel}</p>
          </div>
          <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Numbers SitGuru checked
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">{snapshot.verifiedCount}</p>
            <p className="text-xs font-semibold text-slate-500">
              {snapshot.pendingCount} waiting on SitGuru
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Campaigns
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">{snapshot.campaignCount}</p>
          </div>
          <div className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Social posts
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">{snapshot.contentCount}</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-500">{snapshot.projectName}</p>
        {snapshot.verifiedMetrics.length ? (
          <ul className="space-y-2">
            {snapshot.verifiedMetrics.map((metric) => (
              <li
                key={metric.label}
                className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3"
              >
                <span className="text-sm font-black text-slate-950">{metric.label}</span>
                <span className="text-lg font-black text-emerald-900">
                  {metric.value ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            SitGuru-checked numbers show here after they confirm them.
          </p>
        )}
        {snapshot.goals.length ? (
          <div className="space-y-2">
            <h3 className="font-black text-slate-950">SMART targets</h3>
            {snapshot.goals.map((goal) => (
              <p key={goal.id} className="rounded-2xl border border-emerald-100 px-4 py-3 text-sm font-semibold text-slate-600">
                {goal.title}
                {goal.target ? ` · target ${goal.target}` : ""}
              </p>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {snapshot.publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${internGhostBtnClass}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </ToolShell>
    );
  }

  if (tool === "events") {
    return (
      <ToolShell
        title="Events to share"
        blurb="Public SitGuru pet events you can share. Always use a tracking link."
        tool={tool}
        onBack={onBack}
      >
        {events.length ? (
          <ul className="space-y-2">
            {events.map((event) => {
              const shareUrl = `https://sitguru.com${event.href}`;
              return (
                <li
                  key={event.id}
                  className="rounded-[1.4rem] border border-emerald-100 bg-white p-4"
                >
                  <p className="font-black text-slate-950">{event.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {event.when} · {event.place}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={event.href}
                      className={`${internPrimaryBtnClass} min-h-11 px-4 text-xs`}
                    >
                      Open event
                    </Link>
                    <CopyButton value={shareUrl} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
            No upcoming public events yet. Check the public events page.
          </p>
        )}
        <Link
          href="/events"
          className={`${internGhostBtnClass} min-h-12 px-4`}
        >
          Browse all public events
        </Link>
      </ToolShell>
    );
  }

  return (
    <ToolShell
      title="Social media"
      blurb="Draft posts here. Tag @SitGuruOfficial. SitGuru posts from official accounts unless they give you a channel."
      tool={tool}
      onBack={onBack}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SITGURU_OFFICIAL_SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={`${internGhostBtnClass} min-h-12 px-3`}
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="text-sm font-semibold text-slate-500">
        Handle: {SITGURU_OFFICIAL_HANDLE}. Tag it. Use brand green. Bookings stay on
        SitGuru. Never put customer names or emails in a caption.
      </p>
      {platforms.length ? (
        <div className="flex flex-wrap gap-2">
          {platforms.map((row) => (
            <span
              key={row.platform}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900"
            >
              {row.platform} · {row.count}
            </span>
          ))}
        </div>
      ) : null}
      {data.content.length ? (
        <ul className="space-y-2">
          {data.content.map((item) => (
            <li
              key={item.id}
              className="rounded-[1.4rem] border border-emerald-100 bg-white p-4"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                {item.platform || "Social"}
              </p>
              <p className="mt-1 font-black text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {item.status.replaceAll("_", " ")}
                {item.publishedUrl ? " · live" : item.draftUrl ? " · draft" : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[1.4rem] border border-dashed border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500">
          No social posts logged yet. Add a draft below.
        </p>
      )}
      {preview ? (
        <p className="rounded-[1.4rem] border border-dashed border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Preview is view-only. Interns log social drafts on this screen.
        </p>
      ) : (
        <form
          action={saveInternContent}
          className="space-y-3 rounded-[1.4rem] border border-emerald-100 bg-white p-4"
        >
          <h3 className="font-black text-slate-950">Log a social post</h3>
          <input type="hidden" name="internId" value={data.intern.id} />
          <input type="hidden" name="mode" value="intern" />
          <Field name="title" label="Title" required />
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Platform
            </span>
            <select
              name="platform"
              required
              className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-sm font-semibold text-slate-950"
              defaultValue="Instagram"
            >
              {INTERN_SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </label>
          <Field name="draftUrl" label="Draft link" />
          <Field name="publishedUrl" label="Published link" />
          <Field name="studentNotes" label="Caption / notes" />
          <button className={`${internPrimaryBtnClass} w-full`}>
            Save social post
          </button>
        </form>
      )}
    </ToolShell>
  );
}
