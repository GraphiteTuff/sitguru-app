import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessBrandUploadClaim,
  brandDownloadFileName,
  brandKitCapabilities,
  brandMasterFolder,
  internBrandLibraryHref,
  parseSitGuruSharePointUrl,
  sharePointSourceAction,
  inspectBrandBytes,
  paginateBrandAssets,
  resolveBrandLibraryStatus,
  safeBrandFileName,
  sortBrandAssets,
} from "./brand-kit";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const svg = new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>`);
const svgScript = new TextEncoder().encode(`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`);

describe("brand kit permissions", () => {
  it("lets growth managers upload and archive, and only super users approve or delete", () => {
    const manager = brandKitCapabilities({
      canAccessAdmin: true,
      isSuperUser: false,
      growthOnly: true,
      intern: false,
    });
    assert.equal(manager.upload, true);
    assert.equal(manager.archive, true);
    assert.equal(manager.approve, false);
    assert.equal(manager.delete, false);
    const admin = brandKitCapabilities({
      canAccessAdmin: true,
      isSuperUser: true,
      growthOnly: false,
      intern: false,
    });
    assert.equal(admin.approve, true);
    assert.equal(admin.delete, true);
    const intern = brandKitCapabilities({
      canAccessAdmin: false,
      isSuperUser: false,
      growthOnly: false,
      intern: true,
    });
    assert.equal(intern.upload, false);
    assert.equal(intern.delete, false);
    assert.equal(intern.viewApproved, true);
  });
});

describe("brand kit files", () => {
  it("accepts a real PNG and SVG and rejects a renamed or active file", () => {
    const pngOk = inspectBrandBytes({
      bytes: png,
      fileName: "sitguru-logo.png",
      declaredMime: "image/png",
      byteLength: png.length,
    });
    assert.equal(pngOk.ok, true);
    const svgOk = inspectBrandBytes({
      bytes: svg,
      fileName: "mark.svg",
      declaredMime: "image/svg+xml",
      byteLength: svg.length,
    });
    assert.equal(svgOk.ok, true);
    const html = inspectBrandBytes({
      bytes: new TextEncoder().encode("<html><body>nope</body></html>"),
      fileName: "logo.png",
      declaredMime: "image/png",
      byteLength: 32,
    });
    assert.equal(html.ok, false);
    const active = inspectBrandBytes({
      bytes: svgScript,
      fileName: "mark.svg",
      declaredMime: "image/svg+xml",
      byteLength: svgScript.length,
    });
    assert.equal(active.ok, false);
  });

  it("rejects unsafe names and oversized claims", () => {
    assert.equal(safeBrandFileName("../logo.png"), "logo.png");
    assert.equal(safeBrandFileName(".."), "");
    assert.equal(safeBrandFileName("logo..png"), "");
    const huge = assessBrandUploadClaim({
      fileName: "clip.mp4",
      declaredMime: "video/mp4",
      declaredSize: 80 * 1024 * 1024,
    });
    assert.equal(huge.ok, false);
    const zip = assessBrandUploadClaim({
      fileName: "kit.zip",
      declaredMime: "application/zip",
      declaredSize: 1024,
    });
    assert.equal(zip.ok, true);
    assert.equal(brandDownloadFileName("SitGuru Logo.jpg"), "SitGuru-Logo.jpg");
  });
});

describe("brand library order", () => {
  it("keeps Ava and interns on approved files and lets an admin open the other queues", () => {
    assert.equal(resolveBrandLibraryStatus({ isSuperUser: false, status: "draft" }), "approved");
    assert.equal(resolveBrandLibraryStatus({ isSuperUser: false }), "approved");
    assert.equal(resolveBrandLibraryStatus({ isSuperUser: true, status: "draft" }), "draft");
    assert.equal(resolveBrandLibraryStatus({ isSuperUser: true, status: "pending_review" }), "pending_review");
    assert.equal(resolveBrandLibraryStatus({ isSuperUser: true, status: "archived" }), "archived");
    assert.equal(resolveBrandLibraryStatus({ isSuperUser: true }), "active");
  });

  it("sorts approved assets ahead of drafts", () => {
    const sorted = sortBrandAssets(
      [
        { title: "Draft mark", approvalStatus: "draft", createdAt: "2026-11-07T00:00:00Z" },
        { title: "Approved wordmark", approvalStatus: "approved", createdAt: "2026-11-01T00:00:00Z" },
      ],
      "approved_first",
    );
    assert.equal(sorted[0]?.title, "Approved wordmark");
    const page = paginateBrandAssets(Array.from({ length: 30 }, (_, index) => index), 2, 12);
    assert.equal(page.assets.length, 12);
    assert.equal(page.page, 2);
    assert.equal(page.pages, 3);
    assert.equal(page.total, 30);
  });

  it("sends current JPG and SVG masters to active SharePoint folders, not the archive", () => {
    const jpg = brandMasterFolder({
      category: "official_logos",
      mimeType: "image/jpeg",
      approvalStatus: "approved",
    });
    assert.equal(jpg.name, "02 Digital & Social Logos");
    assert.equal(jpg.archived, false);
    const svg = brandMasterFolder({
      category: "official_logos",
      mimeType: "image/svg+xml",
      approvalStatus: "approved",
    });
    assert.equal(svg.name, "01 Official Master Logos");
    const retired = brandMasterFolder({
      category: "official_logos",
      mimeType: "image/svg+xml",
      approvalStatus: "archived",
    });
    assert.equal(retired.name, "99 Brand Archive");
  });

  it("accepts a SitGuru SharePoint file URL and rejects other destinations", () => {
    const file = parseSitGuruSharePointUrl(
      "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/General/02%20Brand%20Kit/02%20Digital%20%26%20Social%20Logos/horizontal.jpg",
    );
    assert.equal(file.ok && file.kind, "file");
    const imageLink = parseSitGuruSharePointUrl(
      "https://sitgurullc.sharepoint.com/:i:/r/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/General/02%20Brand%20Kit/green-dog-cat.jpg",
    );
    assert.equal(imageLink.ok && imageLink.kind, "file");
    const folder = parseSitGuruSharePointUrl(
      "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FSitGuruMarketingCommunityGrowth%2FShared%20Documents%2FGeneral%2F02%20Brand%20Kit",
    );
    assert.equal(folder.ok && folder.kind, "folder");
    assert.equal(parseSitGuruSharePointUrl("https://contoso.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/logo.jpg").ok, false);
    assert.equal(parseSitGuruSharePointUrl("http://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/logo.jpg").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/sites/OtherSite/logo.jpg").ok, false);
    assert.equal(parseSitGuruSharePointUrl("javascript:alert(1)").ok, false);
    const saved = sharePointSourceAction({
      sourceUrl: "https://sitgurullc.sharepoint.com/:i:/r/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/logo.jpg",
      folderHref: "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/Forms/AllItems.aspx",
      libraryHref: "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents",
    });
    assert.equal(saved?.label, "View SharePoint Source File");
    assert.match(saved?.note || "", /has not checked the file/i);
    assert.doesNotMatch(`${saved?.label} ${saved?.note}`, /verified master/i);
    const onlyFolder = sharePointSourceAction({
      folderHref: "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents/Forms/AllItems.aspx",
    });
    assert.equal(onlyFolder?.label, "Open SharePoint Folder");
    const library = sharePointSourceAction({
      libraryHref: "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared%20Documents",
    });
    assert.equal(library?.label, "Open SharePoint Brand Library");
  });

  it("accepts site-scoped Copy Link files and folders, and rejects unsafe links", () => {
    const copyFile = parseSitGuruSharePointUrl(
      "https://sitgurullc.sharepoint.com/:i:/s/SitGuruMarketingCommunityGrowth/Eabc123_token?e=AbCdEf",
    );
    assert.equal(copyFile.ok, true);
    if (copyFile.ok) {
      assert.equal(copyFile.kind, "file");
      assert.match(copyFile.href, /\/:i:\/s\/SitGuruMarketingCommunityGrowth\/Eabc123_token/);
      assert.match(copyFile.href, /[?&]e=AbCdEf/);
    }
    const copyAction = sharePointSourceAction({
      sourceUrl: "https://sitgurullc.sharepoint.com/:i:/s/SitGuruMarketingCommunityGrowth/Eabc123_token",
    });
    assert.equal(copyAction?.label, "View SharePoint Source File");

    const copyFolder = parseSitGuruSharePointUrl(
      "https://sitgurullc.sharepoint.com/:f:/s/SitGuruMarketingCommunityGrowth/EfolderToken",
    );
    assert.equal(copyFolder.ok && copyFolder.kind, "folder");
    const folderAction = sharePointSourceAction({
      sourceUrl: "https://sitgurullc.sharepoint.com/:f:/s/SitGuruMarketingCommunityGrowth/EfolderToken",
    });
    assert.equal(folderAction?.label, "Open SharePoint Folder");

    const canonical = parseSitGuruSharePointUrl(
      "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Shared Documents/General/horizontal.jpg",
    );
    assert.equal(canonical.ok && canonical.kind, "file");

    assert.equal(parseSitGuruSharePointUrl("https://evil.sharepoint.com/:i:/s/SitGuruMarketingCommunityGrowth/Etoken").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com.evil.com/:i:/s/SitGuruMarketingCommunityGrowth/Etoken").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/:i:/s/OtherSite/Etoken").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/:i:/s/SitGuruMarketingCommunityGrowthExtra/Etoken").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowthExtra/logo.jpg").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://user:pass@sitgurullc.sharepoint.com/:i:/s/SitGuruMarketingCommunityGrowth/Etoken").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/:i:/g/SitGuruMarketingCommunityGrowth/Etoken").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/:i:/s/SitGuruMarketingCommunityGrowth/../../evil").ok, false);
    assert.equal(parseSitGuruSharePointUrl("https://sitgurullc.sharepoint.com/:z:/s/SitGuruMarketingCommunityGrowth/Etoken").ok, false);
    assert.equal(
      parseSitGuruSharePointUrl(
        "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/logo.jpg?redirect=https://evil.com",
      ).ok,
      false,
    );
    assert.equal(
      parseSitGuruSharePointUrl(
        "https://sitgurullc.sharepoint.com/sites/SitGuruMarketingCommunityGrowth/Forms/AllItems.aspx?id=%2Fsites%2FOtherSite%2Flogo.jpg",
      ).ok,
      false,
    );
  });

  it("keeps the intern library on SitGuru search and downloads", () => {
    const href = internBrandLibraryHref({ q: "dog", category: "social_graphics", page: 2 });
    assert.match(href, /^\/intern\/toolkit\?/);
    assert.match(href, /tool=brand/);
    assert.match(href, /q=dog/);
    assert.match(href, /category=social_graphics/);
    assert.match(href, /page=2/);
    assert.doesNotMatch(href, /sharepoint/i);
  });
});
