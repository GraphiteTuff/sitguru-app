import assert from "node:assert/strict";
import { test } from "node:test";
import { MANAGER_HELP_ARTICLES, MANAGER_HELP_CATEGORIES, managerHelpArticle } from "./manager-help";
import { searchManagerHelp, MANAGER_HELP_POPULAR_QUESTIONS } from "./manager-help-search";

test("manager help has substantive, unique and actionable guides",()=>{
  assert.ok(MANAGER_HELP_ARTICLES.length>=35);
  assert.equal(new Set(MANAGER_HELP_ARTICLES.map(x=>x.slug)).size,MANAGER_HELP_ARTICLES.length);
  assert.equal(MANAGER_HELP_CATEGORIES.length,8);
  for(const article of MANAGER_HELP_ARTICLES){
    assert.ok(article.steps.length>=4,`Short instructions: ${article.slug}`);
    assert.ok(article.result.length>30,`No expected result: ${article.slug}`);
    assert.ok(article.faqs.length>=1,`No FAQ: ${article.slug}`);
    assert.ok(article.troubleshooting.length>=1,`No troubleshooting: ${article.slug}`);
    assert.ok(article.route.startsWith("/manager/") || article.route.startsWith("/intern/manage"),`Wrong destination: ${article.slug}`);
    assert.equal(managerHelpArticle(article.slug)?.title,article.title);
  }
});

test("natural-language manager questions find the right procedure",()=>{
  const cases=[
    ["How do I approve Lola's weekly check in?","review-checkins"],
    ["Can't access Facebook page account","social-account-access"],
    ["where to download logo and brand colors","brand-kit"],
    ["How to pay Ava from submitted hours","manager-own-hours"],
    ["planner teams sharepoint not syncing","teams-planner"],
  ];
  for(const [question,expected] of cases){
    const hits=searchManagerHelp(question);
    assert.ok(hits.some(x=>x.article.slug===expected),`No useful answer for ${question}`);
  }
});

test("category filters, blank search and no-result states behave",()=>{
  assert.ok(searchManagerHelp("").length>=1);
  const category=searchManagerHelp("hours","Check-ins, hours & reviews");
  assert.ok(category.length>0);
  assert.ok(category.every(x=>x.article.category==="Check-ins, hours & reviews"));
  assert.deepEqual(searchManagerHelp("xqznonexistent999"),[]);
  assert.equal(MANAGER_HELP_POPULAR_QUESTIONS.length,8);
});
