export type MarketplaceTaxScope =
  | "all_pet_care"
  | "boarding_daycare"
  | "platform_fees";

export type MarketplaceSalesTaxState = {
  state: string;
  stateName: string;
  taxName: string;
  rate: string;
  local: string;
  scope: MarketplaceTaxScope;
  scopeLabel: string;
  href: string;
  notes: string;
};

/**
 * States/districts where pet-care marketplaces currently collect and remit
 * tax on bookings (aligned to Rover’s published remittance list).
 * SitGuru should register these in Stripe Tax. CPA confirms nexus.
 */
export const MARKETPLACE_SALES_TAX_STATES: MarketplaceSalesTaxState[] = [
  {
    state: "AR",
    stateName: "Arkansas",
    taxName: "State + local sales tax",
    rate: "6.5%",
    local: "0%–6.125%",
    scope: "boarding_daycare",
    scopeLabel: "Boarding and daycare only",
    href: "https://www.dfa.arkansas.gov/excise-tax/sales-and-use-tax",
    notes: "Walks and sitting are not on the published boarding/daycare list.",
  },
  {
    state: "CT",
    stateName: "Connecticut",
    taxName: "State sales tax",
    rate: "6.35%",
    local: "1% on SitGuru fees for all services",
    scope: "boarding_daycare",
    scopeLabel: "Boarding and daycare + fee on every service",
    href: "https://portal.ct.gov/drs",
    notes: "Service tax on boarding/daycare. Platform fee is taxed on all booking types.",
  },
  {
    state: "DC",
    stateName: "District of Columbia",
    taxName: "District sales tax",
    rate: "6%",
    local: "Fees only",
    scope: "platform_fees",
    scopeLabel: "SitGuru service fee only",
    href: "https://otr.cfo.dc.gov",
    notes: "The walk itself is not taxed. The marketplace fee is.",
  },
  {
    state: "HI",
    stateName: "Hawaii",
    taxName: "General Excise Tax",
    rate: "4.712%",
    local: "Included in GET",
    scope: "all_pet_care",
    scopeLabel: "All pet care + SitGuru fee",
    href: "https://tax.hawaii.gov/geninfo/get/",
    notes: "GET applies to the booking and the platform fee.",
  },
  {
    state: "KY",
    stateName: "Kentucky",
    taxName: "State sales tax",
    rate: "6%",
    local: "None on this list",
    scope: "all_pet_care",
    scopeLabel: "All pet care services",
    href: "https://revenue.ky.gov",
    notes: "Statewide rate on the service charge.",
  },
  {
    state: "MN",
    stateName: "Minnesota",
    taxName: "State + local sales tax",
    rate: "6.875%",
    local: "0%–3%",
    scope: "all_pet_care",
    scopeLabel: "All pet care services",
    href: "https://www.revenue.state.mn.us/sales-and-use-tax",
    notes: "Includes Minneapolis and other local add-ons. Tips stay out.",
  },
  {
    state: "NE",
    stateName: "Nebraska",
    taxName: "State + local sales tax",
    rate: "5.5%",
    local: "0%–2%",
    scope: "all_pet_care",
    scopeLabel: "All pet care services",
    href: "https://revenue.nebraska.gov",
    notes: "Local city/county rates stack on the state rate.",
  },
  {
    state: "NJ",
    stateName: "New Jersey",
    taxName: "State sales tax",
    rate: "6.625%",
    local: "None on this list",
    scope: "boarding_daycare",
    scopeLabel: "Boarding and daycare only",
    href: "https://www.nj.gov/treasury/taxation/payments-notices.shtml",
    notes: "Walks and sitting are outside the published boarding/daycare tax.",
  },
  {
    state: "NM",
    stateName: "New Mexico",
    taxName: "Gross receipts tax",
    rate: "5.25%–10.8125%",
    local: "Combined state + local GRT",
    scope: "all_pet_care",
    scopeLabel: "All pet care + SitGuru fee",
    href: "https://www.tax.newmexico.gov",
    notes: "Rate depends on the sit location. Include the platform fee.",
  },
  {
    state: "RI",
    stateName: "Rhode Island",
    taxName: "State sales tax",
    rate: "7%",
    local: "None on this list",
    scope: "all_pet_care",
    scopeLabel: "All pet care + SitGuru fee",
    href: "https://tax.ri.gov",
    notes: "Statewide rate on the booking and the fee.",
  },
  {
    state: "SD",
    stateName: "South Dakota",
    taxName: "State + local sales tax",
    rate: "4.2%",
    local: "0%–3%",
    scope: "all_pet_care",
    scopeLabel: "All pet care services",
    href: "https://dor.sd.gov",
    notes: "Municipal rates stack. No sales-tax-free state exception here.",
  },
  {
    state: "WV",
    stateName: "West Virginia",
    taxName: "State + local sales tax",
    rate: "6%",
    local: "0%–1%",
    scope: "all_pet_care",
    scopeLabel: "All pet care + SitGuru fee",
    href: "https://tax.wv.gov",
    notes: "Includes the platform fee.",
  },
];

export const MARKETPLACE_SALES_TAX_STATE_CODES = MARKETPLACE_SALES_TAX_STATES.map(
  (item) => item.state,
);

export function isMarketplaceSalesTaxState(state?: string | null) {
  const code = String(state || "").trim().toUpperCase();
  return MARKETPLACE_SALES_TAX_STATES.some((item) => item.state === code);
}

export function marketplaceSalesTaxStateLabel() {
  return MARKETPLACE_SALES_TAX_STATES.map((item) => item.state).join(", ");
}
