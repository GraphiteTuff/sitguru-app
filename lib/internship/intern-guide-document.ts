import { readFile } from "node:fs/promises";
import path from "node:path";
import { internHelpPath } from "@/lib/internship/intern-growth";
import { internGlossarySectionHtml } from "@/lib/internship/intern-glossary";
import { internHelpMediaAllowed } from "@/lib/internship/intern-help";

export const INTERN_GUIDE_FILE = "docs/intern-guide/student-user-guide.html";
export const INTERN_GUIDE_DOWNLOAD_NAME = "SitGuru-Intern-Portal-Student-User-Guide-Spring-2027";

const GUIDE_ROOT = path.join(process.cwd(), "docs", "intern-guide");
const MAX_IMAGE_EMU = 5943600; // 6.5 inches

type GuideBlock =
  | { type: "h1" | "h2" | "h3" | "p" | "li" | "caption"; text: string }
  | { type: "image"; src: string; alt: string };

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files: Array<{ name: string; data: Buffer }>) {
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2));
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    const localFull = Buffer.concat([local, name, file.data]);
    locals.push(localFull);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 18);
    central.writeUInt32LE(file.data.length, 22);
    central.writeUInt32LE(file.data.length, 26);
    central.writeUInt16LE(name.length, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt16LE(0, 38);
    central.writeUInt32LE(0, 40);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, name]));
    offset += localFull.length;
  }

  const localBuf = Buffer.concat(locals);
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(localBuf.length, 16);
  return Buffer.concat([localBuf, centralBuf, end]);
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'");
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attr(source: string, name: string) {
  const match = source.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match?.[1] || "";
}

export function internGuideRelativeSrc(src: string) {
  const clean = String(src || "").replace(/\\/g, "/").replace(/^\/+/, "").split("?")[0];
  if (clean.startsWith("assets/") || clean.startsWith("screenshots/")) return clean;
  return "";
}

export function internGuideWithDefinitions(html: string) {
  const section = internGlossarySectionHtml();
  let next = html;
  if (!next.includes('href="#definitions"')) {
    next = next.replace(
      '<li><a href="#start">How to use this guide</a></li>',
      '<li><a href="#definitions">Definitions</a></li>\n        <li><a href="#start">How to use this guide</a></li>',
    );
  }
  if (/id="definitions"/.test(next)) {
    return next.replace(/<section id="definitions"[\s\S]*?<\/section>/, section);
  }
  return next.replace("</nav>", `</nav>\n    ${section}`);
}

export async function internGuideSourceHtml() {
  const html = await readFile(path.join(process.cwd(), INTERN_GUIDE_FILE), "utf8");
  return internGuideWithDefinitions(html);
}

export function internGuideParts(html: string) {
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || "";
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  return { style, body };
}

export function internGuidePortalHtml(html: string) {
  return html.replace(
    /\bsrc="(assets\/[^"]+|screenshots\/[^"]+)"/g,
    (_all, src: string) => `src="${internHelpPath(`media/${src}`)}"`,
  );
}

export function internGuideBlocks(bodyHtml: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  const pattern =
    /<(h1|h2|h3|p|li|figcaption)\b([^>]*)>([\s\S]*?)<\/\1>|<img\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(bodyHtml))) {
    const tag = String(match[1] || "img").toLowerCase();
    if (tag === "img" || !match[1]) {
      const attrs = match[4] || match[2] || "";
      const src = internGuideRelativeSrc(attr(attrs, "src"));
      if (!src || !internHelpMediaAllowed(src)) continue;
      blocks.push({ type: "image", src, alt: attr(attrs, "alt") });
      continue;
    }
    const className = attr(match[2] || "", "class");
    if (className.includes("print-hint")) continue;
    const text = stripTags(match[3] || "");
    if (!text) continue;
    if (tag === "figcaption") blocks.push({ type: "caption", text });
    else if (tag === "h1" || tag === "h2" || tag === "h3" || tag === "p" || tag === "li") {
      blocks.push({ type: tag, text });
    }
  }
  return blocks;
}

function imageSize(bytes: Buffer, ext: string) {
  if (ext === ".png" && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if ((ext === ".jpg" || ext === ".jpeg") && bytes.length > 12) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) break;
      const marker = bytes[i + 1];
      const length = bytes.readUInt16BE(i + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
      }
      i += 2 + length;
    }
  }
  return { width: 1600, height: 900 };
}

function drawingXml(relId: string, name: string, width: number, height: number, docPrId: number) {
  const ratio = height / Math.max(width, 1);
  const cx = MAX_IMAGE_EMU;
  const cy = Math.max(1, Math.round(cx * ratio));
  return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${docPrId}" name="${xmlEscape(name)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${docPrId}" name="${xmlEscape(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function paragraphXml(text: string, style?: string) {
  const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${pPr}<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

export async function internGuideWordBuffer() {
  const source = await internGuideSourceHtml();
  const { body } = internGuideParts(source);
  const blocks = internGuideBlocks(body);
  const mediaFiles: Array<{ name: string; data: Buffer }> = [];
  const rels: string[] = [];
  const bodyXml: string[] = [];
  let imageCount = 0;

  for (const block of blocks) {
    if (block.type !== "image") {
      if (block.type === "h1") bodyXml.push(paragraphXml(block.text, "Title"));
      else if (block.type === "h2") bodyXml.push(paragraphXml(block.text, "Heading1"));
      else if (block.type === "h3") bodyXml.push(paragraphXml(block.text, "Heading2"));
      else if (block.type === "li") bodyXml.push(paragraphXml(`• ${block.text}`));
      else if (block.type === "caption") bodyXml.push(paragraphXml(block.text, "Caption"));
      else bodyXml.push(paragraphXml(block.text));
      continue;
    }

    const ext = path.extname(block.src).toLowerCase();
    const bytes = await readFile(path.join(GUIDE_ROOT, block.src));
    imageCount += 1;
    const fileName = `image${imageCount}${ext === ".jpeg" ? ".jpeg" : ext}`;
    const relId = `rId${imageCount}`;
    mediaFiles.push({ name: `word/media/${fileName}`, data: bytes });
    rels.push(
      `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${fileName}"/>`,
    );
    const size = imageSize(bytes, ext);
    bodyXml.push(drawingXml(relId, block.alt || fileName, size.width, size.height, imageCount));
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <w:body>
    ${bodyXml.join("")}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>
  </w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  ${rels.join("\n  ")}
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="166534"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr></w:style>
</w:styles>`;

  return zipStore([
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rootRels, "utf8") },
    { name: "word/document.xml", data: Buffer.from(documentXml, "utf8") },
    { name: "word/_rels/document.xml.rels", data: Buffer.from(docRels, "utf8") },
    { name: "word/styles.xml", data: Buffer.from(stylesXml, "utf8") },
    ...mediaFiles,
  ]);
}
