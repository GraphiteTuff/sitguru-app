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
  { key: "custom_care", label: "Custom Care" },
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
export type GuruDirectoryEntry = {
  id: string; name: string; slug: string; city: string; state: string;
  photoUrl: string | null; serviceKeys: ServiceKey[]; serviceRadiusMiles: number;
  /** Staff can share either a verified Guru card or safe SitGuru discovery card. */
  canPromote: boolean; canFeatureGuru: boolean; promotionKind: "guru"|"community"; reason: string;
};

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
/** Current service-rate selections take precedence over legacy profile labels. */
export function serviceKeys(g: GuruCandidate, rows: ServiceRow[]) {
  const configured = new Map<string, boolean>();
  for (const row of rows) if (row.guru_id === g.id)
    configured.set(row.service_key.toLowerCase(), row.is_enabled === true);
  const set = new Set<string>();
  for (const [key, enabled] of configured) if (enabled && isServiceKey(key)) set.add(key);
  for (const label of Array.isArray(g.services) ? g.services : []) {
    if (typeof label !== "string") continue;
    const key = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
    if (isServiceKey(key) && !configured.has(key)) set.add(key);
  }
  return set;
}
function guruNotReady(guru:GuruCandidate) {
  if (clean(guru.status).toLowerCase() === "suspended") return "Account suspended — not eligible";
  if (guru.is_bookable !== true) return "Not currently bookable";
  if (guru.is_public !== true) return "Public profile is not listed";
  if (!/^[a-z0-9][a-z0-9-]{0,120}$/i.test(clean(guru.slug))) return "Public profile link missing";
  return "";
}
export function buildGuruDirectory(gurus:GuruCandidate[], services:ServiceRow[]):GuruDirectoryEntry[] {
  return gurus.map(guru=>{
    const keys=serviceKeys(guru,services);
    const notReady=guruNotReady(guru);
    const names=clean(guru.display_name || guru.full_name || guru.name).split(/\s+/).filter(Boolean);
    const name=names.length>1?`${names[0]} ${names[names.length-1][0]}.`:names[0]||`Incomplete Guru profile (${guru.id.slice(0,8)})`;
    const photo=clean(guru.profile_photo_url || guru.avatar_url || guru.photo_url || guru.image_url);
    const serviceOptions=GURU_MATCH_SERVICES.map(s=>s.key).filter(k=>keys.has(k));
    // A bookable public Guru can be shared without claiming any particular
    // service when no service selections are configured yet.
    const canFeatureGuru=!notReady;
    const canPromote=guru.is_public===true && guru.is_archived!==true &&
      Boolean(clean(guru.service_city||guru.city)) && /^[A-Z]{2}$/.test(clean(guru.service_state||guru.state).toUpperCase());
    return {
      id:guru.id,name,slug:clean(guru.slug),
      city:clean(guru.service_city || guru.city),state:clean(guru.service_state || guru.state).toUpperCase(),
      photoUrl:photo.startsWith("https://")?photo:null,
      serviceKeys:serviceOptions,
      serviceRadiusMiles:num(guru.service_radius_miles)??0,
      canPromote,canFeatureGuru,promotionKind:canFeatureGuru?"guru" as const:"community" as const,
      reason:!canPromote?"Public listing or location unavailable":
        canFeatureGuru?"Guru profile ready":
        "SitGuru discovery card · no booking claim",
    };
  }).sort((a,b)=>Number(b.canPromote)-Number(a.canPromote)||a.name.localeCompare(b.name));
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
  const knownCenter = KNOWN_CITY_COORDINATES[`${filters.city.toLowerCase()}:${filters.state}`]
    || KNOWN_CITY_COORDINATES[`${filters.city}:${filters.state}`];
  // A matching Guru's recorded service coordinates can anchor an otherwise unknown city.
  // We never invent coordinates for a city with no locally registered service record.
  const localAnchor = gurus.find(g=>
    same(g.service_city || g.city,filters.city) &&
    clean(g.service_state || g.state).toUpperCase()===filters.state &&
    num(g.service_latitude)!=null && num(g.service_longitude)!=null &&
    Math.abs(num(g.service_latitude)!)<=90 && Math.abs(num(g.service_longitude)!)<=180);
  const center: [number,number] | undefined = knownCenter ||
    (localAnchor?[num(localAnchor.service_latitude)!,num(localAnchor.service_longitude)!]:undefined);
  const serviceLabel=GURU_MATCH_SERVICES.find(s=>s.key===filters.service)?.label || filters.service;
  const matches:GuruMatch[]=[];
  for(const guru of gurus){
    if (guruNotReady(guru)) continue;
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
  return matches.sort((a,b)=>(a.distanceMiles??999)-(b.distanceMiles??999));
}
