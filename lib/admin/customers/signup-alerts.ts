import { supabaseAdmin } from "@/lib/supabase/admin";
import { SUPER_USER_EMAILS } from "@/lib/admin/super-users";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function listHqRecipientIds() {
  const [admins, supers] = await Promise.all([
    supabaseAdmin.from("profiles").select("id").eq("role", "admin").limit(80),
    supabaseAdmin.from("profiles").select("id").in("email", [...SUPER_USER_EMAILS]).limit(10),
  ]);

  if (admins.error) {
    console.warn("Pet Parent alert recipients skipped:", admins.error.message);
  }

  const ids = new Set<string>();
  for (const row of [...(admins.data || []), ...(supers.data || [])] as AnyRow[]) {
    const id = text(row.id);
    if (id) ids.add(id);
  }
  return Array.from(ids);
}

export async function notifyHqNewPetParent(input: {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  const adminIds = await listHqRecipientIds();
  if (!adminIds.length) return { notified: 0 };

  const href = input.userId
    ? `/admin/customers/${encodeURIComponent(input.userId)}`
    : "/admin/customers#new";
  const title = "New Pet Parent registered";
  const contact = input.email || input.phone || "No contact yet";
  const body = `${input.name} just joined SitGuru. ${contact}`;
  const now = new Date().toISOString();

  const rows = adminIds.map((userId) => ({
    user_id: userId,
    title,
    body,
    type: "pet_parent_signup",
    href,
    link: href,
    is_read: false,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) {
    console.warn("Pet Parent signup notification skipped:", error.message);
    return { notified: 0 };
  }

  return { notified: adminIds.length };
}
