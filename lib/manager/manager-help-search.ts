import { MANAGER_HELP_ARTICLES, type ManagerHelpArticle } from "@/lib/manager/manager-help";

const STOP=new Set("a an and are as at be by can could do does for from how i if in is it me my of on or our should that the their there these this to what when where which who why will with you your we one after before get find need want help sitguru manager".split(" "));
const ALIASES:Record<string,string> = {
  checkins:"checkin",check:"checkin",checks:"checkin",checkin:"checkin",checkinweekly:"checkin",weekly:"week",
  approves:"approve",approved:"approve",approving:"approve",approval:"approve",reviews:"review",reviewing:"review",
  interns:"intern",student:"intern",students:"intern",lola:"intern",ryan:"intern",lalita:"intern",
  hours:"hour",time:"hour",timesheet:"hour",timesheets:"hour",clock:"hour",
  graphics:"brand",logos:"brand",colors:"brand",fonts:"brand",assets:"brand",images:"brand",
  facebook:"social",instagram:"social",tiktok:"social",youtube:"social",meta:"social",
  campaigns:"campaign",posts:"content",posting:"content",pictures:"content",
  performance:"insights",kpis:"metric",analytics:"insights",numbers:"metric",
  microsoft:"microsoft",m365:"microsoft",planner:"planner",teams:"teams",sharepoint:"sharepoint",
  accounts:"account",permissions:"access",roles:"access",login:"access",logins:"access",
  bookings:"booking",signups:"signup",registrations:"signup",gurus:"guru",parents:"parent",
};
function normalize(value:string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/check[\s-]?ins?/g," checkin ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
}
function token(value:string){
  const clean=normalize(value);
  return clean?clean.split(" ").filter(w=>w&&!STOP.has(w)).map(w=>ALIASES[w]||(/s$/.test(w)&&w.length>4?w.slice(0,-1):w)):[];
}
const dedupe=(tokens:string[])=>[...new Set(tokens)];
export type ManagerHelpHit={article:ManagerHelpArticle;score:number;excerpt:string};
function contains(haystack:string,needle:string){return haystack===needle||haystack.includes(needle);}
function tokenScore(haystack:Set<string>,target:string){
  if(haystack.has(target))return 1;
  for(const value of haystack)if(value.startsWith(target)&&target.length>=4)return .6;
  return 0;
}
export function searchManagerHelp(
  query:string,
  category="all",
  maxResults=12,
  articles:ManagerHelpArticle[]=MANAGER_HELP_ARTICLES,
):ManagerHelpHit[]{
  const keywords=dedupe(token(query));
  const phrase=normalize(query).replace(/^(how|what|where|when|why|can|do|does|is|i|my|please|tell|me|to|with|help)+\s*/g,"");
  const matched=articles
    .filter(article=>category==="all"||article.category===category)
    .map(article=>{
      const title=normalize(article.title);
      const summary=normalize(article.summary);
      const tags=normalize(article.keywords.join(" "));
      const question=normalize(article.faqs.map(f=>f.q).join(" "));
      const body=normalize([...article.steps,article.result,...article.tips,...article.troubleshooting.map(t=>t.issue+" "+t.fix),...article.faqs.map(f=>f.a)].join(" "));
      const titleTokens=new Set(token(title));
      const metaTokens=new Set(token(summary+" "+tags+" "+article.category));
      const questionTokens=new Set(token(question));
      const bodyTokens=new Set(token(body));
      let score=0;
      let hits=0;
      for(const term of keywords){
        const ts=tokenScore(titleTokens,term), ms=tokenScore(metaTokens,term), qs=tokenScore(questionTokens,term), bs=tokenScore(bodyTokens,term);
        const best=Math.max(ts*10,ms*6,qs*8,bs*2);
        if(best>0)hits++;
        score+=best;
      }
      if(phrase.length>=4){
        if(contains(title,phrase))score+=25;
        if(contains(tags,phrase))score+=18;
        if(contains(summary,phrase))score+=13;
        if(contains(question,phrase))score+=18;
      }
      if(keywords.length&&hits===keywords.length)score+=12;
      if(keywords.length>2&&hits<Math.ceil(keywords.length/2))score=0;
      const excerpt=article.faqs.find(f=>token(f.q).some(word=>keywords.includes(word)))?.a||article.summary;
      return {article,score,excerpt};
    });
  if(!keywords.length)return matched.slice(0,maxResults).map(hit=>({...hit,score:1}));
  return matched.filter(hit=>hit.score>0).sort((a,b)=>b.score-a.score||a.article.title.localeCompare(b.article.title)).slice(0,maxResults);
}

export const MANAGER_HELP_POPULAR_QUESTIONS=[
  "How do I approve Lola's weekly check-in?",
  "Why can't I see an assigned intern?",
  "How do I submit my own hours for payment?",
  "How do I review an intern's content?",
  "Where can I find approved SitGuru logos and brand colors?",
  "Why isn't Microsoft Planner syncing my assignment?",
  "How do I see actual Guru and Pet Parent growth?",
  "How do I connect Ava's Facebook Page access?",
] as const;
