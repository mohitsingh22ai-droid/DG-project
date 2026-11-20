"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { AdminOrder, AdminOrderDetail } from "./types";


/**
 * Admin order record (PRD § 08, § 11): customer and address, totals, the
 * production gate, every proof version with who approved it and when, and the
 * pipeline history. Opens instantly from the list row, then loads the full
 * record (including the proof log) from the server.
 */
interface OrderDetailPanelProps {
  /** The row clicked in the orders table. */
  initialOrder: AdminOrder;
  onClose: () => void;
  /** Called after the order changed here (e.g. a revised proof moved it to PROOF), so the list can refresh. */
  onOrderChanged?: () => void;
}

export function OrderDetailPanel({ initialOrder, onClose, onOrderChanged }: OrderDetailPanelProps) {
  const [order, setOrder] = useState<AdminOrderDetail>(initialOrder);
  const [isIssuingProof, setIsIssuingProof] = useState(false);
  const [proofMessage, setProofMessage] = useState<{ ok: boolean; text: string } | null>(null);

  /** Loads the full order record (proof log, gate) for the order shown. */
  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(initialOrder.order_number)}`);
      const data = res.ok ? await res.json() : null;
      if (data?.order) setOrder(data.order);
    } catch {
      // keep showing the list row if the detail call fails
    }
  }, [initialOrder.order_number]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  /**
   * Issues the next proof version (v+1) from the order's current artwork (PRD § 08).
   * The server moves the order ARTWORK → PROOF, withdraws the earlier approval
   * (production locks again) and emails the customer to review it.
   */
  const handleIssueRevisedProof = async () => {
    if (!window.confirm(`Issue a new proof version for ${order.order_number}? Production stays locked until the customer approves it.`)) return;
    setIsIssuingProof(true);
    setProofMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(order.order_number)}/proofs`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not issue the revised proof.");
      setProofMessage({ ok: true, text: `Proof v${data.version} issued. The order is now at PROOF and the customer has been emailed.` });
      await loadDetail();
      onOrderChanged?.();
    } catch (err: unknown) {
      setProofMessage({ ok: false, text: err instanceof Error ? err.message : "Could not issue the revised proof." });
    } finally {
      setIsIssuingProof(false);
    }
  };

  return (
    <div
      data-testid="admin-order-detail-modal"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF5A1F]">
              Order Record
            </span>
            <h3 className="text-xl font-extrabold text-neutral-900">
              {order.order_number}
            </h3>
          </div>
          <button
            onClick={() => onClose()}
            className="text-neutral-400 hover:text-neutral-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-4 text-sm">
          {/* Customer & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-lg">
            <div>
              <div className="text-xs font-semibold text-neutral-500">Customer</div>
              <div className="font-semibold text-neutral-900">{order.customer_name || "N/A"}</div>
              <div className="text-xs text-neutral-600">{order.customer_email}</div>
              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">ID: {order.customer_id}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500">Immutable Destination Snapshot</div>
              <div className="text-xs text-neutral-800 font-medium">
                {order.shipping_address?.name}
              </div>
              <div className="text-xs text-neutral-600">
                {order.shipping_address?.line1}
              </div>
              <div className="text-xs text-neutral-600">
                {order.shipping_address?.city}, {order.shipping_address?.postal_code}
              </div>
              <div className="text-xs text-neutral-500">{order.shipping_address?.country}</div>
            </div>
          </div>

          {/* Status & Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 border border-neutral-200 rounded-lg">
              <div className="text-[11px] text-neutral-500">Pipeline Stage</div>
              <div className="font-bold text-neutral-900 mt-0.5">{order.pipeline_stage}</div>
            </div>
            <div className="p-2.5 border border-neutral-200 rounded-lg">
              <div className="text-[11px] text-neutral-500">Payment Status</div>
              <div className="font-bold text-neutral-900 capitalize mt-0.5">{order.payment_status}</div>
            </div>
            <div className="p-2.5 border border-neutral-200 rounded-lg">
              <div className="text-[11px] text-neutral-500">Net / GST</div>
              <div className="font-bold text-neutral-900 mt-0.5">
                {formatINR(order.subtotal_cents)} / {formatINR(order.tax_cents)}
              </div>
            </div>
            <div className="p-2.5 border border-neutral-200 rounded-lg bg-neutral-50">
              <div className="text-[11px] text-neutral-500">Total Gross</div>
              <div className="font-bold text-neutral-900 mt-0.5">
                {formatINR(order.total_cents)}
              </div>
            </div>
          </div>

          {/* Proof Approval Log */}
          <div className="p-3 border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-neutral-700">Proof Approval Gate Status</span>
              <Badge className={order.isReadyForProduction ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                {order.isReadyForProduction ? "Ready for Production" : order.notReadyReason || "Locked"}
              </Badge>
            </div>
            <div className="text-xs text-neutral-600">
              Approved version:{" "}
              <span className="font-semibold">{order.approved_proof_version ? `v${order.approved_proof_version}` : "none yet"}</span>
            </div>
            {/* Revised proofs are issued while the order is at ARTWORK (e.g. after a change request). */}
            {order.pipeline_stage === "ARTWORK" && order.draft_id && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleIssueRevisedProof}
                  disabled={isIssuingProof}
                  data-testid="issue-revised-proof"
                >
                  {isIssuingProof ? "Issuing…" : "Issue revised proof"}
                </Button>
                <span className="text-[11px] text-neutral-500">Creates the next version from the current artwork and sends it to the customer.</span>
              </div>
            )}
            {proofMessage && (
              <div role={proofMessage.ok ? "status" : "alert"} className={`mt-2 text-xs ${proofMessage.ok ? "text-emerald-700" : "text-red-700"}`}>
                {proofMessage.text}
              </div>
            )}
            <div className="mt-2 space-y-1.5" data-testid="proof-log">
              {(order.proofLog || []).length === 0 && (
                <div className="text-xs text-neutral-500">No proofs issued yet.</div>
              )}
              {(order.proofLog || []).map((p) => (
                <div key={p.version} className="text-xs p-2 bg-neutral-50 rounded border border-neutral-200" data-testid="proof-log-entry">
                  <div className="flex items-center justify-between gap-2">
                    <a href={p.previewUrl} target="_blank" rel="noreferrer" className="font-semibold text-neutral-800 underline">v{p.version}</a>
                    <Badge className={p.status === "approved" ? "bg-emerald-100 text-emerald-800" : p.status === "pending_review" ? "bg-amber-100 text-amber-800" : p.status === "changes_requested" ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-600"}>
                      {String(p.status).replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">Issued {new Date(p.createdAt).toLocaleString("en-IN")}</div>
                  {p.approvedAt && (
                    <div className="text-[11px] text-emerald-700">Approved by {p.approvedByEmail || "unknown"} on {new Date(p.approvedAt).toLocaleString("en-IN")}</div>
                  )}
                  {p.feedback && <div className="text-[11px] text-red-700">Change request: {p.feedback}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Status History (PRD § 11) */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-600 mb-2">
              Pipeline Transition History
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {(order.status_history || []).map((h, i) => (
                <div key={i} className="text-xs flex items-center justify-between p-2 bg-neutral-50 rounded border border-neutral-200">
                  <div>
                    <span className="font-medium text-neutral-800">{h.from} → {h.to}</span>
                    {h.notes && <span className="text-neutral-500 ml-2">({h.notes})</span>}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} by {h.changed_by}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-200 flex justify-end">
          <Button variant="outline" onClick={() => onClose()}>
            Close Record
          </Button>
        </div>
      </div>
    </div>
  );
}
