"use client";

import { useMemo, useState } from "react";
import ActionFeedback, {
  type ActionFeedbackState,
} from "@/components/reads/ActionFeedback";
import type { ReadsContentDetail, ReadsStaffRole } from "@/lib/reads/types";

type Kpis = {
  needsReview: number;
  drafts: number;
  scheduled: number;
  publishedThisMonth: number;
  changesRequested: number;
  partnerLeads: number;
  activePartners: number;
  escalations: number;
};

type PartnerRow = {
  id: string;
  name: string;
  partner_type: string;
  status: string;
  escalated_to_admin?: boolean;
  organization?: string | null;
  email?: string | null;
};

type TeamMember = {
  id: string;
  full_name: string;
  role_label: string;
  slug: string;
};

type AnalyticsSummary = {
  totals: Record<string, number>;
  topContent: Array<{ content_id: string; count: number }>;
};

export default function ReadsStaffDashboard({
  role,
  tab,
  kpis,
  content,
  partners = [],
  teamMembers = [],
  topics = [],
  analytics,
}: {
  role: Exclude<ReadsStaffRole, "none">;
  tab: string;
  kpis: Kpis;
  content: ReadsContentDetail[];
  partners?: PartnerRow[];
  teamMembers?: TeamMember[];
  topics?: Array<{ id: string; name: string; slug: string }>;
  analytics?: AnalyticsSummary;
}) {
  const [rows, setRows] = useState(content);
  const [feedback, setFeedback] = useState<ActionFeedbackState>({
    status: "idle",
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (["books", "magazines", "podcasts", "videos", "authors"].includes(tab)) {
      const map: Record<string, string> = {
        books: "book",
        magazines: "magazine",
        podcasts: "podcast",
        videos: "video",
        authors: "author",
      };
      return rows.filter((r) => r.content_type === map[tab] || (tab === "authors" && r.content_type === "expert"));
    }
    if (tab === "drafts") return rows.filter((r) => r.status === "draft");
    if (tab === "submitted" || tab === "submissions" || tab === "content") {
      return rows.filter((r) =>
        ["submitted", "changes_requested", "draft", "approved", "scheduled"].includes(
          r.status,
        ),
      );
    }
    if (tab === "changes") {
      return rows.filter((r) => r.status === "changes_requested");
    }
    if (tab === "published") {
      return rows.filter((r) => r.status === "published");
    }
    if (tab === "calendar") {
      return rows.filter((r) => r.status === "scheduled");
    }
    return rows;
  }, [rows, tab]);

  async function runAction(
    id: string,
    action: () => Promise<Response>,
    successMessage: string,
  ) {
    setBusyId(id);
    setFeedback({ status: "loading", message: "Updating…" });
    try {
      const res = await action();
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Action failed");
      setFeedback({ status: "success", message: successMessage });
      if (json.status) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, status: json.status } : row,
          ),
        );
      }
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function transition(id: string, status: string, note?: string) {
    await runAction(
      id,
      () =>
        fetch(`/api/reads/content/${id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        }),
      `Marked as ${status.replaceAll("_", " ")}.`,
    );
  }

  async function createDraft(form: FormData) {
    setFeedback({ status: "loading", message: "Saving draft…" });
    try {
      const payload = {
        title: String(form.get("title") || ""),
        content_type: String(form.get("content_type") || "book"),
        description: String(form.get("description") || ""),
        editorial_summary: String(form.get("editorial_summary") || ""),
        why_recommended: String(form.get("why_recommended") || ""),
        topic_ids: form.getAll("topic_ids").map(String),
      };
      const res = await fetch("/api/reads/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Unable to save");
      setFeedback({ status: "success", message: "Draft saved." });
      window.location.reload();
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to save",
      });
    }
  }

  async function importYoutube(form: FormData) {
    setFeedback({ status: "loading", message: "Importing YouTube video…" });
    try {
      const res = await fetch("/api/reads/youtube/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlOrId: String(form.get("urlOrId") || ""),
          title: String(form.get("title") || "") || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Import failed");
      setFeedback({
        status: "success",
        message: "YouTube video imported into Needs Review / Draft.",
      });
      window.location.reload();
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  async function saveTeamPick(form: FormData) {
    setFeedback({ status: "loading", message: "Saving team pick…" });
    try {
      const res = await fetch("/api/reads/team-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_member_id: String(form.get("team_member_id") || ""),
          content_id: String(form.get("content_id") || ""),
          recommendation_type: String(form.get("recommendation_type") || "favorite_book"),
          quote: String(form.get("quote") || ""),
          featured: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Unable to save team pick");
      setFeedback({ status: "success", message: "Team pick saved." });
    } catch (error) {
      setFeedback({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to save team pick",
      });
    }
  }

  async function updatePartner(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    setFeedback({ status: "loading", message: "Updating partnership…" });
    try {
      const res = await fetch("/api/reads/partners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Update failed");
      setFeedback({ status: "success", message: "Partnership updated." });
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "Update failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi title="Needs Review" value={kpis.needsReview} tone="amber" />
        <Kpi title="Drafts" value={kpis.drafts} tone="blue" />
        <Kpi title="Scheduled" value={kpis.scheduled} tone="purple" />
        <Kpi
          title="Published This Month"
          value={kpis.publishedThisMonth}
          tone="emerald"
        />
        <Kpi
          title={role === "admin" ? "Escalations" : "Partner Leads"}
          value={role === "admin" ? kpis.escalations : kpis.partnerLeads}
          tone="orange"
        />
      </div>

      <ActionFeedback state={feedback} />

      {(tab === "overview" || !tab || tab === "My Assignments") && (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">Quick actions</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <form
              className="space-y-3 rounded-2xl border border-slate-100 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void createDraft(new FormData(e.currentTarget));
              }}
            >
              <p className="text-sm font-black text-[#0D5C3A]">Create draft</p>
              <input
                name="title"
                required
                placeholder="Title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              />
              <select
                name="content_type"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
                defaultValue="book"
              >
                <option value="book">Book</option>
                <option value="magazine">Magazine</option>
                <option value="podcast">Podcast</option>
                <option value="video">Video</option>
                <option value="author">Author</option>
              </select>
              <textarea
                name="editorial_summary"
                placeholder="Editorial summary"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              />
              <button
                type="submit"
                className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-black text-white"
              >
                Save draft
              </button>
            </form>

            <form
              className="space-y-3 rounded-2xl border border-slate-100 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void importYoutube(new FormData(e.currentTarget));
              }}
            >
              <p className="text-sm font-black text-[#0D5C3A]">
                Import YouTube (manual URL / ID)
              </p>
              <input
                name="urlOrId"
                required
                placeholder="https://youtube.com/watch?v=… or video ID"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              />
              <input
                name="title"
                placeholder="Optional title override"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              />
              <button
                type="submit"
                className="rounded-full bg-[#E86A17] px-4 py-2 text-sm font-black text-white"
              >
                Import for review
              </button>
            </form>
          </div>
        </section>
      )}

      {tab === "team-picks" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">Team Picks</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void saveTeamPick(new FormData(e.currentTarget));
            }}
          >
            <select
              name="team_member_id"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              defaultValue=""
            >
              <option value="" disabled>
                Team member
              </option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} — {m.role_label}
                </option>
              ))}
            </select>
            <select
              name="content_id"
              required
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              defaultValue=""
            >
              <option value="" disabled>
                Content item
              </option>
              {rows.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.content_type}] {c.title}
                </option>
              ))}
            </select>
            <select
              name="recommendation_type"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"
              defaultValue="favorite_book"
            >
              <option value="favorite_book">Favorite Book</option>
              <option value="favorite_magazine">Favorite Magazine</option>
              <option value="favorite_podcast">Favorite Podcast</option>
              <option value="favorite_video">Favorite SitGuru Video</option>
              <option value="additional">Additional</option>
            </select>
            <textarea
              name="quote"
              required
              placeholder="Why I recommend it"
              rows={3}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold md:col-span-2"
            />
            <button
              type="submit"
              className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-black text-white"
            >
              Save team pick
            </button>
          </form>
        </section>
      ) : null}

      {(tab === "partnerships" || tab === "escalations") && role !== "intern" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">
            {tab === "escalations" ? "Escalations" : "Partnership pipeline"}
          </h2>
          <div className="mt-4 space-y-3">
            {(tab === "escalations"
              ? partners.filter((p) => p.escalated_to_admin)
              : partners
            ).map((partner) => (
              <div
                key={partner.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#163127]">{partner.name}</p>
                    <p className="text-sm font-semibold text-slate-600">
                      {partner.partner_type} · {partner.status}
                      {partner.organization ? ` · ${partner.organization}` : ""}
                    </p>
                    {partner.email ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Private contact on file
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === partner.id}
                      onClick={() =>
                        void updatePartner(partner.id, {
                          status: "under_review",
                        })
                      }
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
                    >
                      Under review
                    </button>
                    <button
                      type="button"
                      disabled={busyId === partner.id}
                      onClick={() =>
                        void updatePartner(partner.id, {
                          status: "active_partner",
                        })
                      }
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Active partner
                    </button>
                    {role === "manager" ? (
                      <button
                        type="button"
                        disabled={busyId === partner.id}
                        onClick={() =>
                          void updatePartner(partner.id, {
                            escalated_to_admin: true,
                            escalation_reason:
                              "Sponsorship / legal / financial review needed",
                          })
                        }
                        className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Escalate to Admin
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "analytics" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">Reads analytics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(analytics?.totals || {}).map(([name, count]) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {name}
                </p>
                <p className="mt-2 text-2xl font-black text-[#163127]">
                  {count}
                </p>
              </div>
            ))}
          </div>
          {!Object.keys(analytics?.totals || {}).length ? (
            <p className="mt-3 text-sm font-semibold text-slate-600">
              No Reads analytics events yet. Public page views and plays will
              appear here.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "taxonomy" && role === "admin" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">Taxonomy</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {topics.map((topic) => (
              <li
                key={topic.id}
                className="rounded-xl border border-slate-100 px-3 py-2 text-sm font-semibold"
              >
                {topic.name}{" "}
                <span className="text-slate-400">/{topic.slug}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "settings" && role === "admin" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">
            YouTube / integrations
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            V1 supports manual YouTube URL/video-ID import with review before
            publish. Automated channel sync can be enabled later without changing
            the public content model. Disclosure labels and partner link policies
            are enforced in workflow + RLS.
          </p>
        </section>
      ) : null}

      {!["partnerships", "escalations", "analytics", "taxonomy", "settings", "team-picks"].includes(
        tab,
      ) || tab === "content" || tab === "submissions" || tab === "all" ? (
        <section className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-[#163127]">
            {tab === "overview" ? "Recent content" : "Content queue"}
          </h2>
          <div className="mt-4 space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                      {item.content_type} · {item.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-lg font-black text-[#163127]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                      {item.editorial_summary || item.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role === "intern" &&
                    ["draft", "changes_requested"].includes(item.status) ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void transition(item.id, "submitted")}
                        className="rounded-full bg-[#0D5C3A] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        Submit to Ava
                      </button>
                    ) : null}

                    {role !== "intern" && item.status === "submitted" ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() =>
                            void transition(
                              item.id,
                              "changes_requested",
                              "Please revise metadata/topics.",
                            )
                          }
                          className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 disabled:opacity-60"
                        >
                          Request changes
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void transition(item.id, "approved")}
                          className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                        >
                          Approve
                        </button>
                      </>
                    ) : null}

                    {role !== "intern" &&
                    ["approved", "scheduled"].includes(item.status) ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void transition(item.id, "published")}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                      >
                        Publish
                      </button>
                    ) : null}

                    {role !== "intern" ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() =>
                          void runAction(
                            item.id,
                            () =>
                              fetch(`/api/reads/content/${item.id}/status`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  action: "feature",
                                  featured: !item.featured,
                                  feature_type: item.featured
                                    ? "none"
                                    : "homepage",
                                }),
                              }),
                            item.featured ? "Unfeatured." : "Featured.",
                          ).then(() => {
                            setRows((prev) =>
                              prev.map((row) =>
                                row.id === item.id
                                  ? {
                                      ...row,
                                      featured: !row.featured,
                                      feature_type: row.featured
                                        ? "none"
                                        : "homepage",
                                    }
                                  : row,
                              ),
                            );
                          })
                        }
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                      >
                        {item.featured ? "Unfeature" : "Feature"}
                      </button>
                    ) : null}

                    {role === "admin" ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void transition(item.id, "archived")}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-900 disabled:opacity-60"
                      >
                        Archive (audit)
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length ? (
              <p className="text-sm font-semibold text-slate-600">
                No items in this queue yet.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "amber" | "blue" | "purple" | "emerald" | "orange";
}) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    blue: "border-sky-200 bg-sky-50 text-sky-950",
    purple: "border-violet-200 bg-violet-50 text-violet-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
    orange: "border-orange-200 bg-orange-50 text-orange-950",
  };
  return (
    <div className={`rounded-[1.25rem] border p-4 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-80">
        {title}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
