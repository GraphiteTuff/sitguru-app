import Link from "next/link";
import { currentOutlookIdentity } from "@/lib/microsoft/outlook/access";
import { readOutlook } from "@/lib/microsoft/outlook/graph";
import { calendarMonth } from "@/lib/microsoft/outlook/ical";
import { getCalendarSubscription, loadSitGuruCalendar } from "@/lib/microsoft/outlook/subscriptions";
import { outlookSettings, type OutlookPortal } from "@/lib/microsoft/outlook/security";

const card = "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6";
const button = "inline-flex min-h-11 items-center rounded-xl border border-emerald-900 px-3 text-sm font-semibold text-emerald-950";
const notices: Record<string, string> = {
  connected: "Outlook account connected.",
  updated: "Outlook settings updated.",
  declined: "Microsoft did not grant access. You can try again.",
  invalid: "The sign-in link expired. Start again from this page.",
  unavailable: "The change could not be saved. Try again.",
};

function formatDate(value: string, allDay = false) {
  const date = new Date(allDay ? `${value.slice(0, 10)}T00:00:00Z`
    : /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", allDay
    ? { dateStyle: "medium", timeZone: "UTC" }
    : { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date);
}

function OutlookAction({ portal, action, children, view }: {
  portal: OutlookPortal;
  action: "connect" | "disconnect" | "subscribe" | "revoke";
  view: "calendar" | "mail";
  children: React.ReactNode;
}) {
  return (
    <form method="post" action="/api/internship/outlook/manage">
      <input type="hidden" name="portal" value={portal} />
      <input type="hidden" name="view" value={view} />
      <button type="submit" name="action" value={action} className={button}>{children}</button>
    </form>
  );
}

export default async function InternshipOutlook({ portal, searchParams }: {
  portal: OutlookPortal;
  searchParams: Promise<{ view?: string; month?: string; result?: string }>;
}) {
  const identity = await currentOutlookIdentity(portal);
  if (!identity) {
    return <p className={card}>Sign in with a verified SitGuru account assigned to this portal to view Outlook.</p>;
  }
  const search = await searchParams;
  const view = search.view === "calendar" ? "calendar" : "mail";
  const month = calendarMonth(search.month);
  const settings = outlookSettings();
  const [outlook, subscription, sitguru] = await Promise.all([
    readOutlook(settings, identity.userId, view, month),
    settings && view === "calendar"
      ? getCalendarSubscription(settings, identity.userId, portal).catch(() => undefined) : null,
    view === "calendar" ? loadSitGuruCalendar(identity).catch(() => null) : [],
  ]);
  const path = `/${portal}/outlook`;
  const sitguruEvents = sitguru?.filter((event) => event.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
  const notice = search.result && Object.hasOwn(notices, search.result) ? notices[search.result] : "";
  const connected = outlook.status === "mail" || outlook.status === "calendar";
  const canConnect = outlook.status === "disconnected" || outlook.status === "reconnect";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-24">
      <header className="rounded-2xl bg-[#10583f] p-5 !text-white">
        <h1 className="text-2xl font-black !text-white">Microsoft Outlook</h1>
        <p className="mt-1 text-sm !text-white">{view === "calendar" ? "Your Outlook events and SitGuru schedule" : "Your Outlook Inbox"}</p>
      </header>
      <nav aria-label="Microsoft Outlook" className="flex flex-wrap gap-2">
        <Link prefetch={false} href={path} aria-current={view === "mail" ? "page" : undefined} className={button}>Outlook Inbox</Link>
        <Link prefetch={false} href={`${path}?view=calendar`} aria-current={view === "calendar" ? "page" : undefined} className={button}>Outlook &amp; SitGuru calendars</Link>
        <Link href={`/${portal}/${view === "calendar" ? "calendar" : "messages"}`} className={button}>Back to SitGuru {view === "calendar" ? "Calendar" : "Inbox"}</Link>
      </nav>
      {notice && <p role="status" className={card}>{notice}</p>}
      <section aria-label="Outlook connection" className={`${card} space-y-3`}>
        {outlook.status === "disabled" && <p>Outlook account connections are awaiting setup.</p>}
        {outlook.status === "disconnected" && <p>Connect a Microsoft account to open its Inbox and calendars.</p>}
        {outlook.status === "reconnect" && <p>Microsoft access expired or needs permission. Reconnect to continue.</p>}
        {outlook.status === "unavailable" && <p role="alert">Outlook is temporarily unavailable. Refresh to retry.</p>}
        {connected && <p>Connected to Outlook. Recent mail and events are read directly from Microsoft.</p>}
        <div className="flex flex-wrap gap-2">
          {canConnect && <OutlookAction portal={portal} action="connect" view={view}>{outlook.status === "reconnect" ? "Reconnect Outlook" : "Connect Outlook"}</OutlookAction>}
          {settings && outlook.status !== "disconnected" && <OutlookAction portal={portal} action="disconnect" view={view}>Disconnect Outlook</OutlookAction>}
        </div>
      </section>

      {outlook.status === "mail" && (
        <section className={card}>
          <h2 className="text-lg font-black">Recent Inbox messages</h2>
          <ul className="divide-y divide-slate-100">
            {outlook.items.map((item) => (
              <li className="break-words py-3" key={item.id}>
                <p className={item.read ? "font-medium" : "font-bold"}>{item.title}</p>
                <p className="text-sm text-slate-600">{item.sender} · {formatDate(item.received)}</p>
                {item.href && <a href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline">Read in Outlook</a>}
              </li>
            ))}
          </ul>
          {!outlook.items.length && <p className="mt-2 text-sm text-slate-600">No messages in your Outlook Inbox.</p>}
        </section>
      )}

      {view === "calendar" && (
        <>
          {settings && <section className={`${card} space-y-3`}>
            <h2 className="text-lg font-black">See your SitGuru calendar in Outlook</h2>
            <p className="text-sm text-slate-700">In Outlook Calendar, choose Add calendar, then Subscribe from web. Outlook refreshes the subscription on its own schedule. Keep this private link with calendars you control.</p>
            {subscription === undefined ? <p role="alert">The subscription link is temporarily unavailable.</p> : subscription ? (
              <>
                <label className="block text-sm font-semibold">Private calendar subscription link
                  <input type="text" readOnly value={subscription} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" />
                </label>
                <OutlookAction portal={portal} action="revoke" view={view}>Revoke subscription link</OutlookAction>
              </>
            ) : <OutlookAction portal={portal} action="subscribe" view={view}>Create private subscription link</OutlookAction>}
          </section>}
          <form method="get" action={path} className={`${card} flex flex-wrap items-end gap-3`}>
            <input type="hidden" name="view" value="calendar" />
            <label className="block text-sm font-semibold">Month
              <input name="month" type="month" defaultValue={month} className="mt-1 block min-h-11 rounded-lg border border-slate-300 px-3" />
            </label>
            <button className={button}>Show month</button>
          </form>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className={card}>
              <h2 className="text-lg font-black">SitGuru calendar</h2>
              <ul className="divide-y divide-slate-100">
                {sitguruEvents?.map((item) => <li className="break-words py-3" key={item.id}>
                  {item.href ? <Link href={item.href} className="font-semibold text-emerald-900 underline">{item.title}</Link> : <p className="font-semibold">{item.title}</p>}
                  <p className="text-sm text-slate-600">{formatDate(item.date, true)}{item.time ? ` · ${item.time}` : ""}</p>
                </li>)}
              </ul>
              {sitguru === null && <p role="alert">The SitGuru schedule is temporarily unavailable.</p>}
              {sitguru && !sitguruEvents?.length && <p className="mt-2 text-sm text-slate-600">No SitGuru events this month.</p>}
            </section>
            <section className={card}>
              <h2 className="text-lg font-black">Outlook calendars</h2>
              {outlook.status === "calendar" ? (
                <>
                  <p className="break-words text-sm text-slate-600">{outlook.calendars.map((calendar) => calendar.name).join(" · ") || "No calendars returned by Outlook"}</p>
                  {outlook.partial && <p role="status" className="mt-2 text-sm text-amber-900">Outlook could only return some calendar events. Refresh to retry.</p>}
                  <ul className="divide-y divide-slate-100">
                    {outlook.items.map((item) => <li className="break-words py-3" key={item.id}>
                      {item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-900 underline">{item.title}</a> : <p className="font-semibold">{item.title}</p>}
                      <p className="text-sm text-slate-600">{item.calendar} · {formatDate(item.start, item.allDay)}{item.allDay ? " · All day" : ""}</p>
                    </li>)}
                  </ul>
                  {!outlook.items.length && !outlook.partial && <p className="mt-2 text-sm text-slate-600">No Outlook events this month.</p>}
                </>
              ) : <p className="mt-2 text-sm text-slate-600">Outlook events appear once an account is connected and available.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
