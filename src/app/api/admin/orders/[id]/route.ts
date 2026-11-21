import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { getOrderById, checkReadyForProduction } from "@/modules/orders/order-store";
import { getProofLogForDraft } from "@/modules/proofs/proofs-store";
import { resolveStoredUrl } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: `Order '${id}' not found` }, { status: 404 });
    }

    const gate = checkReadyForProduction(order);
    // Proof previews are private files: give the console short-lived links it can open.
    const rawLog = order.draft_id ? await getProofLogForDraft(order.draft_id) : [];
    const proofLog = await Promise.all(rawLog.map(async (p) => ({ ...p, previewUrl: await resolveStoredUrl(p.previewUrl) })));

    return NextResponse.json({
      order: {
        ...order,
        isReadyForProduction: gate.isReady,
        notReadyReason: gate.reason,
        proofApproved: gate.proofApproved,
        paymentConfirmed: gate.paymentConfirmed,
        proofLog,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load order detail";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}