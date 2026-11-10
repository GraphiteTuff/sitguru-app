import { loadCommunityWorkspaceForActor, loadPublishedCommunityItems, reviewCommunitySubmissionForActor, saveCommunitySubmissionForActor } from "@/lib/community-studio/operations";
import { communityActor, communityConfigured, communityWriteError } from "@/lib/community-studio/service";
import { isMobileAllowedOrigin, mobileCorsHeaders, resolveRequestUser } from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

async function boundedForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty submission");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 5 * 1024 * 1024) { await reader.cancel(); throw new Error("Submission too large"); }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") || "" }, body }).formData();
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: mobileCorsHeaders(request) });
}

export async function GET(request: Request) {
  const headers = { ...mobileCorsHeaders(request), "Cache-Control": "private, no-store" };
  const mode = new URL(request.url).searchParams.get("mode") || "member";
  if (mode === "public") return Response.json({ items: await loadPublishedCommunityItems() }, { headers });
  if (!communityConfigured()) return Response.json({ error: "Community Studio is not configured." }, { status: 503, headers });
  const resolved = await resolveRequestUser(request);
  if (!resolved) return Response.json({ error: "Sign in to open Community Studio." }, { status: 401, headers });
  if (!["member", "manager", "intern"].includes(mode)) return Response.json({ error: "Choose a valid workspace." }, { status: 400, headers });
  const actor = await communityActor(resolved.user);
  if (mode === "manager" && !actor?.canModerate) return Response.json({ error: "Manager access is required." }, { status: 403, headers });
  return Response.json(await loadCommunityWorkspaceForActor(mode as "member" | "manager" | "intern", actor), { headers });
}

export async function POST(request: Request) {
  const headers = { ...mobileCorsHeaders(request), "Cache-Control": "private, no-store" };
  const blocked = communityWriteError();
  if (blocked) return Response.json({ ok: false, error: blocked, message: "" }, { status: 503, headers });
  if (!communityConfigured()) return Response.json({ ok: false, error: "Community Studio is not configured.", message: "" }, { status: 503, headers });
  const origin = request.headers.get("origin") || "";
  // Cookie requests need a trusted Origin. Native clients authenticate with Bearer and may omit it.
  if (origin && origin !== new URL(request.url).origin && !isMobileAllowedOrigin(origin)) return Response.json({ ok: false, error: "Origin is not allowed.", message: "" }, { status: 403, headers });
  const resolved = await resolveRequestUser(request);
  if (!resolved) return Response.json({ ok: false, error: "Sign in to submit your story.", message: "" }, { status: 401, headers });
  if (resolved.authSource === "cookie" && !origin) return Response.json({ ok: false, error: "A trusted request origin is required.", message: "" }, { status: 403, headers });
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 5 * 1024 * 1024) return Response.json({ ok: false, error: "The upload is too large. Use a photo up to 4 MB.", message: "" }, { status: 413, headers });
  try {
    const form = await boundedForm(request);
    const actor = await communityActor(resolved.user);
    const result = form.get("operation") === "review" ? await reviewCommunitySubmissionForActor(form, actor) : await saveCommunitySubmissionForActor(form, actor);
    return Response.json(result, { status: result.ok ? 200 : 400, headers });
  } catch {
    return Response.json({ ok: false, error: "The submission could not be processed.", message: "" }, { status: 400, headers });
  }
}
