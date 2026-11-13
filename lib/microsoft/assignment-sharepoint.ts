/**
 * SharePoint storage for SitGuru internship assignments.
 *
 * SitGuru holds assignment workflow/metadata; editable work lives in the
 * Microsoft 365 team SharePoint library. Do not silently fall back to the
 * Supabase attachments bucket when SharePoint is unavailable.
 */
import { graphRequest, readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { listAssignmentIntegrations, upsertAssignmentIntegration } from "@/lib/microsoft/assignment-integrations";
import { sharePointFolderName } from "@/lib/admin/growth/work-routing";

const SITGURU_SITE = "sitgurullc.sharepoint.com,bdeae946-dde5-432e-b327-67e6f817b1f1,cfd225c1-0753-4381-ad82-d7d1e90e3598";
const SITGURU_DRIVE = "b!RunqveXdLkOzJ2fm-Bex8cEl0s9TB4FDrYLX0ekONZir07HYJ5KSTYfhr0wIPsiy";
const INTERNS_ROOT_ID = "01Y2LU7MYGONZKKTX6AVH2FDUV7FF2EHIC";
const DOCUMENTS_URL = "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/Intern%20Projects";
const KNOWN_INTERN_FOLDERS: Record<string, { name: string; id: string }> = {
  "lola uhl": { name: "03 Lola Uhl", id: "01Y2LU7M4ZVXAUBFGEWZEILESOJRQO5D4M" },
  "ryan manibo": { name: "02 Ryan Manibo", id: "01Y2LU7M6EFF2VUSP73VAKSXR6ACEVBCC7" },
};
const LOLA_TREND_TITLE = "pet trend research & sitguru content ideas";
const LOLA_TREND_FOLDER_ID = "01Y2LU7M3JBENJE6TWXBEK4EUP2RP6QX4G";

function normalize(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function encodedPart(part: string) {
  return encodeURIComponent(part);
}

type DriveItem = {
  id?: string;
  webUrl?: string;
  name?: string;
  parentReference?: { id?: string };
};

export type AssignmentSharePointFolder = {
  status: "connected" | "not_configured" | "needs_access" | "error";
  id: string;
  driveId: string;
  url: string;
  message: string;
  internFolder: string;
  assignmentFolder: string;
};

export function expectedInternAssignmentFolder(internName: string, title: string) {
  const known = KNOWN_INTERN_FOLDERS[normalize(internName)];
  const internFolder = known?.name || sharePointFolderName(internName);
  const assignmentFolder = sharePointFolderName(title);
  const url = `${DOCUMENTS_URL}/${encodedPart(internFolder)}/${encodedPart(assignmentFolder)}`;
  const knownFolderId =
    normalize(internName) === "lola uhl" && normalize(title) === LOLA_TREND_TITLE
      ? LOLA_TREND_FOLDER_ID
      : "";
  return { internFolder, internId: known?.id || "", assignmentFolder, knownFolderId, url };
}

async function getDriveItem(driveId: string, id: string) {
  return graphRequest<DriveItem>({ method: "GET", path: `/drives/${encodedPart(driveId)}/items/${encodedPart(id)}` });
}

/** Find/reuse the exact per-intern folder; never create a flat folder at the shared root. */
export async function ensureInternAssignmentSharePointFolder(input: {
  assignmentId: string;
  internName: string;
  title: string;
}): Promise<AssignmentSharePointFolder> {
  const desired = expectedInternAssignmentFolder(input.internName, input.title);
  const cfg = readMicrosoftGraphConfig();
  const driveId = SITGURU_DRIVE; // Resolved from the SitGuru Growth team's real Documents library.
  const unavailable = (status: AssignmentSharePointFolder["status"], message: string): AssignmentSharePointFolder => ({
    status, id: "", driveId, url: desired.url, message,
    internFolder: desired.internFolder, assignmentFolder: desired.assignmentFolder,
  });
  if (!cfg.configured) {
    return unavailable("not_configured", "Microsoft Graph application credentials are not configured on this deployment.");
  }

  const existing = (await listAssignmentIntegrations([input.assignmentId]))
    .find((item) => item.provider === "sharepoint");
  let internId = desired.internId;
  if (!internId) {
    const find = await graphRequest<DriveItem>({
      method: "GET",
      path: `/drives/${encodedPart(driveId)}/root:/Intern%20Projects/${encodedPart(desired.internFolder)}`,
    });
    if (find.ok) {
      internId = String(find.data.id || "");
    } else {
      const created = await graphRequest<DriveItem>({
        method: "POST",
        path: `/drives/${encodedPart(driveId)}/items/${INTERNS_ROOT_ID}/children`,
        body: { name: desired.internFolder, folder: {}, "@microsoft.graph.conflictBehavior": "fail" },
      });
      if (created.ok) internId = String(created.data.id || "");
      if (!internId) return unavailable(created.ok ? "error" : created.code === "needs_access" ? "needs_access" : "error", "Could not find or create the intern SharePoint folder.");
    }
  } else {
    const parent = await getDriveItem(driveId, internId);
    if (!parent.ok) return unavailable(parent.code === "needs_access" ? "needs_access" : "error", "The intern SharePoint folder is not accessible to the SitGuru integration.");
  }

  let folderId = desired.knownFolderId;
  if (!folderId && existing?.externalId) {
    // Existing integrations are trusted only when they point under this intern's folder.
    const previous = await getDriveItem(driveId, existing.externalId);
    if (previous.ok && previous.data.parentReference?.id === internId) {
      folderId = String(previous.data.id || "");
    }
  }
  if (!folderId) {
    const lookup = await graphRequest<DriveItem>({
      method: "GET",
      path: `/drives/${encodedPart(driveId)}/items/${encodedPart(internId)}:/${encodedPart(desired.assignmentFolder)}`,
    });
    if (lookup.ok) folderId = String(lookup.data.id || "");
  }

  let folderUrl = desired.url;
  if (folderId) {
    const verified = await getDriveItem(driveId, folderId);
    if (!verified.ok || !verified.data.id || verified.data.parentReference?.id !== internId) {
      return unavailable("needs_access", "The expected assignment folder could not be verified under the intern folder.");
    }
    folderUrl = String(verified.data.webUrl || folderUrl);
  } else {
    const made = await graphRequest<DriveItem>({
      method: "POST",
      path: `/drives/${encodedPart(driveId)}/items/${encodedPart(internId)}/children`,
      body: { name: desired.assignmentFolder, folder: {}, "@microsoft.graph.conflictBehavior": "fail" },
    });
    if (!made.ok) {
      return unavailable(made.code === "needs_access" ? "needs_access" : "error", "Could not create the assignment folder; check SharePoint permissions.");
    }
    folderId = String(made.data.id || "");
    folderUrl = String(made.data.webUrl || folderUrl);
  }
  if (!folderId) return unavailable("error", "SharePoint did not return a folder ID.");

  const persisted = await upsertAssignmentIntegration({
    assignmentId: input.assignmentId,
    provider: "sharepoint",
    externalId: folderId,
    externalParentId: internId,
    externalUrl: folderUrl,
    status: "connected",
    metadata: { siteId: SITGURU_SITE, driveId, internFolder: desired.internFolder, assignmentFolder: desired.assignmentFolder },
  });
  if (!persisted) return unavailable("error", "The SharePoint folder was found but SitGuru could not save its link.");
  return { status: "connected", id: folderId, driveId, url: folderUrl, message: "",
    internFolder: desired.internFolder, assignmentFolder: desired.assignmentFolder };
}

export async function saveInternAssignmentMarkdown(input: {
  assignmentId: string;
  internName: string;
  title: string;
  dueOn: string;
  description: string;
  notes: string;
  researchLink: string;
}): Promise<{ ok: true; url: string; id: string; folderUrl: string } | { ok: false; message: string }> {
  const folder = await ensureInternAssignmentSharePointFolder(input);
  if (folder.status !== "connected") {
    return { ok: false, message: folder.message || "SharePoint is unavailable. The work was not saved." };
  }
  const markdown = [
    `# ${input.title}`,
    "",
    `Intern: ${input.internName}`,
    `Due: ${input.dueOn || "TBD"}`,
    "",
    "## Assignment instructions",
    input.description,
    "",
    "## Intern research and work",
    input.notes || "_No notes yet._",
    "",
    "## Supporting work link",
    input.researchLink || "_No link provided._",
    "",
    `Last saved from SitGuru: ${new Date().toISOString()}`,
    "",
  ].join("\n");
  const stored = await graphRequest<DriveItem>({
    method: "PUT",
    path: `/drives/${encodedPart(folder.driveId)}/items/${encodedPart(folder.id)}:/SitGuru%20Assignment%20Work.md:/content`,
    contentType: "text/markdown; charset=utf-8",
    rawBody: markdown,
  });
  if (!stored.ok || !stored.data.id) {
    return { ok: false, message: "SharePoint could not save this file. SitGuru did not mark your work as saved." };
  }
  return { ok: true, url: String(stored.data.webUrl || `${folder.url}/SitGuru%20Assignment%20Work.md`), id: String(stored.data.id), folderUrl: folder.url };
}
