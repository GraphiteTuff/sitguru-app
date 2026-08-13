#!/usr/bin/env node
/**
 * SitGuru production connectivity probe.
 *
 * Diagnoses the home-WiFi vs cellular “Safari can’t establish a secure
 * connection” failure mode: DNS shape, AAAA conflicts, TLS chain depth/size,
 * and cert expiry for sitguru.com / www.sitguru.com.
 *
 * Usage: node scripts/check-domain-connectivity.mjs
 *    or: npm run check:domain-connectivity
 */

import { execFileSync } from "node:child_process";
import tls from "node:tls";
import { X509Certificate } from "node:crypto";

const APEX = "sitguru.com";
const WWW = "www.sitguru.com";
const VERCEL_A = "76.76.21.21";
/** Generation-Y chains (YR/YE + X1 cross-sign) commonly exceed this. */
const LARGE_CHAIN_DER_BYTES = 3500;

const findings = [];
const remediations = [];

function dig(type, name) {
  try {
    const out = execFileSync("dig", ["+short", type, name], {
      encoding: "utf8",
      timeout: 10000,
    });
    return out
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    findings.push(`dig ${type} ${name} failed: ${error.message}`);
    return [];
  }
}

function collectPeerChain(host) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false,
      },
      () => {
        try {
          const peer = socket.getPeerX509Certificate();
          const certs = [];
          let current = peer;
          while (current) {
            certs.push(current);
            current = current.issuerCertificate;
            if (current && current === current.issuerCertificate) break;
          }
          socket.end();
          resolve(certs);
        } catch (error) {
          socket.destroy();
          reject(error);
        }
      },
    );
    socket.setTimeout(12000, () => {
      socket.destroy();
      reject(new Error(`TLS timeout connecting to ${host}`));
    });
    socket.on("error", reject);
  });
}

function summarizeCert(cert) {
  const x509 = new X509Certificate(cert.raw);
  return {
    subject: x509.subject,
    issuer: x509.issuer,
    validFrom: x509.validFrom,
    validTo: x509.validTo,
    derBytes: cert.raw.length,
  };
}

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

async function inspectHost(host) {
  printSection(`TLS ${host}`);
  const chain = await collectPeerChain(host);
  let totalDer = 0;
  const rows = chain.map((cert, index) => {
    const row = summarizeCert(cert);
    totalDer += row.derBytes;
    console.log(
      `[${index}] ${row.subject}\n    issuer: ${row.issuer}\n    DER: ${row.derBytes}B  valid: ${row.validFrom} → ${row.validTo}`,
    );
    return row;
  });

  console.log(`Total presented chain DER: ${totalDer} bytes`);

  const leaf = rows[0];
  const expires = new Date(leaf.validTo);
  const daysLeft = Math.round((expires.getTime() - Date.now()) / 86400000);
  if (daysLeft < 14) {
    findings.push(`${host} certificate expires in ${daysLeft} day(s)`);
  }

  const usesGenerationY = rows.some(
    (row) =>
      /YR\d|YE\d|Root YR|Root YE/i.test(row.subject) ||
      /YR\d|YE\d|Root YR|Root YE/i.test(row.issuer),
  );
  if (usesGenerationY) {
    findings.push(
      `${host} serves Let's Encrypt Generation Y chain (longer than legacy R-series)`,
    );
  }
  if (totalDer >= LARGE_CHAIN_DER_BYTES) {
    findings.push(
      `${host} TLS chain is large (${totalDer}B) — raises PPPoE/MTU drop risk on home WiFi`,
    );
    remediations.push(
      "Put Cloudflare (proxied / orange-cloud) in front of Vercel so browsers terminate TLS on Cloudflare’s shorter Universal SSL chain. Set SSL/TLS mode to Full (strict).",
    );
  }

  return { host, totalDer, daysLeft, usesGenerationY };
}

function inspectDns() {
  printSection("DNS");
  const apexA = dig("A", APEX);
  const apexAAAA = dig("AAAA", APEX);
  const www = dig("A", WWW);
  const wwwAAAA = dig("AAAA", WWW);
  const wwwCname = dig("CNAME", WWW);
  const caa = dig("CAA", APEX);

  console.log(`A ${APEX}:`, apexA.join(", ") || "(none)");
  console.log(`AAAA ${APEX}:`, apexAAAA.join(", ") || "(none)");
  console.log(`CNAME ${WWW}:`, wwwCname.join(", ") || "(none)");
  console.log(`A ${WWW}:`, www.join(", ") || "(none)");
  console.log(`AAAA ${WWW}:`, wwwAAAA.join(", ") || "(none)");
  console.log(`CAA ${APEX}:`, caa.join(", ") || "(none)");

  if (!apexA.includes(VERCEL_A) && apexA.length > 0) {
    findings.push(
      `Apex A record is ${apexA.join(", ")} (expected ${VERCEL_A} for direct Vercel DNS)`,
    );
  }
  if (apexA.length === 0) {
    findings.push(`Missing A record for ${APEX}`);
  }
  if (apexAAAA.length > 0) {
    findings.push(
      `AAAA present on apex (${apexAAAA.join(", ")}) — Vercel does not support IPv6 for third-party custom domains; remove AAAA`,
    );
    remediations.push(
      "Delete every AAAA record for sitguru.com and www at the DNS host (GoDaddy/Cloudflare).",
    );
  }
  if (wwwAAAA.some((line) => line.includes(":"))) {
    findings.push(`AAAA answers present for ${WWW}`);
    remediations.push("Remove AAAA for www.sitguru.com.");
  }
  if (caa.length === 0) {
    findings.push("No CAA records — optional hardening for issuance control");
    remediations.push(
      'Add CAA: 0 issue "letsencrypt.org" (and Cloudflare/Google issuers if proxied).',
    );
  }
  if (
    wwwCname.length > 0 &&
    !wwwCname.some((line) => line.includes("vercel-dns"))
  ) {
    findings.push(`www CNAME is unexpected: ${wwwCname.join(", ")}`);
  }
}

function printRemediation() {
  printSection("Remediation (WiFi + cellular)");
  const steps = [
    ...new Set([
      ...remediations,
      "Keep Outlook MX (sitguru-com.mail.protection.outlook.com) and existing SPF/verification TXT records when moving DNS.",
      "After Cloudflare proxy is on, re-test Safari on the failing home WiFi (not only cellular).",
      "Ask affected users to temporarily disable ISP Advanced Security (xFi / Secure Home) if Cloudflare is not ready yet.",
      "File a Vercel support ticket if SSL Labs still reports edge handshake failures after DNS is clean.",
    ]),
  ];
  for (const [index, step] of steps.entries()) {
    console.log(`${index + 1}. ${step}`);
  }
}

async function main() {
  console.log("SitGuru domain connectivity check");
  console.log(`Time: ${new Date().toISOString()}`);

  inspectDns();
  await inspectHost(APEX);
  await inspectHost(WWW);

  printSection("Findings");
  if (findings.length === 0) {
    console.log("No blocking DNS/TLS misconfigurations detected from this vantage point.");
  } else {
    for (const item of findings) console.log(`- ${item}`);
  }

  printRemediation();

  const hardFailures = findings.filter(
    (item) =>
      item.includes("AAAA") ||
      item.includes("Missing A") ||
      item.includes("expires in"),
  );
  process.exit(hardFailures.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
