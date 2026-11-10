import { communityActor, communityWriteError } from './service';
import { resolveRequestUser, mobileCorsHeaders, isMobileAllowedOrigin } from '@/lib/supabase/request-auth';

export async function communityRequestActor(request: Request, write = false) {
  if (write && communityWriteError()) throw new Error(communityWriteError());
  const auth = await resolveRequestUser(request);
  if (!auth) throw new Error('Sign in to continue.');
  if (write) {
    const origin = request.headers.get('origin');
    if (auth.authSource === 'cookie' && (!origin || (origin !== new URL(request.url).origin && !isMobileAllowedOrigin(origin)))) throw new Error('A trusted origin is required.');
  }
  const actor = await communityActor(auth.user);
  if (!actor) throw new Error('Account access could not be verified.');
  return actor;
}
export function communityJson(request: Request, value: unknown, status = 200) {
  return Response.json(value, { status, headers: { ...mobileCorsHeaders(request), 'Cache-Control': 'private, no-store' } });
}
export async function readCommunityJson(request:Request,limit=4096) {
  const reader=request.body?.getReader();if(!reader)throw new Error('Empty request.');
  let size=0;const chunks:Uint8Array[]=[];
  while(true){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>limit){await reader.cancel();throw new Error('Request too large.');}chunks.push(result.value);}
  const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
