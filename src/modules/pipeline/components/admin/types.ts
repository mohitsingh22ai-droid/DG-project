import type { Order } from "@/types/database";
import type { ExtendedProduct } from "@/modules/catalog/catalog-store";
import type { ProofLogEntry } from "@/modules/proofs/proofs-store";

/**
 * Shapes the admin console receives from the /api/admin/* routes.
 * Type-only imports: nothing server-side is bundled into the browser.
 */

/** A message shown in the console's feedback banner (null clears it). */
export type Feedback = { type: "success" | "error" | "conflict"; text: string };
export type FeedbackHandler = (message: Feedback | null) => void;

/** An order row from GET /api/admin/orders (or /archive), with its production gate. */
export type AdminOrder = Order & {
  isReadyForProduction: boolean;
  notReadyReason: string | null;
};

/** The full record from GET /api/admin/orders/:id; the extra fields arrive after loading. */
export type AdminOrderDetail = AdminOrder & {
  proofApproved?: boolean;
  paymentConfirmed?: boolean;
  proofLog?: ProofLogEntry[];
  proof_version?: number;
};

/** An account from GET /api/admin/users (no secrets are returned). */
export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "customer" | "admin";
  company_name?: string | null;
  phone?: string | null;
  isActive: boolean;
  orderCount: number;
  created_at: string;
}

/** A product from GET /api/admin/products, including its GST settings. */
export type AdminProduct = ExtendedProduct & {
  gst_rate?: number;
  hsn_code?: string | null;
};

/** GET /api/admin/reports (see getAdminReportsData). Money values are paise. */
export interface AdminReports {
  currency: string;
  confirmedRevenueCents: number;
  confirmedRevenueFormatted: string;
  totalOrders: number;
  paidCount: number;
  pendingCount: number;
  cancelledCount: number;
  failedCount: number;
  stageCounts: Record<string, number>;
  divisionThroughput: Record<string, { count: number; totalQuantity: number; revenueCents: number }>;
}
