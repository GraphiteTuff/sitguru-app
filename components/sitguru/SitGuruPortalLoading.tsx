import { PawIcon } from "@/components/ui/PawIcon";

/**
 * Centered brand loading state shared by the Pet Parent and Guru portals.
 * Uses the same paw + rotating emerald ring as SitGuru's tap feedback.
 * Replaces itself automatically once the requested portal is ready.
 */
export default function SitGuruPortalLoading({
  portal,
}: {
  portal: "Pet Parent" | "Guru";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={"Opening your " + portal + " portal"}
      data-sitguru-portal-loading={portal.toLowerCase().replace(" ", "-")}
      className="flex min-h-[70dvh] w-full items-center justify-center bg-gradient-to-b from-white via-[#f7fffb] to-emerald-50/70 px-4 py-12"
    >
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="relative grid h-28 w-28 place-items-center rounded-full border border-emerald-100 bg-white text-[#0D5C3A] shadow-[0_16px_50px_rgba(13,92,58,0.14)] sm:h-36 sm:w-36 lg:h-44 lg:w-44">
          <span
            aria-hidden="true"
            className="absolute inset-2 animate-spin rounded-full border-[7px] border-emerald-100 border-t-emerald-700 motion-reduce:animate-none sm:inset-3 sm:border-[8px] lg:inset-4 lg:border-[9px]"
          />
          <PawIcon
            aria-hidden="true"
            solid
            contrast="inherit"
            className="relative h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
          />
        </span>
        <p className="text-lg font-black text-[#0D5C3A] sm:text-xl">
          Opening your {portal} portal
        </p>
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Getting your SitGuru space ready.
        </p>
      </div>
    </div>
  );
}
