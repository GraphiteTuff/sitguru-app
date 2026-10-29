import Link from "next/link";
import type { ReactNode } from "react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { DESK_UI } from "@/lib/portal/desk-ui";
import {
  saveContent,
  saveGoals,
  saveGrowthCampaign,
  saveInitiative,
  saveOutreach,
  saveReview,
  saveSurvey,
  saveSurveyLearning,
} from "@/lib/manager-growth/actions";
import {
  GROWTH_JOURNEY,
  INITIATIVE_CATEGORIES,
  INITIATIVE_STATUSES,
  NOVEMBER_GOAL_DEFAULTS,
  PARTNER_KINDS,
  PARTNER_STATUSES,
  FORMAL_COMMITMENTS,
} from "@/lib/manager-growth/model";

const field = "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744]";
const button = "min-h-11 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white";

export function GrowthFrame({
  title,
  subtitle,
  notice,
  children,
}: {
  title: string;
  subtitle: string;
  notice?: string;
  children: ReactNode;
}) {
  return (
    <ManagerSectionScaffold title={title} subtitle={subtitle} overlay="Measure. Learn. Improve. Repeat.">
      <p className="text-sm font-semibold text-[#1D4ED8]">{GROWTH_JOURNEY.join(" → ")}</p>
      <p className="text-sm font-medium leading-6 text-slate-600">
        Leadership sets direction. You turn it into strategies, campaigns, partnerships, and experiments. Interns help only after an internship is active, through Assignments. Likes and views are activity. Registrations, referrals, and bookings are outcomes. A result below the goal still matters when it teaches the next step.
      </p>
      {notice ? <p className="rounded-2xl bg-[#EFF6FF] px-4 py-3 text-sm font-semibold text-[#1D4ED8]">{notice}</p> : null}
      {children}
    </ManagerSectionScaffold>
  );
}

export function WeeklyWorkPanel({
  week,
  initiatives,
  inProgress,
  completed,
  goals,
  review,
}: {
  week: string;
  initiatives: Record<string, unknown>[];
  inProgress: number;
  completed: number;
  goals: Record<string, string>;
  review: Record<string, unknown> | null;
}) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="This week" value={week} />
        <Stat label="In motion" value={String(inProgress)} />
        <Stat label="Learned from" value={String(completed)} />
      </section>
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Create initiative</h2>
        <p className="mt-1 text-sm text-slate-600">Ordinary ideas do not need CEO approval. Ask: objective, audience, idea, channel, call to action, and how you will know.</p>
        <form action={saveInitiative} className="mt-3 grid gap-2">
          <input name="title" required placeholder="Initiative title" className={field} />
          <input name="objective" placeholder="Objective" className={field} />
          <input name="audience" placeholder="Who are we trying to reach?" className={field} />
          <input name="idea" placeholder="What are we proposing?" className={field} />
          <input name="channel" placeholder="Where will it happen?" className={field} />
          <input name="callToAction" placeholder="What should someone do?" className={field} />
          <input name="measurement" placeholder="How will we know it worked?" className={field} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select name="category" className={field}>{INITIATIVE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
            <select name="status" className={field}>{INITIATIVE_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
            <input type="date" name="startOn" className={field} />
            <input type="date" name="dueOn" className={field} />
          </div>
          <textarea name="notes" rows={2} placeholder="Notes" className={field} />
          <button className={button}>Create initiative</button>
        </form>
      </article>
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Your initiatives</h2>
        <ul className="mt-3 space-y-2">
          {initiatives.map((item) => (
            <li key={String(item.id)} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
              <p className="font-black text-[#0F2744]">{String(item.title)}</p>
              <p className="text-sm text-slate-600">{String(item.status)} · {String(item.category)}</p>
              <p className="text-sm text-slate-500">{String(item.objective || item.idea || "No objective yet")}</p>
            </li>
          ))}
          {!initiatives.length ? <li className="text-sm text-slate-500">No initiatives yet. November is for experiments, not a filled history.</li> : null}
        </ul>
        <Link href="/manager/assignments?create=true" className="mt-3 inline-flex text-sm font-bold text-[#2563EB]">Turn approved work into an intern assignment →</Link>
      </article>
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Weekly goals</h2>
        <p className="mt-1 text-sm text-slate-600">These November guides are editable. They are not a surveillance schedule. Expected pace is about 10–15 hours, organized your way.</p>
        <form action={saveGoals} className="mt-3 grid gap-2">
          <input name="conversations" defaultValue={goals.conversations || NOVEMBER_GOAL_DEFAULTS.conversations} className={field} />
          <input name="prospects" defaultValue={goals.prospects || NOVEMBER_GOAL_DEFAULTS.prospects} className={field} />
          <input name="content" defaultValue={goals.content || NOVEMBER_GOAL_DEFAULTS.content} className={field} />
          <input name="poll" defaultValue={goals.poll || NOVEMBER_GOAL_DEFAULTS.poll} className={field} />
          <input name="experiment" defaultValue={goals.experiment || NOVEMBER_GOAL_DEFAULTS.experiment} className={field} />
          <button className={button}>Save goals</button>
        </form>
      </article>
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">What happened this week</h2>
        <form action={saveReview} className="mt-3 grid gap-2">
          <textarea name="happened" required rows={2} defaultValue={String(review?.happened || "")} placeholder="What happened?" className={field} />
          <textarea name="why" rows={2} defaultValue={String(review?.why || "")} placeholder="Why do we think it happened?" className={field} />
          <textarea name="learning" rows={2} defaultValue={String(review?.learning || "")} placeholder="What did we learn?" className={field} />
          <textarea name="nextStep" rows={2} defaultValue={String(review?.next_step || "")} placeholder="What should we do next?" className={field} />
          <input name="hoursNote" defaultValue={String(review?.hours_note || "")} placeholder="Optional note on how you used your 10–15 hours" className={field} />
          <textarea name="ceoNote" rows={2} defaultValue={String(review?.ceo_note || "")} placeholder="What should leadership consider?" className={field} />
          <button className={button}>Save weekly learning</button>
        </form>
      </article>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-[#EFF6FF] p-4">
      <p className="text-2xl font-black text-[#0F2744]">{value}</p>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
    </article>
  );
}

export function CampaignPanel({
  campaigns,
  content,
}: {
  campaigns: Record<string, unknown>[];
  content: Record<string, unknown>[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">New organic campaign</h2>
        <p className="mt-1 text-sm text-slate-600">Spending, contracts, and public commitments still need leadership. Creating an organic campaign does not.</p>
        <form action={saveGrowthCampaign} className="mt-3 grid gap-2">
          <input name="name" required placeholder="Campaign name" className={field} />
          <input name="objective" placeholder="Objective" className={field} />
          <input name="audience" placeholder="Primary audience" className={field} />
          <select name="channel" className={field}>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="other">Other</option>
          </select>
          <input name="destination" placeholder="Destination URL" className={field} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="date" name="startOn" className={field} />
            <input type="date" name="endOn" className={field} />
          </div>
          <textarea name="notes" rows={2} placeholder="Notes" className={field} />
          <button className={button}>Save campaign</button>
        </form>
      </article>
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Content you will publish yourself</h2>
        <p className="mt-1 text-sm text-slate-600">Marking something published stores your link. SitGuru does not post it to the network.</p>
        <form action={saveContent} className="mt-3 grid gap-2">
          <input name="title" required placeholder="Content title" className={field} />
          <textarea name="caption" rows={2} placeholder="Caption" className={field} />
          <select name="channel" className={field}><option>Instagram</option><option>Facebook</option><option>TikTok</option><option>Other</option></select>
          <input type="date" name="plannedOn" className={field} />
          <select name="status" className={field}><option>Draft</option><option>Ready</option><option>Published</option></select>
          <input name="publishedUrl" placeholder="Published URL, after you post it" className={field} />
          <input name="activityNote" placeholder="Activity only: views, likes, clicks. Not a booking." className={field} />
          <textarea name="happened" rows={2} placeholder="What happened?" className={field} />
          <textarea name="learning" rows={2} placeholder="What did we learn?" className={field} />
          <textarea name="nextStep" rows={2} placeholder="What should we do next?" className={field} />
          <button className={button}>Save content</button>
        </form>
      </article>
      <article className={`${DESK_UI.card} p-4 xl:col-span-2`}>
        <h2 className="text-lg font-black text-[#0F2744]">Campaigns and planned content</h2>
        <ul className="mt-3 space-y-2">
          {campaigns.map((item) => (
            <li key={String(item.id)} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
              <p className="font-black text-[#0F2744]">{String(item.campaign_name)}</p>
              <p className="break-all text-sm text-[#2563EB]">{String(item.link || "")}</p>
            </li>
          ))}
          {content.map((item) => (
            <li key={String(item.id)} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
              <p className="font-black text-[#0F2744]">{String(item.title)}</p>
              <p className="text-sm text-slate-600">{String(item.channel)} · {String(item.status)} · {String(item.planned_on || "No date")}</p>
            </li>
          ))}
          {!campaigns.length && !content.length ? <li className="text-sm text-slate-500">No campaigns yet.</li> : null}
        </ul>
      </article>
    </div>
  );
}

export function OutreachPanel({
  list,
  followUps,
  supervisor,
}: {
  list: Record<string, unknown>[];
  followUps: Record<string, unknown>[];
  supervisor: boolean;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Add a relationship</h2>
        <p className="mt-1 text-sm text-slate-600">Build the relationship first. A contract, sponsorship, financial deal, legal agreement, or major partnership stays uncommitted until leadership approves it. You can coordinate activity after that approval.</p>
        <form action={saveOutreach} className="mt-3 grid gap-2">
          <input name="partnerName" required placeholder="Partner or prospect name" className={field} />
          <input name="contactName" placeholder="Contact person" className={field} />
          <select name="partnerKind" className={field}>{PARTNER_KINDS.map((item) => <option key={item}>{item}</option>)}</select>
          <textarea name="opportunity" rows={2} placeholder="Opportunity" className={field} />
          <textarea name="sitguruBenefit" rows={2} placeholder="What value can SitGuru provide?" className={field} />
          <textarea name="partnerBenefit" rows={2} placeholder="What value can they provide?" className={field} />
          <input name="whoBenefits" placeholder="Who benefits?" className={field} />
          <textarea name="activity" rows={2} placeholder="Proposed activity" className={field} />
          <select name="commitment" className={field}>
            <option>Conversation</option>
            <option>Cross-promotion</option>
            {FORMAL_COMMITMENTS.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select name="status" className={field}>{PARTNER_STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          <input type="date" name="followUpOn" className={field} />
          <input name="nextAction" placeholder="Next action" className={field} />
          <textarea name="lesson" rows={2} placeholder="Lesson, if this already happened" className={field} />
          {supervisor ? <label className="text-sm font-semibold text-[#0F2744]"><input type="checkbox" name="leadershipApproved" value="yes" /> Leadership approves this commitment</label> : null}
          <button className={button}>Save relationship</button>
        </form>
      </article>
      <div className="space-y-4">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Follow-ups</h2>
          <ul className="mt-3 space-y-2">
            {followUps.map((item) => (
              <li key={String(item.id)} className="text-sm font-semibold text-[#0F2744]">{String(item.partner_name)} · {String(item.follow_up_on)} · {String(item.next_action || "No next action")}</li>
            ))}
            {!followUps.length ? <li className="text-sm text-slate-500">No follow-ups due.</li> : null}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Relationships</h2>
          <ul className="mt-3 space-y-2">
            {list.map((item) => (
              <li key={String(item.id)} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <p className="font-black text-[#0F2744]">{String(item.partner_name)}</p>
                <p className="text-sm text-slate-600">{String(item.partner_kind)} · {String(item.status)} · {String(item.commitment)}</p>
                <p className="text-sm text-slate-500">{String(item.sitguru_benefit || "")} {String(item.partner_benefit || "")}</p>
              </li>
            ))}
            {!list.length ? <li className="text-sm text-slate-500">No relationships logged yet. These notes are yours. They are not a customer message blast.</li> : null}
          </ul>
        </article>
      </div>
    </div>
  );
}

export function SurveyPanel({
  surveys,
  responses,
}: {
  surveys: Record<string, unknown>[];
  responses: Record<string, unknown>[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Create a poll</h2>
        <p className="mt-1 text-sm text-slate-600">Nothing is published until you open it and share the link. SitGuru does not email or text the list.</p>
        <form action={saveSurvey} className="mt-3 grid gap-2">
          <input name="title" required placeholder="Title" className={field} />
          <textarea name="question" required rows={2} placeholder="Question" className={field} />
          <textarea name="choices" required rows={4} placeholder={"One answer per line"} className={field} />
          <select name="audience" className={field}><option>Public visitors</option><option>Existing Pet Parents</option><option>Gurus</option></select>
          <div className="grid gap-2 sm:grid-cols-2">
            <input type="date" name="startOn" className={field} />
            <input type="date" name="endOn" className={field} />
          </div>
          <select name="status" className={field}><option>Draft</option><option>Open</option><option>Closed</option></select>
          <button className={button}>Save poll</button>
        </form>
      </article>
      <article className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Polls and real answers</h2>
        <ul className="mt-3 space-y-3">
          {surveys.map((survey) => {
            const mine = responses.filter((row) => row.survey_id === survey.id);
            const counts = new Map<string, number>();
            for (const row of mine) counts.set(String(row.choice), (counts.get(String(row.choice)) || 0) + 1);
            return (
              <li key={String(survey.id)} className="rounded-2xl bg-[#F8FAFC] px-3 py-3">
                <p className="font-black text-[#0F2744]">{String(survey.title)}</p>
                <p className="text-sm text-slate-600">{String(survey.status)} · {mine.length} answers</p>
                <p className="break-all text-sm text-[#2563EB]">/s/{String(survey.code)}</p>
                <ul className="mt-1 text-sm text-slate-600">
                  {[...counts.entries()].map(([choice, count]) => <li key={choice}>{choice}: {count}</li>)}
                </ul>
                <form action={saveSurveyLearning} className="mt-2 grid gap-2">
                  <input type="hidden" name="id" value={String(survey.id)} />
                  <textarea name="learning" rows={2} defaultValue={String(survey.learning || "")} placeholder="What did we learn?" className={field} />
                  <input name="nextStep" defaultValue={String(survey.next_step || "")} placeholder="What should we do next?" className={field} />
                  <select name="status" defaultValue={String(survey.status || "Draft")} className={field}><option>Draft</option><option>Open</option><option>Closed</option></select>
                  <button className={button}>Save learning</button>
                </form>
              </li>
            );
          })}
          {!surveys.length ? <li className="text-sm text-slate-500">No polls yet.</li> : null}
        </ul>
      </article>
    </div>
  );
}

export function ConversionPanel({
  card,
}: {
  card: {
    label: string;
    visits: number | null;
    signups: number | null;
    registrations: number | null;
    gurus: number | null;
    bookingRequests: number;
    confirmedBookings: number;
    visitToRegistration: number | null;
    registrationToRequest: number | null;
    requestToConfirmed: number | null;
  };
}) {
  const show = (value: number | null) => (value == null ? "Not tracked" : String(value));
  const percent = (value: number | null) => (value == null ? "Not tracked" : `${value}%`);
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-slate-600">Activity such as views and likes stays on the content note. This page shows business outcomes only when SitGuru has a real record. A canceled booking is not counted as confirmed.</p>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tracked visits" value={show(card.visits)} />
        <Stat label="Tracked signups" value={show(card.signups)} />
        <Stat label="New profiles" value={show(card.registrations)} />
        <Stat label="New Guru profiles" value={show(card.gurus)} />
        <Stat label="Booking requests" value={String(card.bookingRequests)} />
        <Stat label="Confirmed bookings" value={String(card.confirmedBookings)} />
        <Stat label="Visits to profiles" value={percent(card.visitToRegistration)} />
        <Stat label="Requests to confirmed" value={percent(card.requestToConfirmed)} />
      </section>
      <p className="text-sm text-slate-500">Profiles to booking requests: {percent(card.registrationToRequest)}. {card.label}. Campaign attribution appears only when a tracked visit or signup was stored. Otherwise it stays Not tracked.</p>
    </div>
  );
}

