import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { workflowActions, waitingFor, checkManualStageChange } from "../order-workflow";
import type { Order, PipelineStage } from "@/types/database";

/** Minimal order for the workflow rules. */
function order(overrides: Partial<Order>): Order {
  return {
    id: "o1",
    order_number: "W2P-TEST",
    customer_id: "c1",
    pipeline_stage: "ORDER",
    payment_status: "paid",
    subtotal_cents: 0,
    tax_cents: 0,
    total_cents: 0,
    currency: "INR",
    shipping_address: { name: "A", line1: "1", city: "Delhi", postal_code: "110001", country: "India" },
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Order;
}

const ids = (o: Order) => workflowActions(o).map((a) => a.id);

describe("Order workflow (PRD § 08, § 11)", () => {
  it("has no staff action while waiting for payment or for the customer", () => {
    assert.deepEqual(ids(order({ pipeline_stage: "QUOTE", payment_status: "pending" })), []);
    assert.equal(waitingFor(order({ pipeline_stage: "QUOTE", payment_status: "pending" })), "Awaiting payment");
    assert.equal(waitingFor(order({ pipeline_stage: "PROOF" })), "Awaiting customer approval");
    assert.deepEqual(ids(order({ pipeline_stage: "PROOF" })), ["withdraw_proof"]);
  });

  it("recommends releasing an approved order to production", () => {
    const actions = workflowActions(order({ pipeline_stage: "ARTWORK", approved_proof_version: 1 }));
    const release = actions.find((a) => a.id === "release_production")!;
    assert.equal(release.primary, true);
    assert.equal(release.disabledReason, undefined);
  });

  it("blocks production and recommends a revised proof when the customer asked for changes", () => {
    const actions = workflowActions(order({ pipeline_stage: "ARTWORK", change_request: "Bigger logo" }));
    assert.equal(actions.find((a) => a.id === "send_revised_proof")!.primary, true);
    assert.ok(actions.find((a) => a.id === "release_production")!.disabledReason);
  });

  it("requires dispatch details to complete and a reason to move back", () => {
    assert.ok(checkManualStageChange("PRODUCTION", "COMPLETED", ""));
    assert.equal(checkManualStageChange("PRODUCTION", "COMPLETED", "Blue Dart AWB 123456"), null);
    assert.ok(checkManualStageChange("PROOF", "ARTWORK", undefined));
    assert.equal(checkManualStageChange("ORDER", "ARTWORK", undefined), null);
  });

  it("leaves proof approval to the customer and holds production while a change is requested", () => {
    assert.ok(checkManualStageChange("PROOF", "PRODUCTION", "note text"));
    assert.ok(checkManualStageChange("ARTWORK", "PRODUCTION", undefined, { changeRequested: true }));
    assert.equal(checkManualStageChange("ARTWORK", "PRODUCTION", undefined), null);
  });

  it("never lets staff enter PROOF or leave QUOTE by hand", () => {
    for (const from of ["ARTWORK", "ORDER"] as PipelineStage[]) assert.ok(checkManualStageChange(from, "PROOF", "note text"));
    assert.ok(checkManualStageChange("QUOTE", "ORDER", "paid in cash"));
  });
});
