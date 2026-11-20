"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { TemplateManager } from "./template-manager";
import { OrdersTab } from "./admin/orders-tab";
import { UsersTab } from "./admin/users-tab";
import { ProductsTab } from "./admin/products-tab";
import { ReportsTab } from "./admin/reports-tab";
import { ArchiveTab } from "./admin/archive-tab";
import { OrderDetailPanel } from "./admin/order-detail-panel";
import type { AdminOrder, Feedback } from "./admin/types";
import { WorkflowDialog } from "./admin/workflow-dialog";
import type { WorkflowAction } from "@/modules/orders/order-workflow";
import { CheckCircle2, AlertCircle, BarChart3, Archive, Layers, Users, Settings, AlertTriangle, Ban, X } from "lucide-react";

/**
 * Admin production console (PRD § 03, § 11). This component holds the shared
 * pieces (admin guard, tab bar, feedback banner, the orders list and its filters,
 * stage changes and production downloads); every tab lives in ./admin/:
 *   orders-tab · users-tab · products-tab · reports-tab · archive-tab · order-detail-panel
 * plus ./template-manager for design templates. Every API it calls re-checks
 * the admin role on the server.
 */
export function ProductionDashboardView() {
  const router = useRouter();
  const { role, user, isLoading } = useAuth();

  // Which console tab is open. Each tab component loads its own data when it opens.
  const [activeTab, setActiveTab] = useState<"orders" | "users" | "products" | "templates" | "reports" | "archive">("orders");

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("ALL");
  const [selectedDivision, setSelectedDivision] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [changeRequestsOnly, setChangeRequestsOnly] = useState(false);

  // UI / Action Feedback
  const [feedbackMsg, setFeedbackMsg] = useState<Feedback | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrder | null>(null);

  // 1. Guard check: Only admins are permitted (PRD § 03, § 11)
  useEffect(() => {
    if (!isLoading && (!user || role !== "admin")) {
      // If user is visitor or non-admin customer, redirect to login
      router.replace("/login?redirect=/production");
    }
  }, [user, role, isLoading, router]);

  // Fetch Orders from Server-Side Admin API (Layer 2 Server Check)
  const ordersRequestRef = useRef(0);
  const fetchOrders = useCallback(async () => {
    // Ignore responses to older requests so a slow reply cannot overwrite newer filters.
    const requestId = ++ordersRequestRef.current;
    setIsOrdersLoading(true);
    setOrdersError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
      if (selectedStage !== "ALL") params.set("stage", selectedStage);
      if (selectedPaymentStatus !== "ALL") params.set("payment_status", selectedPaymentStatus);
      if (selectedDivision !== "ALL") params.set("product_type", selectedDivision);
      if (changeRequestsOnly) params.set("change_requested", "1");
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        setOrdersError("Forbidden: Administrator privileges required to access this endpoint.");
        setIsOrdersLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load orders (${res.status})`);
      }

      const data = await res.json();
      if (requestId !== ordersRequestRef.current) return;
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setOrdersError(err instanceof Error ? err.message : "Error loading orders");
    } finally {
      setIsOrdersLoading(false);
    }
  }, [searchQuery, selectedStage, selectedPaymentStatus, selectedDivision, dateFrom, dateTo, changeRequestsOnly, page]);

  useEffect(() => {
    if (role === "admin") {
      fetchOrders();
    }
  }, [role, fetchOrders]);

  // Workflow steps (PRD § 08, § 11) run through a confirmation dialog; see workflow-dialog.tsx.
  const [pendingAction, setPendingAction] = useState<{ order: AdminOrder; action: WorkflowAction } | null>(null);
  const openAction = (order: AdminOrder, action: WorkflowAction) => {
    setFeedbackMsg(null);
    setPendingAction({ order, action });
  };
  const finishAction = async (feedback: Feedback) => {
    setPendingAction(null);
    setSelectedOrderDetail(null);
    setFeedbackMsg(feedback);
    await fetchOrders();
  };

  // Download Production Files with Signed URL (PRD § 11, § 13)
  const handleDownloadProduction = async (order: AdminOrder) => {
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.order_number}/download-production`);
      const data = await res.json();

      if (!res.ok) {
        setFeedbackMsg({
          type: "error",
          text: data.reason || data.error || "Cannot download: Order not ready for production.",
        });
        return;
      }

      setFeedbackMsg({
        type: "success",
        text: `Signed 60-second production download URL generated for ${order.order_number}. Download logged in audit trail.`,
      });

      // Trigger download
      window.open(data.downloadUrl, "_blank");
    } catch (err: unknown) {
      setFeedbackMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Download request failed",
      });
    }
  };

  // If user is not admin, show access denied state
  if (!isLoading && (!user || role !== "admin")) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center" data-testid="admin-403-message">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <Ban className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
          403 — Administrator Access Required
        </h1>
        <p className="text-neutral-600 mb-6">
          The production shop-floor console requires an authenticated administrator session. You are currently logged in as a {role}.
        </p>
        <Link href="/login?redirect=/production">
          <Button className="bg-flame-500 hover:bg-flame-600 text-white">
            Sign in as Administrator
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-console">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500">
              PRD § 11 Internal Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            Production & Shop-Floor Console
          </h1>
          <p className="text-sm text-neutral-500">
            Internal manufacturing ERP: 6-stage sequential pipeline, proof gates, user administration, and reports.
          </p>
        </div>

        {/* Global Admin Tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200 overflow-x-auto max-w-full">
          <button
            onClick={() => {
              setActiveTab("orders");
              fetchOrders();
            }}
            data-testid="admin-orders-tab"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === "orders" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" />
            Orders & Pipeline ({totalOrders})
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
            }}
            data-testid="admin-users-tab"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === "users" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Users
          </button>
          <button
            onClick={() => {
              setActiveTab("products");
            }}
            data-testid="admin-products-tab"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === "products" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Settings className="w-3.5 h-3.5 inline mr-1" />
            Products & Tiers
          </button>
          <button
            onClick={() => {
              setActiveTab("templates");
            }}
            data-testid="admin-templates-tab"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === "templates" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Design Templates
          </button>
          <button
            onClick={() => {
              setActiveTab("reports");
            }}
            data-testid="admin-reports-tab"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === "reports" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
            Reports & Analytics
          </button>
          <button
            onClick={() => {
              setActiveTab("archive");
            }}
            data-testid="admin-archive-tab"
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === "archive" ? "bg-white text-neutral-900 shadow-sm font-semibold" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Archive className="w-3.5 h-3.5 inline mr-1" />
            Archive
          </button>
        </div>
      </div>

      {/* Global Toast / Feedback Banner */}
      {feedbackMsg && (
        <div
          data-testid={feedbackMsg.type === "conflict" ? "admin-conflict-toast" : "admin-feedback-toast"}
          className={`p-4 rounded-lg flex items-start gap-3 border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : feedbackMsg.type === "conflict"
              ? "bg-amber-50 border-amber-300 text-amber-900 font-medium"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : feedbackMsg.type === "conflict" ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm">{feedbackMsg.text}</div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: ORDERS & PIPELINE */}
      {activeTab === "orders" && (
        <OrdersTab
          orders={orders}
          totalOrders={totalOrders}
          page={page}
          totalPages={totalPages}
          isOrdersLoading={isOrdersLoading}
          ordersError={ordersError}
          searchQuery={searchQuery}
          selectedStage={selectedStage}
          selectedPaymentStatus={selectedPaymentStatus}
          selectedDivision={selectedDivision}
          setSearchQuery={setSearchQuery}
          setSelectedStage={setSelectedStage}
          setSelectedPaymentStatus={setSelectedPaymentStatus}
          setSelectedDivision={setSelectedDivision}
          setPage={setPage}
          fetchOrders={fetchOrders}
          changeRequestsOnly={changeRequestsOnly}
          setChangeRequestsOnly={setChangeRequestsOnly}
          onAction={openAction}
          onDownload={handleDownloadProduction}
          onOpenDetail={setSelectedOrderDetail}
        />
      )}

      {/* TAB 2: USERS MANAGEMENT (PRD § 03, § 11) */}
      {activeTab === "users" && <UsersTab onFeedback={setFeedbackMsg} />}

      {/* TAB 3: PRODUCTS & PRICING TIERS (PRD § 03, § 14) */}
      {activeTab === "products" && <ProductsTab onFeedback={setFeedbackMsg} />}

      {/* TAB 4: DESIGN TEMPLATES (PRD § 03, § 06) */}
      {activeTab === "templates" && <TemplateManager />}

      {/* TAB 5: REPORTS & ANALYTICS (PRD § 11 capability 05) */}

      {activeTab === "reports" && (
        <ReportsTab dateFrom={dateFrom} dateTo={dateTo} setDateFrom={setDateFrom} setDateTo={setDateTo} />
      )}

      {/* TAB 5: ARCHIVE VIEW (PRD § 11 Capability 04) */}
      {activeTab === "archive" && <ArchiveTab onDownload={handleDownloadProduction} />}

      {/* ORDER DETAIL MODAL (PRD § 11 Capability 02) */}
      {pendingAction && (
        <WorkflowDialog
          order={pendingAction.order}
          action={pendingAction.action}
          onClose={() => setPendingAction(null)}
          onDone={finishAction}
        />
      )}

      {selectedOrderDetail && (
        <OrderDetailPanel initialOrder={selectedOrderDetail} onClose={() => setSelectedOrderDetail(null)} onAction={openAction} />
      )}
    </div>
  );
}
