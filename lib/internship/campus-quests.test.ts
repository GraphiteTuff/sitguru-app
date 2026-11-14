import assert from "node:assert/strict";
import { test } from "node:test";
import { campusQuestProgress } from "./campus-quests";
import { campusCampaignTrackingCode, campusDestinationForTarget } from "./campus-growth";
import type {
  CampusCard, CampusLead, CampusLink, CampusMission, CampusOpportunity,
  CampusResult, CampusSourceHealth,
} from "./campus-growth-data";

const health:CampusSourceHealth={
  profiles:true,opportunities:true,leads:true,links:true,
  visits:true,results:true,missions:true,
};
const card={
  internId:"lola",
  campusName:"Saint Joseph's University",
  policyNotes:"",marketNotes:"",
  universityId:"sju",
} as CampusCard;

function data(override:Partial<Parameters<typeof campusQuestProgress>[0]>={}){
  return {
    card,opportunities:[] as CampusOpportunity[],
    leads:[] as CampusLead[],links:[] as CampusLink[],
    missions:[] as CampusMission[],results:[] as CampusResult[],
    sourceHealth:health,...override,
  };
}
function opportunity(approval:string):CampusOpportunity {
  return {
    id:"o1",internId:"lola",title:"University Student Club",
    description:"Research campus students who may offer pet-care services and verify the rules.",
    approval,
  } as CampusOpportunity;
}
test("a brand new campus starts with zero earned badges and no imaginary metrics",()=>{
  const progress=campusQuestProgress(data());
  assert.equal(progress.earned,0);
  assert.equal(progress.total,8);
  assert.equal(progress.percent,0);
  assert.ok(progress.dataComplete);
  assert.ok(progress.quests.every(q=>q.status==="available"));
});
test("research and manager review are distinct from actual approval",()=>{
  const pitched=campusQuestProgress(data({opportunities:[opportunity("ava_review")]}));
  assert.equal(pitched.quests.find(q=>q.key==="scout")?.status,"earned");
  assert.equal(pitched.quests.find(q=>q.key==="pitch")?.status,"earned");
  assert.equal(pitched.quests.find(q=>q.key==="greenlight")?.status,"available");
  const approved=campusQuestProgress(data({opportunities:[opportunity("approved")]}));
  assert.equal(approved.quests.find(q=>q.key==="greenlight")?.status,"earned");
});
test("only real work earns all eight optional badges, not draft assignments",()=>{
  const progress=campusQuestProgress(data({
    card:{...card,policyNotes:"Written university outreach rules and restrictions recorded."},
    opportunities:[opportunity("approved")],
    leads:[{internId:"lola",notes:"Confirmed mutual-interest conversation with a local group.",status:"Contacted"} as CampusLead],
    links:[{internId:"lola",code:"sju-lola-qr-code"} as CampusLink],
    missions:[{internId:"lola",id:"draft",status:"draft",title:"Hidden"} as CampusMission,
      {internId:"lola",id:"published",status:"todo",title:"Real assignment"} as CampusMission],
    results:[{internId:"lola",lesson:"Observed student outreach response, described evidence and next recommendations."} as CampusResult],
  }));
  assert.equal(progress.earned,8);
  assert.equal(progress.total,8);
  assert.equal(progress.percent,100);
  const draftOnly=campusQuestProgress(data({missions:[{internId:"lola",status:"draft"} as CampusMission]}));
  assert.equal(draftOnly.quests.find(q=>q.key==="mission")?.status,"available");
});
test("outage marks badge as unavailable instead of claiming earned or zero",()=>{
  const broken=campusQuestProgress(data({
    opportunities:[opportunity("approved")],
    sourceHealth:{...health,opportunities:false},
  }));
  assert.equal(broken.quests.find(q=>q.key==="greenlight")?.status,"unavailable");
  assert.equal(broken.quests.find(q=>q.key==="scout")?.status,"unavailable");
  assert.equal(broken.earned,0);
  assert.equal(broken.dataComplete,false);
});
test("reported results alone do not become verified conversion achievements",()=>{
  const report=campusQuestProgress(data({results:[{
    internId:"lola",lesson:"Short update",reportedPetParents:300,reportedGuruApplications:99,
  } as CampusResult]}));
  assert.equal(report.quests.find(q=>q.key==="insights")?.status,"available");
  assert.equal(report.earned,0);
});
test("tracked links lead to the right public SitGuru audience with no open redirects",()=>{
  for(const [target,expected] of Object.entries({
    future_guru:"/become-a-guru",
    pet_parent:"/pet-parents",
    petperks:"/petperks",
    partnership:"/partners",
    event:"/events",
    social:"/community",
    awareness:"/",
  }))assert.equal(campusDestinationForTarget(target),expected);
  assert.equal(campusDestinationForTarget("https://evil.example/login"),"/");
});
test("different campaigns get unique URLs with a bounded slug",()=>{
  const common={
    campus:"Saint Joseph's University",
    intern:"Lola Uhl",target:"future_guru",channel:"qr",
    campaign:"Student Guru Campus Recruitment Experiment 2027",
  };
  const first=campusCampaignTrackingCode({...common,nonce:"abc12345"});
  const second=campusCampaignTrackingCode({...common,nonce:"def67890"});
  assert.notEqual(first,second);
  assert.ok(first.length<=80);
  assert.match(first,/lola-uhl/);
  assert.match(first,/abc12345$/);
});
