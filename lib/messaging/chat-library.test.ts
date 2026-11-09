import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decideCompanionAssist,
  faqTitleFromQuestion,
  helpCategoryForQuestion,
  hideFromInternDirectory,
  isGrowthManagerSeat,
  isLiveAgentSeat,
  isStaffChatPeer,
  isSubstantiveQuestion,
  LIVE_AGENT_REPLY,
  matchApprovedFaq,
  shouldHoldForCompanion,
  sortStaffDirectoryPeople,
} from "./chat-library";

describe("companion FAQ or live agent", () => {
  it("answers a known FAQ instead of alerting a teammate", () => {
    const decision = decideCompanionAssist({
      question: "How do refunds work?",
      faqAnswer: "Refunds stay on the SitGuru booking.",
    });
    assert.equal(decision.kind, "faq");
    assert.match(decision.reply, /Refunds stay/);
  });

  it("sends an unanswered problem to the live agent", () => {
    const decision = decideCompanionAssist({
      question: "My Guru profile photo will not save after I crop it.",
    });
    assert.equal(decision.kind, "agent");
    assert.equal(decision.reply, LIVE_AGENT_REPLY);
  });

  it("lets a greeting and a care search stay with the companion", () => {
    assert.equal(decideCompanionAssist({ question: "Hi Rogue" }).kind, "continue");
    assert.equal(
      decideCompanionAssist({ question: "Find a walker near me in 19104" }).kind,
      "continue",
    );
    assert.equal(shouldHoldForCompanion("Need boarding in 19103"), true);
    assert.equal(isSubstantiveQuestion("Jason"), false);
  });

  it("matches an approved help article and ignores a weak overlap", () => {
    const articles = [
      {
        title: "How do I update my Guru profile photo?",
        summary: "Open Guru profile, choose the photo, and save.",
        body: "Open your Guru profile, upload a clear face photo, and save.",
        keywords: ["guru profile photo"],
      },
    ];
    assert.match(
      matchApprovedFaq("How do I update my Guru profile photo?", articles) || "",
      /clear face photo/,
    );
    assert.equal(matchApprovedFaq("What time is it?", articles), null);
  });
});

describe("admin chat directory", () => {
  it("keeps Jason's admin login out of the Intern list", () => {
    assert.equal(
      hideFromInternDirectory({
        email: "jason@sitguru.com",
        userId: "jason",
        actorUserId: "jason",
      }),
      true,
    );
    assert.equal(isLiveAgentSeat({ email: "jason@sitguru.com" }), true);
    assert.equal(
      isLiveAgentSeat({ email: "jasongraff1978@gmail.com", role: "customer" }),
      false,
    );
    assert.equal(
      hideFromInternDirectory({
        email: "lola.uh15@gmail.com",
        role: "intern",
        userId: "lola",
        actorUserId: "jason",
      }),
      false,
    );
    assert.equal(
      isGrowthManagerSeat({ role: "social_community_manager" }),
      true,
    );
    assert.equal(
      isGrowthManagerSeat({
        role: "ambassador",
        accountType: "ambassador",
        signupRole: "social_community_manager",
      }),
      true,
    );
    assert.equal(
      isStaffChatPeer({ email: "jason@sitguru.com" }),
      true,
    );
    assert.equal(
      isStaffChatPeer({ role: "social_community_manager" }),
      true,
    );
    assert.deepEqual(
      sortStaffDirectoryPeople([
        { firstName: "Lola", detail: "Intern", online: true },
        { firstName: "Jason", detail: "Admin", online: false },
        { firstName: "Ava", detail: "Manager", online: true },
      ]).map((row) => row.firstName),
      ["Ava", "Lola", "Jason"],
    );
  });

  it("files profile problems under Account and billing under Billing", () => {
    assert.equal(
      helpCategoryForQuestion("My Guru profile photo will not upload"),
      "Account & Profiles",
    );
    assert.equal(helpCategoryForQuestion("I was charged twice"), "Billing & Refunds");
    assert.match(faqTitleFromQuestion("my profile is stuck"), /\?$/);
  });
});
