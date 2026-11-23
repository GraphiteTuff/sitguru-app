import type { CommunityEventRow } from "@/lib/community/types";

/**
 * Read-only, shared taxonomy for the public directory and staff promotions.
 * External discoveries often arrive with only the generic "Community" tag.
 * Specific event titles take precedence; never rewrite an organizer's source data.
 */
export const EVENT_PROMOTION_CATEGORIES = [
  {id:"adoption_rescue",label:"Adoption & Rescue",audience:"Rescue organizations, foster networks, and prospective adopters",group:"Local rescue, adoption, and foster groups",angle:"Help a pet find a loving home."},
  {id:"meetups_social",label:"Pet Meetups & Socials",audience:"Local pet owners and neighborhood pet communities",group:"City and neighborhood dog-owner groups",angle:"Meet local pet people and enjoy time with your pets."},
  {id:"training_education",label:"Training & Education",audience:"New Pet Parents, puppy owners, and training communities",group:"Puppy, training, and new-pet-owner groups",angle:"Learn something useful for your pet."},
  {id:"fundraisers_charity",label:"Fundraisers & Charity",audience:"Animal welfare supporters and local volunteer communities",group:"Animal welfare, charitable, and volunteer groups",angle:"Support local pets and the organizations that help them."},
  {id:"holiday_photos",label:"Holiday & Pet Photos",audience:"Families, pet owners, and neighborhood social groups",group:"Local family, pet-owner, and photography groups",angle:"Make memories with your pets."},
  {id:"outdoor_fitness",label:"Walks & Outdoor Activities",audience:"Active dog owners and outdoor pet communities",group:"Dog walking, hiking, and outdoor recreation groups",angle:"Get outside and enjoy pet-friendly activities."},
  {id:"festivals_markets",label:"Festivals & Pet Markets",audience:"Local families, vendors, and pet business communities",group:"Local festivals, markets, and pet-friendly business groups",angle:"Discover local vendors, activities, and pet-friendly fun."},
  {id:"wellness_care",label:"Wellness & Pet Care",audience:"Pet Parents seeking care, health, and wellness resources",group:"Pet health, wellness, and community resource groups",angle:"Discover helpful care and wellness resources."},
  {id:"other",label:"Other Pet Events",audience:"Local pet owners and general community groups",group:"Local community and pet-owner groups",angle:"Discover what is happening in your pet community."},
] as const;
export type EventPromotionCategoryId = typeof EVENT_PROMOTION_CATEGORIES[number]["id"];
export type EventCategoryInput = Pick<CommunityEventRow,
  "title" | "short_description" | "description" | "venue_name" | "categories">;
const titleRules: {id:EventPromotionCategoryId;match:RegExp}[] = [
  {id:"holiday_photos",match:/\b(santa|easter bunny|holiday pet photo|pet photos?|pet portraits?|photo shoot|photos? with|paint your pet|christmas pet|howl-?oween)\b/i},
  {id:"adoption_rescue",match:/\b(adoption|adopt(?:ion)?|rescue|foster|clear the shelters|shelter open house)\b/i},
  {id:"fundraisers_charity",match:/\b(fundrais(?:er|ing)|charity|donation|food (?:pantry|drive)|supply drive|pet food pantry|benefit concert)\b/i},
  {id:"outdoor_fitness",match:/\b(5k|10k|pup strut|bark walk|dog walk|walkathon|hike|polar plunge|paddle|swim|pool party|dog park|doggy dash|dog run|trail walk)\b/i},
  {id:"training_education",match:/\b(training|obedience|puppy school|puppy class|workshop|pet education|dog training|behavior seminar|pet safety|first aid|cpr)\b/i},
  {id:"festivals_markets",match:/\b(festival|pet fest|pet fair|street fair|market|expo|parade|palooza|vendor fair|craft fair)\b/i},
  {id:"wellness_care",match:/\b(veterinary|veterinarian|vet care|clinic|vaccination|wellness|pet health|therapy dog|grooming|spay|neuter|pet nutrition|microchip)\b/i},
  {id:"meetups_social",match:/\b(meet(?:-?up)?|social|playdate|dog day out|dogs.day out|yappy hour|bark in the park|pet party|pet mixer|dog gathering|community open house)\b/i},
];
const explicitRules:{id:EventPromotionCategoryId;match:RegExp}[]=[
  {id:"adoption_rescue",match:/^(adoption|rescue)$/i},
  {id:"fundraisers_charity",match:/^(fundraiser|charity)$/i},
  {id:"training_education",match:/^(training|education)$/i},
  {id:"festivals_markets",match:/^(festival|market)$/i},
  {id:"wellness_care",match:/^(wellness|pet business)$/i},
  {id:"meetups_social",match:/^social$/i},
];
export function getEventPromotionCategoryId(event:EventCategoryInput):EventPromotionCategoryId {
  const title=event.title||"";
  for(const rule of titleRules)if(rule.match.test(title))return rule.id;
  const declared=event.categories||[];
  for(const rule of explicitRules)if(declared.some(name=>rule.match.test(name)))return rule.id;
  // Descriptions are supplemental. Avoid using a venue name as evidence: a clinic may host a photo event.
  const description=[event.short_description,event.description].filter(Boolean).join(" ");
  for(const rule of titleRules)if(rule.match.test(description))return rule.id;
  return "other";
}
export function getEventPromotionCategoryInfo(
  category:EventPromotionCategoryId,
){
  return EVENT_PROMOTION_CATEGORIES.find(item=>item.id===category)
    ||EVENT_PROMOTION_CATEGORIES[EVENT_PROMOTION_CATEGORIES.length-1];
}
export function getEventPromotionInfo(event:EventCategoryInput){
  return getEventPromotionCategoryInfo(getEventPromotionCategoryId(event));
}

/** No end time? Retain an event until the following day, not merely its first recorded hour. */
export function eventPromotionExpiry(event:{start_at:string;end_at:string|null}):number{
  const start=Date.parse(event.start_at);
  if(!Number.isFinite(start))return 0;
  const end=event.end_at?Date.parse(event.end_at):start+24*60*60*1000;
  return Number.isFinite(end)?Math.max(end,start):0;
}
