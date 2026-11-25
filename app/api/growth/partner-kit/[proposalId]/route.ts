import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { strToU8, zipSync } from "fflate";
import QRCode from "qrcode";
import { canAccessPartnerProposal, getPartnerProposalActor, PROPOSAL_PATHS, type ProposalMode } from "@/lib/admin/growth/partner-proposal-access";
import { isPortalUserId } from "@/lib/internship/manager-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const origin = "https://www.sitguru.com";
const platforms = ["Facebook", "Instagram", "TikTok", "X", "YouTube"];

function escapeMarkup(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export async function GET(request: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const mode = new URL(request.url).searchParams.get("mode") || "";
  if (!isPortalUserId(proposalId) || !Object.hasOwn(PROPOSAL_PATHS, mode)) return new Response("Not found", { status: 404 });
  const actor = await getPartnerProposalActor(mode as ProposalMode);
  if (!actor) return new Response("Partnership access required.", { status: 403 });
  const { data: proposal } = await supabaseAdmin.from("growth_partner_proposals")
    .select("id,intern_id,owner_user_id,name,partner_id,status,deliverables")
    .eq("id", proposalId).maybeSingle();
  if (!proposal || !canAccessPartnerProposal(actor, proposal)) return new Response("Not found", { status: 404 });

  const [brand, materials, referral] = await Promise.all([
    readFile(join(process.cwd(), "public/images/brand/intern/sitguru-logo-horizontal.jpg")),
    supabaseAdmin.from("growth_partner_proposal_events").select("note,evidence_url")
      .eq("proposal_id", proposal.id).eq("event_type", "material").order("created_at", { ascending: false }).limit(50),
    proposal.partner_id ? supabaseAdmin.from("referral_codes").select("code")
      .eq("partner_id", proposal.partner_id).eq("status","active").order("created_at").limit(1).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (materials.error || referral.error) return new Response("Marketing kit is temporarily unavailable.", { status: 503 });

  const tracked = Boolean(referral.data?.code);
  const url = tracked ? `${origin}/r/${encodeURIComponent(referral.data!.code)}` : origin;
  const qr = await QRCode.toBuffer(url, { width: 600, margin: 3 });
  const name = String(proposal.name);
  const fileNotes = (materials.data || []).map((entry) =>
    [entry.note, entry.evidence_url].filter(Boolean).join("\n"),
  ).join("\n\n");
  const body = [
    `SitGuru marketing kit for ${name}`,
    `Agreement status: ${proposal.status}`,
    proposal.status === "proposed" ? "Draft assets for review. Confirm written acceptance and placement permission before publication." : "Confirm copy and placement with your SitGuru contact.",
    tracked ? `Existing referral URL: ${url}` : `General SitGuru URL: ${url}. This kit has no partner referral attribution until an existing code is linked.`,
    String(proposal.deliverables || ""),
  ].filter(Boolean).join("\n\n");
  const embed = `<a href="${escapeMarkup(url)}"><img src="${origin}/images/brand/intern/sitguru-logo-horizontal.jpg" alt="Visit SitGuru" width="300"></a>\n`;
  const flyer = `<!doctype html><html lang="en"><meta charset="utf-8"><title>SitGuru flyer</title>
<style>body{font:18px system-ui;max-width:640px;margin:3rem auto;text-align:center;color:#10583f}img{max-width:100%}</style>
<img src="sitguru-logo.jpg" width="400" alt="SitGuru"><h1>Find trusted pet care</h1>
<p>Scan the code to explore SitGuru.</p><img src="sitguru-qr.png" width="280" alt="SitGuru website QR code">
<p><a href="${escapeMarkup(url)}">${escapeMarkup(url)}</a></p></html>`;
  const captions = platforms.map((platform) =>
    `${platform}\nDiscover SitGuru and find pet care for your routine. Explore at ${url}`,
  ).join("\n\n");
  const artifact = zipSync({
    "read-me.txt": strToU8(body),
    "sitguru-logo.jpg": brand,
    "sitguru-qr.png": qr,
    "print-flyer.html": strToU8(flyer),
    "website-embed.html": strToU8(embed),
    "social-caption-drafts.txt": strToU8(captions),
    "shared-marketing-assets.txt": strToU8(fileNotes || "No shared assets recorded."),
  });
  return new Response(new Uint8Array(artifact), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="sitguru-partner-marketing-kit.zip"',
      "Cache-Control": "private, no-store",
    },
  });
}
