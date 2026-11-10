import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { COMMUNITY_BUCKET } from '@/lib/community-studio/service';
import { communityRequestActor, communityJson, readCommunityJson } from '@/lib/community-studio/api-access';
import { sanitizeCommunityMedia } from '@/lib/community-studio/media-sanitize';
import { mobileCorsHeaders } from '@/lib/supabase/request-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function OPTIONS(request: Request) { return new Response(null, { status: 204, headers: mobileCorsHeaders(request) }); }
export async function POST(request: Request) {
  try {
    const actor = await communityRequestActor(request, true);
    if (Number(request.headers.get('content-length')) > 4096) throw new Error('Upload request too large.');
    const body = await readCommunityJson(request);
    if (body.action === 'prepare') {
      const extension = String(body.name || '').split('.').pop()?.toLowerCase() || '';
      const mime = ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',mov:'video/quicktime'} as Record<string,string>)[extension];
      if (!mime || !Number.isInteger(body.size) || body.size < 1 || body.size > 25 * 1024 * 1024) throw new Error('Choose a JPG, PNG, WebP, MP4 or MOV up to 25 MB.');
      const { count, error: limitError } = await supabaseAdmin.from('community_studio_uploads').select('id', { count: 'exact', head: true }).eq('user_id', actor.user.id).gte('created_at', new Date(Date.now()-86400000).toISOString());
      if (limitError || (count || 0) >= 30) throw new Error('Upload limit reached or storage is unavailable.');
      const path = `${actor.user.id}/raw-${randomUUID()}.${extension}`;
      const { data: row, error } = await supabaseAdmin.from('community_studio_uploads').insert({user_id:actor.user.id,raw_path:path,mime,size_bytes:body.size}).select('id').single();
      if (error || !row) throw new Error('Upload could not start. Apply the isolated media migration.');
      const { data, error: signing } = await supabaseAdmin.storage.from(COMMUNITY_BUCKET).createSignedUploadUrl(path);
      if (signing || !data) throw new Error('Private upload could not start.');
      return communityJson(request, {uploadId:row.id,path,signedUrl:data.signedUrl,mime});
    }
    if (body.action !== 'verify') throw new Error('Choose a valid upload action.');
    const { data: row } = await supabaseAdmin.from('community_studio_uploads').select('*').eq('id',String(body.uploadId)).eq('user_id',actor.user.id).maybeSingle();
    if (!row || Date.parse(row.created_at) < Date.now()-3600000) throw new Error('Upload expired. Choose your file again.');
    if (row.safe_path) return communityJson(request,{mediaPath:row.safe_path,mediaMime:row.mime});
    const { data: original, error } = await supabaseAdmin.storage.from(COMMUNITY_BUCKET).download(row.raw_path);
    if (error || !original || original.size !== row.size_bytes) throw new Error('Uploaded file size does not match.');
    const safe = await sanitizeCommunityMedia(new Uint8Array(await original.arrayBuffer()),row.mime);
    const path = `${actor.user.id}/${randomUUID()}.${safe.extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(COMMUNITY_BUCKET).upload(path,safe.bytes,{contentType:safe.mime,upsert:false});
    if (uploadError) throw new Error('Processed media could not be stored.');
    const { error: saveError } = await supabaseAdmin.from('community_studio_uploads').update({safe_path:path,mime:safe.mime,verified_at:new Date().toISOString()}).eq('id',row.id).eq('user_id',actor.user.id);
    if (saveError) { await supabaseAdmin.storage.from(COMMUNITY_BUCKET).remove([path]); throw new Error('Media verification could not be saved.'); }
    await supabaseAdmin.storage.from(COMMUNITY_BUCKET).remove([row.raw_path]);
    return communityJson(request,{mediaPath:path,mediaMime:safe.mime});
  } catch(error) { return communityJson(request,{error:error instanceof Error ? error.message : 'Upload failed.'},400); }
}
