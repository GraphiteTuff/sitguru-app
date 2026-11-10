import { ArrowDown, PawPrint, ShieldCheck, Sparkles } from 'lucide-react';
import type { CommunityItem, CommunityWorkspace } from '@/lib/community-studio/types';
import { currentCommunityWeek } from '@/lib/community-studio/editions';
import CommunitySubmissionFlow from './CommunitySubmissionFlow';
import ShareStoryButton from './ShareStoryButton';
import PackLiveRefresh from './PackLiveRefresh';

export default function PackCommunityPage({items,workspace,authenticated=false,preview=false}: {
  items:CommunityItem[];workspace?:CommunityWorkspace;authenticated?:boolean;preview?:boolean;
}) {
  const featured = items.find(item => item.kind === 'pet_of_week' && item.weekOf === currentCommunityWeek());
  const gallery = items.filter(item => item.id !== featured?.id);
  return <main className="bg-[#F8F8F2] pb-16 text-[#173B30]">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      {preview && <p className="pt-4 text-center text-xs font-semibold text-amber-900">Local preview · example community stories · no submissions or permissions are sent</p>}
      <header className="flex flex-wrap items-end justify-between gap-5 py-8 sm:py-12">
        <div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#377956]"><PawPrint size={17}/> The SitGuru Pack</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Good pets. Great stories.<br/><span className="text-[#577661]">One happy community.</span></h1></div>
        <a href="#submit" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0D5C3A] px-6 text-sm font-bold !text-white">Submit photo or video <ArrowDown size={17}/></a>
      </header>
      <section aria-labelledby="weekly-pet" className="overflow-hidden rounded-[2rem] bg-[#E5EEDC] shadow-sm">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          {featured?.imageUrl ? <img src={featured.mediaUrl || featured.imageUrl} alt={featured.petName || featured.title} fetchPriority="high" className="h-[360px] w-full object-cover sm:h-[480px] lg:h-[560px]"/> : <div className="grid min-h-72 place-items-center bg-[#D4E3CD]"><PawPrint size={90} className="text-[#759674]"/></div>}
          <div id={featured ? `story-${featured.id}` : undefined} className="flex flex-col justify-center p-7 sm:p-12">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em]"><Sparkles size={17}/> Pet of the Week</p>
            <h2 id="weekly-pet" className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">{featured?.petName || 'A new friend awaits.'}</h2>
            <p className="mt-4 text-lg font-bold">{featured?.title || 'Every pet deserves a little spotlight.'}</p>
            <p className="mt-4 max-w-lg whitespace-pre-wrap text-base leading-8 text-[#46604E]">{featured?.story || 'Our next Pet of the Week is on the way. Tell us about the little personality who makes your days brighter.'}</p>
            {featured ? <div className="mt-7"><ShareStoryButton id={featured.id} title={featured.title}/></div> : <a href="#submit" className="mt-7 inline-flex min-h-12 items-center text-sm font-extrabold">Nominate a pet you love →</a>}
            <p className="mt-7 text-xs font-semibold text-[#5F775C]">Little personalities. Big reasons to smile.</p>
          </div>
        </div>
      </section>
      <section id="gallery" aria-labelledby="gallery-heading" className="py-12 sm:py-16">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#688161]">Life with the Pack</p><h2 id="gallery-heading" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">A gallery of everyday joy.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#637263]">Funny moments, favorite faces, pet stories, and the Gurus who care. There’s a little bit of all of us here.</p></div><PackLiveRefresh/></div>
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {gallery.map(item => <article id={`story-${item.id}`} key={item.id} className="mb-5 break-inside-avoid overflow-hidden rounded-3xl border border-[#E2E6DB] bg-white">
            {(item.mediaUrl || item.imageUrl) && (item.mediaMime?.startsWith('video/') ? <video src={item.mediaUrl || item.imageUrl} controls playsInline preload="metadata" aria-label={item.title} className="max-h-[430px] w-full bg-[#143327]"/> : <img src={item.mediaUrl || item.imageUrl} alt={item.petName || item.title} loading="lazy" className="max-h-[430px] w-full object-cover"/>)}
            <div className="p-5"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#60815E]">{item.kind === 'guru_spotlight' ? 'Meet a Guru' : item.mediaMime?.startsWith('video/') ? 'Caught on camera' : 'From the community'}</p><h3 className="mt-2 text-lg font-extrabold">{item.title}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#697568]">{item.story}</p><div className="mt-4"><ShareStoryButton id={item.id} title={item.title}/></div></div>
          </article>)}
        </div>
        {!gallery.length && <p className="rounded-3xl border border-dashed border-[#C7D9BF] p-8 text-sm leading-7">The gallery is growing. Your favorite photo, funny clip, or short story could be the next little moment of joy.</p>}
      </section>
      <section id="submit" aria-labelledby="submit-heading" className="scroll-mt-8 border-t border-[#DFE6D6] py-10 sm:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-[0.7fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-24"><p className="text-xs font-extrabold uppercase tracking-widest text-[#688161]">Your moment belongs here</p><h2 id="submit-heading" className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">The best stories<br/>start with you.</h2><p className="mt-5 text-sm leading-8 text-[#637263]">A camera-roll favorite. A wonderfully silly video. A Guru introduction. Share something that makes you smile.</p><p className="mt-5 text-sm font-bold">Choose media → Add your story → Confirm permissions</p><p className="mt-7 flex gap-2 text-xs leading-6 text-[#637263]"><ShieldCheck className="mt-1 shrink-0" size={17}/>Your submission stays private until permission checks and Ava’s community review are complete. Social media reuse is always a separate choice.</p></div>
          <CommunitySubmissionFlow workspace={workspace} authenticated={authenticated} preview={preview}/>
        </div>
      </section>
    </div>
  </main>;
}
