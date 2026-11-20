import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { getOrderById, updateOrderStageWithVersion, validateStageTransition } from "@/modules/orders/order-store";
import { checkManualStageChange } from "@/modules/orders/order-workflow";
import { logAdminAction } from "@/modules/audit/audit-store";
import { PipelineStage } from "@/types/database";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { stage, expectedStage, notes } = body;

    if (!stage) {
      return NextResponse.json({ error: "Target stage is required." }, { status: 400 });
    }

    // Workflow rules (PRD § 08, § 11), checked in this order: stale data, the stage
    // graph, then what staff may do by hand (see order-workflow.ts).
    const current = await getOrderById(id);
    if (!current) {
      return NextResponse.json({ error: `Order '${id}' not found.` }, { status: 404 });
    }
    if (expectedStage && current.pipeline_stage !== expectedStage) {
      return NextResponse.json(
        {
          error: `Stale order stage conflict. Expected '${expectedStage}' but current stage is '${current.pipeline_stage}'. Please refresh.`,
          conflict: true,
          currentStage: current.pipeline_stage,
        },
        { status: 409 }
      );
    }
    const transition = validateStageTransition(current.pipeline_stage, stage as PipelineStage);
    if (!transition.valid) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }
    const manualRule = checkManualStageChange(current.pipeline_stage, stage as PipelineStage, typeof notes === "string" ? notes : undefined, {
      changeRequested: !!current.change_request,
    });
    if (manualRule) {
      return NextResponse.json({ error: manualRule }, { status: 400 });
    }

    const result = await updateOrderStageWithVersion(
      id,
      stage as PipelineStage,
      expectedStage as PipelineStage | undefined,
      auth.user!.email,
      typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
      // Dispatch details are shared with the customer in the completion email.
      stage === "COMPLETED" && typeof notes === "string" ? notes.trim() : undefined
    );

    if (result.conflict) {
      return NextResponse.json(
        {
          error: result.error,
          conflict: true,
          currentStage: result.order?.pipeline_stage,
        },
        { status: 409 }
      );
    }

    if (!result.success || !result.order) {
      return NextResponse.json({ error: result.error || "Stage update failed" }, { status: 400 });
    }

    // Log admin audit
    await logAdminAction(
      auth.user!.id,
      auth.user!.email,
      "pipeline_stage_change",
      "order",
      result.order.order_number,
      {
        from: result.fromStage,
        to: stage,
        notes,
      }
    );

    return NextResponse.json({
      success: true,
      order: result.order,
      emailSent: result.emailSent,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update stage";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
