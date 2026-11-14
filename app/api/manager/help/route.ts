import { NextRequest, NextResponse } from "next/server";
import { resolveRequestUser, mobileCorsHeaders, optionsWithMobileCors } from "@/lib/supabase/request-auth";
import { resolveAdminIdentityForUser } from "@/lib/admin/access";
import { canUseGrowthPortal } from "@/lib/admin/growth/access";
import { MANAGER_HELP_ARTICLES, MANAGER_HELP_CATEGORIES, managerHelpArticle } from "@/lib/manager/manager-help";
import { searchManagerHelp } from "@/lib/manager/manager-help-search";

export const dynamic="force-dynamic";
export function OPTIONS(req:NextRequest){return optionsWithMobileCors(req);}
function reply(req:NextRequest,data:unknown,status=200) {
  return NextResponse.json(data,{status,headers:{...mobileCorsHeaders(req),"Cache-Control":"private, no-store"}});
}
/** Native Manager Help + desktop web share the same reviewed, searchable knowledge base. */
export async function GET(req:NextRequest) {
  const identity=await resolveRequestUser(req);
  if(!identity)return reply(req,{error:"Sign in with a SitGuru manager account."},401);
  if(!identity.user.email_confirmed_at)return reply(req,{error:"Verify your SitGuru account email."},403);
  const admin=await resolveAdminIdentityForUser(identity.user);
  if(!canUseGrowthPortal(admin))return reply(req,{error:"Growth Manager or Super Admin access required."},403);
  const slug=(req.nextUrl.searchParams.get("slug")||"").slice(0,120).trim();
  if(slug){
    const article=managerHelpArticle(slug);
    if(!article)return reply(req,{error:"Help article not found."},404);
    return reply(req,{article});
  }
  const query=(req.nextUrl.searchParams.get("q")||"").slice(0,220);
  const category=(req.nextUrl.searchParams.get("category")||"all").slice(0,100);
  const hits=searchManagerHelp(query,category,query?20:MANAGER_HELP_ARTICLES.length);
  const articles=hits.map(hit=>({
    slug:hit.article.slug,title:hit.article.title,summary:hit.article.summary,
    category:hit.article.category,stepCount:hit.article.steps.length,
    excerpt:hit.excerpt,
  }));
  return reply(req,{query,articles,categories:MANAGER_HELP_CATEGORIES,count:articles.length,total:MANAGER_HELP_ARTICLES.length});
}
