import type { CampusCard, CampusLead, CampusLink, CampusMission, CampusOpportunity, CampusResult, CampusSourceHealth, CampusSourceKey } from "./campus-growth-data";
import { campusMissionIsVisible } from "./campus-growth";

export type CampusQuestKey = "scout" | "rules" | "pitch" | "greenlight" | "mission" | "launch" | "connector" | "insights";
export type CampusQuest = {
  key: CampusQuestKey;
  title: string;
  description: string;
  badge: string;
  evidence: string;
  nextAction: string;
  tab: "overview" | "opportunities" | "leads" | "tracking" | "missions";
  anchor: string;
  status: "earned" | "available" | "unavailable";
};
export type CampusQuests = {
  quests: CampusQuest[];
  earned: number;
  total: number;
  percent: number;
  dataComplete: boolean;
};
/**
 * Engagement badges are optional indicators of work already SAVED, not credit,
 * approval to publish, pay, hiring decisions, or confirmed customer conversions.
 * Never award a badge when its source data could not be loaded.
 */
export function campusQuestProgress(input: {
  card: CampusCard;
  opportunities: CampusOpportunity[];
  leads: CampusLead[];
  links: CampusLink[];
  missions: CampusMission[];
  results: CampusResult[];
  sourceHealth: CampusSourceHealth;
}): CampusQuests {
  const {card, opportunities, leads, links, missions, results, sourceHealth} = input;
  const define = (
    key: CampusQuestKey,title:string,description:string,badge:string,
    evidence:string,nextAction:string,tab:CampusQuest["tab"],anchor:string,
    source:CampusSourceKey,earned:boolean,
  ):CampusQuest => ({
    key,title,description,badge,evidence,nextAction,tab,anchor,
    status:!sourceHealth[source]?"unavailable":earned?"earned":"available",
  });
  const researched=opportunities.some(o=>o.title.trim().length>=3 && o.description.trim().length>=10);
  const pitched=opportunities.some(o=>o.description.trim().length>=10 && ["ava_review","approved","university_approval","jason_review"].includes(o.approval));
  const approved=opportunities.some(o=>o.approval==="approved");
  const visibleMission=missions.some(m=>campusMissionIsVisible(m.status) && m.internId===card.internId);
  const meaningfulFollowup=leads.some(l=>l.notes.trim().length>=10 &&
    ["Contacted","Interested","Follow Up","Converted"].includes(l.status));
  const learned=results.some(r=>r.lesson.trim().length>=30);
  const quests=[
    define("scout","Campus Explorer","Document one credible campus opportunity with an explanation of why it fits SitGuru.","🧭","Research opportunity recorded","Add a researched opportunity","opportunities","#add-opportunity","opportunities",researched),
    define("rules","Rules Detective","Capture campus posting, tabling and outreach rules. Written notes do not mean permission has been granted.","🛡️","Campus rules documented","Document campus guidelines","overview","#campus-policy-form","profiles",card.policyNotes.trim().length>=20),
    define("pitch","Pitch Perfect","Send a specific campus opportunity to Ava with enough detail for her to review.","💡","Proposal submitted for review","Submit a campus proposal","opportunities","#add-opportunity","opportunities",pitched),
    define("greenlight","Green Light","Receive a recorded SitGuru approval before beginning a proposed activity. External permissions still apply.","✅","SitGuru manager approval recorded","Review outstanding approvals","opportunities","#review-queue","opportunities",approved),
    define("mission","Mission Activated","Have an actual published campus assignment in SitGuru; private drafts do not count.","🎯","Published assignment recorded","Open campus missions","missions","#campus-missions","missions",visibleMission),
    define("launch","Link Lab","Prepare a unique link or QR destination for a specific approved campaign.","🔗","Campaign tracking link created","Create a tracking link","tracking","#campus-tracking-form","links",links.some(l=>l.code.trim().length>0)),
    define("connector","Community Connector","Record a respectful outreach follow-up and what was discussed—not a fabricated conversion.","🤝","Outreach follow-up recorded","Update a lead follow-up","leads","#campus-leads-list","leads",meaningfulFollowup),
    define("insights","Insight Finder","Write an evidence-backed learning summary after research or activity. No invented results needed.","📈","Learning entry with detail saved","Record learning and evidence","tracking","#campus-results-form","results",learned),
  ];
  const earned=quests.filter(q=>q.status==="earned").length;
  return {quests,earned,total:quests.length,percent:Math.round(earned/quests.length*100),
    dataComplete:quests.every(q=>q.status!=="unavailable")};
}
