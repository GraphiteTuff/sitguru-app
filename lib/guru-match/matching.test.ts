import assert from "node:assert/strict";
import test from "node:test";
import {buildGuruDirectory,distanceMiles,matchGuruCandidates,normalizeMatchFilters,type GuruCandidate,type ServiceRow} from "./matching";

const base:GuruCandidate={
  id:"00000000-0000-4000-8000-000000000011",
  slug:"quakertown-guru",
  display_name:"Taylor Example",
  city:"Quakertown",state:"PA",service_city:"Quakertown",service_state:"PA",
  service_latitude:40.4418,service_longitude:-75.3416,
  service_radius_miles:15,service_area_enabled:true,
  is_active:true,is_public:true,is_bookable:true,status:"active",
  is_archived:false,is_test_account:false,is_demo:false,
  services:["Dog Walking","Drop-In Visits"],
};
const rates:ServiceRow[]=[
  {guru_id:base.id,service_key:"dog_walking",is_enabled:true},
  {guru_id:base.id,service_key:"drop_in_visits",is_enabled:true},
];
const filters={city:"Quakertown",state:"PA",service:"dog_walking" as const,pet:"dog" as const,radius:10};
test("requires valid state, city, distance and known service",()=>{
  assert.equal(normalizeMatchFilters({...filters,state:""}),null);
  assert.equal(normalizeMatchFilters({...filters,state:"PA;",service:"fake"}),null);
  assert.equal(normalizeMatchFilters({...filters,radius:500}),null);
  assert.equal(normalizeMatchFilters({...filters,radius:10})?.city,"Quakertown");
});
test("requires the Guru to be bookable",()=>{
  assert.equal(matchGuruCandidates(filters,[base],rates).length,1);
  assert.equal(matchGuruCandidates(filters,[{...base,is_bookable:false}],rates).length,0);
  assert.equal(matchGuruCandidates(filters,[{...base,status:"suspended"}],rates).length,0);
  assert.equal(matchGuruCandidates(filters,[{...base,is_public:false}],rates).length,0);
  assert.equal(matchGuruCandidates(filters,[{...base,is_public_visible:false}],rates).length,1);
  assert.equal(matchGuruCandidates(filters,[{...base,is_accepting_bookings:false}],rates).length,1);
  assert.equal(matchGuruCandidates(filters,[{...base,service_area_enabled:false}],rates).length,1);
  assert.equal(matchGuruCandidates(filters,[{...base,is_test_account:true}],rates).length,1);
});
test("requires correct state, location radius and service",()=>{
  assert.equal(matchGuruCandidates(filters,[{...base,service_state:"NJ"}],rates).length,0);
  assert.equal(matchGuruCandidates(filters,[{...base,service_latitude:40.6259,service_longitude:-75.3705}],rates).length,0);
  assert.equal(matchGuruCandidates(filters,[base],[]).length,1); // Service is also on the public profile.
  assert.equal(matchGuruCandidates({...filters,service:"boarding"},[base],rates).length,0);
  assert.ok(distanceMiles([40.4418,-75.3416],[40.6259,-75.3705])>10);
});
test("never guesses distance or pet type without documented evidence",()=>{
  const unknown={...base,service_city:"Other Town",service_latitude:null,service_longitude:null};
  assert.equal(matchGuruCandidates(filters,[unknown],rates).length,0);
  const sitting={...base,services:["Pet Sitting"],id:base.id};
  assert.equal(matchGuruCandidates({...filters,service:"pet_sitting",pet:"dog"},[sitting],[
    {guru_id:base.id,service_key:"pet_sitting",is_enabled:true},
  ]).length,0);
  assert.equal(matchGuruCandidates({...filters,service:"pet_sitting",pet:"any"},[sitting],[
    {guru_id:base.id,service_key:"pet_sitting",is_enabled:true},
  ]).length,1);
  assert.equal(matchGuruCandidates({...filters,pet:"cat"},[base],rates).length,0);
});

test("staff directory keeps all listed Gurus visible with separate promotion readiness",()=>{
  const records=buildGuruDirectory([
    {...base,is_public:true,status:"active"},
    {...base,id:"00000000-0000-4000-8000-000000000012",slug:"other-guru",is_bookable:false},
  ],rates);
  assert.equal(records.length,2);
  assert.equal(records[0].canPromote,true);
  assert.equal(records[1].canPromote,false);
  assert.equal(records[1].reason,"Not currently bookable");
  const privateEntry=buildGuruDirectory([{...base,is_public:false}],rates)[0];
  assert.equal(privateEntry.canPromote,false);
  assert.equal(privateEntry.reason,"Public profile is not listed");
});
test("a disabled service rate overrides stale legacy public labels",()=>{
  assert.equal(matchGuruCandidates(filters,[base],[{guru_id:base.id,service_key:"dog_walking",is_enabled:false}]).length,0);
});
