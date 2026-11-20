"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Download, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, Eye, PackageCheck } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { PipelineStage } from "@/types/database";
import type { AdminOrder } from "./types";


/**
 * Admin → Orders & pipeline (PRD § 11): the searchable job database with filters
 * (status, payment, product family, free text), the ready-for-production
 * indicator, stage controls and production-file download per order.
 * State and data loading live in the parent console; this component renders it.
 */
export interface OrdersTabProps {
  orders: AdminOrder[];
  totalOrders: number;
  page: number;
  totalPages: number;
  isOrdersLoading: boolean;
  ordersError: string | null;
  searchQuery: string;
  selectedStage: string;
  selectedPaymentStatus: string;
  selectedDivision: string;
  setSearchQuery: (value: string) => void;
  setSelectedStage: (value: string) => void;
  setSelectedPaymentStatus: (value: string) => void;
  setSelectedDivision: (value: string) => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  fetchOrders: () => void;
  onUpdateStage: (order: AdminOrder, stage: PipelineStage) => void;
  onDownload: (order: AdminOrder) => void;
  onOpenDetail: (order: AdminOrder) => void;
}

export function OrdersTab({
  orders,
  totalOrders,
  page,
  totalPages,
  isOrdersLoading,
  ordersError,
  searchQuery,
  selectedStage,
  selectedPaymentStatus,
  selectedDivision,
  setSearchQuery,
  setSelectedStage,
  setSelectedPaymentStatus,
  setSelectedDivision,
  setPage,
  fetchOrders,
  onUpdateStage,
  onDownload,
  onOpenDetail,
}: OrdersTabProps) {

  return (
    <div className="space-y-6">
      {/* Combinable Filters & Search (PRD § 11 Capability 01) */}
      <Card className="border-neutral-200 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search query */}
            <div className="lg:col-span-2">
              <Label htmlFor="admin-search" className="text-xs font-semibold text-neutral-600 mb-1 block">
                Search Order # / Customer / Email
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                <Input
                  id="admin-search"
                  data-testid="admin-search-input"
                  placeholder="e.g. DH-2026-00101, Customer name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            {/* Stage Filter */}
            <div>
              <Label htmlFor="stage-filter" className="text-xs font-semibold text-neutral-600 mb-1 block">
                Pipeline Stage
              </Label>
              <select
                id="stage-filter"
                data-testid="admin-stage-filter"
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="ALL">All Stages</option>
                <option value="QUOTE">QUOTE</option>
                <option value="ORDER">ORDER</option>
                <option value="ARTWORK">ARTWORK</option>
                <option value="PROOF">PROOF</option>
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <Label htmlFor="payment-filter" className="text-xs font-semibold text-neutral-600 mb-1 block">
                Payment Status
              </Label>
              <select
                id="payment-filter"
                data-testid="admin-payment-filter"
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="ALL">All Payments</option>
                <option value="paid">Paid (Confirmed)</option>
                <option value="pending">Pending Payment</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Division Filter */}
            <div>
              <Label htmlFor="division-filter" className="text-xs font-semibold text-neutral-600 mb-1 block">
                Division
              </Label>
              <select
                id="division-filter"
                data-testid="admin-division-filter"
                value={selectedDivision}
                onChange={(e) => {
                  setSelectedDivision(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="ALL">All Divisions</option>
                <option value="labels-stickers">Labels & Stickers</option>
                <option value="race-event-numbers">Race & Event Numbers</option>
                <option value="mtb-boards">MTB Boards</option>
                <option value="stamps">Stamps</option>
                <option value="trophies">Trophies & Awards</option>
                <option value="laser-cut">Laser-Cut Work</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table & State Handling */}
      {isOrdersLoading ? (
        <div className="py-12 text-center text-neutral-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF5A1F]" />
          Loading persistent orders from database...
        </div>
      ) : ordersError ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center text-red-800">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="font-semibold">{ordersError}</p>
          <Button onClick={() => fetchOrders()} className="mt-3" variant="outline">
            Retry Query
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-xl">
          <PackageCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900">No matching orders found</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Try adjusting your search query, status filters, or date range.
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-600 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order / Customer</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Ready Gate</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orders.map((ord) => {
                  const addr = ord.shipping_address || {};
                  const nextStageMap: Record<PipelineStage, PipelineStage | null> = {
                    QUOTE: "ORDER",
                    ORDER: "ARTWORK",
                    ARTWORK: "PROOF",
                    PROOF: "PRODUCTION",
                    PRODUCTION: "COMPLETED",
                    COMPLETED: null,
                  };
                  const nextStage = nextStageMap[ord.pipeline_stage as PipelineStage];

                  return (
                    <tr
                      key={ord.order_number}
                      data-testid="admin-order-row"
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Order / Customer */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-neutral-900" data-testid="admin-order-number">
                          {ord.order_number}
                        </div>
                        <div className="text-xs text-neutral-600" data-testid="admin-customer-name">
                          {ord.customer_name || ord.customer_email}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {new Date(ord.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Shipping Destination */}
                      <td className="py-4 px-4 text-xs" data-testid="admin-shipping-address">
                        <div className="font-medium text-neutral-800">{addr.name}</div>
                        <div className="text-neutral-500">{addr.line1}</div>
                        <div className="text-neutral-500">
                          {addr.city}, {addr.postal_code}
                        </div>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-4 px-4">
                        <Badge
                          className={`text-[11px] font-semibold tracking-wide ${
                            ord.pipeline_stage === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                              : ord.pipeline_stage === "PRODUCTION"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : "bg-neutral-100 text-neutral-800 hover:bg-neutral-100"
                          }`}
                        >
                          {ord.pipeline_stage}
                        </Badge>
                      </td>

                      {/* Payment Status */}
                      <td className="py-4 px-4">
                        <Badge
                          className={`text-[11px] font-semibold ${
                            ord.payment_status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : ord.payment_status === "cancelled"
                              ? "bg-neutral-100 text-neutral-500"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ord.payment_status}
                        </Badge>
                      </td>

                      {/* Ready for Production Indicator (PRD § 11, § 08) */}
                      <td className="py-4 px-4">
                        <div
                          data-testid="admin-ready-indicator"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            ord.isReadyForProduction
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}
                        >
                          {ord.isReadyForProduction ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Ready
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span className="truncate max-w-[130px]" title={ord.notReadyReason || "Not ready"}>
                                {ord.notReadyReason ? "Locked" : "Not ready"}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Total Gross */}
                      <td className="py-4 px-4 text-right font-semibold text-neutral-900" data-testid="admin-order-total">
                        {formatINR(ord.total_cents)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Order Detail Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid="admin-order-detail-btn"
                            onClick={() => onOpenDetail(ord)}
                            className="h-8 px-2 text-xs"
                            title="View Order Detail & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {/* Advance Stage Button (Forward 1 step) */}
                          {nextStage && (
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid="admin-advance-stage-btn"
                              onClick={() => onUpdateStage(ord, nextStage)}
                              className="h-8 px-2 text-xs bg-neutral-50 hover:bg-neutral-100"
                              title={`Advance to ${nextStage}`}
                            >
                              <ArrowRight className="w-3.5 h-3.5 mr-1" />
                              {nextStage}
                            </Button>
                          )}

                          {/* Download Production Button (Protected by Ready Gate) */}
                          <Button
                            size="sm"
                            data-testid="admin-download-btn"
                            onClick={() => onDownload(ord)}
                            disabled={!ord.isReadyForProduction}
                            className={`h-8 px-2 text-xs text-white ${
                              ord.isReadyForProduction
                                ? "bg-[#FF5A1F] hover:bg-[#E0480F]"
                                : "bg-neutral-300 cursor-not-allowed text-neutral-500"
                            }`}
                            title={ord.isReadyForProduction ? "Download 300 DPI Production Package" : ord.notReadyReason || "Locked"}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Files
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-3 px-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
              <div>
                Page {page} of {totalPages} ({totalOrders} total orders)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
