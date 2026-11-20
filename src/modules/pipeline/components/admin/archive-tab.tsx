"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { AdminOrder } from "./types";


/**
 * Admin → Archive (PRD § 11 capability 06): completed orders stay retrievable,
 * including their production files, for repeat and event orders.
 */
export function ArchiveTab({ onDownload }: { onDownload: (order: AdminOrder) => void }) {
  const [archiveOrders, setArchiveOrders] = useState<AdminOrder[]>([]);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);

  // Load completed orders when the tab opens.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsArchiveLoading(true);
      try {
        const res = await fetch("/api/admin/archive");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setArchiveOrders(data.orders || []);
        }
      } catch (err) {
        console.warn("Failed to fetch archive:", err);
      } finally {
        if (!cancelled) setIsArchiveLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Completed Order Archive</CardTitle>
        <CardDescription className="text-xs">
          Completed jobs are moved into this permanent archive. Artwork and print packages remain fully retrievable for reorders and repeats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isArchiveLoading ? (
          <div className="py-8 text-center text-neutral-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-flame-600" />
            Loading archive...
          </div>
        ) : archiveOrders.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">No completed orders archived yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Order / Customer</th>
                  <th className="py-3 px-4">Completed Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Print Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {archiveOrders.map((ord) => (
                  <tr key={ord.order_number} className="hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">{ord.order_number}</div>
                      <div className="text-xs text-neutral-500">{ord.customer_name || ord.customer_email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-neutral-600">
                      {new Date(ord.updated_at || ord.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                      {formatINR(ord.total_cents)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(ord)}
                        className="h-7 text-xs"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Retrieve Files
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
