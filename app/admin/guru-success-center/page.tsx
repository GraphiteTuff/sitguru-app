// app/admin/guru-success-center/page.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ResourceType = "guide" | "tip" | "policy" | "form" | "video";
type ResourceStatus = "draft" | "published";

type GuruSuccessResourceRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: ResourceType;
  status: ResourceStatus;
  tags: string[] | null;
  keywords: string[] | null;
  video_url: string | null;
  thumbnail_url: string | null;
  href: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type AdminGuruResource = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ResourceType;
  status: ResourceStatus;
  tags: string[];
  keywords: string[];
  videoUrl: string;
  thumbnailUrl: string;
  href: string;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const resourceTypes: { label: string; value: ResourceType }[] = [
  { label: "Guide", value: "guide" },
  { label: "Tip", value: "tip" },
  { label: "Policy", value: "policy" },
  { label: "Form", value: "form" },
  { label: "Video", value: "video" },
];

const categories = [
  "Bookings",
  "Earnings",
  "Profile Growth",
  "Care Standards",
  "Communication",
  "Payments",
  "Training Videos",
  "Forms",
  "Trust & Safety",
  "Policies",
  "General",
];

function mapRowToResource(row: GuruSuccessResourceRow): AdminGuruResource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    type: row.resource_type,
    status: row.status,
    tags: row.tags || [],
    keywords: row.keywords || [],
    videoUrl: row.video_url || "",
    thumbnailUrl: row.thumbnail_url || "",
    href: row.href || "",
    featured: row.featured,
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  if (!value) return "Unknown";

  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Unknown";
  }
}

function getTypeLabel(type: ResourceType) {
  const match = resourceTypes.find((item) => item.value === type);
  return match?.label || "Resource";
}

function getStatusLabel(status: ResourceStatus) {
  return status === "published" ? "Published" : "Draft";
}

export default function AdminGuruSuccessCenterPage() {
  const [resources, setResources] = useState<AdminGuruResource[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceType>("guide");
  const [selectedStatus, setSelectedStatus] = useState<ResourceStatus>("draft");
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [featured, setFeatured] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredResources = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return resources;

    return resources.filter((resource) => {
      const haystack = [
        resource.title,
        resource.description,
        resource.category,
        resource.type,
        resource.status,
        ...resource.tags,
        ...resource.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [resources, search]);

  const publishedCount = resources.filter((resource) => resource.status === "published").length;
  const draftCount = resources.filter((resource) => resource.status === "draft").length;
  const videoCount = resources.filter((resource) => resource.type === "video").length;

  async function loadResources() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("guru_success_resources")
      .select(
        "id,title,description,category,resource_type,status,tags,keywords,video_url,thumbnail_url,href,featured,sort_order,created_at,updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setResources([]);
      setLoading(false);
      return;
    }

    setResources(((data || []) as GuruSuccessResourceRow[]).map(mapRowToResource));
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, []);

  async function handleCreateResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const tags = splitList(String(formData.get("tags") || ""));
    const keywords = splitList(String(formData.get("keywords") || ""));
    const videoUrl = String(formData.get("videoUrl") || "").trim();
    const thumbnailUrl = String(formData.get("thumbnailUrl") || "").trim();
    const href = String(formData.get("href") || "").trim();
    const sortOrderRaw = String(formData.get("sortOrder") || "0").trim();
    const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0;

    if (!title || !description) {
      setSaving(false);
      setErrorMessage("Please add a title and description.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      title,
      description,
      category: selectedCategory,
      resource_type: selectedType,
      status: selectedStatus,
      tags,
      keywords,
      video_url: videoUrl || null,
      thumbnail_url: thumbnailUrl || null,
      href: href || null,
      featured,
      sort_order: sortOrder,
      created_by: user?.id || null,
    };

    const { error } = await supabase.from("guru_success_resources").insert(payload);

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    form.reset();
    setSelectedType("guide");
    setSelectedStatus("draft");
    setSelectedCategory(categories[0]);
    setFeatured(false);
    setStatusMessage("Resource saved successfully.");
    await loadResources();
    setSaving(false);
  }

  async function updateResource(
    resourceId: string,
    updates: Partial<{
      status: ResourceStatus;
      featured: boolean;
      sort_order: number;
    }>,
  ) {
    setStatusMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("guru_success_resources")
      .update(updates)
      .eq("id", resourceId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStatusMessage("Resource updated.");
    await loadResources();
  }

  async function toggleStatus(resource: AdminGuruResource) {
    await updateResource(resource.id, {
      status: resource.status === "published" ? "draft" : "published",
    });
  }

  async function toggleFeatured(resource: AdminGuruResource) {
    await updateResource(resource.id, {
      featured: !resource.featured,
    });
  }

  async function deleteResource(resourceId: string) {
    const confirmed = window.confirm("Delete this Guru Success Center resource?");

    if (!confirmed) return;

    setStatusMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("guru_success_resources")
      .delete()
      .eq("id", resourceId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStatusMessage("Resource deleted.");
    await loadResources();
  }

  return (
    <main className="ags-page">
      <section className="ags-shell">
        <div className="ags-topbar">
          <div>
            <p className="ags-eyebrow">Admin Tools</p>
            <div role="heading" aria-level={1} className="ags-page-title">
              Guru Success Center Manager
            </div>
            <p className="ags-page-copy">
              Add and organize Guru resources, guides, forms, policies, tips, and future
              YouTube-style training videos.
            </p>
          </div>

          <div className="ags-top-actions">
            <Link href="/guru/success-center" className="ags-secondary-link">
              View Success Center
            </Link>
            <Link href="/admin" className="ags-secondary-link">
              Back to Admin
            </Link>
          </div>
        </div>

        <div className="ags-stat-grid">
          <div className="ags-stat-card">
            <p>Total Resources</p>
            <strong>{resources.length}</strong>
          </div>
          <div className="ags-stat-card">
            <p>Published</p>
            <strong>{publishedCount}</strong>
          </div>
          <div className="ags-stat-card">
            <p>Drafts</p>
            <strong>{draftCount}</strong>
          </div>
          <div className="ags-stat-card">
            <p>Training Videos</p>
            <strong>{videoCount}</strong>
          </div>
        </div>

        {statusMessage ? <div className="ags-success-message">{statusMessage}</div> : null}
        {errorMessage ? <div className="ags-error-message">{errorMessage}</div> : null}

        <div className="ags-grid">
          <section className="ags-card">
            <p className="ags-eyebrow">Create Content</p>
            <div role="heading" aria-level={2} className="ags-section-title">
              Add a Guru resource
            </div>
            <p className="ags-section-copy">
              This form now saves to Supabase. Published resources can be shown on the Guru Success
              Center page, while drafts stay hidden until you publish them.
            </p>

            <form onSubmit={handleCreateResource} className="ags-form">
              <label className="ags-field">
                <span>Title</span>
                <input
                  name="title"
                  placeholder="Example: How to Get More Repeat Bookings"
                  required
                />
              </label>

              <label className="ags-field">
                <span>Description</span>
                <textarea
                  name="description"
                  placeholder="Describe what this resource teaches or helps Gurus do..."
                  rows={5}
                  required
                />
              </label>

              <div className="ags-two-column">
                <label className="ags-field">
                  <span>Category</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="ags-field">
                  <span>Type</span>
                  <select
                    value={selectedType}
                    onChange={(event) => setSelectedType(event.target.value as ResourceType)}
                  >
                    {resourceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="ags-two-column">
                <label className="ags-field">
                  <span>Status</span>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value as ResourceStatus)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>

                <label className="ags-check-field">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                  />
                  <span>Feature this resource</span>
                </label>
              </div>

              <div className="ags-two-column">
                <label className="ags-field">
                  <span>Tags</span>
                  <input name="tags" placeholder="bookings, profile, earnings, safety" />
                </label>

                <label className="ags-field">
                  <span>Search Keywords</span>
                  <input name="keywords" placeholder="money, get booked, trust, pet parent" />
                </label>
              </div>

              <div className="ags-two-column">
                <label className="ags-field">
                  <span>Resource Link</span>
                  <input name="href" placeholder="/guru/success-center/example-resource" />
                </label>

                <label className="ags-field">
                  <span>Sort Order</span>
                  <input name="sortOrder" type="number" placeholder="0" />
                </label>
              </div>

              <div className="ags-video-box">
                <div>
                  <p className="ags-video-title">Video fields</p>
                  <p className="ags-video-copy">
                    Use these for YouTube, Vimeo, or uploaded training videos in the future.
                  </p>
                </div>

                <label className="ags-field">
                  <span>Video URL</span>
                  <input name="videoUrl" placeholder="https://youtube.com/..." />
                </label>

                <label className="ags-field">
                  <span>Thumbnail URL</span>
                  <input name="thumbnailUrl" placeholder="https://..." />
                </label>
              </div>

              <button type="submit" className="ags-primary-button" disabled={saving}>
                {saving ? "Saving..." : "Add Resource"}
              </button>
            </form>
          </section>

          <section className="ags-card">
            <div className="ags-list-header">
              <div>
                <p className="ags-eyebrow">Content Library</p>
                <div role="heading" aria-level={2} className="ags-section-title">
                  Manage resources
                </div>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="ags-library-search"
                placeholder="Search resources..."
              />
            </div>

            {loading ? (
              <div className="ags-empty-state">Loading Guru Success Center resources...</div>
            ) : (
              <div className="ags-resource-list">
                {filteredResources.map((resource) => (
                  <article key={resource.id} className="ags-resource-card">
                    <div className="ags-resource-top">
                      <div>
                        <div className="ags-pill-row">
                          <span>{resource.category}</span>
                          <span>{getTypeLabel(resource.type)}</span>
                          <span>{getStatusLabel(resource.status)}</span>
                          {resource.featured ? <span>Featured</span> : null}
                        </div>

                        <div role="heading" aria-level={3} className="ags-resource-title">
                          {resource.title}
                        </div>
                      </div>
                    </div>

                    <p className="ags-resource-copy">{resource.description}</p>

                    <div className="ags-small-meta">
                      Created {formatDate(resource.createdAt)} · Updated {formatDate(resource.updatedAt)}
                    </div>

                    {resource.tags.length > 0 ? (
                      <div className="ags-tag-row">
                        {resource.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}

                    {resource.keywords.length > 0 ? (
                      <div className="ags-keyword-row">
                        <strong>Keywords:</strong> {resource.keywords.join(", ")}
                      </div>
                    ) : null}

                    {resource.href ? (
                      <div className="ags-keyword-row">
                        <strong>Link:</strong> {resource.href}
                      </div>
                    ) : null}

                    {resource.type === "video" ? (
                      <div className="ags-video-preview">
                        <div
                          className="ags-video-thumbnail"
                          style={
                            resource.thumbnailUrl
                              ? {
                                  backgroundImage: `url(${resource.thumbnailUrl})`,
                                }
                              : undefined
                          }
                        >
                          {resource.thumbnailUrl ? "" : "Video thumbnail placeholder"}
                        </div>
                        <p>{resource.videoUrl || "No video URL added yet"}</p>
                      </div>
                    ) : null}

                    <div className="ags-resource-actions">
                      <button type="button" onClick={() => toggleStatus(resource)}>
                        {resource.status === "published" ? "Move to Draft" : "Publish"}
                      </button>
                      <button type="button" onClick={() => toggleFeatured(resource)}>
                        {resource.featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteResource(resource.id)}
                        className="ags-danger-button"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}

                {filteredResources.length === 0 ? (
                  <div className="ags-empty-state">No resources match that search yet.</div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </section>

      <style jsx global>{`
        .ags-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .ags-page *,
        .ags-page *::before,
        .ags-page *::after {
          box-sizing: border-box;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .ags-shell {
          width: min(100%, 1380px);
          margin: 0 auto;
          padding: 28px 20px 52px;
        }

        .ags-topbar,
        .ags-card,
        .ags-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
        }

        .ags-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 22px;
          padding: 28px;
          margin-bottom: 22px;
        }

        .ags-eyebrow {
          margin: 0;
          color: #059669;
          font-size: 13px;
          font-weight: 750;
          letter-spacing: 0.02em;
        }

        .ags-page-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 0.98;
          font-weight: 760;
          letter-spacing: -0.05em;
        }

        .ags-page-copy,
        .ags-section-copy,
        .ags-resource-copy,
        .ags-video-copy {
          color: #475569;
          line-height: 1.65;
        }

        .ags-page-copy {
          max-width: 760px;
          margin: 12px 0 0;
          font-size: 16px;
        }

        .ags-top-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ags-secondary-link,
        .ags-primary-button,
        .ags-resource-actions button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
        }

        .ags-secondary-link {
          min-height: 44px;
          padding: 0 18px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
        }

        .ags-secondary-link:hover {
          background: #f8fafc;
        }

        .ags-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .ags-stat-card {
          padding: 20px;
        }

        .ags-stat-card p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }

        .ags-stat-card strong {
          display: block;
          margin-top: 8px;
          color: #0f172a;
          font-size: 34px;
          line-height: 1;
          font-weight: 760;
          letter-spacing: -0.045em;
        }

        .ags-success-message,
        .ags-error-message {
          margin-bottom: 18px;
          border-radius: 20px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 750;
        }

        .ags-success-message {
          border: 1px solid #bbf7d0;
          background: #ecfdf5;
          color: #047857;
        }

        .ags-error-message {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .ags-grid {
          display: grid;
          grid-template-columns: minmax(360px, 0.85fr) minmax(0, 1.15fr);
          gap: 22px;
          align-items: start;
        }

        .ags-card {
          padding: 24px;
        }

        .ags-section-title {
          margin-top: 8px;
          color: #0f172a;
          font-size: 25px;
          line-height: 1.12;
          font-weight: 750;
          letter-spacing: -0.04em;
        }

        .ags-section-copy {
          margin: 10px 0 0;
          font-size: 15px;
        }

        .ags-form {
          display: grid;
          gap: 16px;
          margin-top: 22px;
        }

        .ags-field {
          display: grid;
          gap: 8px;
        }

        .ags-field span,
        .ags-check-field span {
          color: #334155;
          font-size: 13px;
          font-weight: 750;
        }

        .ags-field input,
        .ags-field textarea,
        .ags-field select,
        .ags-library-search {
          width: 100%;
          border: 1px solid #dbe3ef;
          border-radius: 18px;
          background: #ffffff;
          color: #0f172a;
          font-size: 15px;
          font-weight: 600;
          outline: none;
        }

        .ags-field input,
        .ags-field select,
        .ags-library-search {
          min-height: 50px;
          padding: 0 15px;
        }

        .ags-field textarea {
          resize: vertical;
          padding: 14px 15px;
        }

        .ags-field input:focus,
        .ags-field textarea:focus,
        .ags-field select:focus,
        .ags-library-search:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.14);
        }

        .ags-two-column {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .ags-check-field {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 50px;
          padding: 0 15px;
          border: 1px solid #dbe3ef;
          border-radius: 18px;
          background: #ffffff;
        }

        .ags-check-field input {
          height: 18px;
          width: 18px;
          accent-color: #059669;
        }

        .ags-video-box {
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid #dbeafe;
          border-radius: 22px;
          background: #eff6ff;
        }

        .ags-video-title {
          margin: 0;
          color: #1e3a8a;
          font-size: 14px;
          font-weight: 800;
        }

        .ags-video-copy {
          margin: 4px 0 0;
          color: #475569;
          font-size: 13px;
        }

        .ags-primary-button {
          min-height: 54px;
          border: 0;
          background: #059669;
          color: #ffffff;
        }

        .ags-primary-button:hover {
          background: #047857;
        }

        .ags-primary-button:disabled {
          cursor: not-allowed;
          opacity: 0.72;
        }

        .ags-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 20px;
        }

        .ags-library-search {
          max-width: 280px;
        }

        .ags-resource-list {
          display: grid;
          gap: 14px;
        }

        .ags-resource-card {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 24px;
          padding: 18px;
        }

        .ags-resource-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }

        .ags-pill-row,
        .ags-tag-row,
        .ags-resource-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ags-pill-row span,
        .ags-tag-row span {
          display: inline-flex;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 750;
        }

        .ags-resource-title {
          margin-top: 13px;
          color: #0f172a;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 750;
          letter-spacing: -0.035em;
        }

        .ags-resource-copy {
          margin: 10px 0 0;
          font-size: 14px;
        }

        .ags-small-meta,
        .ags-keyword-row {
          margin-top: 10px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .ags-keyword-row strong {
          color: #334155;
        }

        .ags-tag-row {
          margin-top: 14px;
        }

        .ags-video-preview {
          margin-top: 14px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid #dbeafe;
          background: #ffffff;
        }

        .ags-video-thumbnail {
          display: flex;
          min-height: 110px;
          align-items: center;
          justify-content: center;
          background-color: #0f172a;
          background-size: cover;
          background-position: center;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
        }

        .ags-video-preview p {
          margin: 0;
          padding: 12px;
          color: #64748b;
          font-size: 13px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .ags-resource-actions {
          margin-top: 16px;
        }

        .ags-resource-actions button {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          padding: 10px 14px;
        }

        .ags-resource-actions button:hover {
          background: #ecfdf5;
          border-color: #10b981;
          color: #047857;
        }

        .ags-resource-actions .ags-danger-button:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #b91c1c;
        }

        .ags-empty-state {
          padding: 18px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: #f8fafc;
          color: #64748b;
          font-size: 14px;
          font-weight: 650;
        }

        @media (max-width: 1100px) {
          .ags-grid,
          .ags-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .ags-shell {
            padding: 18px 14px 42px;
          }

          .ags-topbar,
          .ags-list-header {
            flex-direction: column;
            align-items: stretch;
          }

          .ags-stat-grid,
          .ags-grid,
          .ags-two-column {
            grid-template-columns: 1fr;
          }

          .ags-library-search {
            max-width: none;
          }
        }
      `}</style>
    </main>
  );
}
