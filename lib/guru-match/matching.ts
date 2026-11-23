/** Strict local, service and pet compatibility matching for staff outreach. */
export const GURU_MATCH_SERVICES = [
  { key: "dog_walking", label: "Dog Walking" },
  { key: "pet_sitting", label: "Pet Sitting" },
  { key: "drop_in_visits", label: "Drop-In Visits" },
  { key: "house_sitting", label: "House Sitting" },
  { key: "doggy_day_care", label: "Doggy Day Care" },
  { key: "boarding", label: "Boarding" },
  { key: "cat_care", label: "Cat Care" },
  { key: "pet_taxi", label: "Pet Taxi" },
  { key: "medication_help", label: "Medication Help" },
  { key: "training_support", label: "Training Support" },
] as const;
export type ServiceKey = typeof GURU_MATCH_SERVICES[number]["key"];
export type PetType = "any" | "dog" | "cat";
export type MatchFilters = { city: string; state: string; service: ServiceKey; pet: PetType; radius: number };
export type GuruMatch = {
  id: string; name: string; slug: string; city: string; state: string;
  photoUrl: string | null; distanceMiles: number | null;
  service: ServiceKey; serviceLabel: string; petType: PetType;
  experienceYears: number | null; serviceRadiusMiles: number;
  reason: string;
};
export type GuruCandidate = Record<string, unknown> & { id: string };
export type ServiceRow = { guru_id: string; service_key: string; is_enabled: boolean };

export const KNOWN_CITY_COORDINATES: Record<string, [number, number]> = {
  "quakertown:PA": [40.4418, -75.3416],
  "perkasie:PA": [40.3720, -75.2927],
  "doylestown:PA": [40.3101, -75.1299],
  "dublin:PA": [40.3718, -75.2016],
  "sellersville:PA": [40.3537, -75.3049],
  "bethlehem:PA": [40.6259, -75.3705],
  "allentown:PA": [40.6023, -75.4714],
  "easton:PA": [40.6884, -75.2207],
  "coopersburg:PA": [40.5115, -75.3905],
  "emmaus:PA": [40.5395, -75.4969],
  "lansdale:PA": [40.2415, -75.2838],
  "norristown:PA": [40.1215, -75.3399],
  "philadelphia:PA": [39.9526, -75.1652],
  "souderton:PA": [40.3118, -75.3252],
  "hatfield:PA": [40.2798, -75.2992],
};
function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function same(a: unknown, b: string) { return clean(a).toLowerCase().replace(/\s+/g," ") === b.toLowerCase().replace(/\s+/g," "); }
function num(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
function degrees(x: number) { return x * Math.PI / 180; }
export function distanceMiles(a: [number,number], b: [number,number]) {
  const dlat = degrees(b[0]-a[0]), dlon = degrees(b[1]-a[1]);
  const h = Math.sin(dlat/2)**2 + Math.cos(degrees(a[0])) * Math.cos(degrees(b[0])) * Math.sin(dlon/2)**2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
export function isServiceKey(value: string): value is ServiceKey {
  return GURU_MATCH_SERVICES.some(s => s.key === value);
}
export function normalizeMatchFilters(query: Record<string, unknown>): MatchFilters | null {
  const city = clean(query.city).replace(/\s+/g, " ");
  const state = clean(query.state).toUpperCase();
  const service = clean(query.service);
  const pet = clean(query.pet) || "any";
  const radius = Number(query.radius ?? 10);
  if (!/^[\p{L}][\p{L} .'-]{1,79}$/u.test(city) ||
    !/^[A-Z]{2}$/.test(state) || !isServiceKey(service) ||
    !["any","dog","cat"].includes(pet) ||
    !Number.isInteger(radius) || radius < 1 || radius > 50) return null;
  return {city,state,service,pet:pet as PetType,radius};
}
function serviceKeys(g: GuruCandidate, rows: ServiceRow[]) {
  const set = new Set<string>();
  for(const row of rows) if(row.guru_id === g.id && row.is_enabled) set.add(row.service_key.toLowerCase());
  const labels = Array.isArray(g.services) ? g.services : [];
  for (const label of labels) {
    if (typeof label !== "string") continue;
    const value = label.toLowerCase().trim().replace(/[^a-z0-9]+/g,"_").replace(/_+$/,"");
    if (value === "cat_care") set.add("cat_care");
    if (value === "dog_walking") set.add("dog_walking");
    if (value === "doggy_day_care") set.add("doggy_day_care");
    if (value === "pet_sitting") set.add("pet_sitting");
    if (value === "drop_in_visits") set.add("drop_in_visits");
    if (value === "house_sitting") set.add("house_sitting");
    if (value === "boarding") set.add("boarding");
    if (value === "pet_taxi") set.add("pet_taxi");
    if (value === "medication_help") set.add("medication_help");
    if (value === "training_support") set.add("training_support");
  }
  return set;
}
/**
 * Generic sitting services do NOT prove dog/cat compatibility. Require an
 * explicit dog-walking/daycare or cat-care service elsewhere on the Guru profile.
 */
function petCompatible(keys:Set<string>, pet:PetType){
  if(pet === "any") return true;
  if(pet === "dog") return keys.has("dog_walking") || keys.has("doggy_day_care");
  return keys.has("cat_care");
}
export function matchGuruCandidates(
  filters:MatchFilters, gurus:GuruCandidate[], services:ServiceRow[],
): GuruMatch[] {
  const center = KNOWN_CITY_COORDINATES[`${filters.city.toLowerCase()}:${filters.state}`]
    || KNOWN_CITY_COORDINATES[`${filters.city}:${filters.state}`];
  const serviceLabel=GURU_MATCH_SERVICES.find(s=>s.key===filters.service)?.label || filters.service;
  const matches:GuruMatch[]=[];
  for(const guru of gurus){
    if(guru.is_active!==true || guru.is_public!==true || guru.is_bookable!==true ||
      guru.is_archived===true || guru.is_test_account===true || guru.is_demo===true ||
      guru.service_area_enabled!==true || clean(guru.status).toLowerCase()!=="active") continue;
    const state=clean(guru.service_state || guru.state).toUpperCase();
    if(state!==filters.state) continue;
    const city=clean(guru.service_city || guru.city);
    const hasSameCity=same(city,filters.city);
    const radius=num(guru.service_radius_miles);
    if(radius==null || radius<=0)continue;
    let distance:number|null=null;
    if(center){
      const lat=num(guru.service_latitude),lon=num(guru.service_longitude);
      if(lat!=null&&lon!=null&&Math.abs(lat)<=90&&Math.abs(lon)<=180){
        distance=distanceMiles(center,[lat,lon]);
        if(distance>Math.min(filters.radius,radius))continue;
      }else if(!hasSameCity)continue;
    }else if(!hasSameCity)continue;
    const keys=serviceKeys(guru,services);
    if(!keys.has(filters.service)||!petCompatible(keys,filters.pet))continue;
    const slug=clean(guru.slug);
    if(!slug || !/^[a-z0-9][a-z0-9-]{0,120}$/i.test(slug))continue;
    const display=clean(guru.display_name || guru.full_name || guru.name).split(/\s+/).filter(Boolean);
    const name=display.length>1?`${display[0]} ${display[display.length-1][0]}.`:display[0]||"SitGuru Guru";
    const photo=clean(guru.profile_photo_url || guru.avatar_url || guru.photo_url || guru.image_url);
    const years=num(guru.experience_years ?? guru.years_experience);
    matches.push({
      id:guru.id,name,slug,city,state,
      photoUrl:photo.startsWith("https://")?photo:null,
      distanceMiles:distance==null?null:Math.round(distance*10)/10,
      service:filters.service,serviceLabel,petType:filters.pet,
      experienceYears:years!=null&&years>0?years:null,
      serviceRadiusMiles:radius,
      reason:distance!=null?`Within ${radius} mi Guru service area`:`Serves ${filters.city}, ${filters.state}`,
    });
  }
  return matches.sort((a,b)=>(a.distanceMiles??999)-(b.distanceMiles??999)).slice(0,35);
}
