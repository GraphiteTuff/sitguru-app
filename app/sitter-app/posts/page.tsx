"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type SitterRow = {
  id: string;
  profile_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
};

type PostRow = {
  id: string;
  author_profile_id: string;
  audience: "public" | "followers" | "booking_private";
  post_type: "photo" | "video" | "story" | "update" | "text";
  caption?: string | null;
  is_provider_post: boolean;
  is_pet_post: boolean;
  is_story: boolean;
  status: "draft" | "published" | "hidden" | "flagged";
  created_at: string;
  updated_at: string;
};

type PostMediaRow = {
  id: string;
  post_id: string;
  media_type: "image" | "video";
  file_url: string;
  thumbnail_url?: string | null;
  sort_order: number;
  created_at: string;
};

type PostWithMedia = PostRow & {
  media: PostMediaRow[];
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLocation(city?: string | null, state?: string | null) {
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return "Location not listed";
}

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

function getMediaType(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Card className="p-8 text-center">
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </Card>
  );
}

export default function GuruPostsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [sitter, setSitter] = useState<SitterRow | null>(null);
  const [posts, setPosts] = useState<PostWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<"public" | "followers" | "booking_private">("public");
  const [postType, setPostType] = useState<"photo" | "video" | "story" | "update" | "text">(
    "photo"
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  async function loadPage() {
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/login");
      return;
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, account_type, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profileRow) {
      setError(profileError?.message || "Could not load guru profile.");
      setLoading(false);
      return;
    }

    const normalizedRole = String(profileRow.role || "").toLowerCase();
    const normalizedAccountType = String(profileRow.account_type || "").toLowerCase();

    const allowed =
      ["sitter", "walker", "caretaker", "provider", "admin"].includes(normalizedRole) ||
      normalizedAccountType.includes("provider") ||
      normalizedAccountType.includes("sitter") ||
      normalizedAccountType.includes("walker") ||
      normalizedAccountType.includes("caretaker");

    if (!allowed) {
      router.push("/dashboard");
      return;
    }

    setProfile(profileRow as ProfileRow);

    const { data: sitterRow, error: sitterError } = await supabase
      .from("sitters")
      .select("id, profile_id, slug, full_name, title, city, state, image_url, is_active")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (sitterError) {
      setError(sitterError.message);
      setLoading(false);
      return;
    }

    if (sitterRow) {
      setSitter(sitterRow as SitterRow);
    }

    const { data: postRows, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("author_profile_id", user.id)
      .eq("is_provider_post", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    const safePosts = (postRows as PostRow[]) || [];
    const postIds = safePosts.map((post) => post.id);

    let mediaRows: PostMediaRow[] = [];

    if (postIds.length > 0) {
      const { data: mediaData, error: mediaError } = await supabase
        .from("post_media")
        .select("*")
        .in("post_id", postIds)
        .order("sort_order", { ascending: true });

      if (mediaError) {
        setError(mediaError.message);
        setLoading(false);
        return;
      }

      mediaRows = (mediaData as PostMediaRow[]) || [];
    }

    const mediaMap = new Map<string, PostMediaRow[]>();

    mediaRows.forEach((item) => {
      const existing = mediaMap.get(item.post_id) || [];
      existing.push(item);
      mediaMap.set(item.post_id, existing);
    });

    const mergedPosts: PostWithMedia[] = safePosts.map((post) => ({
      ...post,
      media: mediaMap.get(post.id) || [],
    }));

    setPosts(mergedPosts);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    const nextPreviewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(nextPreviewUrls);

    return () => {
      nextPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => getMediaType(file) !== null).slice(0, 6);
    setSelectedFiles(validFiles);
  }

  async function uploadPostMedia(postId: string) {
    const uploadedMedia: Omit<PostMediaRow, "id" | "created_at">[] = [];

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      const mediaType = getMediaType(file);

      if (!mediaType) continue;

      const extension = getFileExtension(file.name) || (mediaType === "image" ? "jpg" : "mp4");
      const safeName = `${postId}/${Date.now()}-${index}.${extension}`;

      const { error: uploadError } = await supabase.storage.from("post-media").upload(safeName, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-media").getPublicUrl(safeName);

      uploadedMedia.push({
        post_id: postId,
        media_type: mediaType,
        file_url: publicUrl,
        thumbnail_url: null,
        sort_order: index,
      });
    }

    if (uploadedMedia.length > 0) {
      const { error: mediaInsertError } = await supabase.from("post_media").insert(uploadedMedia);

      if (mediaInsertError) {
        throw new Error(mediaInsertError.message);
      }
    }
  }

  async function handlePublish(event: FormEvent) {
    event.preventDefault();

    if (!profile?.id) return;

    if (!caption.trim() && selectedFiles.length === 0) {
      setError("Add a caption or upload at least one image or video.");
      return;
    }

    setPublishing(true);
    setError("");
    setSuccess("");

    try {
      const { data: insertedPost, error: postError } = await supabase
        .from("posts")
        .insert({
          author_profile_id: profile.id,
          audience,
          post_type: postType,
          caption: caption.trim() || null,
          is_provider_post: true,
          is_pet_post: false,
          is_story: postType === "story",
          status: "published",
        })
        .select("*")
        .single();

      if (postError || !insertedPost) {
        throw new Error(postError?.message || "Could not create post.");
      }

      await uploadPostMedia(insertedPost.id);

      setCaption("");
      setAudience("public");
      setPostType("photo");
      setSelectedFiles([]);
      setSuccess("Post published successfully.");
      await loadPage();
    } catch (publishError) {
      const message =
        publishError instanceof Error ? publishError.message : "Something went wrong.";
      setError(message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeletePost(postId: string) {
    setError("");
    setSuccess("");

    const existingPost = posts.find((post) => post.id === postId);

    if (!existingPost) return;

    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const storagePaths: string[] = [];

    existingPost.media.forEach((item) => {
      try {
        const url = new URL(item.file_url);
        const match = url.pathname.match(/\/storage\/v1\/object\/public\/post-media\/(.+)$/);
        if (match?.[1]) {
          storagePaths.push(decodeURIComponent(match[1]));
        }
      } catch {
        // ignore bad urls
      }
    });

    if (storagePaths.length > 0) {
      await supabase.storage.from("post-media").remove(storagePaths);
    }

    setSuccess("Post deleted.");
    await loadPage();
  }

  const stats = useMemo(() => {
    const published = posts.filter((post) => post.status === "published").length;
    const stories = posts.filter((post) => post.is_story).length;
    const mediaCount = posts.reduce((sum, post) => sum + post.media.length, 0);
    const publicPosts = posts.filter((post) => post.audience === "public").length;

    return {
      totalPosts: posts.length,
      published,
      stories,
      mediaCount,
      publicPosts,
    };
  }, [posts]);

  const displayName =
    sitter?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Guru";

  const publicProfileHref = sitter?.slug
    ? `/sitter/${sitter.slug}`
    : sitter?.id
    ? `/sitter/${sitter.id}`
    : "/search";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading guru posts...</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru Social</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Guru Posts
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Share photos, videos, care highlights, and story-style updates to build trust and make
              your profile feel active, modern, and personal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={publicProfileHref}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              View Public Profile
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-sm">
                  {sitter?.image_url ? (
                    <img src={sitter.image_url} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-3xl font-black text-slate-400">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-900">{displayName}</h2>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">
                    {sitter?.title || "Trusted local pet guru"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatLocation(sitter?.city, sitter?.state)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {stats.publicPosts} public posts
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {stats.mediaCount} media items
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Total Posts</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.totalPosts}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Published</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.published}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Public</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.publicPosts}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Stories</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.stories}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Media Items</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.mediaCount}</p>
          </Card>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-500">Create a post</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Share your care style</h2>
            <p className="mt-2 text-sm text-slate-600">
              Showcase walks, routines, pet-safe spaces, happy updates, trust-building content, or story moments.
            </p>
          </div>

          <form onSubmit={handlePublish} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                placeholder="Write something warm, trustworthy, and personal about the pets you care for..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Audience</label>
                <select
                  value={audience}
                  onChange={(e) =>
                    setAudience(e.target.value as "public" | "followers" | "booking_private")
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers</option>
                  <option value="booking_private">Booking Private</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Post Type</label>
                <select
                  value={postType}
                  onChange={(e) =>
                    setPostType(e.target.value as "photo" | "video" | "story" | "update" | "text")
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                  <option value="story">Story</option>
                  <option value="update">Update</option>
                  <option value="text">Text</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Upload images or videos
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-700"
              />
              <p className="mt-2 text-xs text-slate-500">Up to 6 files per post.</p>
            </div>

            {previewUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {previewUrls.map((url, index) => {
                  const file = selectedFiles[index];
                  const mediaType = file ? getMediaType(file) : null;

                  return (
                    <div
                      key={`${url}-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      <div className="relative aspect-square">
                        {mediaType === "image" ? (
                          <Image
                            src={url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <video
                            src={url}
                            className="h-full w-full object-cover"
                            controls
                            muted
                            playsInline
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={publishing}
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {publishing ? "Publishing..." : "Publish Post"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCaption("");
                  setAudience("public");
                  setPostType("photo");
                  setSelectedFiles([]);
                  setError("");
                  setSuccess("");
                }}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Your Recent Posts</h2>
            <p className="mt-2 text-sm text-slate-600">
              Public posts show on your guru profile and help customers trust your care style.
            </p>
          </div>

          <Link
            href={publicProfileHref}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Preview Public Feed
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            body="Create your first guru post with a photo, video, or short update so your public profile feels active and trustworthy."
          />
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {post.post_type}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {post.audience}
                        </span>
                        {post.is_story ? (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            Story
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm text-slate-500">
                        Published {formatDateTime(post.created_at)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>

                  {post.caption ? (
                    <p className="text-base leading-7 text-slate-700">{post.caption}</p>
                  ) : null}

                  {post.media.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {post.media.map((item) => (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                        >
                          <div className="relative aspect-square">
                            {item.media_type === "image" ? (
                              <Image
                                src={item.file_url}
                                alt="Guru post media"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <video
                                src={item.file_url}
                                className="h-full w-full object-cover"
                                controls
                                playsInline
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
