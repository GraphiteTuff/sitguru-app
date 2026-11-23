import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { communityRequestActor, readCommunityJson } from "@/lib/community-studio/api-access";
import type { CommunityActor } from "@/lib/community-studio/service";
import { getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import {
  matchGuruCandidates,buildGuruDirectory,normalizeMatchFilters,type GuruDirectoryEntry,type GuruMatch,type MatchFilters,type GuruCandidate,type ServiceRow,
} from "./matching";

const SITE="https://www.sitguru.com";
const CHANNELS = ["facebook","instagram","tiktok","x","other"] as const;
export type ShareChannel = typeof CHANNELS[number];
export type CampaignStatus = "pending_review"|"approved"|"rejected"|"archived";
export type CampaignRow = {
  id:string; code:string; guru_id:string; created_by_user_id:string;
  intern_id:string|null; city:string; state:string;radius_miles:number;
  service_key:string; pet_type:string;channel:ShareChannel;
  reply_text:string;status:CampaignStatus;approved_at:string|null;
  created_at:string;shared_reported_at:string|null;
};
export type CampaignMetrics = {
  linkOpens:number;qrOpens:number;profileClicks:number;inquiryClicks:number;
  copyIntents:number;sharesReported:number;
};
export type CampaignView = CampaignRow & {
  guru: {name:string; city:string;state:string;slug:string;photoUrl:string|null};
  metrics:CampaignMetrics; shareUrl:string; qrUrl:string; cardUrl:string;
};
export type GuruMatchDashboard = {
  matches:GuruMatch[]; directory:GuruDirectoryEntry[]; campaigns:CampaignView[]; totals:CampaignMetrics;
  period:"90d"; matchesNotice:string;
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clean(v:unknown){return typeof v==="string"?v.trim():"";}
function isUuid(v:string){return uuid.test(v);}
function emptyMetrics():CampaignMetrics{return {linkOpens:0,qrOpens:0,profileClicks:0,inquiryClicks:0,copyIntents:0,sharesReported:0};}
function channelOf(v:unknown):ShareChannel{return CHANNELS.includes(v as ShareChannel)?v as ShareChannel:"other";}
function initialsName(v:unknown){const names=clean(v).split(/\s+/).filter(Boolean);return names.length>1?`${names[0]} ${names[names.length-1][0]}.`:names[0]||"SitGuru Guru";}
function safeGuruSlug(v:unknown){const s=clean(v);return /^[a-z0-9][a-z0-9-]{0,120}$/i.test(s)?s:"";}
function photoUrl(v:unknown){const s=clean(v);return s.startsWith("https://")?s:null;}
export const guruMatchPublicUrl=(code:string,channel:ShareChannel="other")=>`${SITE}/s/g/${code}?via=${channel}`;
export const guruMatchQrUrl=(code:string)=>`${SITE}/s/g/${code}?via=qr`;
export const guruMatchQrImage=(code:string)=>`${SITE}/api/guru-match/qr/${code}`;
export const guruMatchCardImage=(code:string)=>`${SITE}/api/guru-match/card/${code}`;
export function isCode(code:string){return /^[A-Za-z0-9_-]{16,48}$/.test(code);}

/** Cookie + bearer auth share the same existing Community Studio staff roles. */
export async function guruMatchActor(request:Request,write=false) {
  const actor=await communityRequestActor(request,write);
  if(!actor.canModerate && !actor.intern) throw new Error("Growth staff access required.");
  if(actor.intern && !actor.canModerate){
    const intern=actor.intern;
    if (intern.userId && intern.userId!==actor.user.id) throw new Error("Assigned intern account required.");
    const onboarding=await getInternOnboarding(intern.id);
    if (!internOnboardingComplete(onboarding)) throw new Error("Complete intern onboarding first.");
  }
  return actor;
}
export async function readMatchBody(request:Request) {
  const body=await readCommunityJson(request,4096);
  return body && typeof body==="object"&&!Array.isArray(body)
    ? body as Record<string,unknown>:{};
}
async function permittedCreatorIds(actor:CommunityActor){
  if(actor.isSuperUser)return null;
  if(!actor.canModerate)return [actor.user.id];
  const {data,error}=await supabaseAdmin.from("internship_interns")
    .select("user_id").eq("manager_user_id",actor.user.id).limit(150);
  if(error) return [actor.user.id];
  return [actor.user.id,...(data||[]).map(x=>clean(x.user_id)).filter(isUuid)];
}

const GURU_SELECT="id,slug,display_name,full_name,name,city,state,service_city,service_state,service_latitude,service_longitude,service_radius_miles,service_area_enabled,services,experience_years,years_experience,profile_photo_url,avatar_url,photo_url,image_url,is_active,is_public,is_bookable,is_public_visible,is_accepting_bookings,accepting_bookings,is_archived,is_test_account,is_demo,status";

async function loadAllGuruCandidates():Promise<{gurus:GuruCandidate[]; rates:ServiceRow[]}>{
  const gurus:GuruCandidate[]=[];
  // Explicitly paginate: a hard .limit(300) silently hides Gurus as the marketplace grows.
  for(let start=0;start<10000;start+=500){
    const {data,error}=await supabaseAdmin.from("gurus").select(GURU_SELECT)
      .order("id",{ascending:true}).range(start,start+499);
    if(error)throw new Error("Could not load SitGuru's Guru directory.");
    gurus.push(...(data||[]) as GuruCandidate[]);
    if((data||[]).length<500)break;
  }
  const rates:ServiceRow[]=[];
  for(let start=0;start<20000;start+=500){
    const {data,error}=await supabaseAdmin.from("guru_service_rates")
      .select("guru_id,service_key,is_enabled").order("guru_id",{ascending:true})
      .order("service_key",{ascending:true}).range(start,start+499);
    if(error)throw new Error("Could not load Guru service selections.");
    rates.push(...(data||[]) as ServiceRow[]);
    if((data||[]).length<500)break;
  }
  return {gurus,rates};
}
export async function findEligibleGuruMatches(filters:MatchFilters):Promise<GuruMatch[]>{
  const {gurus,rates}=await loadAllGuruCandidates();
  return matchGuruCandidates(filters,gurus,rates);
}
export async function loadCampaignDashboard(actor:CommunityActor,filters:MatchFilters|null):Promise<GuruMatchDashboard>{
  const ids=await permittedCreatorIds(actor);
  let q=supabaseAdmin.from("guru_match_share_campaigns").select("*").order("created_at",{ascending:false}).limit(100);
  if(ids)q=q.in("created_by_user_id",ids);
  const [{data:rows,error:campaignError}, candidates]=await Promise.all([
    q,loadAllGuruCandidates(),
  ]);
  const directory=buildGuruDirectory(candidates.gurus,candidates.rates);
  const matches=filters?matchGuruCandidates(filters,candidates.gurus,candidates.rates):[];
  if(campaignError)throw new Error("Guru outreach reporting is not configured.");
  const campaigns=(rows||[]) as CampaignRow[];
  const guruIds=[...new Set(campaigns.map(c=>c.guru_id))];
  const [guruResult,eventResult]=await Promise.all([
    guruIds.length?supabaseAdmin.from("gurus").select("id,slug,display_name,full_name,name,city,state,profile_photo_url,avatar_url").in("id",guruIds)
      :Promise.resolve({data:[],error:null}),
    campaigns.length?supabaseAdmin.from("guru_match_share_events").select("share_id,event_type")
      .in("share_id",campaigns.map(c=>c.id))
      .gte("created_at",new Date(Date.now()-90*86400000).toISOString()).limit(10000)
      :Promise.resolve({data:[],error:null}),
  ]);
  if(guruResult.error||eventResult.error)throw new Error("Unable to load outreach activity.");
  const guruMap=new Map((guruResult.data||[]).map(g=>[g.id,g]));
  const byCampaign=new Map<string,CampaignMetrics>();
  const totals=emptyMetrics();
  const mapEvent:Record<string,keyof CampaignMetrics>={
    link_open:"linkOpens",qr_open:"qrOpens",profile_click:"profileClicks",
    inquiry_click:"inquiryClicks",copy_intent:"copyIntents",shared_reported:"sharesReported",
  };
  for(const event of eventResult.data||[]){
    const key=mapEvent[clean(event.event_type)];
    if(!key)continue;
    if(!byCampaign.has(event.share_id))byCampaign.set(event.share_id,emptyMetrics());
    const metric=byCampaign.get(event.share_id)!;
    metric[key]++;totals[key]++;
  }
  return {
    matches,directory,
    campaigns:campaigns.map(c=>{
      const g=guruMap.get(c.guru_id);
      return {...c,
        guru:{name:initialsName(g?.display_name||g?.full_name||g?.name),city:clean(g?.city),
          state:clean(g?.state),slug:safeGuruSlug(g?.slug),photoUrl:photoUrl(g?.profile_photo_url||g?.avatar_url)},
        metrics:byCampaign.get(c.id)||emptyMetrics(),
        shareUrl:guruMatchPublicUrl(c.code,c.channel),qrUrl:guruMatchQrImage(c.code),cardUrl:guruMatchCardImage(c.code),
      };
    }),
    totals, period:"90d",
    matchesNotice:filters?
      "All registered Gurus are in the directory. Only currently bookable Gurus matching the chosen service, pet needs and recorded coverage can be promoted.":
      "Browse the complete Guru directory below, then enter a city, state and service to find promotable local matches.",
  };
}
export async function makeGuruShare(actor:CommunityActor,input:Record<string,unknown>){
  const filters=normalizeMatchFilters(input);
  const guruId=clean(input.guruId);
  const channel=channelOf(input.channel);
  if(!filters||!isUuid(guruId))throw new Error("Choose a city, state, service and eligible Guru.");
  const matches=await findEligibleGuruMatches(filters);
  const guru=matches.find(g=>g.id===guruId);
  if(!guru)throw new Error("This Guru does not currently meet the selected location, service and pet requirements.");
  const code=randomBytes(16).toString("base64url");
  const reply=`Hi! If you're looking for ${guru.serviceLabel.toLowerCase()} in ${filters.city}, ${filters.state}, SitGuru can help you find local pet care. Meet ${guru.name} and check their services and availability: ${guruMatchPublicUrl(code,channel)} 🐾`;
  const manager=actor.canModerate;
  const status:CampaignStatus=manager?"approved":"pending_review";
  const {data,error}=await supabaseAdmin.from("guru_match_share_campaigns").insert({
    code,guru_id:guru.id,created_by_user_id:actor.user.id,
    intern_id:!manager&&actor.intern?actor.intern.id:null,
    city:filters.city,state:filters.state,radius_miles:filters.radius,
    service_key:filters.service,pet_type:filters.pet,channel,reply_text:reply,
    status,approved_by_user_id:manager?actor.user.id:null,
    approved_at:manager?new Date().toISOString():null,
  }).select("id,code,status,reply_text").single();
  if(error||!data)throw new Error("The Guru promotion could not be saved.");
  return {id:data.id,code:data.code,status:data.status,replyText:data.reply_text,
    shareUrl:guruMatchPublicUrl(code,channel),cardUrl:guruMatchCardImage(code),qrUrl:guruMatchQrImage(code)};
}
export async function updateGuruShare(actor:CommunityActor,input:Record<string,unknown>){
  const id=clean(input.id),action=clean(input.action);
  if(!isUuid(id))throw new Error("Select an outreach card.");
  const {data,error}=await supabaseAdmin.from("guru_match_share_campaigns")
    .select("id,created_by_user_id,status,channel,guru_id").eq("id",id).maybeSingle();
  if(error||!data)throw new Error("Outreach card not found.");
  const creators=await permittedCreatorIds(actor);
  if(creators&&!creators.includes(data.created_by_user_id))throw new Error("Not authorized to manage this outreach card.");
  if(action==="approve"||action==="reject"){
    if(!actor.canModerate)throw new Error("Only a Manager or Admin can approve outreach.");
    if(data.status!=="pending_review")throw new Error("This draft has already been reviewed.");
    // Manager can approve only assigned team drafts; the creator may not self-approve.
    if(data.created_by_user_id===actor.user.id)throw new Error("Self-approval is not allowed.");
    const next=action==="approve"?"approved":"rejected";
    const {error:change}=await supabaseAdmin.from("guru_match_share_campaigns").update({
      status:next,approved_at:action==="approve"?new Date().toISOString():null,
      approved_by_user_id:actor.user.id,updated_at:new Date().toISOString(),
    }).eq("id",id).eq("status","pending_review");
    if(change)throw new Error("Review could not be saved.");
    return {ok:true,status:next};
  }
  if(action==="copy"||action==="shared"){
    if(data.status!=="approved")throw new Error("Only approved outreach may be shared.");
    const eventType=action==="copy"?"copy_intent":"shared_reported";
    const {error:write}=await supabaseAdmin.from("guru_match_share_events").insert({
      share_id:id,event_type:eventType,source:channelOf(data.channel),
    });
    if(write)throw new Error("This outreach action could not be recorded.");
    if(action==="shared")await supabaseAdmin.from("guru_match_share_campaigns")
      .update({shared_reported_at:new Date().toISOString()}).eq("id",id);
    return {ok:true,status:"approved"};
  }
  throw new Error("Unsupported outreach action.");
}
export async function findApprovedShare(code:string){
  if(!isCode(code))return null;
  const {data,error}=await supabaseAdmin.from("guru_match_share_campaigns")
    .select("id,code,guru_id,status,city,state,radius_miles,service_key,pet_type,channel").eq("code",code).eq("status","approved").maybeSingle();
  if(error||!data)return null;
  const {data:g,error:gError}=await supabaseAdmin.from("gurus")
    .select("id,slug,display_name,full_name,name,city,state,service_city,service_state,services,profile_photo_url,avatar_url,is_active,is_public,is_bookable,status")
    .eq("id",data.guru_id).maybeSingle();
  if(gError||!g||g.is_bookable!==true)return null;
  const slug=safeGuruSlug(g.slug);if(!slug)return null;
  // An approved card must stop working if the Guru later disables a service
  // or leaves the original service radius. Never silently promote stale coverage.
  const filters=normalizeMatchFilters({
    city:data.city,state:data.state,service:data.service_key,pet:data.pet_type,
    radius:data.radius_miles,
  });
  if(!filters)return null;
  const eligible=await findEligibleGuruMatches(filters);
  if(!eligible.some(item=>item.id===data.guru_id))return null;
  return {...data,guru:{slug,name:initialsName(g.display_name||g.full_name||g.name),
    city:clean(g.city),state:clean(g.state),photoUrl:photoUrl(g.profile_photo_url||g.avatar_url)}};
}
export async function logPublicShareEvent(shareId:string,eventType:"link_open"|"qr_open"|"profile_click"|"inquiry_click",source:ShareChannel|"qr"){
  const {error}=await supabaseAdmin.from("guru_match_share_events").insert({
    share_id:shareId,event_type:eventType,source,
  });
  if(error)console.warn("Guru share event not recorded",error.code);
}
