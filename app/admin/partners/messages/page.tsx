import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { sendPartnerMessage } from "./actions";

type PartnerMessage = {
  id: string;
  sender_user_id: string | null;
  recipient_user_id: string | null;
  partner_id: string | null;
  ambassador_id: string | null;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
  partners: {
    id: string;
    business_name: string;
    partner_type: string;
    email: string | null;
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    ambassador_type: string;
    email: string;
  } | null;
};

type Partner = {
  id: string;
  business_name: string;
  partner_type: string;
  email: string | null;
  status: "active" | "paused" | "suspended" | "archived";
};

type Ambassador = {
  id: string;
  display_name: string;
  ambassador_type: string;
  email: string;
  status: "active" | "paused" | "suspended" | "archived";
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Provided";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function messageRecipientName(message: PartnerMessage) {
  if (message.partners?.business_name) return message.partners.business_name;
  if (message.ambassadors?.display_name) return message.ambassadors.display_name;
  if (message.recipient_user_id) return message.recipient_user_id;
  return "Unknown recipient";
}

function messageRecipientType(message: PartnerMessage) {
  if (message.partners?.partner_type) return formatLabel(message.partners.partner_type);
  if (message.ambassadors?.ambassador_type) {
    return formatLabel(message.ambassadors.ambassador_type);
  }

  return "Partner Network";
}

function messageRecipientEmail(message: PartnerMessage) {
  if (message.partners?.email) return message.partners.email;
  if (message.ambassadors?.email) return message.ambassadors.email;
  return null;
}

function recipientIcon(type: string | null | undefined) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("ambassador")) return "⭐";
  if (normalized.includes("affiliate")) return "📈";
  if (normalized.includes("rescue")) return "💚";
  if (normalized.includes("groom")) return "✂️";
  if (normalized.includes("trainer")) return "🦮";
  if (normalized.includes("vet")) return "🩺";
  if (normalized.includes("insurance")) return "🛡️";
  if (normalized.includes("national")) return "🌐";
  if (normalized.includes("local")) return "📍";

  return "💬";
}

function truncate(value: string, max = 150) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

export default async function AdminPartnerMessagesPage() {
  const supabase = await createClient();

  const { data: messagesData, error: messagesError } = await supabase
    .from("partner_messages")
    .select(
      `
        *,
        partners (
          id,
          business_name,
          partner_type,
          email
        ),
        ambassadors (
          id,
          display_name,
          ambassador_type,
          email
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: partnersData, error: partnersError } = await supabase
    .from("partners")
    .select("id, business_name, partner_type, email, status")
    .in("status", ["active", "paused"])
    .order("business_name", { ascending: true })
    .limit(100);

  const { data: ambassadorsData, error: ambassadorsError } = await supabase
    .from("ambassadors")
    .select("id, display_name, ambassador_type, email, status")
    .in("status", ["active", "paused"])
    .order("display_name", { ascending: true })
    .limit(100);

  const messages = (messagesData ?? []) as PartnerMessage[];
  const partners = (partnersData ?? []) as Partner[];
  const ambassadors = (ambassadorsData ?? []) as Ambassador[];

  const unreadMessages = messages.filter((message) => !message.read_at).length;
  const partnerMessages = messages.filter((message) => message.partner_id).length;
  const ambassadorMessages = messages.filter((message) => message.ambassador_id).length;
  const availableRecipients = partners.length + ambassadors.length;

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-green-800">
                <Link href="/admin" className="hover:text-green-950">
                  Admin
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                <Link href="/admin/partners" className="hover:text-green-950">
                  Partners
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                Messages
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Partner Messages
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Send and view messages for approved partners, Growth Affiliates,
                and SitGuru Ambassadors.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/active"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Active Partners
              </Link>

              <Link
                href="/admin/partners"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Partner Overview
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">
                Total Messages
              </p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {messages.length}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">Unread</p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {unreadMessages}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm font-bold text-purple-800">
                Partner Messages
              </p>
              <p className="mt-2 text-3xl font-black text-purple-950">
                {partnerMessages}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <p className="text-sm font-bold text-orange-800">
                Ambassador Messages
              </p>
              <p className="mt-2 text-3xl font-black text-orange-950">
                {ambassadorMessages}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-10">
        <div className="space-y-6">
          {messagesError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">Could not load messages</h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading partner messages:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {messagesError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Message activity
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Recent partner messages
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Showing latest 50 messages.
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    💬
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No partner messages yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Use the compose form to send your first partner, affiliate,
                    or ambassador message.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {messages.map((message) => {
                    const typeLabel = messageRecipientType(message);

                    return (
                      <article
                        key={message.id}
                        className="overflow-hidden rounded-2xl border border-green-100 bg-[#fbfaf6]"
                      >
                        <div className="flex flex-col gap-4 border-b border-green-100 bg-white p-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                              {recipientIcon(typeLabel)}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                                  {typeLabel}
                                </span>

                                <span
                                  className={`rounded-full border px-3 py-1 text-xs font-black ${
                                    message.read_at
                                      ? "border-slate-200 bg-slate-50 text-slate-700"
                                      : "border-blue-200 bg-blue-50 text-blue-800"
                                  }`}
                                >
                                  {message.read_at ? "Read" : "Unread"}
                                </span>
                              </div>

                              <h3 className="mt-3 text-2xl font-black text-green-950">
                                {message.subject || "Partner Message"}
                              </h3>

                              <p className="mt-1 text-sm text-slate-600">
                                To {messageRecipientName(message)}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm font-bold text-slate-500">
                            {formatDateTime(message.created_at)}
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {truncate(message.body, 320)}
                          </p>

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-slate-600">
                              {messageRecipientEmail(message) ? (
                                <Link
                                  href={`mailto:${messageRecipientEmail(message)}`}
                                  className="font-bold text-green-800 hover:text-green-950"
                                >
                                  {messageRecipientEmail(message)}
                                </Link>
                              ) : (
                                <span>No email found</span>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                              {message.partner_id ? (
                                <Link
                                  href="/admin/partners/active"
                                  className="rounded-xl border border-green-200 bg-white px-4 py-2 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                                >
                                  View Partner
                                </Link>
                              ) : null}

                              {message.ambassador_id ? (
                                <Link
                                  href="/admin/partners/ambassadors"
                                  className="rounded-xl border border-green-200 bg-white px-4 py-2 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                                >
                                  View Ambassador
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <form
            action={sendPartnerMessage}
            className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-2xl font-black text-green-950">
              Compose Message
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Send a message to an approved partner, Growth Affiliate, or
              Ambassador. Messages are saved in Supabase.
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                Recipient
              </span>
              <select
                required
                name="recipient"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              >
                <option value="" disabled>
                  Select recipient
                </option>

                {partners.length > 0 ? (
                  <optgroup label="Partners & Affiliates">
                    {partners.map((partner) => (
                      <option key={partner.id} value={`partner:${partner.id}`}>
                        {partner.business_name} — {formatLabel(partner.partner_type)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}

                {ambassadors.length > 0 ? (
                  <optgroup label="Ambassadors">
                    {ambassadors.map((ambassador) => (
                      <option
                        key={ambassador.id}
                        value={`ambassador:${ambassador.id}`}
                      >
                        {ambassador.display_name} —{" "}
                        {formatLabel(ambassador.ambassador_type)}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">Subject</span>
              <input
                name="subject"
                type="text"
                placeholder="Message from SitGuru"
                className="mt-2 w-full rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-slate-700">Message</span>
              <textarea
                required
                name="body"
                rows={7}
                placeholder="Write your message..."
                className="mt-2 w-full resize-none rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
            >
              Send Message
            </button>

            {partnersError || ambassadorsError ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {partnersError ? (
                  <p>Partner recipient error: {partnersError.message}</p>
                ) : null}
                {ambassadorsError ? (
                  <p>Ambassador recipient error: {ambassadorsError.message}</p>
                ) : null}
              </div>
            ) : null}
          </form>

          <div className="rounded-[1.5rem] border border-green-100 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-2xl font-black">Messaging Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Available Recipients
                </p>
                <p className="mt-2 text-3xl font-black">
                  {availableRecipients}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Approved Partners
                </p>
                <p className="mt-2 text-3xl font-black">{partners.length}</p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Approved Ambassadors
                </p>
                <p className="mt-2 text-3xl font-black">
                  {ambassadors.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">Next Wiring</h2>

            <div className="mt-5 space-y-3">
              {[
                "Connect to existing Admin Messages notification bell",
                "Add read/unread update action",
                "Create partner-facing message inbox",
                "Send email notification when Admin sends a message",
                "Add threaded replies",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 text-sm font-bold text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
