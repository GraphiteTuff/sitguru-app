import { listGrowthHires } from "@/lib/admin/growth/hire";
import { superUserMayPreviewManager } from "@/lib/internship/manager-access";
import { listInterns } from "@/lib/internship/queries";
import { excludeFromInternPortalList } from "@/lib/internship/team-roster";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type PortalPerson = {
  id: string;
  name: string;
  email: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listSuperUserPortals() {
  const [hires, interns] = await Promise.all([listGrowthHires(), listInterns()]);
  const managers = hires.filter((hire) => hire.status === "active" && hire.userId);
  const ids = managers.map((hire) => hire.userId);
  const { data: profiles } = ids.length
    ? await supabaseAdmin.from("profiles").select("id,full_name,email").in("id", ids)
    : { data: [] };
  const names = new Map(
    (profiles || []).map((row) => [text(row.id), text(row.full_name) || text(row.email)]),
  );
  return {
    managers: managers.map((hire) => ({
      id: hire.userId,
      name: names.get(hire.userId) || hire.email || "Manager",
      email: hire.email,
    })),
    interns: interns
      .filter((intern) => !excludeFromInternPortalList(intern))
      .map((intern) => ({
        id: intern.id,
        name: intern.preferredName || intern.fullName,
        email: intern.email,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function resolveSuperUserManagerPreview(requestedUserId?: string | null) {
  const portals = await listSuperUserPortals();
  if (
    !superUserMayPreviewManager({
      isSuperUser: true,
      requestedUserId,
      activeManagerIds: portals.managers.map((manager) => manager.id),
    })
  ) {
    return null;
  }
  return portals.managers.find((manager) => manager.id === requestedUserId) || null;
}
