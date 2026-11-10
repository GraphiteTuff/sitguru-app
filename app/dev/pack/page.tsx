import { notFound } from 'next/navigation';
import Link from 'next/link';
import PackCommunityPage from '@/components/community-studio/PackCommunityPage';
import { currentCommunityWeek } from '@/lib/community-studio/editions';
import type { CommunityItem } from '@/lib/community-studio/types';
export const dynamic = 'force-dynamic';
export default async function PackFixture({searchParams}:{searchParams:Promise<{phone?:string;canvas?:string}>}) {
  if(process.env.NODE_ENV!=='development'||process.env.VERCEL||process.env.SITGURU_LOCAL_PREVIEW!=='true')notFound();
  const params=await searchParams;
  if(params.phone==='1')return <main className="min-h-screen bg-slate-100 p-6"><p className="mb-4 text-center text-sm font-bold">Phone preview · 390 px · <Link href="/dev/pack">Desktop preview</Link></p><iframe title="SitGuru Pack phone preview" src="/dev/pack?canvas=1" className="mx-auto block h-[1000px] w-[390px] max-w-full rounded-[2rem] border-8 border-slate-800 bg-white"/></main>;
  const base:CommunityItem={id:'fixture-rogue',kind:'pet_of_week',petName:'Rogue',title:'Chief explorer. Professional heart-stealer.',story:'A tiny head tilt, a very big personality, and a talent for turning an ordinary walk into everyone’s favorite part of the day. Meet Rogue — this week’s reason to smile.',location:'',status:'published',feedback:'',imageUrl:'/images/rogue-avatar-original.png',mediaMime:'image/png',publicConsent:true,socialConsent:false,submitterName:'',createdAt:'2026-11-09T12:00:00Z',updatedAt:'',publishAt:'2026-11-09T12:00:00Z',weekOf:currentCommunityWeek(),contentId:'',taskId:'',canEdit:false,canReview:false};
  const items:CommunityItem[]=[base,{...base,id:'fixture-cat',kind:'gallery',petName:'Miso',title:'The look that gets an extra treat.',story:'A little fluff. A lot of personality. Some faces make every day a little softer.',imageUrl:'/images/ambassadors/cat-care-trust.jpg'}, {...base,id:'fixture-guru',kind:'guru_spotlight',petName:'A caring neighbor',title:'Good care starts with good company.',story:'Fresh air, happy paws, and someone who notices all the little things. Say hello to the people behind the happy homecomings.',imageUrl:'/images/portal/intern-dog-leash.jpg'}, {...base,id:'fixture-story',kind:'pack',petName:'',title:'Our favorite kind of afternoon.',story:'No big plans. Just a familiar path, a curious nose, and a friend who’s always happy to see you. Sometimes those are the stories that stay with us.',imageUrl:''}];
  return <><div className="bg-white px-5 py-3 text-center text-xs font-bold text-emerald-900"><Link href="/dev/pack?phone=1">View phone layout ↗</Link> · <Link href="/dev/community-studio">Manager Studio preview ↗</Link></div><PackCommunityPage items={items} preview/></>;
}
