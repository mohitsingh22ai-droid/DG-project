import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/server-auth";
import {
  getOrderById,
  updateOrderStageWithVersion,
  clearOrderApprovedProof,
  setOrderChangeRequest,
  logOrderNote,
} from "@/modules/orders/order-store";
import { safeSendNotificationEmail } from "@/modules/email/email-service";

/**
 * A customer asks for changes to a PAID order before printing starts (PRD § 08
 * "Change requests"). Allowed at ORDER or ARTWORK; at PROOF the customer answers
 * the proof itself, and from PRODUCTION on the job is already on the press.
 *
 * Effect: the earlier approval is withdrawn (production locks), the order goes to
 * ARTWORK, and the request appears in the admin console until pre-press sends a
 * revised proof for the customer to approve.
 */
const Schema = z.object({ message: z.string().trim().min(5, "Describe the change (at least 5 characters).").max(2000) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Describe the change." }, { status: 400 });
  }
  const message = parsed.data.message;

  const { id } = await params;
  const order = await getOrderById(id);
  // Only the order's owner may ask; other people's orders are reported as not found.
  if (!order || order.customer_id !== auth.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.payment_status !== "paid") {
    return NextResponse.json({ error: "Changes can be requested once the order is paid." }, { status: 409 });
  }
  if (order.pipeline_stage === "PROOF") {
    return NextResponse.json({ error: "A proof is waiting for you: approve it or request changes on the proof." }, { status: 409 });
  }
  if (order.pipeline_stage !== "ORDER" && order.pipeline_stage !== "ARTWORK") {
    return NextResponse.json({ error: "This order is already in production, so it can no longer be changed." }, { status: 409 });
  }
  if (order.change_request) {
    return NextResponse.json({ error: "You already have a change request open for this order." }, { status: 409 });
  }

  try {
    await clearOrderApprovedProof(order.id);
    await setOrderChangeRequest(order.id, message);
    const note = `Customer requested changes: ${message}`;
    if (order.pipeline_stage === "ORDER") {
      const moved = await updateOrderStageWithVersion(order.order_number, "ARTWORK", "ORDER", auth.user.email, note);
      if (!moved.success) {
        return NextResponse.json({ error: moved.error || "Could not update the order." }, { status: moved.conflict ? 409 : 400 });
      }
    } else {
      await logOrderNote(order.id, order.pipeline_stage, auth.user.email, note);
    }

    await safeSendNotificationEmail({
      to: order.customer_email || auth.user.email,
      recipientName: order.customer_name || auth.user.full_name || "Customer",
      event: "change_requested",
      orderId: order.id,
      orderNumber: order.order_number,
      version: order.approved_proof_version || 1,
      feedback: message,
    });

    return NextResponse.json({
      success: true,
      message: "Change request sent. Our pre-press team will send you a revised proof to approve.",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not send the change request." }, { status: 500 });
  }
}
