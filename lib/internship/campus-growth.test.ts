import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canReadPrivateInternRecord } from "./manager-access";
import { validateManagerAssignment } from "./manager-assignment";
import {
  campusApprovalChangeAllowed,
  campusAttributionReward,
  campusExecutionAllowed,
  campusMissionDraft,
  campusMissionIsVisible,
  campusTrackingCode,
  routeCampusLane,
  summarizeCampusActivity,
} from "./campus-growth";

const ryan = "11111111-1111-1111-1111-111111111111";
const lola = "22222222-2222-2222-2222-222222222222";
const ava = "33333333-3333-3333-3333-333333333333";

describe("campus growth permissions and missions", () => {
  it("lets a manager see only an assigned intern campus", () => {
    assert.equal(canReadPrivateInternRecord({
      actor: "manager",
      actorUserId: ava,
      targetInternId: ryan,
      managerUserId: ava,
    }), true);
    assert.equal(canReadPrivateInternRecord({
      actor: "manager",
      actorUserId: ava,
      targetInternId: lola,
      managerUserId: "44444444-4444-4444-4444-444444444444",
    }), false);
  });

  it("lets an intern see only their own campus", () => {
    assert.equal(canReadPrivateInternRecord({
      actor: "intern",
      actorInternId: ryan,
      targetInternId: ryan,
    }), true);
    assert.equal(canReadPrivateInternRecord({
      actor: "intern",
      actorInternId: ryan,
      targetInternId: lola,
    }), false);
  });

  it("keeps a draft campus mission off the intern portal", () => {
    const draft = campusMissionDraft({
      internId: ryan,
      title: "Penn State Pet Parent Awareness",
      dueOn: "2027-11-30",
      description: "Research campus pet-parent awareness and recommend one approved tactic.",
      freedom: "Explore",
      lane: "strategy",
      phases: ["explore", "recommend"],
      clientRequestId: "campus-1",
    });
    const checked = validateManagerAssignment(draft, "create");
    assert.equal(checked.ok, true);
    if (checked.ok) assert.equal(checked.value.category, "Campus Growth");
    assert.equal(campusMissionIsVisible("draft"), false);
    assert.equal(campusMissionIsVisible("todo"), true);
  });

  it("routes campus work through the existing Teams channels", () => {
    assert.equal(routeCampusLane("strategy").channelLabel, "Growth and Strategy");
    assert.equal(routeCampusLane("creative").channelLabel, "Content and Social");
    assert.equal(routeCampusLane("creative").canva, true);
    assert.equal(routeCampusLane("coaching").channelLabel, "Intern Projects");
    assert.equal(routeCampusLane("outreach").channelLabel, "Partnerships and Community");
    assert.equal(routeCampusLane("results").channelLabel, "Analytics and Results");
    assert.equal(routeCampusLane("strategy").sharePointSection, "Intern Projects");
    assert.equal(routeCampusLane("strategy").plannerPlan, "growth");
  });

  it("does not turn campus tracking into an Ambassador reward", () => {
    const reward = campusAttributionReward();
    assert.equal(reward.grantsAmbassadorReward, false);
    assert.equal(reward.grantsPetPerksReward, false);
    assert.match(campusTrackingCode({ campus: "Penn State", intern: "Ryan", target: "pet_parent", channel: "qr" }), /^penn-state-ryan-pet-parent-qr$/);
  });

  it("blocks intern self-approval and unapproved execution", () => {
    assert.equal(campusApprovalChangeAllowed({ actor: "intern", next: "approved" }), false);
    assert.equal(campusApprovalChangeAllowed({ actor: "intern", next: "ava_review" }), true);
    assert.equal(campusApprovalChangeAllowed({ actor: "manager", next: "approved" }), true);
    assert.equal(campusExecutionAllowed("ava_review"), false);
    assert.equal(campusExecutionAllowed("university_approval"), false);
    assert.equal(campusExecutionAllowed("approved"), true);
  });

  it("summarizes only the records it is given", () => {
    const summary = summarizeCampusActivity({
      today: "2027-11-01",
      opportunities: [{ status: "Scheduled", happensOn: "2027-11-12" }],
      missions: [{ status: "draft", title: "Hidden" }, { status: "todo", title: "November awareness" }],
      leads: 1,
      visits: 4,
      scans: 2,
      petParents: 0,
      guruApplications: 1,
    });
    assert.equal(summary.activeCampaigns, 1);
    assert.equal(summary.upcomingEvents, 1);
    assert.equal(summary.topCampaign, "November awareness");
    assert.equal(summary.visits, 4);
  });
});
