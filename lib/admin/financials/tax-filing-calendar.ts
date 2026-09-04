export const SITGURU_LEGAL_ENTITY = "Graff Enterprises LLC";
export const SITGURU_DBA = "SitGuru";
export const SITGURU_TAX_HOME = "Pennsylvania";

export type FilingAuthority = "IRS" | "Pennsylvania";
export type FilingUrgency = "overdue" | "due_soon" | "upcoming" | "later";

export type FilingDeadline = {
  id: string;
  authority: FilingAuthority;
  dueOn: string;
  title: string;
  form: string;
  who: string;
  action: string;
  href: string;
  notes: string;
};

export type DatedFilingDeadline = FilingDeadline & {
  dueDate: Date;
  urgency: FilingUrgency;
  daysUntil: number;
  dueLabel: string;
};

const MS_PER_DAY = 86_400_000;

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function daysBetween(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

function urgencyFor(daysUntil: number): FilingUrgency {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 30) return "due_soon";
  if (daysUntil <= 90) return "upcoming";
  return "later";
}

function dueLabel(dueDate: Date, daysUntil: number) {
  const date = dueDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (daysUntil < 0) return `${date} · ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"} late`;
  if (daysUntil === 0) return `${date} · due today`;
  if (daysUntil === 1) return `${date} · tomorrow`;
  return `${date} · in ${daysUntil} days`;
}

/**
 * Working calendar for Graff Enterprises LLC dba SitGuru.
 * Default path is a PA multi-member LLC (Jason + Danette) filing Form 1065
 * and PA-20S/PA-65. CPA must confirm if the LLC is disregarded or an S corp.
 */
export const GRAFF_ENTERPRISES_FILING_DEADLINES: FilingDeadline[] = [
  {
    id: "irs-2026-q3-es",
    authority: "IRS",
    dueOn: "2026-09-15",
    title: "Q3 2026 federal estimated tax",
    form: "1040-ES",
    who: "Members of Graff Enterprises LLC",
    action: "Pay IRS estimated tax",
    href: "https://www.irs.gov/payments",
    notes: "Covers June–August 2026. SitGuru launch year starts June 1, so this is the first real federal estimate window.",
  },
  {
    id: "pa-2026-q3-es",
    authority: "Pennsylvania",
    dueOn: "2026-09-15",
    title: "Q3 2026 PA estimated personal income tax",
    form: "PA-40 ES",
    who: "PA-resident members",
    action: "Pay on myPATH",
    href: "https://mypath.pa.gov",
    notes: "PA uses the same quarter dates as the IRS. Members pay the 3.07% PA PIT on pass-through income.",
  },
  {
    id: "pa-2026-llc-annual-report",
    authority: "Pennsylvania",
    dueOn: "2026-09-30",
    title: "PA LLC Annual Report (Act 122)",
    form: "DSCB:15-146",
    who: "Graff Enterprises LLC",
    action: "File at file.dos.pa.gov",
    href: "https://file.dos.pa.gov",
    notes: "$7 Department of State report. Window is Jan 1–Sep 30. Missing later years can start administrative dissolution.",
  },
  {
    id: "irs-2026-q4-es",
    authority: "IRS",
    dueOn: "2027-01-15",
    title: "Q4 2026 federal estimated tax",
    form: "1040-ES",
    who: "Members of Graff Enterprises LLC",
    action: "Pay IRS estimated tax",
    href: "https://www.irs.gov/payments",
    notes: "Covers September–December 2026. Safe-harbor is usually 90% of this year or 100% of last year (110% if prior AGI is high).",
  },
  {
    id: "pa-2026-q4-es",
    authority: "Pennsylvania",
    dueOn: "2027-01-15",
    title: "Q4 2026 PA estimated personal income tax",
    form: "PA-40 ES",
    who: "PA-resident members",
    action: "Pay on myPATH",
    href: "https://mypath.pa.gov",
    notes: "Same date as federal Q4 estimates.",
  },
  {
    id: "irs-2026-1099-nec",
    authority: "IRS",
    dueOn: "2027-02-01",
    title: "1099-NEC to Gurus / contractors and IRS",
    form: "1099-NEC / 1096",
    who: "Graff Enterprises LLC dba SitGuru",
    action: "Review 1099 desk",
    href: "/admin/financials/tax-reports/1099",
    notes: "Jan 31, 2027 is a Sunday, so the due date moves to Monday Feb 1. Use the Tax Center 1099 desk for $600+ review. Stripe may also issue 1099-K.",
  },
  {
    id: "irs-2026-1065",
    authority: "IRS",
    dueOn: "2027-03-15",
    title: "Federal partnership return + K-1s",
    form: "Form 1065 / Schedule K-1",
    who: "Graff Enterprises LLC",
    action: "Open IRS Form 1065",
    href: "https://www.irs.gov/forms-pubs/about-form-1065",
    notes: "Default if Jason and Danette are both members. File Form 7004 to extend to Sep 15, 2027. If CPA confirms S-corp, use 1120-S instead. If single-member, this date does not apply.",
  },
  {
    id: "irs-2026-1040",
    authority: "IRS",
    dueOn: "2027-04-15",
    title: "Member federal income tax returns",
    form: "Form 1040 + Schedule E (or C)",
    who: "Jason, Danette, and any other members",
    action: "Open IRS Form 1040",
    href: "https://www.irs.gov/forms-pubs/about-form-1040",
    notes: "Partnership income lands on Schedule E from the K-1. Disregarded LLC uses Schedule C. Extension is Form 4868 to Oct 15, 2027 — payment is still due April 15.",
  },
  {
    id: "irs-2027-q1-es",
    authority: "IRS",
    dueOn: "2027-04-15",
    title: "Q1 2027 federal estimated tax",
    form: "1040-ES",
    who: "Members of Graff Enterprises LLC",
    action: "Pay IRS estimated tax",
    href: "https://www.irs.gov/payments",
    notes: "Same day as the 2026 Form 1040. Pay the estimate even if the return is on extension.",
  },
  {
    id: "pa-2026-20s-65",
    authority: "Pennsylvania",
    dueOn: "2027-04-15",
    title: "PA partnership / S corp information return",
    form: "PA-20S/PA-65",
    who: "Graff Enterprises LLC",
    action: "File on myPATH",
    href: "https://mypath.pa.gov",
    notes: "Due April 15 for calendar-year filers — one month after federal 1065. Extension generally follows to Sep 15.",
  },
  {
    id: "pa-2026-40",
    authority: "Pennsylvania",
    dueOn: "2027-04-15",
    title: "Member PA personal income tax returns",
    form: "PA-40",
    who: "PA-resident members",
    action: "File on myPATH",
    href: "https://mypath.pa.gov",
    notes: "PA PIT is a flat 3.07%. Federal extension usually covers PA-40 to Oct 15.",
  },
  {
    id: "pa-2027-q1-es",
    authority: "Pennsylvania",
    dueOn: "2027-04-15",
    title: "Q1 2027 PA estimated personal income tax",
    form: "PA-40 ES",
    who: "PA-resident members",
    action: "Pay on myPATH",
    href: "https://mypath.pa.gov",
    notes: "Same day as PA-40.",
  },
  {
    id: "pa-sales-tax-20th",
    authority: "Pennsylvania",
    dueOn: "2026-09-20",
    title: "PA sales tax return (if registered)",
    form: "PA-3 / myPATH sales tax",
    who: "Graff Enterprises LLC dba SitGuru",
    action: "Open PA business tax payments",
    href: "https://www.pa.gov/services/revenue/make-a-business-tax-payment",
    notes: "Due the 20th after each monthly or quarterly period once PA sales-tax registration is live. Confirm cadence with your CPA before promising remittance.",
  },
  {
    id: "irs-2027-q2-es",
    authority: "IRS",
    dueOn: "2027-06-15",
    title: "Q2 2027 federal estimated tax",
    form: "1040-ES",
    who: "Members of Graff Enterprises LLC",
    action: "Pay IRS estimated tax",
    href: "https://www.irs.gov/payments",
    notes: "Covers April–May 2027.",
  },
  {
    id: "pa-2027-q2-es",
    authority: "Pennsylvania",
    dueOn: "2027-06-15",
    title: "Q2 2027 PA estimated personal income tax",
    form: "PA-40 ES",
    who: "PA-resident members",
    action: "Pay on myPATH",
    href: "https://mypath.pa.gov",
    notes: "Same date as federal Q2 estimates.",
  },
  {
    id: "irs-2027-q3-es",
    authority: "IRS",
    dueOn: "2027-09-15",
    title: "Q3 2027 federal estimated tax",
    form: "1040-ES",
    who: "Members of Graff Enterprises LLC",
    action: "Pay IRS estimated tax",
    href: "https://www.irs.gov/payments",
    notes: "Also the extended due date for Form 1065 / 1120-S if Form 7004 was filed.",
  },
  {
    id: "pa-2027-q3-es",
    authority: "Pennsylvania",
    dueOn: "2027-09-15",
    title: "Q3 2027 PA estimated personal income tax",
    form: "PA-40 ES",
    who: "PA-resident members",
    action: "Pay on myPATH",
    href: "https://mypath.pa.gov",
    notes: "Extended PA-20S/PA-65 is generally due the same day.",
  },
  {
    id: "pa-2027-llc-annual-report",
    authority: "Pennsylvania",
    dueOn: "2027-09-30",
    title: "PA LLC Annual Report (Act 122)",
    form: "DSCB:15-146",
    who: "Graff Enterprises LLC",
    action: "File at file.dos.pa.gov",
    href: "https://file.dos.pa.gov",
    notes: "File every year. 2027 is when DOS can start administrative dissolution for missed reports.",
  },
  {
    id: "irs-2026-1040-extended",
    authority: "IRS",
    dueOn: "2027-10-15",
    title: "Extended member federal returns",
    form: "Form 1040",
    who: "Members who filed Form 4868",
    action: "Open IRS Form 1040",
    href: "https://www.irs.gov/forms-pubs/about-form-1040",
    notes: "Filing extension only. Any tax due was still payable April 15, 2027.",
  },
  {
    id: "irs-2027-q4-es",
    authority: "IRS",
    dueOn: "2028-01-15",
    title: "Q4 2027 federal estimated tax",
    form: "1040-ES",
    who: "Members of Graff Enterprises LLC",
    action: "Pay IRS estimated tax",
    href: "https://www.irs.gov/payments",
    notes: "Closes the 2027 estimate year.",
  },
];

export function getGraffEnterprisesFilingCalendar(asOf = new Date()) {
  const dated = GRAFF_ENTERPRISES_FILING_DEADLINES.map((item) => {
    const dueDate = parseDate(item.dueOn);
    const daysUntil = daysBetween(asOf, dueDate);
    return {
      ...item,
      dueDate,
      daysUntil,
      urgency: urgencyFor(daysUntil),
      dueLabel: dueLabel(dueDate, daysUntil),
    };
  }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const open = dated.filter((item) => item.daysUntil >= -14);
  const nextUp = open.filter((item) => item.urgency === "overdue" || item.urgency === "due_soon");
  const upcoming = open.filter((item) => item.urgency === "upcoming");

  return {
    legalName: SITGURU_LEGAL_ENTITY,
    dba: SITGURU_DBA,
    homeState: SITGURU_TAX_HOME,
    asOf,
    all: dated,
    open,
    nextUp,
    upcoming,
    nextDeadline: open[0] || dated[dated.length - 1],
  };
}
