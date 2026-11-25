import sharp from "sharp";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  guruMatchCardSvg,
  guruCardInitials,
  SHARE_POSTER_WIDTH,
  SHARE_POSTER_HEIGHT,
  SHARE_QR_SIZE,
} from "@/lib/guru-match/card-image";

/** This is a real 1080x1350 PNG built from the same approved SitGuru artwork
 * as the Guru Match promotional poster. The QR is composited into the PNG. */
export type AmbassadorPosterAssets = {
  ambassadorName: string;
  referralCode: string;
  logoPng: Buffer;
  portraitPng: Buffer | null;
  qrPng: Buffer;
};

function safeText(value: string, length = 80) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, length);
}
function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[char]!);
}
let fontPromise: Promise<string> | undefined;
async function cardFont() {
  if (!fontPromise) {
    fontPromise = (async () => {
      const text = await readFile(path.join(process.cwd(), "app/fonts/plus-jakarta-sans-latin.ttf.base64"), "utf8");
      const folder = await mkdtemp(path.join(tmpdir(), "sitguru-ambassador-card-"));
      const filename = path.join(folder, "PlusJakartaSans.ttf");
      await writeFile(filename, Buffer.from(text.trim(), "base64"), { mode: 0o600 });
      return filename;
    })().catch(error => { fontPromise = undefined; throw error; });
  }
  return fontPromise;
}

type Label = {
  value: string; left: number; top: number; size: number; color: string;
  width: number; height: number; bold?: boolean;
};
async function textLayer(item: Label, fontfile: string) {
  const pango = '<span foreground="' + item.color + '"' +
    (item.bold ? ' weight="bold"' : "") + '>' + escapeMarkup(item.value) + '</span>';
  let png = await sharp({
    text: { text: pango, font: "Plus Jakarta Sans " + item.size, fontfile,
      rgba: true, wrap: "none", dpi: 72 },
  }).png().toBuffer();
  const meta = await sharp(png).metadata();
  if ((meta.width || 0) > item.width || (meta.height || 0) > item.height) {
    png = await sharp(png).resize({ width: Math.min(item.width, meta.width || item.width),
      height: Math.min(item.height, meta.height || item.height),
      fit: "inside", withoutEnlargement: true }).png().toBuffer();
  }
  return { input: png, left: item.left, top: item.top };
}

export async function renderAmbassadorCardPng(input: AmbassadorPosterAssets): Promise<Buffer> {
  const fontfile = await cardFont();
  const name = safeText(input.ambassadorName, 44);
  const code = safeText(input.referralCode, 64).toUpperCase();
  const labels: Label[] = [
    { value: "MEET YOUR", left: 735, top: 75, size: 36, color: "#FFFFFF", width: 298, height: 58, bold: true },
    { value: "AMBASSADOR!", left: 687, top: 124, size: 43, color: "#D8FFAE", width: 337, height: 62, bold: true },
    { value: name, left: 675, top: 292, size: name.length > 18 ? 52 : 74, color: "#FFFFFF", width: 352, height: 115, bold: true },
    { value: "SitGuru community", left: 677, top: 415, size: 32, color: "#E6FFF0", width: 350, height: 56, bold: true },
    { value: "CONNECT & SHARE", left: 685, top: 533, size: 35, color: "#102F3F", width: 331, height: 54, bold: true },
    { value: "Trusted local pet care", left: 714, top: 628, size: 24, color: "#FFFFFF", width: 310, height: 42, bold: true },
    { value: "Invite future Gurus", left: 714, top: 700, size: 24, color: "#FFFFFF", width: 310, height: 42, bold: true },
    { value: "Grow our community", left: 714, top: 772, size: 24, color: "#FFFFFF", width: 310, height: 42, bold: true },
    { value: "REFERRAL: " + code, left: 679, top: 842, size: 24, color: "#D8FFAE", width: 340, height: 54, bold: true },
    { value: "Grow a happier", left: 68, top: 993, size: 53, color: "#0F2744", width: 584, height: 80, bold: true },
    { value: "pet community!", left: 68, top: 1053, size: 53, color: "#0F2744", width: 584, height: 79, bold: true },
    { value: "SCAN TO CONNECT", left: 72, top: 1162, size: 30, color: "#0D5C3A", width: 580, height: 49, bold: true },
    { value: "Choose Pet Parent or Guru", left: 72, top: 1209, size: 26, color: "#42576B", width: 590, height: 48 },
    { value: "sitguru.com", left: 138, top: 1294, size: 35, color: "#FFFFFF", width: 330, height: 50, bold: true },
    { value: "LOCAL PET CARE. BIG HEART.", left: 516, top: 1298, size: 28, color: "#D8FFAE", width: 520, height: 48, bold: true },
  ];

  const composites: Array<{input: Buffer; left: number; top: number}> = [];
  const logo = await sharp(input.logoPng).resize(480, 170, {
    fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 },
  }).png().toBuffer();
  composites.push({ input: logo, left: 60, top: 37 });

  if (input.portraitPng) {
    let photo = await sharp(input.portraitPng, { limitInputPixels: 40_000_000 })
      .rotate().resize(574, 648, { fit: "cover", position: sharp.strategy.attention }).png().toBuffer();
    const mask = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="574" height="648"><rect width="574" height="648" rx="34" fill="white"/></svg>');
    photo = await sharp(photo).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    composites.push({ input: photo, left: 54, top: 259 });
  } else {
    // Personal initials are more truthful than showing an unrelated person's photo.
    labels.push({ value: guruCardInitials(name), left: 180, top: 452, size: 178, color: "#0D5C3A", width: 340, height: 210, bold: true });
    labels.push({ value: "SitGuru Ambassador", left: 102, top: 724, size: 32, color: "#195846", width: 482, height: 55, bold: true });
  }

  const qr = await sharp(input.qrPng).resize(SHARE_QR_SIZE, SHARE_QR_SIZE, {
    fit: "contain", kernel: "nearest", background: "#FFFFFF",
  }).png().toBuffer();
  composites.push({ input: qr, left: 712, top: 947 });
  composites.push(...await Promise.all(labels.map(label => textLayer(label, fontfile))));

  return sharp(Buffer.from(guruMatchCardSvg({
    guruName: name, city: "", state: "", serviceLabel: "",
    logoPng: input.logoPng, photoPng: input.portraitPng, qrPng: input.qrPng,
  })), { density: 144 })
    .resize(SHARE_POSTER_WIDTH, SHARE_POSTER_HEIGHT)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer();
}
