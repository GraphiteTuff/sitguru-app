"use client";

import { Check, GraduationCap, PawPrint } from "lucide-react";

export type PawPerksAudience = "pet-parent" | "future-guru";

type PawPerksRewardStatesProps = {
  selectedAudience: PawPerksAudience;
  onAudienceChange: (audience: PawPerksAudience) => void;
};

const rewardStates = [
  {
    id: "pet-parent" as const,
    eyebrow: "Pet Parents",
    title: "Give $10. Get $10.",
    description:
      "Your friend or family member gets $10 toward care. You earn $10 after their first eligible paid booking.",
    icon: PawPrint,
    selectedClass:
      "border-emerald-500 bg-emerald-50/80 shadow-[0_18px_40px_rgba(16,185,129,0.12)]",
    iconClass: "bg-emerald-100 text-emerald-700",
    eyebrowClass: "text-emerald-700",
  },
  {
    id: "future-guru" as const,
    eyebrow: "Future Gurus",
    title: "Refer a Guru. Earn $20.",
    description:
      "You earn $20 after they are approved and complete their first eligible paid booking.",
    icon: GraduationCap,
    selectedClass:
      "border-sky-500 bg-sky-50/80 shadow-[0_18px_40px_rgba(14,165,233,0.12)]",
    iconClass: "bg-sky-100 text-sky-700",
    eyebrowClass: "text-sky-700",
  },
];

export default function PawPerksRewardStates({
  selectedAudience,
  onAudienceChange,
}: PawPerksRewardStatesProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rewardStates.map((reward) => {
        const Icon = reward.icon;
        const isSelected = selectedAudience === reward.id;

        return (
          <button
            key={reward.id}
            type="button"
            onClick={() => onAudienceChange(reward.id)}
            className={[
              "group relative min-h-[250px] rounded-[2rem] border bg-white p-6 text-left transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl",
              isSelected
                ? reward.selectedClass
                : "border-slate-200 shadow-sm hover:bg-slate-50",
            ].join(" ")}
            aria-pressed={isSelected}
          >
            {isSelected ? (
              <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                <Check className="h-4 w-4" aria-hidden="true" />
              </div>
            ) : null}

            <div
              className={[
                "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                reward.iconClass,
              ].join(" ")}
            >
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>

            <p
              className={[
                "mb-2 text-sm font-black uppercase tracking-[0.22em]",
                reward.eyebrowClass,
              ].join(" ")}
            >
              {reward.eyebrow}
            </p>

            <h3 className="max-w-[13rem] text-3xl font-black leading-[1.05] text-slate-950">
              {reward.title}
            </h3>

            <p className="mt-4 max-w-[17rem] text-base leading-7 text-slate-600">
              {reward.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}