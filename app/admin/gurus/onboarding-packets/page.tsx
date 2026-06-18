import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  MessageCircle,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DOCUMENT_BUCKET = "guru-onboarding-documents";

type SearchParams = {
  status?: string;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

type PacketRow = {
  id: string;
  user_id: string;
  legal_name: string | null;
  signature_name: string | null;
  agreement_version: string | null;
  provider_acknowledged: boolean | null;
  tax_acknowledged: boolean | null;
  safety_acknowledged: boolean | null;
  care_standards_acknowledged: boolean | null;
  communication_acknowledged: boolean | null;
  payment_acknowledged: boolean | null;
  final_certification_acknowledged: boolean | null;
  status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type DocumentRow = {
  id: string;
  user_id: string;
  packet_id: string | null;
  document_type: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  status: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  signedUrl?: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  image_url?: string | null;
};

type PacketViewModel = {
  packet: PacketRow;
  profile: ProfileRow | null;
  documents: DocumentRow[];
  displayName: string;
  email: string;
  messageHref: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value?: string | null) {
  if (!value) return "Not saved";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not saved";

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function prettyStatus(value?: string | null) {
  const status = asString(value) || "not_started";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClasses(value?: string | null) {
  const status = asString(value).toLowerCase();

  if (["approved", "complete", "completed"].includes(status)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (["submitted", "pending_review", "in_review"].includes(status)) {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  if (["needs_fix", "needs_action"].includes(status)) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (status === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

function isSubmittedStatus(status?: string | null) {
  const normalized = asString(status).toLowerCase();
  return ["submitted", "pending_review", "in_review"].includes(normalized);
}

function isNeedsFixStatus(status?: string | null) {
  const normalized = asString(status).toLowerCase();
  return ["needs_fix", "needs_action"].includes(normalized);
}

function isApprovedStatus(status?: string | null) {
  const normalized = asString(status).toLowerCase();
  return ["approved", "complete", "completed"].includes(normalized);
}

function getProfileName(profile: ProfileRow | null, packet: PacketRow) {
  if (!profile) return packet.legal_name || "Guru";

  const firstLast = `${asString(profile.first_name)} ${asString(profile.last_name)}`.trim();

  return (
    asString(profile.full_name) ||
    asString(profile.display_name) ||
    asString(profile.name) ||
    firstLast ||
    packet.legal_name ||
    "Guru"
  );
}

function getMessageHref({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  const params = new URLSearchParams();
  params.set("threadType", "direct_guru");
  params.set("recipientRole", "guru");
  params.set("source", "guru-onboarding-packet");
  if (userId) params.set("recipientId", userId);
  if (name) params.set("recipientName", name);
  if (email) params.set("recipientEmail", email);
  return `/admin/messages?${params.toString()}`;
}

async function approvePacket(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/admin/login");

  const packetId = asString(formData.get("packet_id"));
  const note = asString(formData.get("admin_notes")) || "Approved by SitGuru.";

  if (!packetId) return;

  await supabaseAdmin
    .from("guru_onboarding_packets")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      admin_notes: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packetId);

  revalidatePath("/admin/gurus");
  revalidatePath("/admin/gurus/onboarding-packets");
  revalidatePath("/guru/dashboard");
  revalidatePath("/guru/dashboard/onboarding-packet");
}

async function markNeedsFix(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/admin/login");

  const packetId = asString(formData.get("packet_id"));
  const note =
    asString(formData.get("admin_notes")) ||
    "SitGuru needs one or more updates before this packet can be completed.";

  if (!packetId) return;

  await supabaseAdmin
    .from("guru_onboarding_packets")
    .update({
      status: "needs_fix",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      admin_notes: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packetId);

  revalidatePath("/admin/gurus");
  revalidatePath("/admin/gurus/onboarding-packets");
  revalidatePath("/guru/dashboard");
  revalidatePath("/guru/dashboard/onboarding-packet");
}

async function getPacketData(statusFilter: string): Promise<PacketViewModel[]> {
  const { data: packetsData } = await supabaseAdmin
    .from("guru_onboarding_packets")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(100);

  const packets = ((packetsData || []) as PacketRow[]).filter((packet) => {
    if (statusFilter === "submitted") return isSubmittedStatus(packet.status);
    if (statusFilter === "needs_fix") return isNeedsFixStatus(packet.status);
    if (statusFilter === "approved") return isApprovedStatus(packet.status);
    return true;
  });

  const packetIds = packets.map((packet) => packet.id).filter(Boolean);
  const userIds = packets.map((packet) => packet.user_id).filter(Boolean);

  const { data: documentsData } = packetIds.length
    ? await supabaseAdmin
        .from("guru_onboarding_documents")
        .select("*")
        .in("packet_id", packetIds)
        .order("submitted_at", { ascending: false })
    : { data: [] as DocumentRow[] };

  const documents = (documentsData || []) as DocumentRow[];

  const documentsWithSignedUrls = await Promise.all(
    documents.map(async (document) => {
      const storagePath = asString(document.storage_path);
      const storageBucket = asString(document.storage_bucket) || DOCUMENT_BUCKET;

      if (!storagePath) return { ...document, signedUrl: null };

      const { data } = await supabaseAdmin.storage
        .from(storageBucket)
        .createSignedUrl(storagePath, 60 * 30);

      return {
        ...document,
        signedUrl: data?.signedUrl || null,
      };
    }),
  );

  const { data: profilesData } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select(
          "id, full_name, display_name, name, first_name, last_name, email, avatar_url, profile_photo_url, image_url",
        )
        .in("id", userIds)
    : { data: [] as ProfileRow[] };

  const profileMap = new Map<string, ProfileRow>();
  ((profilesData || []) as ProfileRow[]).forEach((profile) => {
    profileMap.set(profile.id, profile);
  });

  const documentsByPacket = new Map<string, DocumentRow[]>();
  documentsWithSignedUrls.forEach((document) => {
    const packetId = asString(document.packet_id);
    if (!packetId) return;
    documentsByPacket.set(packetId, [...(documentsByPacket.get(packetId) || []), document]);
  });

  return packets.map((packet) => {
    const profile = profileMap.get(packet.user_id) || null;
    const displayName = getProfileName(profile, packet);
    const email = asString(profile?.email);

    return {
      packet,
      profile,
      documents: documentsByPacket.get(packet.id) || [],
      displayName,
      email,
      messageHref: getMessageHref({
        userId: packet.user_id,
        name: displayName,
        email,
      }),
    };
  });
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function PacketCard({ viewModel }: { viewModel: PacketViewModel }) {
  const { packet, documents, displayName, email, messageHref } = viewModel;

  return (
    <article className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black text-slate-950">{displayName}</h2>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${getStatusClasses(
                packet.status,
              )}`}
            >
              {prettyStatus(packet.status)}
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            {email || "No email found"} • Submitted {formatDate(packet.submitted_at)}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Reviewed: {formatDate(packet.reviewed_at)} • Documents: {documents.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={messageHref}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
          >
            <MessageCircle size={16} />
            Message
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Legal Name
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {packet.legal_name || "Not saved"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Signature
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {packet.signature_name || "Not saved"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Agreement
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {packet.agreement_version || "Not saved"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Security
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            IP saved: {packet.ip_address ? "Yes" : "No"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
          Acknowledgments
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Provider", packet.provider_acknowledged],
            ["Tax / W-9", packet.tax_acknowledged],
            ["Safety", packet.safety_acknowledged],
            ["Care Standards", packet.care_standards_acknowledged],
            ["Communication", packet.communication_acknowledged],
            ["Payment", packet.payment_acknowledged],
            ["Final", packet.final_certification_acknowledged],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm font-black text-slate-800"
            >
              {value ? "✓" : "—"} {label}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Documents
        </p>

        <div className="mt-3 grid gap-3">
          {documents.length ? (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {document.file_name || "Uploaded document"}
                  </p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    {prettyStatus(document.document_type)} • {formatDate(document.submitted_at)}
                  </p>
                </div>

                {document.signedUrl ? (
                  <a
                    href={document.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    <Download size={15} />
                    Open
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-bold text-slate-500">
              No documents were uploaded with this packet.
            </div>
          )}
        </div>
      </div>

      {packet.admin_notes ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">
            Admin Note
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
            {packet.admin_notes}
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form action={approvePacket} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <input type="hidden" name="packet_id" value={packet.id} />
          <label className="block">
            <span className="text-sm font-black text-emerald-950">
              Approval note
            </span>
            <textarea
              name="admin_notes"
              defaultValue="Approved by SitGuru."
              className="mt-2 min-h-24 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <button
            type="submit"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
          >
            <CheckCircle2 size={16} />
            Approve Packet
          </button>
        </form>

        <form action={markNeedsFix} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <input type="hidden" name="packet_id" value={packet.id} />
          <label className="block">
            <span className="text-sm font-black text-amber-950">
              Needs-fix note to Guru
            </span>
            <textarea
              name="admin_notes"
              placeholder="Example: Please upload the requested document or update your legal name."
              className="mt-2 min-h-24 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
            />
          </label>
          <button
            type="submit"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-700"
          >
            <ShieldAlert size={16} />
            Mark Needs Fix
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function AdminGuruOnboardingPacketsPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusFilter = asString(resolvedSearchParams.status) || "submitted";

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  const allPackets = await getPacketData("all");
  const packets = await getPacketData(statusFilter);

  const submitted = allPackets.filter((row) => isSubmittedStatus(row.packet.status)).length;
  const needsFix = allPackets.filter((row) => isNeedsFixStatus(row.packet.status)).length;
  const approved = allPackets.filter((row) => isApprovedStatus(row.packet.status)).length;
  const documentCount = allPackets.reduce((sum, row) => sum + row.documents.length, 0);

  const filterLinks = [
    { label: "Submitted", href: "/admin/gurus/onboarding-packets?status=submitted", active: statusFilter === "submitted" },
    { label: "Needs Fix", href: "/admin/gurus/onboarding-packets?status=needs_fix", active: statusFilter === "needs_fix" },
    { label: "Approved", href: "/admin/gurus/onboarding-packets?status=approved", active: statusFilter === "approved" },
    { label: "All", href: "/admin/gurus/onboarding-packets?status=all", active: statusFilter === "all" },
  ];

  return (
    <main className="min-h-screen bg-[#f9faf5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-[30px] border border-[#e3ece5] bg-white p-5 shadow-sm">
          <Link
            href="/admin/gurus"
            className="mb-4 inline-flex items-center gap-2 text-sm font-black text-emerald-800 transition hover:text-emerald-950"
          >
            <ArrowLeft size={17} />
            Back to Guru Management
          </Link>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Step 5 Admin Review
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Guru Onboarding Packets
              </h1>
              <p className="mt-2 max-w-4xl text-base font-semibold leading-7 text-slate-600">
                Review submitted Guru Step 5 packets, open uploaded documents, approve packets,
                or mark them as needing fixes. Approval turns Step 5 green on the Guru dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                    link.active
                      ? "bg-amber-600 text-white"
                      : "border border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ClipboardCheck size={21} />}
            label="Submitted"
            value={submitted}
          />
          <StatCard
            icon={<ShieldAlert size={21} />}
            label="Needs Fix"
            value={needsFix}
          />
          <StatCard
            icon={<CheckCircle2 size={21} />}
            label="Approved"
            value={approved}
          />
          <StatCard
            icon={<UploadCloud size={21} />}
            label="Documents"
            value={documentCount}
          />
        </section>

        <section className="grid gap-5">
          {packets.length ? (
            packets.map((packet) => (
              <PacketCard key={packet.packet.id} viewModel={packet} />
            ))
          ) : (
            <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-2xl font-black text-slate-950">
                No packets in this queue
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                Guru onboarding packet submissions will appear here after Gurus complete Step 5.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
