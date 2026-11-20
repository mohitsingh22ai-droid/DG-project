"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { AdminReports } from "./types";


/**
 * Admin → Reports & analytics (PRD § 11 capability 05): order totals, confirmed
 * revenue (paid orders only) and throughput per product family, plus the
 * Xero-ready accounting export for the same date range (PRD § 05, § 14).
 */
interface ReportsTabProps {
  dateFrom: string;
  dateTo: string;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
}

export function ReportsTab({ dateFrom, dateTo, setDateFrom, setDateTo }: ReportsTabProps) {
  const [reportsData, setReportsData] = useState<AdminReports | null>(null);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  const fetchReports = async () => {
    setIsReportsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        setReportsData(await res.json());
      }
    } catch (err) {
      console.warn("Failed to fetch reports:", err);
    } finally {
      setIsReportsLoading(false);
    }
  };

  // Load once when the tab opens; afterwards the admin refreshes after changing dates.
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Business Analytics & Aggregates</CardTitle>
              <CardDescription className="text-xs">
                Revenue computed strictly from confirmed payments (&apos;paid&apos;). Pending and cancelled orders are excluded.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <span className="text-xs text-neutral-400">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <Button asChild size="sm" variant="outline" className="h-8 text-xs" data-testid="xero-export-csv">
                <a href={`/api/admin/accounting/export?format=csv${dateFrom ? `&from=${dateFrom}` : ""}${dateTo ? `&to=${dateTo}` : ""}`}>Xero CSV</a>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <a href={`/api/admin/accounting/export?format=json${dateFrom ? `&from=${dateFrom}` : ""}${dateTo ? `&to=${dateTo}` : ""}`}>Xero JSON</a>
              </Button>
              <Button size="sm" onClick={() => fetchReports()} variant="outline" className="h-8 px-2 text-xs">
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isReportsLoading ? (
            <div className="py-8 text-center text-neutral-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-flame-600" />
              Aggregating SQL data...
            </div>
          ) : reportsData ? (
            <div className="space-y-6">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Confirmed Revenue
                  </div>
                  <div className="text-2xl font-bold text-emerald-900 mt-1" data-testid="admin-reports-revenue">
                    {reportsData.confirmedRevenueFormatted}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {reportsData.paidCount} confirmed orders
                  </div>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Total Orders
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mt-1" data-testid="admin-reports-orders-count">
                    {reportsData.totalOrders}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    {reportsData.pendingCount} pending / {reportsData.cancelledCount} cancelled
                  </div>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl">
                  <div className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    Active Production
                  </div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {reportsData.stageCounts?.PRODUCTION || 0}
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5">
                    In manufacturing queue
                  </div>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Completed Jobs
                  </div>
                  <div className="text-2xl font-bold text-amber-900 mt-1">
                    {reportsData.stageCounts?.COMPLETED || 0}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    Dispatched & archived
                  </div>
                </div>
              </div>

              {/* Throughput by Division Table */}
              <div>
                <h4 className="text-sm font-bold text-neutral-900 mb-3">
                  Throughput & Volume by Manufacturing Division
                </h4>
                <div className="border border-neutral-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-600 border-b border-neutral-200">
                      <tr>
                        <th className="py-2.5 px-4">Division</th>
                        <th className="py-2.5 px-4 text-center">Jobs Placed</th>
                        <th className="py-2.5 px-4 text-center">Total Quantity</th>
                        <th className="py-2.5 px-4 text-right">Confirmed Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {Object.entries(reportsData.divisionThroughput || {}).map(([divSlug, metrics]) => (
                        <tr key={divSlug} className="hover:bg-neutral-50/50">
                          <td className="py-2.5 px-4 font-medium text-neutral-800 capitalize">
                            {divSlug.replace(/-/g, " ")}
                          </td>
                          <td className="py-2.5 px-4 text-center text-neutral-600">{metrics.count}</td>
                          <td className="py-2.5 px-4 text-center font-semibold text-neutral-800">
                            {metrics.totalQuantity} units
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-neutral-900">
                            {formatINR(metrics.revenueCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
