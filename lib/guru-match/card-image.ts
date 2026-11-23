import sharp from "sharp";
import { readFile, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const SHARE_POSTER_WIDTH = 1080;
export const SHARE_POSTER_HEIGHT = 1350;

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

/** Background shapes only; actual words are rendered independently with the
 * bundled font, so no deployed system font can turn their letters into boxes. */
export function guruMatchCardSvg(input: GuruMatchCardAssets): string {
  const community = input.promotionType === "community";
  const subject = escapeMarkup(input.guruName, 42);
  const city = escapeMarkup(input.city, 50);
  const state = escapeMarkup(input.state, 3);
  const service = escapeMarkup(input.serviceLabel, 50);
  const label = community ? "Scan to explore pet care" : "Scan to meet this Guru";
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">',
    '<title>' + subject + '</title>',
    '<desc>' + (community ? "Explore SitGuru pet care in your community. " : "") + city + ', ' + state + ' - ' + service + '. ' + label + '.</desc>',
    '<defs>',
    '<linearGradient id="navy" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#102B43"/><stop offset="1" stop-color="#076346"/></linearGradient>',
    '<linearGradient id="photoBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CAEDDB"/><stop offset="1" stop-color="#72BCA7"/></linearGradient>',
    '</defs>',
    '<rect width="1080" height="1350" fill="#F6F9FA"/>',
    '<rect width="1080" height="343" fill="url(#navy)"/>',
    '<circle cx="1022" cy="82" r="235" fill="#51B79D" opacity=".12"/>',
    '<circle cx="970" cy="270" r="170" fill="#7CD9B5" opacity=".10"/>',
    '<rect x="65" y="45" width="258" height="93" rx="23" fill="#FFFFFF"/>',
    '<rect x="66" y="354" width="948" height="258" rx="28" fill="#C9D8DA" opacity=".35"/>',
    '<rect x="62" y="348" width="948" height="258" rx="28" fill="#FFFFFF" stroke="#D9E6E7" stroke-width="2"/>',
    '<circle cx="190" cy="478" r="100" fill="#DEF6E9"/>',
    '<rect x="63" y="651" width="954" height="440" rx="30" fill="url(#photoBg)"/>',
    '<rect x="62" y="1111" width="956" height="211" rx="27" fill="#EAF7EE" stroke="#CFE7D8" stroke-width="2"/>',
    '<rect x="781" y="1121" width="212" height="191" rx="22" fill="#FFFFFF"/>',
    '<rect x="58" y="1338" width="964" height="3" rx="1.5" fill="#0B6546" opacity=".25"/>',
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

async function petPhotoPanel(input: GuruMatchCardAssets): Promise<Buffer|null> {
  if (!input.dogPng && !input.catPng) return null;
  const layers: {input: Buffer;left:number;top:number}[] = [];
  if (input.dogPng) layers.push({
    input:await cropImage(input.dogPng,600,440), left:0,top:0,
  });
  if (input.catPng) layers.push({
    input:await cropImage(input.catPng,348,440),left:607,top:0,
  });
  // Show one pet image across the entire area when only one is available.
  if (layers.length===1) {
    layers[0].input=await cropImage(input.dogPng||input.catPng!,954,440);
    layers[0].left=0;
  }
  const photo = await sharp({
    create:{width:954,height:440,channels:4,background:"#C2E8D6"},
  }).composite(layers).png().toBuffer();
  const overlay = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="954" height="440">' +
    '<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#102B43" stop-opacity="0"/>' +
    '<stop offset=".55" stop-color="#102B43" stop-opacity=".02"/>' +
    '<stop offset="1" stop-color="#102B43" stop-opacity=".88"/></linearGradient></defs>' +
    '<rect width="954" height="440" fill="url(#shade)"/></svg>');
  const shaded=await sharp(photo).composite([{input:overlay,left:0,top:0}]).png().toBuffer();
  return sharp(shaded).composite([{
    input:roundedMask(954,440,30),blend:"dest-in",
  }]).png().toBuffer();
}

/** Finished, high-resolution 4:5 social poster. Text is rasterized by Sharp
 * against a private bundled TTF, never by SVG's missing font fallback. */
export async function renderGuruMatchCardPng(input: GuruMatchCardAssets): Promise<Buffer> {
  const community=input.promotionType==="community";
  const fontfile=await cardFont();
  const name=tidy(input.guruName,42);
  const service=tidy(input.serviceLabel,50);
  const location=tidy(input.city,45) + ", " + tidy(input.state,2);
  const personalTitle=name.length>22?42:52;
  const textItems:TextItem[]=[
    {value:"LOCAL CARE. BIG HEART.",left:356,top:82,size:25,color:"#C7F5D9",bold:true,maxWidth:670},
    {value:"Great pet care",left:75,top:168,size:76,color:"#FFFFFF",bold:true,maxWidth:900,maxHeight:90},
    {value:"starts close to home.",left:75,top:252,size:65,color:"#C8F7D6",bold:true,maxWidth:910,maxHeight:82},
    {value:community?"Explore pet care":"Meet " + name,left:326,top:387,size:personalTitle,
      color:"#102B43",bold:true,maxWidth:635,maxHeight:74},
    {value:location,left:329,top:466,size:33,color:"#42576B",bold:true,maxWidth:640,maxHeight:50},
    {value:community?"Find sitters, walkers and more":service,left:329,top:523,size:27,
      color:"#116A4B",bold:true,maxWidth:638,maxHeight:42},
    {value:"Real people. Happier pets.",left:102,top:1001,size:47,color:"#FFFFFF",
      bold:true,maxWidth:855,maxHeight:58},
    {value:community?"Discover pet care nearby":"Connect with your Guru",left:94,top:1158,size:45,
      color:"#102B43",bold:true,maxWidth:640,maxHeight:60},
    {value:community?"Explore local providers and availability.":"Check services, availability and fit.",
      left:96,top:1219,size:24,color:"#326B58",maxWidth:646,maxHeight:40},
    {value:"sitguru.com",left:95,top:1270,size:30,color:"#086446",bold:true,maxWidth:535,maxHeight:45},
  ];
  if (!community && input.experienceYears && input.experienceYears>0) {
    textItems.push({value:input.experienceYears+" years of experience",left:330,top:568,size:21,
      color:"#4B6475",maxWidth:570,maxHeight:32});
  }
  const overlays: {input:Buffer;left:number;top:number}[] = [];
  overlays.push({input:await sharp(input.logoPng).resize(228,83,{
    fit:"contain",background:{r:255,g:255,b:255,alpha:0},
  }).png().toBuffer(),left:81,top:50});
  if (input.photoPng && !community) {
    const avatar=await cropImage(input.photoPng,182,182,91);
    overlays.push({input:avatar,left:99,top:388});
  } else {
    textItems.push({value:"SG",left:144,top:443,size:69,
      color:"#0D674B",bold:true,maxWidth:94,maxHeight:82});
  }
  const photo=await petPhotoPanel(input);
  if (photo) overlays.push({input:photo,left:63,top:651});
  // Put the QR on a white tile so it remains scannable when saved or resized.
  overlays.push({input:await sharp(input.qrPng).resize(178,178,{
    fit:"contain",background:"#FFFFFF",
  }).png().toBuffer(),left:798,top:1129});
  // Text is composed last, above all photograph content and shadows.
  const textLayers=await Promise.all(textItems.map(item=>renderedText(item,fontfile)));
  overlays.push(...textLayers);
  return sharp(Buffer.from(guruMatchCardSvg(input)),{density:144})
    .resize(SHARE_POSTER_WIDTH,SHARE_POSTER_HEIGHT).composite(overlays)
    .png({compressionLevel:9}).toBuffer();
}
