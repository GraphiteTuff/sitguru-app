"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  Send,
  UserRound,
  UsersRound,
  X,
  ShieldAlert,
} from "lucide-react";

export type ComposeDirectoryPerson = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
  subtitle?: string;
};

export type ComposerIntent = {
  threadType?: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;
  recipientRole?: string;
  messageCategory?: string;
  department?: string;
  departmentLabel?: string;
  source?: string;
  ambassadorId?: string;
  ambassadorName?: string;
  ambassadorEmail?: string;
  referralCode?: string;
  isDepartment?: boolean;
  isAmbassadorContext?: boolean;
};

type InquiryOption = {
  key: string;
  label: string;
};

type AdminMessageComposerProps = {
  action: (formData: FormData) => void | Promise<void>;
  intent: ComposerIntent;
  currentUser: {
    id: string;
    email: string;
    name: string;
  };
  inquiryTypes: InquiryOption[];
};

function roleLabel(role: string) {
  const value = role.toLowerCase();
  if (value === "guru") return "Guru";
  if (value === "customer" || value === "pet_parent") return "Pet Parent";
  if (value === "ambassador") return "Ambassador";
  if (value === "partner" || value === "vendor") return "Partner";
  if (value === "admin" || value === "brand") return "SitGuru Admin";
  return role || "User";
}

function threadTypeForRole(role: string) {
  const value = role.toLowerCase();
  if (value === "guru") return "direct_guru";
  if (value === "customer" || value === "pet_parent") return "direct_customer";
  if (value === "ambassador") return "direct_ambassador";
  if (value === "admin") return "internal";
  return "direct_external";
}

function Avatar({
  name,
  src,
  icon,
}: {
  name: string;
  src?: string;
  icon?: ReactNode;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        src={src}
        className="h-12 w-12 shrink-0 rounded-full border border-green-100 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50 text-xs font-black text-green-800 shadow-sm">
      {icon ||
        name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() ||
        "SG"}
    </div>
  );
}

export default function AdminMessageComposer({
  action,
  intent,
  currentUser,
  inquiryTypes,
}: AdminMessageComposerProps) {
  const [deliveryMode, setDeliveryMode] = useState<"sitguru" | "external">(
    intent.recipientEmail && !intent.recipientId ? "external" : "sitguru",
  );
  const [audienceRole, setAudienceRole] = useState(
    intent.recipientRole ||
      (intent.threadType?.startsWith("direct_")
        ? intent.threadType.replace("direct_", "")
        : "guru"),
  );
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<ComposeDirectoryPerson[]>(
    [],
  );
  const [selectedRecipient, setSelectedRecipient] =
    useState<ComposeDirectoryPerson | null>(
      intent.recipientId || intent.recipientEmail
        ? {
            id: intent.recipientId || "",
            name: intent.recipientName || intent.recipientEmail || "SitGuru User",
            email: intent.recipientEmail || "",
            role: intent.recipientRole || "user",
            subtitle: intent.recipientEmail || "",
          }
        : null,
    );
  const [externalName, setExternalName] = useState(intent.recipientName || "");
  const [externalEmail, setExternalEmail] = useState(intent.recipientEmail || "");
  const [senderOptions, setSenderOptions] = useState<ComposeDirectoryPerson[]>([
    {
      id: currentUser.id,
      name: currentUser.name || currentUser.email || "SitGuru Admin",
      email: currentUser.email,
      role: "admin",
      subtitle: `SitGuru Admin · ${currentUser.email}`,
    },
  ]);
  const [brandSender, setBrandSender] = useState<ComposeDirectoryPerson | null>({
    id: "sitguru-support",
    name: "SitGuru Support",
    email: "support@sitguru.com",
    role: "brand",
    subtitle: "Official SitGuru outbound identity",
  });
  const [senderId, setSenderId] = useState(currentUser.id);
  const [directoryError, setDirectoryError] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(() => {
    const categoryLabel =
      inquiryTypes.find((item) => item.key === (intent.messageCategory || "direct"))
        ?.label || "Direct Message";
    const label =
      intent.departmentLabel ||
      intent.recipientName ||
      intent.recipientEmail ||
      "SitGuru User";
    return intent.departmentLabel
      ? `Internal Message: ${intent.departmentLabel}`
      : `${categoryLabel}: SitGuru Admin ↔ ${label}`;
  });
  const [body, setBody] = useState(
    () =>
      `Hi ${
        intent.departmentLabel ||
        intent.recipientName ||
        intent.recipientEmail ||
        "there"
      },\n\n`,
  );
  const [category, setCategory] = useState(intent.messageCategory || "direct");
  const [isSearching, startSearch] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadSenders() {
      try {
        const response = await fetch(
          "/api/admin/messages/compose-directory?kind=senders&limit=80",
          { credentials: "same-origin" },
        );
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok || !payload?.ok) {
          setDirectoryError(
            String(payload?.error || "Could not load admin senders."),
          );
          return;
        }

        setDirectoryError("");
        const people = Array.isArray(payload.people)
          ? (payload.people as ComposeDirectoryPerson[])
          : [];
        const hasCurrent = people.some((person) => person.id === currentUser.id);
        const next = hasCurrent
          ? people
          : [
              {
                id: currentUser.id,
                name: currentUser.name || currentUser.email || "SitGuru Admin",
                email: currentUser.email,
                role: "admin",
                subtitle: `SitGuru Admin · ${currentUser.email}`,
              },
              ...people,
            ];

        setSenderOptions(
          next.map((person) => ({
            ...person,
            subtitle:
              person.subtitle ||
              `SitGuru Admin${person.email ? ` · ${person.email}` : ""}`,
          })),
        );
        if (payload.brandSender) {
          setBrandSender(payload.brandSender as ComposeDirectoryPerson);
        }
      } catch {
        if (!cancelled) {
          setDirectoryError("Could not load admin senders.");
        }
      }
    }

    void loadSenders();
    return () => {
      cancelled = true;
    };
  }, [currentUser.email, currentUser.id, currentUser.name]);

  useEffect(() => {
    if (deliveryMode !== "sitguru") return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      startSearch(async () => {
        try {
          const params = new URLSearchParams({
            kind: "recipients",
            role: audienceRole || "all",
            q: recipientQuery,
            limit: "40",
          });
          const response = await fetch(
            `/api/admin/messages/compose-directory?${params.toString()}`,
            { signal: controller.signal, credentials: "same-origin" },
          );
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.ok) {
            setRecipientResults([]);
            setDirectoryError(
              String(payload?.error || "Could not load recipients."),
            );
            return;
          }
          setDirectoryError("");
          setRecipientResults(
            Array.isArray(payload.people)
              ? (payload.people as ComposeDirectoryPerson[])
              : [],
          );
        } catch {
          // aborted or network
        }
      });
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [audienceRole, deliveryMode, recipientQuery]);

  const selectedSender = useMemo(() => {
    if (senderId === "sitguru-support" && brandSender) return brandSender;
    return (
      senderOptions.find((person) => person.id === senderId) || {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: "admin",
      }
    );
  }, [brandSender, currentUser, senderId, senderOptions]);

  const recipientLabel =
    deliveryMode === "external"
      ? externalName || externalEmail || "External recipient"
      : selectedRecipient?.name ||
        intent.departmentLabel ||
        "SitGuru User";

  const resolvedThreadType =
    deliveryMode === "external"
      ? "direct_external"
      : intent.department
        ? "internal_department"
        : threadTypeForRole(selectedRecipient?.role || audienceRole);

  const resolvedRecipientRole =
    deliveryMode === "external"
      ? "external"
      : selectedRecipient?.role || intent.recipientRole || audienceRole;

  function applyRecipient(person: ComposeDirectoryPerson) {
    setSelectedRecipient(person);
    setAudienceRole(person.role || audienceRole);
    const categoryLabel =
      inquiryTypes.find((item) => item.key === category)?.label || "Direct Message";
    setSubject(`${categoryLabel}: SitGuru Admin ↔ ${person.name}`);
    setBody((current) => {
      if (!current.trim() || /^Hi .+,?\n\n$/m.test(current)) {
        return `Hi ${person.name},\n\n`;
      }
      return current;
    });
  }

  return (
    <section className="rounded-[30px] border border-green-200 bg-green-50 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
            Message Draft
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-green-950">
            Compose SitGuru outreach
          </h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-green-900">
            Pick who the message is from, choose a SitGuru user or external email,
            optionally add CC/BCC, then send. SitGuru users also get an in-app
            unread thread.
          </p>
        </div>

        <Link
          href="/admin/messages"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-100"
        >
          <X size={16} />
          Clear draft
        </Link>
      </div>

      <form
        action={action}
        onSubmit={(event) => {
          if (deliveryMode === "sitguru" && !selectedRecipient?.id && !intent.department) {
            event.preventDefault();
            window.alert("Pick a SitGuru recipient, or switch to External email.");
            return;
          }
          if (deliveryMode === "external" && !externalEmail.trim()) {
            event.preventDefault();
            window.alert("Enter an external email address.");
          }
        }}
        className="mt-5 grid gap-4"
      >
        <input type="hidden" name="senderId" value={selectedSender.id} />
        <input type="hidden" name="senderName" value={selectedSender.name} />
        <input type="hidden" name="senderEmail" value={selectedSender.email} />
        <input type="hidden" name="threadType" value={resolvedThreadType} />
        <input
          type="hidden"
          name="recipientId"
          value={deliveryMode === "sitguru" ? selectedRecipient?.id || "" : ""}
        />
        <input
          type="hidden"
          name="recipientEmail"
          value={
            deliveryMode === "external"
              ? externalEmail
              : selectedRecipient?.email || ""
          }
        />
        <input
          type="hidden"
          name="recipientName"
          value={
            deliveryMode === "external"
              ? externalName || externalEmail
              : selectedRecipient?.name || ""
          }
        />
        <input type="hidden" name="recipientRole" value={resolvedRecipientRole} />
        <input type="hidden" name="messageCategory" value={category} />
        <input type="hidden" name="department" value={intent.department || ""} />
        <input
          type="hidden"
          name="departmentLabel"
          value={intent.departmentLabel || ""}
        />
        <input type="hidden" name="source" value={intent.source || "admin_compose"} />
        <input type="hidden" name="ambassadorId" value={intent.ambassadorId || ""} />
        <input
          type="hidden"
          name="ambassadorName"
          value={intent.ambassadorName || ""}
        />
        <input
          type="hidden"
          name="ambassadorEmail"
          value={intent.ambassadorEmail || ""}
        />
        <input type="hidden" name="referralCode" value={intent.referralCode || ""} />
        <input type="hidden" name="ccEmails" value={cc} />
        <input type="hidden" name="bccEmails" value={bcc} />
        <input
          type="hidden"
          name="deliveryMode"
          value={deliveryMode === "external" ? "external" : "sitguru"}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                From (sender)
              </span>
              <select
                value={senderId}
                onChange={(event) => setSenderId(event.target.value)}
                className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
              >
                {brandSender ? (
                  <option value={brandSender.id}>
                    {brandSender.name} · {brandSender.email}
                  </option>
                ) : null}
                {senderOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} (SitGuru Admin)
                    {person.email ? ` · ${person.email}` : ""}
                  </option>
                ))}
              </select>
              {directoryError ? (
                <p className="text-xs font-semibold text-rose-700">{directoryError}</p>
              ) : null}
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMode("sitguru")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                  deliveryMode === "sitguru"
                    ? "border-green-700 bg-green-800 text-white"
                    : "border-green-200 bg-white text-green-900 hover:bg-green-100"
                }`}
              >
                SitGuru user
                <span className="mt-1 block text-xs font-semibold opacity-80">
                  In-app thread + email alert
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMode("external")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                  deliveryMode === "external"
                    ? "border-green-700 bg-green-800 text-white"
                    : "border-green-200 bg-white text-green-900 hover:bg-green-100"
                }`}
              >
                External email
                <span className="mt-1 block text-xs font-semibold opacity-80">
                  Anyone outside SitGuru
                </span>
              </button>
            </div>

            {deliveryMode === "sitguru" ? (
              <div className="grid gap-3 rounded-[24px] border border-green-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                      Audience
                    </span>
                    <select
                      value={audienceRole}
                      onChange={(event) => {
                        setAudienceRole(event.target.value);
                        setSelectedRecipient(null);
                      }}
                      className="min-h-12 rounded-2xl border border-green-200 bg-[#fcfffd] px-4 py-3 text-sm font-black text-slate-900 outline-none"
                    >
                      <option value="guru">Guru</option>
                      <option value="customer">Pet Parent</option>
                      <option value="ambassador">Ambassador</option>
                      <option value="partner">Partner</option>
                      <option value="admin">Admin / Staff</option>
                      <option value="all">All roles</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                      Find recipient
                    </span>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={recipientQuery}
                        onChange={(event) => setRecipientQuery(event.target.value)}
                        placeholder="Search name or email…"
                        className="min-h-12 w-full rounded-2xl border border-green-200 bg-[#fcfffd] pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                      />
                    </div>
                  </label>
                </div>

                {selectedRecipient ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {selectedRecipient.name}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {roleLabel(selectedRecipient.role)}
                        {selectedRecipient.email
                          ? ` · ${selectedRecipient.email}`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipient(null)}
                      className="rounded-xl border border-green-200 bg-white px-3 py-2 text-xs font-black text-green-900"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-green-100">
                    {isSearching && recipientResults.length === 0 ? (
                      <p className="px-4 py-6 text-sm font-semibold text-slate-500">
                        Searching…
                      </p>
                    ) : null}
                    {!isSearching && recipientResults.length === 0 ? (
                      <p className="px-4 py-6 text-sm font-semibold text-slate-500">
                        {directoryError
                          ? directoryError
                          : "No matching SitGuru users. Try another role, clear search, or switch to external email."}
                      </p>
                    ) : null}
                    {recipientResults.map((person) => (
                      <button
                        key={`${person.id}-${person.email}`}
                        type="button"
                        onClick={() => applyRecipient(person)}
                        className="flex w-full items-center gap-3 border-b border-green-50 px-4 py-3 text-left transition hover:bg-[#f5fcf8]"
                      >
                        <Avatar
                          name={person.name}
                          src={person.avatarUrl}
                          icon={
                            person.role === "guru" ? (
                              <UsersRound size={16} />
                            ) : person.role === "admin" ? (
                              <ShieldAlert size={16} />
                            ) : (
                              <UserRound size={16} />
                            )
                          }
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {person.name}
                          </p>
                          <p className="truncate text-xs font-semibold text-slate-500">
                            {roleLabel(person.role)}
                            {person.email ? ` · ${person.email}` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-3 rounded-[24px] border border-green-200 bg-white p-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                    External name
                  </span>
                  <input
                    value={externalName}
                    onChange={(event) => setExternalName(event.target.value)}
                    placeholder="Recipient name"
                    className="min-h-12 rounded-2xl border border-green-200 bg-[#fcfffd] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                    External email
                  </span>
                  <input
                    type="email"
                    required={deliveryMode === "external"}
                    value={externalEmail}
                    onChange={(event) => setExternalEmail(event.target.value)}
                    placeholder="name@company.com"
                    className="min-h-12 rounded-2xl border border-green-200 bg-[#fcfffd] px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                  />
                </label>
              </div>
            )}

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Message category
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
              >
                {inquiryTypes.map((inquiry) => (
                  <option key={inquiry.key} value={inquiry.key}>
                    {inquiry.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Subject
              </span>
              <input
                name="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCcBcc((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2 text-xs font-black text-green-900 transition hover:bg-green-100"
              >
                <Mail size={14} />
                {showCcBcc ? "Hide CC / BCC" : "Add CC / BCC"}
              </button>
            </div>

            {showCcBcc ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                    CC
                  </span>
                  <input
                    value={cc}
                    onChange={(event) => setCc(event.target.value)}
                    placeholder="comma-separated emails"
                    className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                    BCC
                  </span>
                  <input
                    value={bcc}
                    onChange={(event) => setBcc(event.target.value)}
                    placeholder="comma-separated emails"
                    className="min-h-12 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                  />
                </label>
              </div>
            ) : null}

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-green-800">
                Message
              </span>
              <textarea
                name="body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={7}
                className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-base font-semibold leading-7 text-slate-900 outline-none transition focus:border-green-400 focus:ring-4 focus:ring-green-100"
              />
            </label>
          </div>

          <div className="rounded-[26px] border border-green-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Send preview
            </p>

            <div className="mt-3 space-y-3">
              <div className="rounded-2xl bg-[#f8fbf6] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  From
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar name={selectedSender.name} src={selectedSender.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {selectedSender.name}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      SitGuru Admin · {selectedSender.email || "support@sitguru.com"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#f8fbf6] p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  To
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar
                    name={recipientLabel}
                    src={selectedRecipient?.avatarUrl}
                    icon={
                      deliveryMode === "external" ? (
                        <Mail size={18} />
                      ) : resolvedRecipientRole === "guru" ? (
                        <UsersRound size={18} />
                      ) : (
                        <UserRound size={18} />
                      )
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {recipientLabel}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {deliveryMode === "external"
                        ? externalEmail || "External email"
                        : `${roleLabel(resolvedRecipientRole)}${
                            selectedRecipient?.email
                              ? ` · ${selectedRecipient.email}`
                              : ""
                          }`}
                    </p>
                  </div>
                </div>
              </div>

              {(cc || bcc) && (
                <div className="rounded-2xl bg-[#f8fbf6] p-3 text-xs font-semibold text-slate-600">
                  {cc ? <p>CC: {cc}</p> : null}
                  {bcc ? <p>BCC: {bcc}</p> : null}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 p-4 text-xs font-bold leading-5 text-green-900">
              {deliveryMode === "external"
                ? "This sends the full message by email (with CC/BCC if provided) and keeps an admin record in Message Center."
                : "SitGuru users get an unread in-app thread plus an email notification. CC/BCC are emailed only."}
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-green-900"
            >
              <Send size={17} />
              Send message
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
