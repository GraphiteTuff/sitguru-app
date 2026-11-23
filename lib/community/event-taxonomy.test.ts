import { test } from "node:test";
import { strict as assert } from "node:assert";
import { getEventPromotionCategoryId,getEventPromotionCategoryInfo,eventPromotionExpiry } from "./event-taxonomy";

function event(title:string,categories:string[]=["Community"],short_description:string|null=null){
  return {title,categories,short_description,description:null,venue_name:null};
}
test("auto-categorizes daily discoveries by event title",()=>{
  assert.equal(getEventPromotionCategoryId(event("Pet Photos with Santa")),"holiday_photos");
  assert.equal(getEventPromotionCategoryId(event("Pop Up Free Pet Food Pantry")),"fundraisers_charity");
  assert.equal(getEventPromotionCategoryId(event("Doggy Paddle Polar Plunge")),"outdoor_fitness");
  assert.equal(getEventPromotionCategoryId(event("Low Cost Veterinary Care Workshop")),"training_education");
  assert.equal(getEventPromotionCategoryId(event("Rescue Dog Adoption Day")),"adoption_rescue");
  assert.equal(getEventPromotionCategoryId(event("Pet Festival & Vendor Market")),"festivals_markets");
});
test("preserves a specific partner category and does not overclassify ambiguous titles",()=>{
  assert.equal(getEventPromotionCategoryId(event("Local Class",["Training"])),"training_education");
  assert.equal(getEventPromotionCategoryId(event("The Stray Cats")),"other");
  assert.equal(getEventPromotionCategoryInfo("adoption_rescue").label,"Adoption & Rescue");
});
test("no-duration events have a usable expiry while explicitly ended events expire",()=>{
  assert.equal(eventPromotionExpiry({start_at:"2026-11-28T11:00:00Z",end_at:null}),Date.parse("2026-11-29T11:00:00Z"));
  assert.equal(eventPromotionExpiry({start_at:"2026-11-28T11:00:00Z",end_at:"2026-11-28T14:00:00Z"}),Date.parse("2026-11-28T14:00:00Z"));
});
