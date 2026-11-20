import { Order, PipelineStage } from "@/types/database";

/*
 * Pure order rules (no database access), shared by the API routes, the admin
 * console and the unit tests:
 *   - checkReadyForProduction   the production-file gate (PRD § 08, § 11)
 *   - validateStageTransition   which pipeline moves are allowed (PRD § 11)
 *   - checkStagePreconditions   business conditions for entering a stage
 */

/**
 * Ready-for-production gate: true only when payment is confirmed AND the customer
 * approved a proof for this order. Reaching a pipeline stage never implies approval.
 */
export function checkReadyForProduction(order: Order): {
  isReady: boolean;
  reason: string | null;
  proofApproved: boolean;
  paymentConfirmed: boolean;
} {
  const proofApproved = !!order.approved_proof_version && order.proof_status !== "changes_requested";
  const paymentConfirmed = order.payment_status === "paid";
  const isReady = proofApproved && paymentConfirmed;

  let reason: string | null = null;
  if (!isReady) {
    if (!proofApproved && !paymentConfirmed) reason = "Proof not approved and payment not confirmed";
    else if (!proofApproved) reason = "Proof pending customer approval";
    else reason = `Payment not confirmed (Status: ${order.payment_status})`;
  }
  return { isReady, reason, proofApproved, paymentConfirmed };
}

/**
 * Pipeline (PRD § 11): QUOTE → ORDER → ARTWORK → (PROOF) → PRODUCTION → COMPLETED.
 *
 * - QUOTE → ORDER happens when Stripe confirms payment.
 * - ARTWORK is the pre-press check. The proof was approved before payment, so a
 *   checked job goes ARTWORK → PRODUCTION; PROOF is used only when pre-press
 *   issues a revised proof (ARTWORK → PROOF → PRODUCTION, or back to ARTWORK).
 */
const PIPELINE_SEQUENCE: PipelineStage[] = ["QUOTE", "ORDER", "ARTWORK", "PROOF", "PRODUCTION", "COMPLETED"];
const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  QUOTE: ["ORDER"],
  ORDER: ["ARTWORK"],
  ARTWORK: ["PROOF", "PRODUCTION", "ORDER"],
  PROOF: ["PRODUCTION", "ARTWORK"],
  PRODUCTION: ["COMPLETED"],
  COMPLETED: [],
};

export function validateStageTransition(current: PipelineStage, target: PipelineStage): { valid: boolean; error?: string } {
  if (current === target) return { valid: true };
  if (!PIPELINE_SEQUENCE.includes(current) || !PIPELINE_SEQUENCE.includes(target)) {
    return { valid: false, error: `Invalid pipeline stage: ${target}` };
  }
  if (ALLOWED_TRANSITIONS[current].includes(target)) return { valid: true };

  if (PIPELINE_SEQUENCE.indexOf(target) > PIPELINE_SEQUENCE.indexOf(current)) {
    return {
      valid: false,
      error: `Stage skipping is not allowed. Cannot transition directly from ${current} to ${target}. Allowed next stages: ${ALLOWED_TRANSITIONS[current].join(", ") || "none"}.`,
    };
  }
  return {
    valid: false,
    error: `Illegal backward transition from ${current} to ${target}. Only PROOF -> ARTWORK and ARTWORK -> ORDER are permitted for pre-press revisions.`,
  };
}

/** Business preconditions for entering a stage (beyond the transition graph). */
export function checkStagePreconditions(order: Order, target: PipelineStage): string | null {
  if (target === "ORDER" && order.payment_status !== "paid") {
    return "An order only leaves QUOTE once Stripe has confirmed the payment.";
  }
  if (target === "PRODUCTION" || target === "COMPLETED") {
    const gate = checkReadyForProduction(order);
    if (!gate.isReady) return `Not ready for production: ${gate.reason}.`;
  }
  return null;
}

