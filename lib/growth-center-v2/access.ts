import type { ReactNode } from "react";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import type { GrowthAudience } from "./types";

export async function requireGrowthCenterAccess(
  audience: GrowthAudience,
): Promise<
  | {
      ok: true;
      audience: GrowthAudience;
      actor: {
        id: string;
        name: string;
        isSuperUser: boolean;
      };
      workplace: Awaited<ReturnType<typeof requireGrowthWorkplace>>;
    }
  | { ok: false; ui: ReactNode }
> {
  const kind = audience === "admin" ? "admin" : audience;
  const workplace = await requireGrowthWorkplace(kind);
  if (!workplace.ok) return workplace;

  return {
    ok: true,
    audience,
    actor: {
      id: workplace.actor.id,
      name: workplace.actor.email,
      isSuperUser: workplace.actor.isSuperUser,
    },
    workplace,
  };
}
