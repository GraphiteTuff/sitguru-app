import { supabaseAdmin } from '@/lib/supabase/admin';
import type { CommunityActor } from './service';
import { parentDecisionPatch } from './rights';

export async function verifiedBookingParent(bookingId: string, actor: CommunityActor) {
  const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id',bookingId).maybeSingle();
  if (!booking || ['cancelled','canceled','declined'].includes(booking.status)) return '';
  const assigned = String(booking.guru_id || booking.provider_id || booking.sitter_id || '');
  if (!actor.guruIds.includes(assigned)) return '';
  const parent = String(booking.customer_id || booking.pet_owner_id || booking.user_id || '');
  return parent && parent !== actor.user.id ? parent : '';
}

export async function loadParentPermissions(actor: CommunityActor) {
  const { data, error } = await supabaseAdmin.from('community_studio_submissions').select('*').eq('parent_user_id',actor.user.id).order('created_at',{ascending:false}).limit(100);
  if (error) throw new Error('Permission requests are unavailable. Check the isolated migration.');
  return (data || []).map(row => ({id:row.id,submissionId:row.id,title:row.title,story:row.story,
    mediaUrl: row.image_path ? `/api/community-studio/media/${row.id}` : '', mediaMime:row.image_mime,
    requesterName:row.submitter_name,publicConsent:row.public_consent,socialConsent:row.social_consent,
    status:row.parent_permission_status,updatedAt:row.updated_at}));
}

export async function decideParentPermission(actor: CommunityActor, input: {id:string;updatedAt:string;decision:string;publicConsent:boolean;socialConsent:boolean}) {
  const { data: row } = await supabaseAdmin.from('community_studio_submissions').select('*').eq('id',input.id).eq('parent_user_id',actor.user.id).maybeSingle();
  if (!row || row.updated_at !== input.updatedAt) throw new Error('This request changed or is not assigned to your account. Refresh before deciding.');
  // Recheck booking ownership; a Guru-supplied checkbox or arbitrary account ID is never authority.
  const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id',row.booking_id).maybeSingle();
  const owner = String(booking?.customer_id || booking?.pet_owner_id || booking?.user_id || '');
  if (owner !== actor.user.id) throw new Error('Pet Parent booking ownership could not be verified.');
  const patch = parentDecisionPatch(input.decision,input.publicConsent,input.socialConsent && row.social_consent === true);
  const { data, error } = await supabaseAdmin.from('community_studio_submissions').update({...patch,updated_by:actor.user.id}).eq('id',row.id).eq('parent_user_id',actor.user.id).eq('updated_at',input.updatedAt).select('*').maybeSingle();
  if (error || !data) throw new Error('This request changed. Refresh and try again.');
  return data;
}
