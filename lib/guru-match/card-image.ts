import sharp from "sharp";

export type GuruMatchCardAssets = {
  guruName: string;
  city: string;
  state: string;
  serviceLabel: string;
  logoPng: Buffer;
  qrPng: Buffer;
  photoPng: Buffer | null;
};

function escapeSvgText(value: string, maxLength = 52): string {
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  const shortened = normalized.length > maxLength ? normalized.slice(0, maxLength - 3) + "..." : normalized;
  return shortened.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[char]!);
}

/**
 * Build a static, self-contained branded card. Sharp converts this SVG directly
 * to PNG so it cannot fail in Next's streaming OG/Satori layout renderer.
 * All dynamic text is XML-escaped and all images are locally encoded PNGs.
 */
export function guruMatchCardSvg(input: GuruMatchCardAssets): string {
  const name = escapeSvgText(input.guruName, 35);
  const city = escapeSvgText(input.city, 42);
  const state = escapeSvgText(input.state, 3);
  const service = escapeSvgText(input.serviceLabel, 34);
  const nameFontSize = input.guruName.length > 24 ? 32 : 40;
  const initials = escapeSvgText(input.guruName.split(/\s+/).filter(Boolean)
    .slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "SG", 3);
  const logo = input.logoPng.toString("base64");
  const qr = input.qrPng.toString("base64");
  const photo = input.photoPng ? `
    <image x="104" y="320" width="152" height="152" clip-path="url(#guruPhoto)"
      preserveAspectRatio="xMidYMid slice" href="data:image/png;base64,${input.photoPng.toString("base64")}" />` : `
    <text x="180" y="410" text-anchor="middle" fill="#0D5C3A"
      font-size="56" font-weight="800">${initials}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="header" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0F2744"/>
        <stop offset="100%" stop-color="#0D5C3A"/>
      </linearGradient>
      <clipPath id="guruPhoto"><circle cx="180" cy="396" r="76"/></clipPath>
    </defs>
    <rect width="1200" height="630" fill="#F4F7FB" />
    <rect width="1200" height="214" fill="url(#header)" />
    <rect x="52" y="24" width="172" height="72" rx="14" fill="#FFFFFF" />
    <image x="62" y="31" width="152" height="58" preserveAspectRatio="xMidYMid meet"
      href="data:image/png;base64,${logo}" />
    <g font-family="Arial,Helvetica,DejaVu Sans,sans-serif">
      <text x="253" y="69" font-size="23" font-weight="800" letter-spacing="2" fill="#BBF7D0">LOCAL PET CARE</text>
      <text x="54" y="149" font-size="50" font-weight="800" fill="#FFFFFF">Need pet care nearby?</text>
      <text x="56" y="186" font-size="23" fill="#E5F7F0">Meet a local SitGuru Guru and explore their services.</text>
      <rect x="46" y="236" width="1108" height="323" rx="28" fill="#FFFFFF" stroke="#DCE8E5" stroke-width="2" />
      <circle cx="180" cy="396" r="81" fill="#DCFCE7" />
      ${photo}
      <text x="285" y="339" font-size="${nameFontSize}" font-weight="800" fill="#0F2744">${name}</text>
      <text x="286" y="388" font-size="25" fill="#475569">${city}, ${state}</text>
      <text x="285" y="438" font-size="30" font-weight="800" fill="#0D5C3A">${service}</text>
      <text x="286" y="482" font-size="20" font-weight="600" fill="#1D4ED8">Explore services and availability on SitGuru</text>
      <rect x="869" y="263" width="245" height="272" rx="18" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="888" y="283" width="208" height="208" rx="7" fill="#FFFFFF" />
      <image x="892" y="287" width="200" height="200" preserveAspectRatio="xMidYMid meet"
        href="data:image/png;base64,${qr}" />
      <text x="992" y="518" text-anchor="middle" font-size="17" font-weight="800" fill="#0F2744">Scan to meet this Guru</text>
      <text x="60" y="599" font-size="19" fill="#475569">sitguru.com &#8226; Verify availability and your pet's needs with the Guru</text>
    </g>
  </svg>`;
}

export async function renderGuruMatchCardPng(input: GuruMatchCardAssets): Promise<Buffer> {
  return sharp(Buffer.from(guruMatchCardSvg(input))).png().toBuffer();
}
