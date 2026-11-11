import ContentCard from "@/components/reads/ContentCard";
import type { ReadsContent, ReadsContentDetail } from "@/lib/reads/types";

export default function RelatedRail({
  title = "Related on SitGuru Reads",
  items,
}: {
  title?: string;
  items: Array<ReadsContent | ReadsContentDetail>;
}) {
  if (!items?.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-black text-[#163127]">{title}</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div key={item.id} className="min-w-[240px] max-w-[260px] flex-shrink-0">
            <ContentCard item={item as ReadsContentDetail} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
