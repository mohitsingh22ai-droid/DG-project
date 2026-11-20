"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Receipt, RotateCcw, PencilLine, X } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { Order } from "@/types/database";
import { STAGE_BADGE } from "@/modules/orders/order-workflow";
import { OrderTracker } from "./order-tracker";

/**
 * Customer → Order history (PRD § 08, § 09, § 10): every order with its status in
 * plain words, a GST invoice download, one-click reorder, and "Request changes"
 * on paid orders that have not gone to print yet.
 */
interface OrderHistoryTabProps {
  orders: Order[];
  /** Order number currently being reordered (its button shows progress). */
  reorderingOrder: string | null;
  handleReorder: (order: Order) => void;
  /** Reloads orders and proofs after a change request. */
  onOrdersChanged: () => void;
}

/** Changes can be requested on a paid order until it goes to print. */
function canRequestChanges(order: Order): boolean {
  return order.payment_status === "paid" && (order.pipeline_stage === "ORDER" || order.pipeline_stage === "ARTWORK") && !order.change_request;
}

export function OrderHistoryTab({ orders, reorderingOrder, handleReorder, onOrdersChanged }: OrderHistoryTabProps) {
  const [requestFor, setRequestFor] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sendChangeRequest = async () => {
    if (!requestFor) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(requestFor.order_number)}/change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send the change request.");
      setNotice(data.message || "Change request sent.");
      setRequestFor(null);
      setMessage("");
      onOrdersChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send the change request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading">Your orders</h2>
        
      </div>

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {requestFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="change-request-title">
          <div className="bg-card rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl" data-testid="change-request-dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-muted-foreground">{requestFor.order_number}</div>
                <h3 id="change-request-title" className="text-xl font-heading font-semibold text-brand-800">Request changes</h3>
              </div>
              <button onClick={() => setRequestFor(null)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close" disabled={sending}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Tell our pre-press team what to change. Printing is paused, and you will receive a revised proof to approve before anything is printed.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. Please change the event date to 14 March and make the logo larger."
              className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="change-request-message"
            />
            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestFor(null)} disabled={sending}>
                Cancel
              </Button>
              <Button variant="cta" onClick={sendChangeRequest} disabled={sending || message.trim().length < 5} data-testid="change-request-submit">
                {sending ? "Sending…" : "Send request"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-heading font-bold text-base text-foreground mb-1">No Orders Placed Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            Your orders, their progress and GST invoices will appear here once you place one.
          </p>
          <Button asChild size="sm" className="text-xs font-semibold bg-brand-500 hover:bg-brand-600">
            <Link href="/#divisions">Browse Products & Catalog</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {

            return (
              <Card key={ord.id} className="p-6 hover-lift">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-foreground">
                        {ord.order_number}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${STAGE_BADGE[ord.pipeline_stage] || ""}`}>
                        {ord.pipeline_stage}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-300">
                        {ord.payment_status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono space-y-0.5">
                      <div>Placed: {new Date(ord.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                      <div data-testid="order-shipping-address">
                        Shipping to: {ord.shipping_address?.line1}, {ord.shipping_address?.city}, {ord.shipping_address?.postal_code}, {ord.shipping_address?.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0">
                    <div className="text-right mr-2">
                      <span className="text-[10px] font-mono text-muted-foreground block">TOTAL (INC. GST)</span>
                      <span className="font-mono font-bold text-lg text-foreground">
                        {formatINR(ord.total_cents)}
                      </span>
                    </div>

                    {/* Downloadable Tax Invoice (§ 10 Module 6) */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(`/api/orders/${ord.order_number}/invoice`, "_blank");
                      }}
                      className="text-xs font-mono"
                      title="Download Xero-compliant GST invoice PDF"
                    >
                      <Receipt className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      Invoice PDF
                    </Button>

                    {/* Request changes before printing (PRD § 08) */}
                    {canRequestChanges(ord) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNotice(null);
                          setError(null);
                          setRequestFor(ord);
                        }}
                        className="text-xs"
                        data-testid="request-changes-button"
                      >
                        <PencilLine className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        Request changes
                      </Button>
                    )}

                    {/* 1-Click Reorder (§ 10 Module 5) */}
                    {ord.payment_status === "paid" && (
                      <Button
                        size="sm"
                        onClick={() => handleReorder(ord)}
                        disabled={reorderingOrder !== null}
                        className="font-semibold text-xs shadow-sm bg-brand-500 hover:bg-brand-600"
                        data-testid="reorder-button"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        {reorderingOrder === ord.order_number ? "Preparing…" : "1-Click Reorder"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Where the order is, like parcel tracking */}
                <div className="mt-5 pt-5 border-t border-border">
                  <OrderTracker order={ord} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
