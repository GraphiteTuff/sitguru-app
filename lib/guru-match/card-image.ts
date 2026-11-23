import sharp from "sharp";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const SHARE_POSTER_WIDTH = 1080;
export const SHARE_POSTER_HEIGHT = 1350;
/** Large enough to remain readable in the exported social-poster PNG. */
export const SHARE_QR_SIZE = 306;

export type GuruMatchCardAssets = {
  guruName: string;
  promotionType?: "guru"|"community";
  city: string;
  state: string;
  serviceLabel: string;
  experienceYears?: number | null;
  logoPng: Buffer;
  qrPng: Buffer;
  photoPng: Buffer | null;
  dogPng?: Buffer | null;
  catPng?: Buffer | null;
};

function escapeMarkup(value: string, maxLength = 90): string {
  const clean = String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ").trim();
  const shortened = clean.length > maxLength ? clean.slice(0, maxLength - 3) + "..." : clean;
  return shortened.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;",
  })[c]!);
}
function tidy(value: string, limit = 70): string {
  return String(value||"").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ")
    .trim().slice(0,limit);
}

/** Branded neutral placeholder, never a stock person posing as a real Guru. */
export function guruCardInitials(name: string): string {
  const words = tidy(name, 42).split(/\s+/).filter(Boolean);
  if (!words.length) return "SG";
  if (words.length === 1) return Array.from(words[0]).slice(0, 2).join("").toLocaleUpperCase("en-US");
  return ((Array.from(words[0])[0] || "") + (Array.from(words[words.length - 1])[0] || ""))
    .toLocaleUpperCase("en-US");
}

let loadedFont: Promise<string> | undefined;
/**
 * Serverless Linux can have no usable fonts installed. Never use SVG <text>
 * for the printable card. Load our licensed, bundled Plus Jakarta Sans TTF
 * into an isolated temporary file and ask Sharp/Pango to use that fontfile.
 */
function cardFont(): Promise<string> {
  if (!loadedFont) {
    loadedFont = (async () => {
      const fontBase64 = await readFile(
        path.join(process.cwd(), "app/fonts/plus-jakarta-sans-latin.ttf.base64"), "utf8"
      );
      const folder = await mkdtemp(path.join(tmpdir(), "sitguru-card-"));
      const fontFile = path.join(folder, "PlusJakartaSans.ttf");
      await writeFile(fontFile, Buffer.from(fontBase64.trim(), "base64"), { mode: 0o600 });
      return fontFile;
    })().catch(error => {
      loadedFont = undefined;
      throw error;
    });
  }
  return loadedFont;
}

/** Portrait adaptation of the approved SitGuru local-Guru promotional mockup.
 * Images and QR are composited after the SVG base. Do not use SVG <text>:
 * production serverless images must render using our explicitly bundled font. */
export function guruMatchCardSvg(input: GuruMatchCardAssets): string {
  const community = input.promotionType === "community";
  const title = escapeMarkup(input.guruName, 45);
  const place = escapeMarkup(input.city, 45) + ", " + escapeMarkup(input.state, 2);
  const service = escapeMarkup(input.serviceLabel, 55);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">',
    '<title>SitGuru local pet care: ' + title + '</title>',
    '<desc>' + (community ? 'Explore SitGuru pet care in your community. Scan to explore pet care. ' : 'Scan to meet this Guru. ') + place + '. ' + service + '.</desc>',
    '<defs>',
    '<linearGradient id="forest" x1="0" y1="0" x2="1" y2="1">',
    '<stop stop-color="#112C43"/><stop offset=".56" stop-color="#0D4E4A"/>',
    '<stop offset="1" stop-color="#00613C"/></linearGradient>',
    '<linearGradient id="lime" x1="0" y1="0" x2="1" y2="1">',
    '<stop stop-color="#EFFDC8"/><stop offset="1" stop-color="#D1F29C"/></linearGradient>',
    '</defs>',
    '<rect width="1080" height="1350" fill="#F9FBF8"/>',
    '<rect width="1080" height="940" fill="url(#forest)"/>',
    '<circle cx="1025" cy="95" r="230" fill="#53BD98" opacity=".11"/>',
    '<circle cx="944" cy="334" r="175" fill="#70CB9C" opacity=".08"/>',
    '<path d="M0 0 H679 C664 105 599 200 469 239 H0 Z" fill="#FFFFFF"/>',
    '<path d="M461 243 C580 205 655 110 687 0" fill="none" stroke="#80CE22" stroke-width="20"/>',
    '<rect x="54" y="259" width="574" height="648" rx="34" fill="#D4ECDF"/>',
    '<rect x="661" y="510" width="365" height="88" rx="36" fill="url(#lime)"/>',
    '<circle cx="681" cy="652" r="16" fill="#75D72C"/>',
    '<path d="M673 652 l6 6 11 -14" stroke="#0C5939" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    '<circle cx="681" cy="724" r="16" fill="#75D72C"/>',
    '<path d="M673 724 l6 6 11 -14" stroke="#0C5939" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    '<circle cx="681" cy="796" r="16" fill="#75D72C"/>',
    '<path d="M673 796 l6 6 11 -14" stroke="#0C5939" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M0 922 C205 879 450 918 631 931 C785 946 934 900 1080 893 L1080 1278 L0 1278 Z" fill="#FFFFFF"/>',
    '<path d="M0 922 C205 879 450 918 631 931" fill="none" stroke="#7AD528" stroke-width="12"/>',
    '<path d="M162 1144 Q318 1107 558 1126" stroke="#7BD123" stroke-width="8" fill="none" stroke-linecap="round"/>',
    '<rect x="690" y="932" width="351" height="337" rx="31" fill="#79C914"/>',
    '<rect x="698" y="940" width="335" height="321" rx="25" fill="#FFFFFF"/>',
    '<rect x="0" y="1278" width="1080" height="72" fill="url(#forest)"/>',
    '<circle cx="74" cy="1316" r="12" fill="#84D828"/>',
    '<circle cx="104" cy="1316" r="12" fill="#84D828"/>',
    '<circle cx="89" cy="1300" r="9" fill="#84D828"/>',
    '</svg>',
  ].join("");
}

type TextItem = { value: string; left: number; top: number; size: number; color: string;
  maxWidth: number; bold?: boolean; maxHeight?: number };
async function renderedText(item: TextItem, fontfile: string) {
  const text = escapeMarkup(item.value);
  const pango = '<span foreground="' + item.color + '"' +
    (item.bold ? ' weight="bold"' : '') + '>' + text + '</span>';
  let result = await sharp({text:{
    text:pango, font:"Plus Jakarta Sans " + item.size, fontfile,
    rgba:true, wrap:"none", dpi:72,
  }}).png().toBuffer();
  const meta = await sharp(result).metadata();
  const maxWidth = Math.max(30, Math.floor(item.maxWidth));
  const maxHeight = item.maxHeight || 120;
  if ((meta.width||0) > maxWidth || (meta.height||0) > maxHeight) {
    result = await sharp(result).resize({
      width:Math.min(maxWidth,meta.width||maxWidth),
      height:Math.min(maxHeight,meta.height||maxHeight),fit:"inside",
      withoutEnlargement:true,
    }).png().toBuffer();
  }
  return { input:result, left:item.left, top:item.top };
}
function roundedMask(width: number, height: number, radius: number): Buffer {
  return Buffer.from('<svg width="' + width + '" height="' + height +
    '" xmlns="http://www.w3.org/2000/svg"><rect width="' + width +
    '" height="' + height + '" rx="' + radius + '" fill="#fff"/></svg>');
}
async function cropImage(input: Buffer, width: number, height: number, radius = 0) {
  let img = await sharp(input,{limitInputPixels:30_000_000}).rotate()
    .resize(width,height,{fit:"cover",position:sharp.strategy.attention}).png().toBuffer();
  if (radius) img = await sharp(img).composite([{
    input:roundedMask(width,height,radius),blend:"dest-in",
  }]).png().toBuffer();
  return img;
}

/** An individual Guru poster must feature that actual Guru's photo.
 * When it is missing, use a branded initials tile instead of stock imagery
 * that could wrongly represent a different person. Community discovery cards
 * may still use the approved generic SitGuru pet-care photography. */
async function petPhotoPanel(input: GuruMatchCardAssets): Promise<Buffer|null> {
  const source = input.promotionType === "community"
    ? input.dogPng || input.catPng
    : input.photoPng;
  if (!source) return null;
  return cropImage(source, 574, 648, 34);
}

/** Actual, high-resolution 4:5 social graphic. The QR is always encoded
 * by qrcode upstream, scaled with nearest-neighbor and given a quiet white tile. */
export async function renderGuruMatchCardPng(input: GuruMatchCardAssets): Promise<Buffer> {
  const community = input.promotionType === "community";
  const fontfile = await cardFont();
  const name = tidy(input.guruName, 42);
  const service = tidy(input.serviceLabel, 50);
  const place = tidy(input.city, 42) + ", " + tidy(input.state, 2);
  const textItems: TextItem[] = [
    {value:"MEET YOUR",left:734,top:75,size:36,color:"#FFFFFF",bold:true,maxWidth:300,maxHeight:55},
    {value:"LOCAL GURU!",left:698,top:124,size:44,color:"#D8FFAE",bold:true,maxWidth:326,maxHeight:65},
    {value:community?"Find local care":name,left:676,top:293,
      size:name.length>18?52:74,color:"#FFFFFF",bold:true,maxWidth:352,maxHeight:115},
    {value:place,left:678,top:412,size:34,color:"#ECFFF0",bold:true,maxWidth:342,maxHeight:53},
    {value:community?"Explore local pet care":service,left:686,top:535,
      size:36,color:"#102F3F",bold:true,maxWidth:329,maxHeight:60},
    {value:"Explore services",left:714,top:627,size:25,color:"#FFFFFF",bold:true,maxWidth:306,maxHeight:43},
    {value:"Check availability",left:714,top:699,size:25,color:"#FFFFFF",bold:true,maxWidth:306,maxHeight:43},
    {value:community?"Find care near you":(input.experienceYears && input.experienceYears>0
      ? input.experienceYears+" years of experience" : "Get to know your Guru"),
      left:714,top:771,size:24,color:"#FFFFFF",bold:true,maxWidth:310,maxHeight:43},
    {value:"Reliable care",left:68,top:991,size:55,color:"#0F2744",bold:true,maxWidth:590,maxHeight:81},
    {value:"for happier pets!",left:68,top:1052,size:53,color:"#0F2744",bold:true,maxWidth:597,maxHeight:85},
    {value:community?"SCAN TO EXPLORE CARE":"SCAN TO VIEW THIS GURU",left:72,top:1163,
      size:29,color:"#0D5C3A",bold:true,maxWidth:588,maxHeight:50},
    {value:"See profile & booking options",left:72,top:1210,
      size:25,color:"#42576B",maxWidth:583,maxHeight:49},
    {value:"sitguru.com",left:138,top:1294,size:35,color:"#FFFFFF",bold:true,
      maxWidth:330,maxHeight:52},
    {value:"LOCAL PET CARE. BIG HEART.",left:516,top:1298,size:28,color:"#D8FFAE",bold:true,
      maxWidth:520,maxHeight:48},
  ];
  const overlays: {input:Buffer;left:number;top:number}[] = [];
  const logo = await sharp(input.logoPng).resize(480,170,{
    fit:"contain",background:{r:255,g:255,b:255,alpha:0},
  }).png().toBuffer();
  overlays.push({input:logo,left:60,top:37});
  const portrait=await petPhotoPanel(input);
  if(portrait) overlays.push({input:portrait,left:54,top:259});
  else {
    // A missing or inaccessible Guru photo must never display an unrelated
    // person. Keep the poster recognizable with the Guru's actual initials.
    textItems.push({
      value:community?"SITGURU PET CARE":guruCardInitials(input.guruName),
      left:community?92:198,top:480,size:community?50:170,
      color:"#0D5C3A",bold:true,maxWidth:480,maxHeight:210,
    });
    textItems.push({
      value:community?"Find trusted local pet care":"View this Guru's profile",
      left:community?90:102,top:723,size:31,
      color:"#195846",bold:true,maxWidth:475,maxHeight:65,
    });
  }
  // QR image is not AI art. These are exact QRCode bytes for this saved campaign.
  overlays.push({input:await sharp(input.qrPng)
    .resize(SHARE_QR_SIZE,SHARE_QR_SIZE,{fit:"contain",kernel:"nearest",background:"#FFFFFF"})
    .png().toBuffer(),left:712,top:947});
  const textLayers=await Promise.all(textItems.map(item=>renderedText(item,fontfile)));
  overlays.push(...textLayers);
  return sharp(Buffer.from(guruMatchCardSvg(input)),{density:144})
    .resize(SHARE_POSTER_WIDTH,SHARE_POSTER_HEIGHT)
    .composite(overlays)
    .png({compressionLevel:9}).toBuffer();
}
