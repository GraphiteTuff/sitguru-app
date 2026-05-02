import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

function formatStatus(status: PartnerApplication["status"]) {
  switch (status) {
    case "needs_review":
      return "Needs Review";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminPartnerApplicationsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("partner_applications")
    .select("*")
    .order("created_at", { ascending: false });

  const applications = (data ?? []) as PartnerApplication[];

  const pendingCount = applications.filter((app) => app.status === "pending").length;
  const needsReviewCount = applications.filter(
    (app) => app.status === "needs_review"
  ).length;
  const approvedCount = applications.filter((app) => app.status === "approved").length;
  const rejectedCount = applications.filter((app) => app.status === "rejected").length;

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
                Applications
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Partner Applications
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Review Local Partner, National Partner, Growth Affiliate, and
                Ambassador applications submitted from the public SitGuru Partner
                Network pages.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/partners"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                View Public Partner Pages
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
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">Pending</p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-800">Needs Review</p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {needsReviewCount}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">Approved</p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {approvedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <p className="text-sm font-bold text-red-800">Rejected</p>
              <p className="mt-2 text-3xl font-black text-red-950">
                {rejectedCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
            <h2 className="text-xl font-black">Could not load applications</h2>
            <p className="mt-2 text-sm leading-6">
              Supabase returned an error while loading partner applications:
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
              {error.message}
            </pre>
            <p className="mt-4 text-sm font-bold">
              This usually means the Admin RLS policy still needs to be added.
            </p>
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-[2rem] border border-green-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              🐾
            </div>
            <h2 className="mt-5 text-3xl font-black text-green-950">
              No applications yet
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Once local businesses, brands, affiliates, or ambassadors submit
              applications, they will appear here for Admin review.
            </p>
            <Link
              href="/partners"
              className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
            >
              Open Partner Network
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {applications.map((application) => (
              <article
                key={application.id}
                className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-sm"
              >
                <div className="border-b border-green-100 bg-[#fbfaf6] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
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

                      <h2 className="mt-3 text-2xl font-black text-green-950">
                        {application.business_name ||
                          application.contact_name ||
                          "Unnamed Application"}
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Submitted by {application.contact_name} on{" "}
                        {formatDate(application.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/admin/partners/applications/${application.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
                      >
                        Review
                      </Link>

                      <Link
                        href={`mailto:${application.email}`}
                        className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                      >
                        Email
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_1fr]">
                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Contact
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {application.contact_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {application.email}
                    </p>
                    {application.phone ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {application.phone}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Location
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {[application.city, application.state]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </p>
                    {application.zip_code ? (
                      <p className="mt-1 text-sm text-slate-600">
                        ZIP {application.zip_code}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Type
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {application.business_type || "Not provided"}
                    </p>
                    {application.website ? (
                      <a
                        href={application.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-sm font-bold text-green-800 hover:text-green-950"
                      >
                        {application.website}
                      </a>
                    ) : null}
                  </div>
                </div>

                {application.message ? (
                  <div className="border-t border-green-100 px-5 py-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Message
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                      {application.message}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
