"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearPendingList, loadPendingList, type PendingList } from "@/modules/variable-data/pending-list";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  productSlug: string;
  quantity: number;
  sampleHeaders?: string[];
  ensureDraftId: () => Promise<string>;
}

/**
 * Attaches the variable-data CSV to the job (one personalised item per row).
 * In the designer, text such as {{BibNumber}} or {{AthleteName}} is replaced per
 * row and fitted to its box when the print files are produced.
 */
export function VariableDataAttach({ productSlug, quantity, sampleHeaders = [], ensureDraftId }: Props) {
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "busy" } | { kind: "ok"; rows: number; headers: string[] } | { kind: "error"; message: string }
  >({ kind: "idle" });

  // A list brought over from the Variable Data Printing page, waiting to be attached.
  const [pending, setPending] = useState<PendingList | null>(null);
  useEffect(() => setPending(loadPendingList(productSlug)), [productSlug]);

  const attach = async (fileName: string, csvContent: string) => {
    setStatus({ kind: "busy" });
    try {
      const draftId = await ensureDraftId();
      const res = await fetch(`/api/drafts/${draftId}/csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, csvContent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The list could not be attached.");
      setStatus({ kind: "ok", rows: data.rowCount, headers: data.headers });
      clearPendingList();
      setPending(null);
    } catch (err: unknown) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "The list could not be attached." });
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 1_000_000) {
      setStatus({ kind: "error", message: "CSV files are limited to 1 MB." });
      return;
    }
    await attach(file.name, await file.text());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-brand-500" aria-hidden="true" />
          Variable data (your list)
        </CardTitle>
        <CardDescription>
          One row per item ({quantity} rows for this job). Use column names in text, e.g.{" "}
          {(sampleHeaders.length ? sampleHeaders.slice(0, 2) : ["BibNumber", "AthleteName"]).map((h) => `{{${h}}}`).join(" ")}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending && status.kind !== "ok" && (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm flex flex-wrap items-center justify-between gap-3" data-testid="pending-list">
            <span>
              Your list <strong>{pending.fileName}</strong> ({pending.rowCount} rows) is ready to attach.
            </span>
            <span className="flex gap-2">
              <Button size="sm" onClick={() => attach(pending.fileName, pending.csvContent)} disabled={status.kind === "busy"}>
                Attach this list
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  clearPendingList();
                  setPending(null);
                }}
              >
                Don&apos;t use it
              </Button>
            </span>
          </div>
        )}
        <label className="block">
          <span className="sr-only">Choose a CSV file</span>
          <input type="file" accept=".csv,text/csv" onChange={onFile} disabled={status.kind === "busy"} className="text-sm" data-testid="csv-file-input" />
        </label>
        {status.kind === "busy" && <p role="status" className="text-xs text-muted-foreground">Checking the file…</p>}
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-red-600 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {status.message}
          </p>
        )}
        {status.kind === "ok" && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 flex gap-2" data-testid="csv-attached">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            {status.rows} rows attached · columns: {status.headers.join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
