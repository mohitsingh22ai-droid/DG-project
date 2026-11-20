import type { Order, PipelineStage } from "@/types/database";
import { checkReadyForProduction } from "./order-rules";

/*
 * Production workflow (PRD § 08, § 11): what staff can do with an order at each
 * stage. Pure (no database access), so the admin console and the API apply the
 * same rules.
 *
 *   QUOTE       checkout started, not paid            → moves to ORDER only when Stripe confirms payment
 *   ORDER       paid, proof approved before payment   → "Start pre-press check"            → ARTWORK
 *   ARTWORK     pre-press checks the files            → "Release to production"          → PRODUCTION (needs an approved proof)
 *                                                     → "Send revised proof"             → PROOF (new version; customer must approve)
 *                                                     → "Return to order intake" (note)  → ORDER
 *   PROOF       waiting for the customer               → customer approves → PRODUCTION; requests changes → ARTWORK
 *                                                     → "Withdraw proof" (note)          → ARTWORK
 *   PRODUCTION  printing                              → "Mark completed" (dispatch note) → COMPLETED
 *   COMPLETED   archived
 *
 * PROOF can only be entered by sending a proof, and QUOTE → ORDER only by payment,
 * so the manual stage endpoint refuses both.
 */

export type WorkflowActionId = "start_prepress" | "release_production" | "send_revised_proof" | "return_to_intake" | "withdraw_proof" | "mark_completed";

export interface WorkflowAction {
  id: WorkflowActionId;
  label: string;
  /** Stage the order moves to. */
  target: PipelineStage;
  /** "proof" actions go through the revised-proof flow, "stage" actions through a stage change. */
  kind: "stage" | "proof";
  /** Main next step (shown as the primary button). */
  primary: boolean;
  /** Explanation shown in the confirmation dialog. */
  description: string;
  /** A note is required (shown in the order history and, for completion, emailed to the customer). */
  noteRequired: boolean;
  notePlaceholder?: string;
  /** Set when the action exists but is not allowed right now. */
  disabledReason?: string;
}

/** What the order is waiting for, in plain words (shown when there is no staff action). */
export function waitingFor(order: Pick<Order, "pipeline_stage" | "payment_status">): string | null {
  if (order.pipeline_stage === "QUOTE") return order.payment_status === "cancelled" ? "Checkout cancelled" : "Awaiting payment";
  if (order.pipeline_stage === "PROOF") return "Awaiting customer approval";
  if (order.pipeline_stage === "COMPLETED") return "Completed";
  return null;
}

/** Actions available to staff for an order. The first primary action is the recommended next step. */
export function workflowActions(order: Order): WorkflowAction[] {
  const gate = checkReadyForProduction(order);
  const changeRequested = !!order.change_request;

  switch (order.pipeline_stage) {
    case "ORDER":
      return [
        {
          id: "start_prepress",
          label: "Start pre-press check",
          target: "ARTWORK",
          kind: "stage",
          primary: true,
          description: "Pre-press checks the artwork, sizes and bleed before printing. The customer is emailed that work has started.",
          noteRequired: false,
          notePlaceholder: "Optional note for the order history",
        },
      ];
    case "ARTWORK":
      return [
        {
          id: "send_revised_proof",
          label: "Send revised proof",
          target: "PROOF",
          kind: "proof",
          primary: changeRequested || !gate.proofApproved,
          description:
            "Creates the next proof version from the current artwork (optionally upload corrected artwork first) and emails it to the customer. Production stays locked until they approve it.",
          noteRequired: true,
          notePlaceholder: "What changed, for the customer (e.g. 'Logo enlarged and moved up as requested')",
        },
        {
          id: "release_production",
          label: "Release to production",
          target: "PRODUCTION",
          kind: "stage",
          primary: !changeRequested && gate.proofApproved,
          description: "Artwork checked and the approved proof is final. Print-ready files unlock for the press.",
          noteRequired: false,
          notePlaceholder: "Optional note (e.g. press, material batch)",
          disabledReason: changeRequested
            ? "The customer has asked for changes. Send a revised proof first."
            : !gate.isReady
            ? gate.reason || "Not ready for production"
            : undefined,
        },
        {
          id: "return_to_intake",
          label: "Return to order intake",
          target: "ORDER",
          kind: "stage",
          primary: false,
          description: "Moves the order back to ORDER, e.g. while waiting for information from the customer.",
          noteRequired: true,
          notePlaceholder: "Reason (shown in the order history)",
        },
      ];
    case "PROOF":
      return [
        {
          id: "withdraw_proof",
          label: "Withdraw proof",
          target: "ARTWORK",
          kind: "stage",
          primary: false,
          description: "Takes the proof back to pre-press, e.g. if it was sent with a mistake. Send a corrected proof afterwards.",
          noteRequired: true,
          notePlaceholder: "Reason (shown in the order history)",
        },
      ];
    case "PRODUCTION":
      return [
        {
          id: "mark_completed",
          label: "Mark completed",
          target: "COMPLETED",
          kind: "stage",
          primary: true,
          description: "The job is printed, checked and dispatched. The customer receives a completion email with your note.",
          noteRequired: true,
          notePlaceholder: "Dispatch details (e.g. 'Shipped via Blue Dart, AWB 1234567890')",
        },
      ];
    default:
      return [];
  }
}

/** Minimum length of a required workflow note. */
export const MIN_NOTE_LENGTH = 5;

/**
 * Server-side rule for manual stage changes made by staff. Returns an error message,
 * or null when the move is allowed. (Transition order and production readiness are
 * checked separately by validateStageTransition / checkStagePreconditions.)
 */
export function checkManualStageChange(
  from: PipelineStage,
  to: PipelineStage,
  notes: string | undefined,
  options: { changeRequested?: boolean } = {}
): string | null {
  if (to === "PROOF") return "Proofs are sent with 'Send revised proof', which creates the new proof version for the customer.";
  if (to === "QUOTE") return "An order cannot be moved back to QUOTE.";
  if (from === "QUOTE") return "An order leaves QUOTE only when Stripe confirms the payment.";
  if (from === "PROOF" && to === "PRODUCTION") return "Only the customer can approve the proof; the order moves to production when they do.";
  if (to === "PRODUCTION" && options.changeRequested) return "The customer has asked for changes. Send a revised proof first.";
  const needsNote = to === "COMPLETED" || (from === "PROOF" && to === "ARTWORK") || (from === "ARTWORK" && to === "ORDER");
  if (needsNote && (notes ?? "").trim().length < MIN_NOTE_LENGTH) {
    return to === "COMPLETED"
      ? "Add dispatch details (courier and tracking number) before marking the order completed."
      : "Add a short reason for moving the order back.";
  }
  return null;
}

/** Badge colours per stage, shared by the customer dashboard and the admin console. */
export const STAGE_BADGE: Record<PipelineStage, string> = {
  QUOTE: "bg-neutral-100 text-neutral-700",
  ORDER: "bg-sky-100 text-sky-800",
  ARTWORK: "bg-violet-100 text-violet-800",
  PROOF: "bg-amber-100 text-amber-800",
  PRODUCTION: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
};
