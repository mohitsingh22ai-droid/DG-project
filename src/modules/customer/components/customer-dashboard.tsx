"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Order, Proof, SavedDesign } from "@/types/database";
import { ProofReviewDialog } from "@/modules/proofs/components/proof-review-dialog";
import { OrderHistoryTab } from "./order-history-tab";
import { ProofsTab } from "./proofs-tab";
import { SavedDesignsTab } from "./saved-designs-tab";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, ShoppingBag, FileCheck, BookmarkCheck, CheckCircle2, Building, Mail, Phone } from "lucide-react";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Signed-in customer dashboard (PRD § 09, § 10). This component owns the data
 * (orders, proofs, saved designs) and the actions (reorder, approve, request
 * changes); each tab is a presentational component in this folder:
 *   order-history-tab · proofs-tab · saved-designs-tab
 * A customer only ever sees their own records; the API enforces it by session.
 */
export function CustomerDashboardView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null);
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "proofs" | "designs" | "profile">("orders");
  const [selectedProofForReview, setSelectedProofForReview] = useState<Proof | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || role === "visitor")) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [user, role, isLoading, router, searchParams]);

  // Authoritative server-side customer data retrieval via session cookie (PRD § 03, § 10)
  const fetchCustomerData = async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const [ordersRes, proofsRes, designsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/proofs"),
        fetch("/api/designs"),
      ]);

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.orders || []);
      }
      if (proofsRes.ok) {
        const pData = await proofsRes.json();
        setProofs(pData.proofs || []);
      }
      if (designsRes.ok) {
        const dData = await designsRes.json();
        setSavedDesigns(dData.designs || []);
      }
    } catch (err) {
      console.warn("Error loading customer data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    // Staff have no customer orders; the shared APIs would return every customer's
    // records to an admin, so the customer dashboard never loads them for one.
    if (user && role !== "admin") {
      fetchCustomerData();
    }
  }, [user, role]);

  // Returning from Stripe Checkout: confirm the payment with the server (which asks
  // Stripe directly), then refresh the order list.
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (searchParams.get("checkout") !== "success" || !sessionId || !user) return;
    fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.orderNumber) setCheckoutSuccessOrder(data.orderNumber);
        fetchCustomerData();
      })
      .catch(() => fetchCustomerData());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per return from Stripe
  }, [searchParams, user]);

  // One-click reorder (§ 09, § 10): the server copies the approved artwork into a
  // new job that already carries the approved proof, then we go straight to checkout.
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [reorderingOrder, setReorderingOrder] = useState<string | null>(null);
  const handleReorder = async (order: Order) => {
    setReorderError(null);
    setReorderingOrder(order.order_number);
    try {
      const res = await fetch(`/api/orders/${order.order_number}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reorder failed");
      router.push(data.checkoutUrl);
    } catch (err) {
      setReorderError(err instanceof Error ? err.message : "Reorder failed");
      setReorderingOrder(null);
    }
  };

  // Handle proof approval (§ 08)
  const handleApproveProof = async (proofId: string) => {
    const targetProof = proofs.find((p) => p.id === proofId);
    if (!targetProof) return;

    try {
      // Proofs of unpaid jobs are approved on the job draft; revised proofs of paid orders on the order.
      const isDraftProof = UUID_PATTERN.test(targetProof.order_id);
      const res = isDraftProof
        ? await fetch(`/api/drafts/${targetProof.order_id}/approve-proof`, { method: "POST" })
        : await fetch(`/api/proofs/${proofId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: targetProof.order_id, version: targetProof.version_number }),
          });

      if (res.ok) {
        setProofs((prev) =>
          prev.map((p) =>
            p.id === proofId
              ? {
                  ...p,
                  status: "approved",
                  approved_by: user?.email || user?.id,
                  approved_at: new Date().toISOString(),
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to approve proof:", err);
    }
  };

  // Handle proof revision request (§ 08)
  const handleRequestProofChanges = async (proofId: string, feedback: string) => {
    const targetProof = proofs.find((p) => p.id === proofId);
    if (!targetProof) return;

    try {
      const isDraftProof = UUID_PATTERN.test(targetProof.order_id);
      const res = isDraftProof
        ? await fetch(`/api/drafts/${targetProof.order_id}/request-changes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedback }),
          })
        : await fetch(`/api/proofs/${proofId}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: targetProof.order_id, currentVersion: targetProof.version_number, feedback }),
          });

      if (res.ok) {
        setProofs((prev) =>
          prev.map((p) =>
            p.id === proofId
              ? {
                  ...p,
                  status: "changes_requested",
                  customer_feedback: feedback,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to request changes:", err);
    }
  };

  if (!user || role === "visitor") {
    return (
      <div className="p-8 text-center max-w-lg mx-auto space-y-4 border rounded-2xl bg-card my-16 shadow-elevation">
        <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-600 flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-600 text-xs font-medium">
          Your account
        </span>
        <h2 className="text-2xl font-bold font-heading">Sign in to see your orders</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Track your orders, approve proofs and reorder in one click.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="w-full sm:w-auto font-semibold text-xs">
            <Link href="/login">Sign In to Your Account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto text-xs font-mono">
            <Link href="/signup">Create New Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl border bg-card text-center space-y-4" data-testid="dashboard-admin-notice">
        <h2 className="text-2xl font-bold font-heading">This is the customer area</h2>
        <p className="text-sm text-muted-foreground">
          You are signed in as staff. Orders, proofs and change requests from all customers are in the production console.
        </p>
        <Button asChild>
          <Link href="/production">Open the production console</Link>
        </Button>
      </div>
    );
  }

  const pendingProofsCount = proofs.filter((p) => p.status === "pending_review").length;

  return (
    <div className="space-y-8 pb-16">
      {/* Checkout Success Notification */}
      {checkoutSuccessOrder && (
        <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-sm flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-base font-heading">
              Thank you! Order {checkoutSuccessOrder} is confirmed
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              Your payment went through and our team will check your artwork next. Your GST invoice is ready below.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner / Account Profile Status (§ 10 Module 1) */}
      <div className="p-6 rounded-xl bg-card border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xl border border-brand-500/20">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold font-heading text-foreground">
                {user?.full_name || "Customer Account"}
              </h1>
              <Badge variant="success" className="text-[10px]">
                Active Account
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-brand-500" />
                {user?.company_name || <span className="text-muted-foreground/60 italic">Individual Account</span>}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {user?.phone ? user.phone : <span className="text-muted-foreground/60 italic">Add phone</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Summary Pill - authoritatively computed from user's rows */}
        <div className="flex items-center gap-3 bg-secondary/50 p-2.5 rounded-lg border text-xs font-mono">
          <div>
            <span className="text-muted-foreground block text-[10px]">ORDERS</span>
            <span className="font-bold text-foreground">{orders.length} Total</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <span className="text-muted-foreground block text-[10px]">PENDING PROOFS</span>
            <span className="font-bold text-brand-500">
              {pendingProofsCount} Awaiting
            </span>
          </div>
        </div>
      </div>

      {reorderSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{reorderSuccess}</span>
        </div>
      )}

      {reorderError && (
        <div role="alert" className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {reorderError}
        </div>
      )}

      {isLoadingData && (
        <div role="status" className="text-sm text-muted-foreground flex items-center gap-2" data-testid="dashboard-loading">
          <span className="w-3 h-3 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" aria-hidden="true" />
          Loading your orders, proofs and designs…
        </div>
      )}

      {/* Navigation Tabs (§ 10 modules) */}
      <div className="flex gap-2 border-b border-border pb-2 text-sm font-semibold overflow-x-auto -mx-1 px-1" role="tablist">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "orders"
              ? "bg-industrial-950 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order History & 1-Click Reorder</span>
          <Badge variant="outline" className="ml-1 text-[10px]">{orders.length}</Badge>
        </button>

        <button
          onClick={() => setActiveTab("proofs")}
          className={`px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "proofs"
              ? "bg-industrial-950 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Active Proofs & Approvals</span>
          <Badge variant={pendingProofsCount > 0 ? "destructive" : "outline"} className="ml-1 text-[10px]">
            {pendingProofsCount}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("designs")}
          className={`px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "designs"
              ? "bg-industrial-950 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Saved Designs</span>
          <Badge variant="outline" className="ml-1 text-[10px]">{savedDesigns.length}</Badge>
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY & 1-CLICK REORDER (§ 10 Module 2 & 5) */}
      {activeTab === "orders" && (
        <OrderHistoryTab orders={orders} reorderingOrder={reorderingOrder} handleReorder={handleReorder} onOrdersChanged={fetchCustomerData} />
      )}

      {/* TAB 2: ACTIVE PROOFS & VERSION CONTROL (§ 10 Module 4 & § 08) */}
      {activeTab === "proofs" && <ProofsTab proofs={proofs} setSelectedProofForReview={setSelectedProofForReview} />}

      {/* TAB 3: SAVED DESIGNS & REUSE (§ 10 Module 3 & § 09) */}
      {activeTab === "designs" && <SavedDesignsTab savedDesigns={savedDesigns} />}

      {/* PROOF REVIEW & APPROVAL DIALOG (§ 08) */}
      {selectedProofForReview && (
        <ProofReviewDialog
          proof={{
            id: selectedProofForReview.id,
            orderId: selectedProofForReview.order_id,
            orderItemId: selectedProofForReview.order_item_id,
            version: selectedProofForReview.version_number,
            status: selectedProofForReview.status,
            previewUrl: selectedProofForReview.watermarked_preview_url,
            customerFeedback: selectedProofForReview.customer_feedback,
            approvedBy: selectedProofForReview.approved_by,
            approvedAt: selectedProofForReview.approved_at,
            createdAt: selectedProofForReview.created_at,
            // The job's real size and material (absent for very old proofs).
            metadata: {
              version: selectedProofForReview.version_number,
              widthMm: selectedProofForReview.spec?.widthMm,
              heightMm: selectedProofForReview.spec?.heightMm,
              materialName: selectedProofForReview.spec?.materialName,
              bleedMm: selectedProofForReview.spec?.bleedMm,
              productName: selectedProofForReview.spec?.productName,
              orderNumber: selectedProofForReview.order_id,
              createdAt: selectedProofForReview.created_at,
            },
          }}
          customerEmail={user?.email || "customer@example.com"}
          onApprove={(id) => {
            handleApproveProof(id);
            setReorderSuccess(`Proof v${selectedProofForReview.version_number} formally APPROVED. Production files are now unlocked!`);
            setTimeout(() => setReorderSuccess(null), 5000);
          }}
          onRequestChanges={(id, feedback) => {
            handleRequestProofChanges(id, feedback);
            setReorderSuccess(`Revision request logged: "${feedback}". Pre-press operator notified.`);
            setTimeout(() => setReorderSuccess(null), 5000);
          }}
          onClose={() => setSelectedProofForReview(null)}
          // Unpaid job (its "order id" is still the job id): the customer edits it in the designer.
          editDesignHref={
            UUID_PATTERN.test(selectedProofForReview.order_id) && selectedProofForReview.spec?.productSlug
              ? `/designer/${selectedProofForReview.spec.productSlug}?draft=${selectedProofForReview.order_id}`
              : undefined
          }
        />
      )}
    </div>
  );
}
