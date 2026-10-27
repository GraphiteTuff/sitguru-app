import { chromium } from "playwright";
import path from "path";

const out = "/opt/cursor/artifacts/screenshots";
const base = "http://127.0.0.1:3456/dev/portal-mockups";

const browser = await chromium.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function dismissOverlay(page) {
  try {
    const close = page
      .locator('[data-nextjs-errors-dialog] button, button:has-text("×"), [aria-label="Close"]')
      .first();
    if (await close.isVisible({ timeout: 1200 })) await close.click({ force: true });
  } catch {}
  await page.evaluate(() => {
    document
      .querySelectorAll("nextjs-portal, [data-nextjs-dialog], [data-nextjs-toast]")
      .forEach((el) => el.remove());
  });
}

async function captureFrame(name, url, frame, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(900);
  await dismissOverlay(page);
  const el = page.locator(`[data-frame="${frame}"]`).first();
  await el.waitFor({ state: "visible", timeout: 20000 });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const file = path.join(out, name);
  await el.screenshot({ path: file });
  console.log("saved", file, frame);
  await page.close();
}

await captureFrame(
  "growth-manager-desktop.png",
  `${base}?view=growth-manager`,
  "growth-manager-desktop",
  { width: 1500, height: 1200 },
);
await captureFrame(
  "growth-intern-desktop.png",
  `${base}?view=growth-intern`,
  "growth-intern-desktop",
  { width: 1500, height: 1200 },
);
await captureFrame(
  "growth-manager-mobile.png",
  `${base}?view=growth-manager`,
  "growth-manager-mobile",
  { width: 1200, height: 1800 },
);
await captureFrame(
  "growth-intern-mobile.png",
  `${base}?view=growth-intern`,
  "growth-intern-mobile",
  { width: 1200, height: 1800 },
);

await browser.close();
console.log("done");
