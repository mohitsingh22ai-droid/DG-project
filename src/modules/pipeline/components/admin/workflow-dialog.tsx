"use client";

import React, { useState } from "react";
import { ArrowRight, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MIN_NOTE_LENGTH, type WorkflowAction } from "@/modules/orders/order-workflow";
import { precheckArtwork } from "@/modules/designer/artwork-validation";
import type { AdminOrder, Feedback } from "./types";

/**
 * Confirmation dialog for every production-workflow action (PRD § 08, § 11).
 * Replaces one-click stage arrows: staff see what will happen, add the note the
 * action needs, and — for "Send revised proof" — can attach corrected artwork,
 * which is checked by the server before the new proof version is built from it.
 */
interface WorkflowDialogProps {
  order: AdminOrder;
  action: WorkflowAction;
  onClose: () => void;
  /** Called when the action completed (or the order changed meanwhile), with a message to show. */
  onDone: (feedback: Feedback) => void;
}

async function readJson(res: Response): Promise<{ error?: string; [key: string]: unknown }> {
  return res.json().catch(() => ({}));
}

export function WorkflowDialog({ order, action, onClose, onDone }: WorkflowDialogProps) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const noteOk = !action.noteRequired || note.trim().length >= MIN_NOTE_LENGTH;
  const isProof = action.kind === "proof";

  /** Uploads corrected artwork through the admin artwork endpoint (signed URL + server check). */
  const uploadArtwork = async (f: File) => {
    const problem = precheckArtwork(f.name, f.size);
    if (problem) throw new Error(problem);
    setBusy("Uploading corrected artwork…");
    const base = `/api/admin/orders/${encodeURIComponent(order.order_number)}/artwork`;
    const ticketRes = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: f.name, sizeBytes: f.size }),
    });
    const ticket = await readJson(ticketRes);
    if (!ticketRes.ok) throw new Error(ticket.error || "Could not start the upload.");
    const put = await fetch(String(ticket.signedUrl), {
      method: "PUT",
      headers: { "Content-Type": f.type || "application/octet-stream", "x-upsert": "true" },
      body: f,
    });
    if (!put.ok) throw new Error("The file could not be uploaded. Please try again.");
    setBusy("Checking the artwork…");
    const confirmRes = await fetch(base, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: ticket.path, fileName: f.name }),
    });
    const confirmed = await readJson(confirmRes);
    if (!confirmRes.ok) throw new Error(confirmed.error || "The artwork failed the pre-flight check.");
  };

  const submit = async () => {
    setError(null);
    try {
      if (isProof) {
        if (file) await uploadArtwork(file);
        setBusy("Creating the revised proof…");
        const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.order_number)}/proofs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: note.trim() }),
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not send the revised proof.");
        onDone({ type: "success", text: `Proof v${data.version} sent for ${order.order_number}. Production stays locked until the customer approves it.` });
        return;
      }

      setBusy("Updating the order…");
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.order_number)}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: action.target, expectedStage: order.pipeline_stage, notes: note.trim() || `${action.label} (admin console)` }),
      });
      const data = await readJson(res);
      if (res.status === 409) {
        onDone({ type: "conflict", text: `${order.order_number} was changed by someone else. The list has been refreshed; please check it and try again.` });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not update the order.");
      onDone({ type: "success", text: `${order.order_number}: ${action.label.toLowerCase()} done. The customer has been emailed.` });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="workflow-title">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4" data-testid="workflow-dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{order.order_number}</div>
            <h2 id="workflow-title" className="text-xl font-semibold text-neutral-900 mt-0.5">
              {action.label}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700" aria-label="Close" disabled={!!busy}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-md bg-neutral-100 px-2 py-1 text-neutral-700">{order.pipeline_stage}</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
          <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-800">{action.target}</span>
        </div>

        <p className="text-sm text-neutral-600 leading-relaxed">{action.description}</p>

        {order.change_request && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="text-xs font-semibold uppercase tracking-wide">Customer&apos;s change request</div>
            <p className="mt-1 whitespace-pre-wrap">{order.change_request}</p>
          </div>
        )}

        {isProof && (
          <label className="block rounded-lg border border-dashed border-neutral-300 p-3 text-sm cursor-pointer hover:border-brand-400">
            <span className="flex items-center gap-2 font-medium text-neutral-800">
              <UploadCloud className="w-4 h-4 text-brand-600" aria-hidden="true" />
              Corrected artwork (optional)
            </span>
            <span className="block text-xs text-neutral-500 mt-1">
              {file ? file.name : "PDF, SVG, AI, EPS or PNG. Leave empty to re-issue the proof from the current artwork."}
            </span>
            <input
              type="file"
              accept=".pdf,.svg,.ai,.png,.eps"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              data-testid="workflow-artwork-input"
            />
          </label>
        )}

        {(action.noteRequired || action.notePlaceholder) && (
          <div className="space-y-1">
            <label htmlFor="workflow-note" className="text-xs font-semibold text-neutral-700">
              {isProof ? "Message to the customer" : action.target === "COMPLETED" ? "Dispatch details" : "Note"}
              {action.noteRequired ? " (required)" : " (optional)"}
            </label>
            <textarea
              id="workflow-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={action.notePlaceholder}
              className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              data-testid="workflow-note"
            />
            {action.noteRequired && !noteOk && note.length > 0 && (
              <p className="text-xs text-amber-700">Please write at least {MIN_NOTE_LENGTH} characters.</p>
            )}
          </div>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={!!busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!!busy || !noteOk} data-testid="workflow-confirm">
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {busy}
              </span>
            ) : (
              action.label
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
