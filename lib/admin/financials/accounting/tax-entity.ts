import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITGURU_ACCOUNTING_ORG_ID, type TaxProfessionalRecord, type TaxReturnStatus } from "./types";

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export type TaxEntityProfile = {
  organizationId: string;
  legalEntity: string;
  dba: string;
  taxClassification: string;
  taxYear: number;
  owners: Array<{ name: string; percent: number }>;
};

export type { TaxProfessionalRecord };

const FALLBACK_ENTITY: TaxEntityProfile = {
  organizationId: SITGURU_ACCOUNTING_ORG_ID,
  legalEntity: "Graff Enterprises LLC",
  dba: "SitGuru",
  taxClassification: "Partnership",
  taxYear: new Date().getFullYear(),
  owners: [
    { name: "Jason Graff", percent: 81 },
    { name: "Danette Graff", percent: 19 },
  ],
};

export async function loadTaxEntityProfile(
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
): Promise<TaxEntityProfile> {
  try {
    const [{ data: profile }, { data: owners }] = await Promise.all([
      supabaseAdmin
        .from("organization_tax_profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle(),
      supabaseAdmin
        .from("organization_tax_owners")
        .select("owner_name, ownership_percent, display_order")
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true }),
    ]);
    if (!profile) return FALLBACK_ENTITY;
    return {
      organizationId,
      legalEntity: asTrimmed(profile.legal_entity) || FALLBACK_ENTITY.legalEntity,
      dba: asTrimmed(profile.dba) || FALLBACK_ENTITY.dba,
      taxClassification:
        asTrimmed(profile.tax_classification) || FALLBACK_ENTITY.taxClassification,
      taxYear: Number(profile.tax_year) || FALLBACK_ENTITY.taxYear,
      owners: (owners || []).map((row) => ({
        name: asTrimmed(row.owner_name),
        percent: Number(row.ownership_percent) || 0,
      })),
    };
  } catch {
    return FALLBACK_ENTITY;
  }
}

export async function loadTaxProfessional(
  taxYear = new Date().getFullYear(),
  organizationId = SITGURU_ACCOUNTING_ORG_ID,
): Promise<TaxProfessionalRecord> {
  try {
    const { data } = await supabaseAdmin
      .from("tax_professional_handoffs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("tax_year", taxYear)
      .maybeSingle();
    return {
      taxYear,
      name: asTrimmed(data?.tax_professional_name),
      firm: asTrimmed(data?.tax_professional_firm),
      email: asTrimmed(data?.tax_professional_email),
      dateSent: asTrimmed(data?.date_sent) || null,
      returnStatus: (asTrimmed(data?.return_status) ||
        "not_started") as TaxReturnStatus,
    };
  } catch {
    return {
      taxYear,
      name: "",
      firm: "",
      email: "",
      dateSent: null,
      returnStatus: "not_started",
    };
  }
}

export async function markTaxPackageSent(input: {
  taxYear: number;
  actorEmail: string;
  organizationId?: string;
}) {
  const organizationId = input.organizationId || SITGURU_ACCOUNTING_ORG_ID;
  const now = new Date().toISOString();
  await supabaseAdmin.from("tax_professional_handoffs").upsert(
    {
      organization_id: organizationId,
      tax_year: input.taxYear,
      date_sent: now,
      return_status: "sent_to_preparer",
      updated_by_email: input.actorEmail,
      updated_at: now,
    },
    { onConflict: "organization_id,tax_year" },
  );
}

export function taxProfessionalStatusLabel(status: TaxReturnStatus) {
  switch (status) {
    case "records_ready":
      return "Records ready";
    case "sent_to_preparer":
      return "Sent to preparer";
    case "preparer_reviewing":
      return "Preparer reviewing";
    case "signature_required":
      return "Signature required";
    case "filed":
      return "Filed";
    case "accepted":
      return "Accepted";
    default:
      return "Not started";
  }
}
