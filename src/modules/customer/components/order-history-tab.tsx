"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Receipt, RotateCcw } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { Order } from "@/types/database";

/**
 * Customer → Order history (PRD § 09, § 10): every order with its pipeline status,
 * a GST invoice download and one-click reorder from the approved artwork.
 */
interface OrderHistoryTabProps {
  orders: Order[];
  /** Order number currently being reordered (its button shows progress). */
  reorderingOrder: string | null;
  handleReorder: (order: Order) => void;
}

export function OrderHistoryTab({ orders, reorderingOrder, handleReorder }: OrderHistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading">Past Orders & Production Pipeline Status</h2>
        <span className="text-xs font-mono text-muted-foreground">
          Instant 1-Click re-ordering from approved artwork
        </span>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-heading font-bold text-base text-foreground mb-1">No Orders Placed Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            Custom print jobs, manufacturing status updates, and downloadable GST tax invoices will appear here once you place an order.
          </p>
          <Button asChild size="sm" className="text-xs font-semibold bg-brand-500 hover:bg-brand-600">
            <Link href="/#divisions">Browse Products & Catalog</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const stageColors: Record<string, string> = {
              QUOTE: "bg-gray-100 text-gray-800",
              ORDER: "bg-blue-100 text-blue-800",
              ARTWORK: "bg-purple-100 text-purple-800",
              PROOF: "bg-amber-100 text-amber-800 font-semibold",
              PRODUCTION: "bg-orange-100 text-orange-800 font-semibold",
              COMPLETED: "bg-emerald-100 text-emerald-800 font-semibold",
            };

            return (
              <Card key={ord.id} className="p-6 hover-lift">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-foreground">
                        {ord.order_number}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono ${stageColors[ord.pipeline_stage] || ""}`}>
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
