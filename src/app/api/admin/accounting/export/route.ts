import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { db, unwrap } from "@/lib/supabase/server";
import { logAdminAction } from "@/modules/audit/audit-store";
import type { XeroInvoicePayload } from "@/modules/orders/xero-generator";

/**
 * Accounting export (PRD § 05 "Xero-ready", § 14). Every paid order stores a Xero
 * invoice payload when payment is confirmed; this downloads them for a date range.
 *
 *   ?format=csv   Xero "Import sales invoices" CSV (one row per line item)  [default]
 *   ?format=json  the raw invoice payloads, ready for the Xero Invoices API
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD   optional order-date range
 */
const CSV_COLUMNS = [
  "*ContactName", "EmailAddress", "*InvoiceNumber", "Reference", "*InvoiceDate", "*DueDate",
  "*Description", "*Quantity", "*UnitAmount", "*AccountCode", "*TaxType", "TaxAmount", "Currency",
];

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything and neutralise spreadsheet formula injection.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") === "json" ? "json" : "csv";
  const from = sp.get("from");
  const to = sp.get("to");
  const isDate = (d: string | null) => !d || /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!isDate(from) || !isDate(to)) return NextResponse.json({ error: "from/to must be YYYY-MM-DD" }, { status: 400 });

  try {
    let q = db().from("orders").select("order_number, created_at, xero_invoice").not("xero_invoice", "is", null).order("created_at");
    if (from) q = q.gte("created_at", `${from}T00:00:00Z`);
    if (to) q = q.lte("created_at", `${to}T23:59:59Z`);
    const rows = unwrap(await q, "Load accounting export") as { order_number: string; xero_invoice: XeroInvoicePayload }[];
    const invoices = rows.map((r) => r.xero_invoice);

    await logAdminAction(auth.user.id, auth.user.email, "accounting_export", "order", "*", { format, from, to, count: invoices.length });

    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "json") {
      return new NextResponse(JSON.stringify({ Invoices: invoices }, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="xero-invoices-${stamp}.json"` },
      });
    }

    const lines = [CSV_COLUMNS.join(",")];
    for (const inv of invoices) {
      for (const li of inv.LineItems ?? []) {
        lines.push([
          inv.Contact?.Name, inv.Contact?.EmailAddress, inv.InvoiceNumber, inv.Reference, inv.Date, inv.DueDate,
          li.Description, li.Quantity, li.UnitAmount, li.AccountCode, li.TaxType, li.TaxAmount, inv.CurrencyCode,
        ].map(cell).join(","));
      }
    }
    return new NextResponse(lines.join("\r\n") + "\r\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="xero-invoices-${stamp}.csv"` },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Export failed" }, { status: 500 });
  }
}
