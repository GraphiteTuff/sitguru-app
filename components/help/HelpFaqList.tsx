// components/help/HelpFaqList.tsx
import type { HelpFaqItem, HelpStepBlock } from "@/lib/help/content";

export function HelpFaqList({ items }: { items: HelpFaqItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.question}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-sm font-black text-slate-950">{item.question}</p>
          <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-600">
            {item.answer}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function HelpStepBlocks({ blocks }: { blocks: HelpStepBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <section
          key={block.title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
            {block.audience}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">
            {block.title}
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
            {block.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {block.tips && block.tips.length > 0 ? (
            <ul className="mt-4 space-y-1.5 rounded-xl bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-950">
              {block.tips.map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export function HelpNumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}
