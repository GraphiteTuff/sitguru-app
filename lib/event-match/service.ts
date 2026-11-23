import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { communityRequestActor, readCommunityJson } from "@/lib/community-studio/api-access";
import type { CommunityActor } from "@/lib/community-studio/service";
import { getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import { fetchPublicEvents, fetchPublicEventBySlug } from "@/lib/community/queries";
import { fetchDiscoveredHomepageEvents } from "@/lib/community/discovered-events";
import { buildEventShareCaptionSocial } from "@/lib/community/share";
import { getBrandedSocialGraphicUrl } from "@/lib/community/social-assets";
import type { CommunityEventWithPartner } from "@/lib/community/types";
import {getEventPromotionInfo,eventPromotionExpiry,type EventPromotionCategoryId} from "@/lib/community/event-taxonomy";

const SITE = "https://www.sitguru.com";
export const EVENT_SHARE_CHANNELS = ["facebook","instagram","tiktok","x","other"] as const;
export type EventShareChannel = typeof EVENT_SHARE_CHANNELS[number];
export type EventShareStatus = "pending_review" | "approved" | "rejected" | "archived";
export type EventShareMetrics = {linkOpens:number;qrOpens:number;eventClicks:number;copyIntents:number;sharesReported:number};
export type EventPromotionItem = {
  id:string;slug:string;title:string;startAt:string;endAt:string|null;
  venue:string;city:string;state:string;county:string;image:string|null;
  isFree:boolean;petFriendly:boolean;source:"discovered"|"partner";
  category:EventPromotionCategoryId;categoryLabel:string;recommendedAudience:string;
  recommendedGroup:string;promotionAngle:string;
};
export type EventShareCampaign = {
  id:string;code:string;event_id:string;event_slug:string;event_title:string;
  event_start_at:string;city:string|null;state:string|null;
  created_by_user_id:string;intern_id:string|null;channel:EventShareChannel;
  target_group:string;reply_text:string;status:EventShareStatus;
  approved_at:string|null;created_at:string;shared_reported_at:string|null;
};
export type EventShareView = EventShareCampaign & {
  event:EventPromotionItem|null;metrics:EventShareMetrics;
  shareUrl:string;qrUrl:string;cardUrl:string;
};
export type EventShareDashboard = {events:EventPromotionItem[];campaigns:EventShareView[];totals:EventShareMetrics;period:"90d"};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const codePattern = /^[A-Za-z0-9_-]{16,48}$/;
const clean = (value:unknown):string => typeof value==="string" ? value.trim() : "";
const validUuid = (value:string):boolean => uuid.test(value);
const channelOf = (value:unknown):EventShareChannel => EVENT_SHARE_CHANNELS.includes(value as EventShareChannel) ? value as EventShareChannel : "other";
const emptyMetrics = ():EventShareMetrics => ({linkOpens:0,qrOpens:0,eventClicks:0,copyIntents:0,sharesReported:0});
const metricFor:Record<string,keyof EventShareMetrics> = {
  link_open:"linkOpens",qr_open:"qrOpens",event_click:"eventClicks",
  copy_intent:"copyIntents",shared_reported:"sharesReported",
};

export const eventShareUrl = (code:string,source:EventShareChannel|"qr"="other") => SITE + "/s/e/" + encodeURIComponent(code) + "?via=" + source;
export const eventQrImageUrl = (code:string) => SITE + "/api/event-match/qr/" + encodeURIComponent(code);
export const eventCardImageUrl = (code:string) => SITE + "/api/event-match/card/" + encodeURIComponent(code);
export const validShareCode = (code:string) => codePattern.test(code);

export function eventStillLive(event:CommunityEventWithPartner):boolean {
  if(event.status!=="published" || event.cancelled_at) return false;
  return eventPromotionExpiry(event) > Date.now();
}
export function promotionItem(event:CommunityEventWithPartner):EventPromotionItem {
  const type=getEventPromotionInfo(event);
  return {
    id:event.id,slug:event.slug,title:event.title,startAt:event.start_at,endAt:event.end_at,
    venue:event.venue_name||"",city:event.city||"",state:event.state||"",
    county:event.featured_market_city||event.city||"",
    image:event.image_card_url||event.image_hero_url||event.image_original_url||null,
    isFree:event.is_free,petFriendly:event.pet_friendly,
    category:type.id,categoryLabel:type.label,recommendedAudience:type.audience,
    recommendedGroup:type.group,promotionAngle:type.angle,
    source:event.event_type==="google_discovery"?"discovered":"partner",
  };
}
export function filterEventPromotions(events:EventPromotionItem[],query:Record<string,unknown>):EventPromotionItem[]{
  const city=clean(query.city).toLowerCase(),state=clean(query.state).toLowerCase();
  const search=clean(query.q).toLowerCase(),category=clean(query.category);
  return events.filter(e=>
    (!category||category==="all"||e.category===category) &&
    (!state||e.state.toLowerCase()===state) &&
    (!city||[e.city,e.county,e.venue].some(field=>field.toLowerCase().includes(city))) &&
    (!search||[e.title,e.city,e.county,e.venue].some(field=>field.toLowerCase().includes(search)))
  );
}
async function loadPromotionEvents():Promise<EventPromotionItem[]> {
  // The homepage includes discovered events, not only manually published partner events.
  const from=new Date(Date.now()-72*3600000).toISOString();
  const [partner,discovered] = await Promise.all([
    fetchPublicEvents({limit:250,from}),
    fetchDiscoveredHomepageEvents({limit:250,homepageEligibleOnly:false,from}),
  ]);
  const found = new Map<string,EventPromotionItem>();
  for(const event of [...partner,...discovered.events]){
    if(eventStillLive(event)) found.set(event.slug,promotionItem(event));
  }
  return [...found.values()].sort((a,b)=>a.startAt.localeCompare(b.startAt)||a.title.localeCompare(b.title));
}
/** Cookie and mobile bearer auth share Community Studio's existing manager/intern rules. */
export async function eventMatchActor(request:Request,write=false):Promise<CommunityActor>{
  const actor=await communityRequestActor(request,write);
  if(!actor.canModerate&&!actor.intern) throw new Error("Growth staff access required.");
  if(actor.intern&&!actor.canModerate){
    if(actor.intern.userId&&actor.intern.userId!==actor.user.id) throw new Error("Assigned intern account required.");
    const onboarding=await getInternOnboarding(actor.intern.id);
    if(!internOnboardingComplete(onboarding)) throw new Error("Complete intern onboarding first.");
  }
  return actor;
}
async function visibleCreatorIds(actor:CommunityActor):Promise<string[]|null>{
  if(actor.isSuperUser)return null;
  if(!actor.canModerate)return [actor.user.id];
  const {data,error}=await supabaseAdmin.from("internship_interns")
    .select("user_id").eq("manager_user_id",actor.user.id).limit(200);
  if(error)return [actor.user.id];
  return [actor.user.id,...(data||[]).map(x=>clean(x.user_id)).filter(validUuid)];
}
export async function readEventMatchBody(request:Request):Promise<Record<string,unknown>>{
  const value=await readCommunityJson(request,4096);
  return value&&typeof value==="object"&&!Array.isArray(value) ? value as Record<string,unknown> : {};
}
export async function loadEventShareDashboard(actor:CommunityActor,filters:Record<string,unknown>):Promise<EventShareDashboard>{
  const ids=await visibleCreatorIds(actor);
  let query=supabaseAdmin.from("event_match_share_campaigns").select("*")
    .order("created_at",{ascending:false}).limit(150);
  if(ids)query=query.in("created_by_user_id",ids);
  const [eventList,campaignResult]=await Promise.all([loadPromotionEvents(),query]);
  if(campaignResult.error)throw new Error("Event outreach reporting is not configured. Apply the database migration.");
  const campaigns=(campaignResult.data||[]) as EventShareCampaign[];
  const eventMap=new Map(eventList.map(event=>[event.slug,event]));
  const expired=campaigns.filter(c=>c.status==="approved"&&!eventMap.has(c.event_slug)).map(c=>c.id);
  // Preserve historical metrics but close old share campaigns automatically as the directory refreshes.
  if(expired.length){
    const {error:archiveError}=await supabaseAdmin.from("event_match_share_campaigns")
      .update({status:"archived",updated_at:new Date().toISOString()})
      .in("id",expired).eq("status","approved");
    if(archiveError)console.warn("Event campaign archive reconciliation failed",archiveError.code);
    else campaigns.forEach(c=>{if(expired.includes(c.id))c.status="archived";});
  }
  const metricsByCampaign=new Map<string,EventShareMetrics>();
  const totals=emptyMetrics();
  if(campaigns.length){
    const {data,error}=await supabaseAdmin.from("event_match_share_events")
      .select("share_id,event_type").in("share_id",campaigns.map(c=>c.id))
      .gte("created_at",new Date(Date.now()-90*86400000).toISOString()).limit(15000);
    if(error)throw new Error("Event outreach activity is unavailable.");
    for(const log of data||[]){
      const metric=metricFor[clean(log.event_type)];
      if(!metric)continue;
      const stats=metricsByCampaign.get(log.share_id)||emptyMetrics();
      stats[metric]++;totals[metric]++;metricsByCampaign.set(log.share_id,stats);
    }
  }
  return {
    events:filterEventPromotions(eventList,filters),
    campaigns:campaigns.map(c=>({
      ...c,
      status:c.status==="approved"&&!eventMap.has(c.event_slug)?"archived":c.status,
      event:eventMap.get(c.event_slug)||null,
      metrics:metricsByCampaign.get(c.id)||emptyMetrics(),
      shareUrl:eventShareUrl(c.code,c.channel),
      qrUrl:eventQrImageUrl(c.code),cardUrl:eventCardImageUrl(c.code),
    })),
    totals,period:"90d",
  };
}
export async function createEventShare(actor:CommunityActor,input:Record<string,unknown>){
  const eventId=clean(input.eventId),channel=channelOf(input.channel);
  const group=clean(input.targetGroup);
  if(!validUuid(eventId)||group.length>120)throw new Error("Select an eligible event and a shorter group name.");
  const all=await loadPromotionEvents();
  const selected=all.find(event=>event.id===eventId);
  if(!selected)throw new Error("This event is no longer eligible for promotion.");
  const live=await fetchPublicEventBySlug(selected.slug);
  if(!live||!eventStillLive(live))throw new Error("This event is no longer published or upcoming.");
  const code=randomBytes(16).toString("base64url");
  const caption=buildEventShareCaptionSocial(live);
  const category=getEventPromotionInfo(live);
  const reply=[
    "🐾 Featured by SitGuru · "+category.label,
    category.angle,
    caption,
    "Discover more local pet events and join the SitGuru community free as a Pet Parent or Guru.",
    "Event details and RSVP: "+eventShareUrl(code,channel),
    "Event organized by its listed host. #SitGuru #LocalPetEvents",
  ].join("\n\n");
  const manager=actor.canModerate;
  const status:EventShareStatus=manager?"approved":"pending_review";
  const {data,error}=await supabaseAdmin.from("event_match_share_campaigns").insert({
    code,event_id:selected.id,event_slug:selected.slug,event_title:selected.title,
    event_start_at:selected.startAt,city:selected.city,state:selected.state,
    created_by_user_id:actor.user.id,intern_id:!manager&&actor.intern?actor.intern.id:null,
    channel,target_group:group,reply_text:reply,status,
    approved_by_user_id:manager?actor.user.id:null,
    approved_at:manager?new Date().toISOString():null,
  }).select("id,code,status").single();
  if(error||!data)throw new Error("Could not save this event promotion.");
  return {id:data.id,code:data.code,status:data.status};
}
export async function updateEventShare(actor:CommunityActor,input:Record<string,unknown>){
  const id=clean(input.id),action=clean(input.action);
  if(!validUuid(id))throw new Error("Select an outreach campaign.");
  const {data,error}=await supabaseAdmin.from("event_match_share_campaigns")
    .select("id,created_by_user_id,status,channel,event_slug").eq("id",id).maybeSingle();
  if(error||!data)throw new Error("Event campaign not found.");
  const ids=await visibleCreatorIds(actor);
  if(ids&&!ids.includes(data.created_by_user_id))throw new Error("Not authorized to manage this campaign.");
  if(action==="approve"||action==="reject"){
    if(!actor.canModerate)throw new Error("Manager or Admin approval required.");
    if(data.created_by_user_id===actor.user.id)throw new Error("Self-approval is not allowed.");
    if(data.status!=="pending_review")throw new Error("This draft has already been reviewed.");
    if(action==="approve"){
      const event=await fetchPublicEventBySlug(data.event_slug);
      if(!event||!eventStillLive(event))throw new Error("This event can no longer be promoted.");
    }
    const status=action==="approve"?"approved":"rejected";
    const {error:change}=await supabaseAdmin.from("event_match_share_campaigns")
      .update({status,approved_by_user_id:actor.user.id,
        approved_at:action==="approve"?new Date().toISOString():null,
        updated_at:new Date().toISOString()})
      .eq("id",id).eq("status","pending_review");
    if(change)throw new Error("Could not save this review.");
    return {ok:true,status};
  }
  if(action==="copy"||action==="shared"){
    if(data.status!=="approved")throw new Error("Only approved event promotions may be shared.");
    const event=await fetchPublicEventBySlug(data.event_slug);
    if(!event||!eventStillLive(event))throw new Error("This event has ended or is no longer public.");
    const eventType=action==="copy"?"copy_intent":"shared_reported";
    const {error:write}=await supabaseAdmin.from("event_match_share_events").insert({
      share_id:id,event_type:eventType,source:channelOf(data.channel),actor_user_id:actor.user.id,
    });
    if(write)throw new Error("This outreach action could not be recorded.");
    if(action==="shared")await supabaseAdmin.from("event_match_share_campaigns")
      .update({shared_reported_at:new Date().toISOString()}).eq("id",id);
    return {ok:true};
  }
  throw new Error("Unsupported event outreach action.");
}
export async function findApprovedEventShare(code:string){
  if(!validShareCode(code))return null;
  const {data,error}=await supabaseAdmin.from("event_match_share_campaigns")
    .select("id,code,event_id,event_slug,channel,status").eq("code",code)
    .eq("status","approved").maybeSingle();
  if(error||!data)return null;
  const event=await fetchPublicEventBySlug(data.event_slug);
  if(!event||!eventStillLive(event)||event.id!==data.event_id)return null;
  return {...data,event};
}
export async function logEventShareActivity(
  id:string,type:"link_open"|"qr_open"|"event_click",
  source:EventShareChannel|"qr",
){
  const {error}=await supabaseAdmin.from("event_match_share_events")
    .insert({share_id:id,event_type:type,source});
  if(error)console.warn("Event share attribution unavailable",error.code);
}
export function eventSocialImage(slug:string){
  return getBrandedSocialGraphicUrl(slug,"landscape");
}
