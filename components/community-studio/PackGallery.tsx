import { PawPrint } from "lucide-react";
import ShareStoryButton from "@/components/community-studio/ShareStoryButton";
import { currentCommunityWeek } from "@/lib/community-studio/editions";
import type { CommunityItem } from "@/lib/community-studio/types";

const collections = [
  { id: "pet_of_week", title: "Pet of the Week", text: "A little spotlight for a whole lot of personality." },
  { id: "pack", title: "Meet the SitGuru Pack", text: "Good company, great stories, and plenty of wagging tails." },
  { id: "gallery", title: "Community Gallery", text: "The moments that bring us together." },
  { id: "guru_spotlight", title: "Guru Spotlights", text: "The caring people making a difference every day." },
];

function StoryCard({ item, collection }: { item: CommunityItem; collection: string }) {
  return (
    <article id={`story-${item.id}`} className="scroll-mt-24 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.petName || item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="grid aspect-[4/3] place-items-center bg-emerald-50 text-emerald-600"><PawPrint size={56} /></div>
      )}
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          {item.petName || collection}{item.location ? ` · ${item.location}` : ""}
        </p>
        {item.weekOf && <p className="mt-2 text-xs font-semibold text-slate-500">Week of {new Date(`${item.weekOf}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</p>}
        <h3 className="mt-2 text-xl font-extrabold text-slate-900">{item.title}</h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{item.story}</p>
        <div className="mt-4"><ShareStoryButton id={item.id} title={item.title} /></div>
      </div>
    </article>
  );
}

export default function PackGallery({ items }: { items: CommunityItem[] }) {
  const week = currentCommunityWeek();
  return (
    <div className="space-y-12">
      {collections.map(collection => {
        const all = items.filter(item => item.kind === collection.id);
        const isWeekly = collection.id === "pet_of_week";
        const stories = isWeekly ? all.filter(item => item.weekOf === week) : all;
        const past = isWeekly ? all.filter(item => item.weekOf < week).sort((a, b) => b.weekOf.localeCompare(a.weekOf)) : [];
        return (
          <section key={collection.id} id={collection.id} className="scroll-mt-24">
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0D5C3A]">{collection.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{collection.text}</p>
            </div>
            {stories.length ? (
              <div className={`grid items-start gap-5 ${isWeekly ? "max-w-2xl" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {stories.map(item => <StoryCard key={item.id} item={item} collection={collection.title} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-sm leading-6 text-emerald-900">
                {isWeekly ? "This week’s spotlight is on its way. Share a story to nominate a pet you love." : "The next great story could be yours. Our team is preparing this collection."}
              </div>
            )}
            {past.length > 0 && (
              <details className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4">
                <summary className="min-h-10 cursor-pointer text-sm font-bold text-emerald-900">Meet our past Pets of the Week ({past.length})</summary>
                <div className="mt-4 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map(item => <StoryCard key={item.id} item={item} collection={collection.title} />)}
                </div>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}
