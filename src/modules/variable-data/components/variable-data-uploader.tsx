"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { ArrowRight, FileSpreadsheet, UploadCloud, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { savePendingList } from "@/modules/variable-data/pending-list";

/**
 * Variable Data Printing (VDP): the customer checks their list here, picks a product and
 * goes to the designer with the list ready to attach. The real order (price,
 * proof, payment, one print file per row) happens through the designer, so this
 * page never creates files or orders on its own.
 */

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 5000;

const SAMPLE_NAME = "sample-list.csv";
const SAMPLE_CSV = `BibNumber,AthleteName,Category
201,AARAV SHARMA,Men Elite 10K
202,ANANYA IYER,Women Elite 10K
203,ARJUN VENKATARAMAN SUBRAMANIAN,Masters 40+ 10K
204,ROHAN D'SOUZA,Men Open 5K
205,PRIYA CHATTERJEE,Women Open 5K`;

interface ParsedList {
  fileName: string;
  csvContent: string;
  headers: string[];
  rows: Record<string, string>[];
  problems: string[];
}

function parseList(fileName: string, text: string): ParsedList {
  const csvContent = text.replace(/^﻿/, "");
  const parsed = Papa.parse<Record<string, string>>(csvContent.trim(), { header: true, skipEmptyLines: "greedy" });
  const headers = (parsed.meta.fields ?? []).map((h) => h.trim()).filter(Boolean);
  const rows = parsed.data.filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));
  const problems: string[] = [];
  if (headers.length === 0) problems.push("The first line must contain column names, e.g. BibNumber,AthleteName.");
  if (new Set(headers).size !== headers.length) problems.push("Each column name must be different.");
  if (rows.length === 0) problems.push("The file has no names or numbers under the column names.");
  if (rows.length > MAX_ROWS) problems.push(`Lists are limited to ${MAX_ROWS.toLocaleString("en-IN")} rows (this one has ${rows.length}).`);
  const badRows = parsed.errors.filter((e) => e.type === "FieldMismatch").map((e) => (e.row ?? 0) + 2);
  if (badRows.length) problems.push(`These lines have the wrong number of columns: ${badRows.slice(0, 10).join(", ")}${badRows.length > 10 ? "…" : ""}.`);
  return { fileName, csvContent, headers, rows, problems };
}

export function VariableDataUploader({ products }: { products: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [list, setList] = useState<ParsedList>(() => parseList(SAMPLE_NAME, SAMPLE_CSV));
  const [productSlug, setProductSlug] = useState(products[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [going, setGoing] = useState(false);

  const productName = useMemo(() => products.find((p) => p.slug === productSlug)?.name ?? "piece", [products, productSlug]);
  const isSample = list.fileName === SAMPLE_NAME;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("The file is larger than 1 MB. Split it into smaller lists.");
      return;
    }
    file
      .text()
      .then((text) => setList(parseList(file.name, text)))
      .catch(() => setError("The file could not be read. Save it again as .csv and retry."));
  };

  const goToDesigner = () => {
    if (!productSlug || list.problems.length) return;
    setGoing(true);
    const saved = savePendingList({ productSlug, fileName: list.fileName, csvContent: list.csvContent, rowCount: list.rows.length });
    if (!saved) {
      setGoing(false);
      setError("Your browser blocked saving the list. Open the designer and upload the file there instead.");
      return;
    }
    router.push(`/designer/${productSlug}?qty=${list.rows.length}`);
  };

  const placeholders = list.headers.slice(0, 3).map((h) => `{{${h}}}`);

  return (
    <Card className="border-border shadow-elevation">
      <CardHeader>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider">
          <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
          <span>Your list</span>
        </div>
        <CardTitle className="text-xl font-bold font-heading">One personalised {productName} for every row</CardTitle>
        <CardDescription>
          Upload your list from Excel or Google Sheets (File → Download → .csv). The first line holds the column names; every
          line after it becomes one printed piece.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-secondary/40 border">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold bg-brand-700 text-white hover:bg-brand-800 h-10 px-4 cursor-pointer shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring">
              <UploadCloud className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Upload your list (.csv)
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="sr-only" data-testid="bulk-list-input" />
            </label>
            <span className="text-sm text-muted-foreground" data-testid="bulk-list-count">
              {isSample ? "Showing a sample list" : list.fileName}: <strong className="text-foreground">{list.rows.length} rows</strong>
            </span>
          </div>
          {!isSample && (
            <Button variant="outline" size="sm" onClick={() => setList(parseList(SAMPLE_NAME, SAMPLE_CSV))}>
              Show the sample again
            </Button>
          )}
        </div>

        {(error || list.problems.length > 0) && (
          <div role="alert" className="p-4 rounded-lg text-sm bg-destructive/10 border border-destructive/20 text-destructive flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              {error && <p>{error}</p>}
              {list.problems.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        )}

        {list.headers.length > 0 && list.rows.length > 0 && (
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-secondary/60 px-4 py-2 text-xs font-semibold text-muted-foreground flex justify-between gap-3">
              <span>First {Math.min(5, list.rows.length)} rows</span>
              <span>Long names shrink to fit</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="p-2.5 text-left font-semibold text-muted-foreground">#</th>
                    {list.headers.map((h) => (
                      <th key={h} className="p-2.5 text-left font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-muted-foreground">{idx + 1}</td>
                      {list.headers.map((h) => (
                        <td key={h} className="p-2.5 whitespace-nowrap">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end p-4 rounded-xl border bg-card">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-product">What should we print?</Label>
            <select
              id="bulk-product"
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              className="w-full text-sm bg-background border rounded-md h-10 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            {placeholders.length > 0 && (
              <p className="text-xs text-muted-foreground">
                In the designer, type {placeholders.join(", ")} where each name or number should go.
              </p>
            )}
          </div>
          <Button
            size="lg"
            variant="cta"
            onClick={goToDesigner}
            disabled={going || !productSlug || list.problems.length > 0}
            className="font-semibold"
            data-testid="bulk-design-button"
          >
            {going ? "Opening the designer…" : `Design ${list.rows.length} pieces`}
            <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        </div>
        {products.length === 0 && <p className="text-sm text-muted-foreground">Personalised printing is not available right now.</p>}
      </CardContent>
    </Card>
  );
}
