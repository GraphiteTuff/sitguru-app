import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { communityRequestActor, readCommunityJson } from "@/lib/community-studio/api-access";
import type { CommunityActor } from "@/lib/community-studio/service";
import { getInternOnboarding } from "@/lib/internship/queries";
import { internOnboardingComplete } from "@/lib/internship/onboarding";
import {
  matchGuruCandidates,buildGuruDirectory,normalizeMatchFilters,serviceKeys,isServiceKey,GURU_MATCH_SERVICES,type GuruDirectoryEntry,type GuruMatch,type MatchFilters,type GuruCandidate,type ServiceRow,
} from "./matching";

const SITE="https://www.sitguru.com";
const CHANNELS = ["facebook","instagram","tiktok","x","other"] as const;
export type ShareChannel = typeof CHANNELS[number];
export type CampaignStatus = "pending_review"|"approved"|"rejected"|"archived";
export type GuruSocialGroup = {id:string;name:string;city:string;state:string;channel:ShareChannel;group_url:string;created_at:string};
export type CampaignRow = {
  id:string; code:string; guru_id:string; created_by_user_id:string;
  intern_id:string|null; group_id:string|null; city:string; state:string;radius_miles:number;
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
  matches:GuruMatch[]; directory:GuruDirectoryEntry[]; groups:GuruSocialGroup[]; campaigns:CampaignView[]; totals:CampaignMetrics;
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
  const [{data:rows,error:campaignError}, candidates, groupResult]=await Promise.all([
    q,loadAllGuruCandidates(),
    supabaseAdmin.from("guru_match_social_groups")
      .select("id,name,city,state,channel,group_url,created_at")
      .order("state",{ascending:true}).order("city",{ascending:true})
      .order("name",{ascending:true}).limit(1500),
  ]);
  // Match the Admin Dashboard public-listing count, not its booking-readiness count.
  // Bookability is a separate permission: pending, suspended and incomplete accounts
  // remain visible to authorized staff but are never offered for public promotion.
  const directory=buildGuruDirectory(candidates.gurus.filter(g=>g.is_public===true),candidates.rates);
  const matches=filters?matchGuruCandidates(filters,candidates.gurus,candidates.rates):[];
  if(campaignError)throw new Error("Guru outreach reporting is not configured.");
  if(groupResult.error)throw new Error("Local social group directory is unavailable.");
  const campaigns=(rows||[]) as CampaignRow[];
  const guruIds=[...new Set(campaigns.map(c=>c.guru_id))];
  const [guruResult,eventResult]=await Promise.all([
    guruIds.length?supabaseAdmin.from("gurus").select("id,slug,display_name,full_name,name,city,state,profile_photo_url,avatar_url,photo_url,image_url").in("id",guruIds)
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
    matches,directory,groups:(groupResult.data||[]) as GuruSocialGroup[],
    campaigns:campaigns.map(c=>{
      const g=guruMap.get(c.guru_id);
      return {...c,
        guru:{name:initialsName(g?.display_name||g?.full_name||g?.name),city:clean(g?.city),
          state:clean(g?.state),slug:safeGuruSlug(g?.slug),photoUrl:photoUrl(g?.profile_photo_url||g?.avatar_url||g?.photo_url||g?.image_url)},
        metrics:byCampaign.get(c.id)||emptyMetrics(),
        shareUrl:guruMatchPublicUrl(c.code,c.channel),qrUrl:guruMatchQrImage(c.code),cardUrl:guruMatchCardImage(c.code),
      };
    }),
    totals, period:"90d",
    matchesNotice:filters?
      "All publicly listed profiles can be promoted through the staff library. Individual Guru cards require valid booking and local service eligibility; incomplete profiles use SitGuru discovery cards.":
      "Browse the 72 publicly listed profiles. Guru cards link to verified bookable profiles; the remaining records use tracked SitGuru discovery cards without booking claims.",
  };
}
export async function makeGuruShare(actor:CommunityActor,input:Record<string,unknown>,approvedGuruTemplate=false){
  const filters=normalizeMatchFilters(input);
  const guruId=clean(input.guruId);
  const channel=channelOf(input.channel);
  const groupId=clean(input.groupId);
  if(groupId&&!isUuid(groupId))throw new Error("Invalid local group.");
  if(!filters||!isUuid(guruId))throw new Error("Choose a city, state, service and eligible Guru.");
  const promotionType: "guru"|"community" =
    approvedGuruTemplate && input.promotionType==="community"?"community":"guru";
  const matches=promotionType==="guru"?await findEligibleGuruMatches(filters):[];
  const guru=matches.find(g=>g.id===guruId);
  let unspecifiedGuruName="";
  if(promotionType==="guru"&&!guru){
    if(!approvedGuruTemplate||filters.service!=="custom_care")
      throw new Error("This Guru does not currently meet the selected location, service and pet requirements.");
    const {data:profile,error:profileError}=await supabaseAdmin.from("gurus")
      .select("display_name,full_name,name,slug,service_city,service_state,city,state,is_public,is_bookable,is_archived,status")
      .eq("id",guruId).maybeSingle();
    if(profileError||!profile||profile.is_bookable!==true||profile.is_public!==true||
      profile.is_archived===true||clean(profile.status).toLowerCase()!=="active"||
      !safeGuruSlug(profile.slug))
      throw new Error("The Guru's profile is not ready for public sharing.");
    const localCity=clean(profile.service_city||profile.city);
    const localState=clean(profile.service_state||profile.state).toUpperCase();
    if(localCity.toLowerCase()!==filters.city.toLowerCase()||localState!==filters.state)
      throw new Error("Choose the Guru's actual city before sharing a general profile card.");
    unspecifiedGuruName=initialsName(profile.display_name||profile.full_name||profile.name);
  }
  if(promotionType==="community"){
    const {data:listed,error:listError}=await supabaseAdmin.from("gurus")
      .select("id,is_public,is_archived").eq("id",guruId).maybeSingle();
    if(listError||!listed||listed.is_public!==true||listed.is_archived===true)
      throw new Error("This profile is not available for a SitGuru discovery promotion.");
  }
  const code=randomBytes(16).toString("base64url");
  const reply=promotionType==="guru"&&guru
    ? `Hi! If you're looking for ${guru.serviceLabel.toLowerCase()} in ${filters.city}, ${filters.state}, SitGuru can help you find local pet care. Meet ${guru.name} and check their services and availability: ${guruMatchPublicUrl(code,channel)} 🐾`
    : promotionType==="guru"&&unspecifiedGuruName
      ? `Hi! Meet ${unspecifiedGuruName} on SitGuru near ${filters.city}, ${filters.state}. View their profile to check offered services and current availability: ${guruMatchPublicUrl(code,channel)} 🐾`
      : `Hi! Looking for pet care near ${filters.city}, ${filters.state}? Explore SitGuru to find pet care providers, compare services and check availability: ${guruMatchPublicUrl(code,channel)} 🐾`;
  const manager=actor.canModerate;
  // Pre-approved Guru directory templates are approved by backend eligibility, not by an intern.
  const status:CampaignStatus=(manager||approvedGuruTemplate)?"approved":"pending_review";
  const {data,error}=await supabaseAdmin.from("guru_match_share_campaigns").insert({
    code,guru_id:guruId,promotion_type:promotionType,created_by_user_id:actor.user.id,
    intern_id:!manager&&actor.intern?actor.intern.id:null,group_id:groupId||null,
    city:filters.city,state:filters.state,radius_miles:filters.radius,
    service_key:filters.service,pet_type:filters.pet,channel,reply_text:reply,
    status,approved_by_user_id:manager?actor.user.id:null,
    approved_at:status==="approved"?new Date().toISOString():null,
  }).select("id,code,status,reply_text").single();
  if(error||!data)throw new Error("The Guru promotion could not be saved.");
  return {id:data.id,code:data.code,status:data.status,replyText:data.reply_text,
    shareUrl:guruMatchPublicUrl(code,channel),cardUrl:guruMatchCardImage(code),qrUrl:guruMatchQrImage(code)};
}
/** Auto-available branded Guru card, lazily materialized only when staff opens it.
 * Reuses the same staff/Guru/channel/service campaign instead of creating endless cards.
 * Approval here is for a fixed, administrator-bookable Guru template; custom intern
 * content still follows the existing manager review workflow. */
export async function prepareGuruMiniCard(actor:CommunityActor,input:Record<string,unknown>){
  const guruId=clean(input.guruId);
  if(!isUuid(guruId)) throw new Error("Choose a valid Guru.");
  const channel=channelOf(input.channel);
  const groupId=clean(input.groupId);
  if(groupId && !isUuid(groupId))throw new Error("Select a valid local social group.");
  const groupLookup=groupId?await supabaseAdmin.from("guru_match_social_groups")
    .select("id,name,city,state,channel").eq("id",groupId).maybeSingle():null;
  if(groupLookup?.error || (groupId && !groupLookup?.data))
    throw new Error("The selected local group no longer exists.");
  const group=groupLookup?.data||null;
  if(group&&group.channel!==channel)throw new Error("Choose the same channel as the selected group.");
  const candidates=await loadAllGuruCandidates();
  const guru=candidates.gurus.find(g=>g.id===guruId);
  if(!guru || guru.is_public!==true || guru.is_archived===true)
    throw new Error("This profile is not publicly listed for SitGuru promotion.");
  const available=serviceKeys(guru,candidates.rates);
  const requested=clean(input.service);
  const service=isServiceKey(requested)?requested:
    GURU_MATCH_SERVICES.find(item=>available.has(item.key))?.key || "custom_care";
  const slug=safeGuruSlug(guru.slug);
  const named=Boolean(clean(guru.display_name||guru.full_name||guru.name));
  const canFeatureGuru=guru.is_bookable===true &&
    clean(guru.status).toLowerCase()==="active" && Boolean(slug) && named;
  const promotionType: "guru"|"community"=canFeatureGuru?"guru":"community";
  const unspecifiedPersonal=canFeatureGuru && available.size===0 && service==="custom_care";
  if(canFeatureGuru&&!available.has(service)&&!unspecifiedPersonal)
    throw new Error("The selected Guru service is not enabled.");
  const city=clean(group?.city||guru.service_city||guru.city);
  const state=clean(group?.state||guru.service_state||guru.state).toUpperCase();
  const radiusValue=Number(guru.service_radius_miles);
  const radius=Number.isFinite(radiusValue)&&radiusValue>0
    ?Math.max(1,Math.min(50,Math.floor(radiusValue))):10;
  const filters=normalizeMatchFilters({city,state,service,pet:"any",radius});
  if(!filters)throw new Error("This listing needs a valid city and state before sharing.");
  if(canFeatureGuru&&!unspecifiedPersonal&&
    !matchGuruCandidates(filters,[guru],candidates.rates).some(item=>item.id===guruId))
    throw new Error("This Guru does not serve the selected local area or service. Choose a local group.");
  if(unspecifiedPersonal&&(
    city.toLowerCase()!==clean(guru.service_city||guru.city).toLowerCase()||
    state!==clean(guru.service_state||guru.state).toUpperCase()))
    throw new Error("This Guru needs service information before sharing outside their listed city.");
  let existingQuery=supabaseAdmin.from("guru_match_share_campaigns")
    .select("id,code,reply_text").eq("guru_id",guruId)
    .eq("created_by_user_id",actor.user.id).eq("channel",channel)
    .eq("service_key",service).eq("city",city).eq("state",state)
    .eq("pet_type","any").eq("status","approved").eq("promotion_type",promotionType);
  existingQuery=groupId?existingQuery.eq("group_id",groupId):existingQuery.is("group_id",null);
  const {data:existing,error:queryError}=await existingQuery
    .order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(queryError) throw new Error("Unable to retrieve the approved Guru card.");
  if(existing) return {
    id:existing.id,code:existing.code,status:"approved" as const,
    replyText:existing.reply_text,shareUrl:guruMatchPublicUrl(existing.code,channel),
    cardUrl:guruMatchCardImage(existing.code),qrUrl:guruMatchQrImage(existing.code),
  };
  return makeGuruShare(actor,{
    guruId,city,state,service,pet:"any",radius,channel,groupId,promotionType,
  },true);
}

/** Staff-maintained destination links. Browsing/opening groups is a manual flow;
 * the platform does not assume permission to post in any third-party group. */
export async function addGuruSocialGroup(actor:CommunityActor,input:Record<string,unknown>){
  if(!actor.canModerate)throw new Error("A Manager or Admin must approve group destinations.");
  const name=clean(input.name),city=clean(input.city),state=clean(input.state).toUpperCase();
  const channel=channelOf(input.channel);
  if(name.length<3||name.length>110||city.length<2||city.length>90||
    !/^[A-Z]{2}$/.test(state))throw new Error("Provide a group name, city, and two-letter state.");
  let url:URL;
  try{url=new URL(clean(input.groupUrl));}
  catch{throw new Error("Enter a valid HTTPS group URL.");}
  if(url.protocol!=="https:"||url.username||url.password)throw new Error("Use a secure HTTPS group link.");
  const host=url.hostname.toLowerCase();
  if(channel==="facebook"&&!(
    ["facebook.com","www.facebook.com","m.facebook.com"].includes(host)&&
    /^\/groups\/[^/]+/.test(url.pathname)))
    throw new Error("Please use a direct Facebook group URL (facebook.com/groups/…).");
  if(channel==="x"&&!(
    ["x.com","www.x.com","twitter.com","www.twitter.com"].includes(host)&&
    /^\/i\/communities\/[^/]+/.test(url.pathname)))
    throw new Error("Please use an X Community URL (x.com/i/communities/…).");
  if(channel==="other" && !["facebook.com","www.facebook.com","m.facebook.com","x.com","www.x.com","twitter.com","www.twitter.com","nextdoor.com","www.nextdoor.com","reddit.com","www.reddit.com"].includes(host))
    throw new Error("Use a recognized social community link.");
  url.hash="";
  const normalized=url.toString();
  const {data:existing,error:findError}=await supabaseAdmin.from("guru_match_social_groups")
    .select("id").eq("group_url",normalized).limit(1).maybeSingle();
  if(findError)throw new Error("Unable to check existing local groups.");
  if(existing)return {ok:true,alreadyExists:true,id:existing.id};
  const {data,error}=await supabaseAdmin.from("guru_match_social_groups")
    .insert({name,city,state,channel,group_url:normalized,created_by_user_id:actor.user.id})
    .select("id").single();
  if(error||!data)throw new Error("Could not save the local social group.");
  return {ok:true,id:data.id};
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
    .select("id,code,guru_id,promotion_type,status,city,state,radius_miles,service_key,pet_type,channel")
    .eq("code",code).eq("status","approved").maybeSingle();
  if(error||!data)return null;
  const {data:g,error:gError}=await supabaseAdmin.from("gurus")
    .select("id,slug,display_name,full_name,name,city,state,service_city,service_state,services,profile_photo_url,avatar_url,photo_url,image_url,is_active,is_public,is_bookable,is_archived,status")
    .eq("id",data.guru_id).maybeSingle();
  if(gError||!g||g.is_public!==true||g.is_archived===true)return null;
  const promotionType=data.promotion_type==="community"?"community" as const:"guru" as const;
  if(promotionType==="community"){
    // Do not expose a pending, suspended, unbookable or incomplete Guru as available.
    // The branded card directs visitors to general SitGuru care discovery instead.
    return {...data,promotionType,guru:{
      slug:"",name:"SitGuru Pet Care",city:clean(data.city),state:clean(data.state),
      photoUrl:null,
    }};
  }
  if(g.is_bookable!==true||clean(g.status).toLowerCase()!=="active")return null;
  const slug=safeGuruSlug(g.slug);
  if(!slug)return null;
  // A personal Guru card must stop working when booking or documented services change.
  const filters=normalizeMatchFilters({
    city:data.city,state:data.state,service:data.service_key,pet:data.pet_type,
    radius:data.radius_miles,
  });
  if(!filters)return null;
  const eligible=await findEligibleGuruMatches(filters);
  if(!eligible.some(item=>item.id===data.guru_id))return null;
  return {...data,promotionType,guru:{slug,
    name:initialsName(g.display_name||g.full_name||g.name),
    city:clean(g.city),state:clean(g.state),
    photoUrl:photoUrl(g.profile_photo_url||g.avatar_url||g.photo_url||g.image_url)}};
}
export async function logPublicShareEvent(shareId:string,eventType:"link_open"|"qr_open"|"profile_click"|"inquiry_click",source:ShareChannel|"qr"){
  const {error}=await supabaseAdmin.from("guru_match_share_events").insert({
    share_id:shareId,event_type:eventType,source,
  });
  if(error)console.warn("Guru share event not recorded",error.code);
}
