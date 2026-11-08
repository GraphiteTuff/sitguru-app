/**
 * Where an intern work-file action should land after it finishes.
 * Brand uploads must stay on the Brand Kit tool. Sending them to
 * `/intern?tool=brand` is rewritten to the Toolkit home and drops the
 * saved confirmation, which looks like the file never saved.
 */
export function internAttachmentReturnPath(
  mode: string,
  internId: string,
  itemType?: string | null,
) {
  if (mode === "supervisor") return `/admin/internship/interns/${internId}`;
  if (itemType === "brand") return "/intern/toolkit?tool=brand";
  if (itemType === "task") return "/intern?tab=work&work=tasks";
  return "/intern";
}
