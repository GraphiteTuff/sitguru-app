import {notFound} from 'next/navigation';
import Link from 'next/link';
import PackFixture from '@/app/dev/pack/page';
import CommunityFixture from '@/app/dev/community-studio/page';
import ManagerPortalShell from '@/components/manager/ManagerPortalShell';
import ManagerDeskHome from '@/components/manager/ManagerDeskHome';
import InternPortalShell from '@/components/internship/InternPortalShell';
import InternDeskVerification from '@/components/dev/InternDeskVerification';
import AdminLayout from '@/app/admin/layout';
import MarketGrowthBoard from '@/components/admin/MarketGrowthBoard';
import {documentationInternWorkspace} from '@/lib/internship/documentation-fixture';
import {summarizeInternshipHours} from '@/lib/internship/hours';
import {buildMarketDensityMarket,summarizeMarkets} from '@/lib/admin/market-density';
import {buildActivityHeatmap} from '@/lib/internship/activity-heatmap';

export const dynamic='force-dynamic';
const pages=['pack','community','manager','intern','admin','market'] as const;
export default async function VerificationPage({searchParams}:{searchParams:Promise<{page?:string;width?:string;canvas?:string}>}) {
  if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.SITGURU_LOCAL_PREVIEW!=='true')notFound();
  const params=await searchParams;
  const page=pages.includes(params.page as typeof pages[number])?params.page!:'pack';
  const width=[320,390,768,1440].includes(Number(params.width))?Number(params.width):390;
  if(params.canvas!=='1')return <main className="min-h-screen bg-slate-100 p-4"><div className="mb-4 flex flex-wrap gap-3 text-sm font-bold">{pages.map(value=><Link key={value} href={`?page=${value}&width=${width}`}>{value}</Link>)}<span>·</span>{[320,390,768,1440].map(value=><Link key={value} href={`?page=${page}&width=${value}`}>{value}px</Link>)}</div><p className="mb-4 text-xs text-slate-600">Rendered application components with synthetic local data. Header authentication and role dropdowns require real isolated accounts; fixture names are not authenticated identities.</p><iframe title={`${page} at ${width}px`} src={`?page=${page}&canvas=1`} width={width} height={1050} className="block rounded-xl border border-slate-300 bg-white"/></main>;
  if(page==='pack')return <PackFixture searchParams={Promise.resolve({canvas:'1'})}/>;
  if(page==='community')return <CommunityFixture/>;
  if(page==='admin')return <AdminLayout><div className="p-4"><p className="text-sm text-amber-900">Local Admin header and navigation preview only. No authenticated account or dashboard data. Profile, authorized roles and module access require isolated authenticated verification.</p></div></AdminLayout>;
  if(page==='manager')return <ManagerPortalShell><p className="mb-3 text-xs text-amber-900">Synthetic Manager fixture · authenticated identity unverified</p><ManagerDeskHome desk={{firstName:'Fixture',fullName:'Fixture Manager',email:'fixture.manager@example.test',title:'Social Media & Community Growth Manager',cards:[],reviews:[],questions:[],initiatives:[],messages:[],extras:{myTime:null,needsAttention:[]},myTimeSnap:null,activityHeatmap:buildActivityHeatmap({})}}/></ManagerPortalShell>;
  if(page==='intern') {
    const data=documentationInternWorkspace();
    const hourSummary=summarizeInternshipHours({requiredHours:150,requirementStatus:'set',plannedWeeklyHours:20,internshipWeeks:16,startDate:data.intern.academicStartDate,entries:[],exceptions:[],weekZeroReady:true,internshipStatus:'active'});
    return <InternPortalShell assigned onboarded localVerification><p className="mb-3 text-xs text-amber-900">Synthetic Intern fixture · authenticated identity unverified</p><InternDeskVerification data={data} hourSummary={hourSummary}/></InternPortalShell>;
  }
  const markets=[buildMarketDensityMarket({key:'fixture-market',city:'Doylestown',state:'PA',zip:'18901',latitude:40.31,longitude:-75.13,guruCount:4,bookableCount:3,petParentCount:12,ambassadorCount:2,bookingCount:8})];
  return <ManagerPortalShell><p className="mb-3 text-xs text-amber-900">Synthetic market counts · map tiles are external public resources</p><MarketGrowthBoard markets={markets} summary={summarizeMarkets(markets)}/></ManagerPortalShell>;
}
