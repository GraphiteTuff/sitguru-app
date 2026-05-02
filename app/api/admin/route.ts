import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DocumentType = "invoice" | "purchase_order";

type FinancialDocumentPayload = {
  id?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  status?: string;
  issueDate?: string;
  dueDate?: string;

  fromName?: string;
  fromEmail?: string;
  fromPhone?: string;
  fromAddress?: string;

  toName?: string;
  toEmail?: string;
  toPhone?: string;
  toAddress?: string;

  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;

  notes?: string;
  terms?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureDate?: string;

  paymentAccount?: string;
  expenseAccount?: string;
  action?: "save_draft" | "post_financials";

  lineItems?: FinancialDocumentLinePayload[];
};

type FinancialDocumentLinePayload = {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  displayOrder?: number;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeDate(value: unknown) {
  const text = safeString(value);

  if (!text) return null;

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) return null;

  return text.slice(0, 10);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function makeDocumentNumber(documentType: DocumentType) {
  const prefix = documentType === "invoice" ? "SG-INV" : "SG-PO";
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  return `${prefix}-${stamp}`;
}

function normalizeLineItems(items: unknown): FinancialDocumentLinePayload[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const raw = item as Record<string, unknown>;
      const description = safeString(raw.description);
      const quantity = toNumber(raw.quantity) || 1;
      const unitPrice = toNumber(raw.unitPrice ?? raw.unit_price);
      const fallbackLineTotal = quantity * unitPrice;
      const lineTotal = toNumber(raw.lineTotal ?? raw.line_total) || fallbackLineTotal;

      return {
        description,
        quantity,
        unitPrice,
        lineTotal,
        displayOrder: toNumber(raw.displayOrder ?? raw.display_order) || (index + 1) * 10,
      };
    })
    .filter((item) => item.description || item.lineTotal > 0);
}

function calculateSubtotal(lineItems: FinancialDocumentLinePayload[]) {
  return lineItems.reduce((sum, item) => sum + toNumber(item.lineTotal), 0);
}

async function replaceLineItems(
  documentId: string,
  lineItems: FinancialDocumentLinePayload[]
) {
  await supabaseAdmin
    .from("financial_document_line_items")
    .delete()
    .eq("document_id", documentId);

  if (!lineItems.length) return;

  const rows = lineItems.map((item, index) => ({
    document_id: documentId,
    description: safeString(item.description) || "Line item",
    quantity: toNumber(item.quantity) || 1,
    unit_price: toNumber(item.unitPrice),
    line_total: toNumber(item.lineTotal),
    display_order: toNumber(item.displayOrder) || (index + 1) * 10,
  }));

  const { error } = await supabaseAdmin
    .from("financial_document_line_items")
    .insert(rows);

  if (error) {
    throw new Error(`Line item insert failed: ${error.message}`);
  }
}

async function clearExistingLedgerEntries(documentId: string) {
  await supabaseAdmin
    .from("financial_ledger_entries")
    .delete()
    .eq("source_type", "financial_document")
    .eq("source_id", documentId);
}

async function postInvoiceLedgerEntries({
  documentId,
  issueDate,
  documentNumber,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
}: {
  documentId: string;
  issueDate: string | null;
  documentNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}) {
  const entryDate = issueDate || new Date().toISOString().slice(0, 10);
  const memo = `Invoice ${documentNumber}`;

  const rows = [
    {
      source_type: "financial_document",
      source_id: documentId,
      entry_date: entryDate,
      account_name: "Accounts Receivable",
      debit: totalAmount,
      credit: 0,
      memo,
    },
    {
      source_type: "financial_document",
      source_id: documentId,
      entry_date: entryDate,
      account_name: "Invoice Revenue",
      debit: 0,
      credit: subtotal,
      memo,
    },
  ];

  if (taxAmount > 0) {
    rows.push({
      source_type: "financial_document",
      source_id: documentId,
      entry_date: entryDate,
      account_name: "Sales Tax Payable",
      debit: 0,
      credit: taxAmount,
      memo,
    });
  }

  if (discountAmount > 0) {
    rows.push({
      source_type: "financial_document",
      source_id: documentId,
      entry_date: entryDate,
      account_name: "Discounts / Customer Credits",
      debit: discountAmount,
      credit: 0,
      memo,
    });
  }

  const { error } = await supabaseAdmin.from("financial_ledger_entries").insert(rows);

  if (error) {
    throw new Error(`Invoice ledger insert failed: ${error.message}`);
  }
}

async function postPurchaseOrderLedgerEntries({
  documentId,
  issueDate,
  documentNumber,
  totalAmount,
  status,
  expenseAccount,
  paymentAccount,
  notes,
}: {
  documentId: string;
  issueDate: string | null;
  documentNumber: string;
  totalAmount: number;
  status: string;
  expenseAccount: string;
  paymentAccount: string;
  notes: string;
}) {
  const entryDate = issueDate || new Date().toISOString().slice(0, 10);
  const normalizedStatus = status.toLowerCase();
  const isPaid =
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("expensed") ||
    normalizedStatus.includes("posted");

  const debitAccount = expenseAccount || "Operating Expense";
  const creditAccount = isPaid ? paymentAccount || "Cash / Bank" : "Accounts Payable";
  const memo = `Purchase Order ${documentNumber}`;

  const rows = [
    {
      source_type: "financial_document",
      source_id: documentId,
      entry_date: entryDate,
      account_name: debitAccount,
      debit: totalAmount,
      credit: 0,
      memo,
    },
    {
      source_type: "financial_document",
      source_id: documentId,
      entry_date: entryDate,
      account_name: creditAccount,
      debit: 0,
      credit: totalAmount,
      memo,
    },
  ];

  const { error } = await supabaseAdmin.from("financial_ledger_entries").insert(rows);

  if (error) {
    throw new Error(`Purchase order ledger insert failed: ${error.message}`);
  }

  if (isPaid) {
    await supabaseAdmin.from("expense_ledger").insert({
      name: memo,
      description: notes || `Posted from ${memo}`,
      category: debitAccount,
      amount: totalAmount,
    });
  }
}

async function postDocumentToFinancials({
  documentId,
  documentType,
  documentNumber,
  issueDate,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  status,
  expenseAccount,
  paymentAccount,
  notes,
}: {
  documentId: string;
  documentType: DocumentType;
  documentNumber: string;
  issueDate: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  expenseAccount: string;
  paymentAccount: string;
  notes: string;
}) {
  await clearExistingLedgerEntries(documentId);

  if (documentType === "invoice") {
    await postInvoiceLedgerEntries({
      documentId,
      issueDate,
      documentNumber,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
    });
  }

  if (documentType === "purchase_order") {
    await postPurchaseOrderLedgerEntries({
      documentId,
      issueDate,
      documentNumber,
      totalAmount,
      status,
      expenseAccount,
      paymentAccount,
      notes,
    });
  }

  const { error } = await supabaseAdmin
    .from("financial_documents")
    .update({
      accounting_posted: true,
      accounting_posted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    throw new Error(`Document posting update failed: ${error.message}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const documentType = safeString(req.nextUrl.searchParams.get("type"));
    const limit = Math.min(100, Math.max(1, toNumber(req.nextUrl.searchParams.get("limit")) || 25));

    let query = supabaseAdmin
      .from("financial_documents")
      .select(
        `
        *,
        financial_document_line_items (*)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (documentType === "invoice" || documentType === "purchase_order") {
      query = query.eq("document_type", documentType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: data || [],
    });
  } catch (error) {
    console.error("Financial documents GET error:", error);

    return NextResponse.json(
      { error: "Failed to load financial documents." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as FinancialDocumentPayload | null;

    if (!body) {
      return NextResponse.json(
        { error: "Missing request body." },
        { status: 400 }
      );
    }

    const documentType = body.documentType;

    if (documentType !== "invoice" && documentType !== "purchase_order") {
      return NextResponse.json(
        { error: "Document type must be invoice or purchase_order." },
        { status: 400 }
      );
    }

    const lineItems = normalizeLineItems(body.lineItems);
    const calculatedSubtotal = calculateSubtotal(lineItems);

    const subtotal = toNumber(body.subtotal) || calculatedSubtotal;
    const taxAmount = toNumber(body.taxAmount);
    const discountAmount = toNumber(body.discountAmount);
    const totalAmount =
      toNumber(body.totalAmount) || Math.max(0, subtotal + taxAmount - discountAmount);

    const documentNumber =
      safeString(body.documentNumber) || makeDocumentNumber(documentType);

    const status = safeString(body.status) || "draft";
    const issueDate = safeDate(body.issueDate);
    const dueDate = safeDate(body.dueDate);
    const signatureDate = safeDate(body.signatureDate);

    const documentPayload = {
      document_type: documentType,
      document_number: documentNumber,
      status,
      issue_date: issueDate,
      due_date: dueDate,

      from_name: safeString(body.fromName),
      from_email: safeString(body.fromEmail),
      from_phone: safeString(body.fromPhone),
      from_address: safeString(body.fromAddress),

      to_name: safeString(body.toName),
      to_email: safeString(body.toEmail),
      to_phone: safeString(body.toPhone),
      to_address: safeString(body.toAddress),

      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,

      notes: safeString(body.notes),
      terms: safeString(body.terms),
      signature_name: safeString(body.signatureName),
      signature_title: safeString(body.signatureTitle),
      signature_date: signatureDate,

      updated_at: new Date().toISOString(),
    };

    let documentId = safeString(body.id);

    if (documentId) {
      const { error } = await supabaseAdmin
        .from("financial_documents")
        .update(documentPayload)
        .eq("id", documentId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("financial_documents")
        .insert(documentPayload)
        .select("id")
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: error?.message || "Failed to create financial document." },
          { status: 500 }
        );
      }

      documentId = String(data.id);
    }

    await replaceLineItems(documentId, lineItems);

    if (body.action === "post_financials") {
      await postDocumentToFinancials({
        documentId,
        documentType,
        documentNumber,
        issueDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        status,
        expenseAccount: safeString(body.expenseAccount),
        paymentAccount: safeString(body.paymentAccount),
        notes: safeString(body.notes),
      });
    }

    const { data: savedDocument, error: savedDocumentError } = await supabaseAdmin
      .from("financial_documents")
      .select(
        `
        *,
        financial_document_line_items (*)
      `
      )
      .eq("id", documentId)
      .single();

    if (savedDocumentError) {
      return NextResponse.json({
        success: true,
        documentId,
        message:
          body.action === "post_financials"
            ? "Document saved and posted to financials."
            : "Document saved.",
      });
    }

    return NextResponse.json({
      success: true,
      documentId,
      document: savedDocument,
      message:
        body.action === "post_financials"
          ? `Saved and posted ${documentType === "invoice" ? "invoice" : "purchase order"} ${documentNumber} to financials for ${money(totalAmount)}.`
          : `Saved ${documentType === "invoice" ? "invoice" : "purchase order"} ${documentNumber}.`,
    });
  } catch (error) {
    console.error("Financial documents POST error:", error);

    return NextResponse.json(
      { error: "Failed to save financial document." },
      { status: 500 }
    );
  }
}
