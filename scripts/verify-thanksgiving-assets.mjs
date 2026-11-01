#!/usr/bin/env node
/** Run from the SitGuru repo root before publishing the Thanksgiving campaign. */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const required = [
  'public/videos/sitguru-giving-thanks-homepage.mp4',
  'public/images/sitguru-giving-thanks-homepage-poster.jpg',
  'public/images/sitguru-thanksgiving-logo.svg',
  'public/images/sitguru-thanksgiving-logo-footer.svg',
  'public/images/sitguru-thanksgiving-logo-footer-dark.svg',
  'sitguru-mobile/src/assets/videos/sitguru-giving-thanks-homepage.mp4',
  'sitguru-mobile/src/assets/images/sitguru-giving-thanks-homepage-poster.jpg',
  'sitguru-mobile/src/assets/images/sitguru-thanksgiving-logo-dark.png',
];

const problems = [];
for (const relativePath of required) {
  const path = resolve(relativePath);
  if (!existsSync(path) || statSync(path).size < 1000) {
    problems.push(`Missing or empty: ${relativePath}`);
    continue;
  }
  const ext = relativePath.split('.').pop();
  const prefix = readFileSync(path).subarray(0, 32);
  const isPng = prefix[0] === 0x89 && prefix.subarray(1, 4).toString() === 'PNG';
  const isJpeg = prefix[0] === 0xff && prefix[1] === 0xd8;
  const isMp4 = prefix.subarray(4, 8).toString() === 'ftyp';
  const isSvg = ext === 'svg' && readFileSync(path, 'utf8').includes('<svg');
  const valid = ext === 'png' ? isPng : ext === 'jpg' ? isJpeg : ext === 'mp4' ? isMp4 : ext === 'svg' ? isSvg : false;
  if (!valid) problems.push(`Unexpected media format: ${relativePath}`);
}

if (problems.length) {
  console.error('Thanksgiving assets are not ready for production:');
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log(`Thanksgiving assets ready: ${required.length} files validated.`);
