import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  SITGURU_ACCOUNTING_ORG_ID,
  type AccountingProviderId,
  type ProviderCatalogRow,
} from "./types";

const FALLBACK: ProviderCatalogRow[] = [
  {
    provider: "quickbooks",
    providerName: "QuickBooks Online",
    pricingNote:
      "Intuit subscription required for a live QuickBooks Online company.",
    supportUrl: "https://quickbooks.intuit.com",
    connectUrl: "/api/admin/financials/quickbooks/connect",
    enabled: true,
  },
  {
    provider: "wave",
    providerName: "Wave Accounting",
    pricingNote:
      "Wave Pro is required for direct API connection. Check Wave for current pricing.",
    supportUrl: "https://www.waveapps.com/tax-season",
    connectUrl: "/api/tax/wave/connect",
    enabled: true,
  },
];

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBool(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  const text = asTrimmed(value).toLowerCase();
  if (text === "true" || text === "1") return true;
  if (text === "false" || text === "0") return false;
  return fallback;
}

export function isWaveAccountingEnabled() {
  const flag = asTrimmed(process.env.WAVE_ACCOUNTING_ENABLED).toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  if (flag === "true" || flag === "1" || flag === "on") return true;
  return Boolean(
    asTrimmed(process.env.WAVE_CLIENT_ID) &&
      asTrimmed(process.env.WAVE_CLIENT_SECRET),
  );
}

export async function loadProviderCatalog(): Promise<ProviderCatalogRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("accounting_provider_catalog")
      .select("*")
      .in("provider", ["quickbooks", "wave"]);
    if (error || !data?.length) return FALLBACK;
    const rows = data.map((row) => ({
      provider: asTrimmed(row.provider) as AccountingProviderId,
      providerName: asTrimmed(row.provider_name),
      pricingNote: asTrimmed(row.pricing_note),
      supportUrl: asTrimmed(row.support_url),
      connectUrl: asTrimmed(row.connect_url),
      enabled: asBool(row.enabled, true),
    }));
    return FALLBACK.map((fallback) => {
      const live = rows.find((row) => row.provider === fallback.provider);
      return live ? { ...fallback, ...live } : fallback;
    });
  } catch {
    return FALLBACK;
  }
}

export function getWaveCatalogCopy(catalog: ProviderCatalogRow[]) {
  return (
    catalog.find((row) => row.provider === "wave") ||
    FALLBACK.find((row) => row.provider === "wave")!
  );
}

export { SITGURU_ACCOUNTING_ORG_ID };
