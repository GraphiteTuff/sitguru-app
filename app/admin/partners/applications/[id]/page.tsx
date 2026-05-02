import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePartnerApplicationStatus } from "../actions";

type PartnerApplication = {
  id: string;
  applicant_user_id: string | null;
  applicant_type: "local_partner" | "national_partner" | "affiliate" | "ambassador";
  business_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  social_url: string | null;
  business_type: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected" | "needs_review";
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  params: {
    id: string;
  };
};

function formatApplicantType(type: PartnerApplication["applicant_type"]) {
  switch (type) {
    case "local_partner":
      return "Local Partner";
    case "national_partner":
      return "National Partner";
    case "affiliate":
      return "Growth Affiliate";
    case "ambassador":
      return "Ambassador";
  }
}

function formatStatus(status: PartnerApplication["status"]) {
  switch (status) {
    case "needs_review":
      return "Needs Review";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function statusClasses(status: PartnerApplication["status"]) {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "needs_review":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800";
  }
}

function typeClasses(type: PartnerApplication["applicant_type"]) {
  switch (type) {
    case "local_partner":
      return "border-green-200 bg-green-50 text-green-800";
    case "national_partner":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "affiliate":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "ambassador":
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
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

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-5">
      <p className="text-xs font-black uppercase tracking-wide text-green-700">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-900">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function StatusActionButton({
  status,
  label,
  className,
}: {
  status: "approved" | "needs_review" | "rejected";
  label: string;
  className: string;
}) {
  return (
    <button
      type="submit"
      name="status"
      value={status}
      className={className}
    >
      {label}
    </button>
  );
}

export default async function AdminPartnerApplicationReviewPage({
  params,
}: PageProps) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("partner_applications")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const application = data as PartnerApplication;

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
                <Link
                  href="/admin/partners/applications"
                  className="hover:text-green-950"
                >
                  Applications
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                Review
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${typeClasses(
                    application.applicant_type
                  )}`}
                >
                  {formatApplicantType(application.applicant_type)}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                    application.status
                  )}`}
                >
                  {formatStatus(application.status)}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                {application.business_name ||
                  application.contact_name ||
                  "Partner Application"}
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Review the full application details before approving, rejecting,
                or requesting additional review.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/applications"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Back to Applications
              </Link>

              <Link
                href={`mailto:${application.email}`}
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Email Applicant
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_380px] lg:px-10">
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Application Details
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailCard
                label="Application Type"
                value={formatApplicantType(application.applicant_type)}
              />
              <DetailCard
                label="Status"
                value={formatStatus(application.status)}
              />
              <DetailCard
                label="Submitted"
                value={formatDateTime(application.created_at)}
              />
              <DetailCard
                label="Last Updated"
                value={formatDateTime(application.updated_at)}
              />
              <DetailCard
                label="Reviewed At"
                value={formatDateTime(application.reviewed_at)}
              />
              <DetailCard label="Reviewed By" value={application.reviewed_by} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Applicant Contact
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailCard label="Contact Name" value={application.contact_name} />
              <DetailCard label="Email" value={application.email} />
              <DetailCard label="Phone" value={application.phone} />
              <DetailCard
                label="Applicant User ID"
                value={application.applicant_user_id}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Business / Audience Info
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <DetailCard
                label="Business / Brand Name"
                value={application.business_name}
              />
              <DetailCard
                label="Business / Partner Type"
                value={application.business_type}
              />
              <DetailCard label="Website" value={application.website} />
              <DetailCard label="Social URL" value={application.social_url} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">Location</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <DetailCard label="City" value={application.city} />
              <DetailCard label="State" value={application.state} />
              <DetailCard label="ZIP Code" value={application.zip_code} />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Applicant Message
            </h2>

            <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {application.message || "No message provided."}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Current Admin Notes
            </h2>

            <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {application.admin_notes || "No admin notes yet."}
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <form
            action={updatePartnerApplicationStatus}
            className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm"
          >
            <input type="hidden" name="application_id" value={application.id} />

            <h2 className="text-2xl font-black text-green-950">
              Review Actions
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Add optional notes, then choose an application status. This updates
              the application in Supabase.
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-bold text-slate-700">
                Admin Notes
              </span>
              <textarea
                name="admin_notes"
                rows={6}
                defaultValue={application.admin_notes || ""}
                placeholder="Add notes about why this application was approved, rejected, or needs more review."
                className="mt-2 w-full resize-none rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:bg-white"
              />
            </label>

            <div className="mt-6 space-y-3">
              <StatusActionButton
                status="approved"
                label="Approve Application"
                className="w-full rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
              />

              <StatusActionButton
                status="needs_review"
                label="Mark Needs Review"
                className="w-full rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
              />

              <StatusActionButton
                status="rejected"
                label="Reject Application"
                className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-800 transition hover:border-red-400 hover:bg-red-100"
              />
            </div>
          </form>

          <div className="rounded-[1.5rem] border border-green-100 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-2xl font-black">Review Checklist</h2>

            <ul className="mt-5 space-y-3 text-sm leading-6 text-green-100">
              <li>✓ Check business, brand, or ambassador fit.</li>
              <li>✓ Confirm contact information looks valid.</li>
              <li>✓ Review website or social presence.</li>
              <li>✓ Confirm location and outreach relevance.</li>
              <li>✓ Decide whether to approve, reject, or request review.</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Quick Links
            </h2>

            <div className="mt-5 space-y-3">
              {application.website ? (
                <a
                  href={application.website}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm font-black text-green-900 transition hover:border-green-700 hover:bg-green-50"
                >
                  Open Website →
                </a>
              ) : null}

              {application.social_url ? (
                <a
                  href={application.social_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm font-black text-green-900 transition hover:border-green-700 hover:bg-green-50"
                >
                  Open Social →
                </a>
              ) : null}

              <Link
                href={`mailto:${application.email}`}
                className="block rounded-xl border border-green-100 bg-[#fbfaf6] px-4 py-3 text-sm font-black text-green-900 transition hover:border-green-700 hover:bg-green-50"
              >
                Email Applicant →
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}