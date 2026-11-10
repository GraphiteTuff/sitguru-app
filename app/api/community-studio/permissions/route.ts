import { communityRequestActor, communityJson, readCommunityJson } from '@/lib/community-studio/api-access';
import { loadParentPermissions, decideParentPermission } from '@/lib/community-studio/parent-permissions';
import { communitySignals } from '@/lib/community-studio/service';
import { mobileCorsHeaders } from '@/lib/supabase/request-auth';
export const dynamic = 'force-dynamic';
export async function OPTIONS(request: Request) { return new Response(null,{status:204,headers:mobileCorsHeaders(request)}); }
export async function GET(request: Request) {
  try { return communityJson(request,{items:await loadParentPermissions(await communityRequestActor(request))}); }
  catch(error) { return communityJson(request,{error:error instanceof Error ? error.message : 'Permission requests unavailable.'},400); }
}
export async function POST(request: Request) {
  try {
    const actor = await communityRequestActor(request,true);
    const input = await readCommunityJson(request,2048);
    if (typeof input.publicConsent !== 'boolean' || typeof input.socialConsent !== 'boolean') throw new Error('Choose each permission separately.');
    const row = await decideParentPermission(actor,input);
    await communitySignals(actor,row,'parent_permission');
    return communityJson(request,{ok:true});
  } catch(error) { return communityJson(request,{error:error instanceof Error ? error.message : 'Permission could not be saved.'},400); }
}
