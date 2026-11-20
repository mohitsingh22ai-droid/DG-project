"use client";

import React from "react";
import { Check, Clock } from "lucide-react";
import type { Order, PipelineStage } from "@/types/database";

/**
 * Order progress tracker (PRD § 09, § 10): the order's pipeline shown the way
 * shoppers know from parcel tracking. Five customer-facing steps map onto the
 * PRD stages; done steps show their date, the current one is highlighted.
 * QUOTE (unpaid) is shown as a notice instead, since nothing has started yet.
 */

const STEPS: Array<{ stage: PipelineStage; label: string; current: string }> = [
  { stage: "ORDER", label: "Order placed", current: "Payment received" },
  { stage: "ARTWORK", label: "Artwork check", current: "Pre-press is checking your files" },
  { stage: "PROOF", label: "Proof approval", current: "A proof is waiting for your approval" },
  { stage: "PRODUCTION", label: "Printing", current: "Your job is on the press" },
  { stage: "COMPLETED", label: "Dispatched", current: "Printed and dispatched" },
];

/** Date the order last entered `stage`, from its history. */
function enteredAt(order: Order, stage: PipelineStage): string | null {
  const hits = (order.status_history ?? []).filter((h) => h.to === stage);
  const last = hits[hits.length - 1];
  if (last) return last.timestamp;
  // Orders are created at ORDER when payment is confirmed in the same step.
  if (stage === "ORDER") return order.created_at;
  return null;
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function OrderTracker({ order }: { order: Order }) {
  if (order.pipeline_stage === "QUOTE") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground" data-testid="order-tracker-quote">
        <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
        {order.payment_status === "cancelled" ? "Checkout was cancelled." : "Awaiting payment. Complete checkout to start production."}
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.stage === order.pipeline_stage);
  const changeRequested = !!order.change_request && order.pipeline_stage === "ARTWORK";
  const dispatchNote =
    order.pipeline_stage === "COMPLETED"
      ? [...(order.status_history ?? [])].reverse().find((h) => h.to === "COMPLETED" && h.notes)?.notes
      : undefined;

  return (
    <div className="space-y-3" data-testid="order-tracker">
      <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
        {STEPS.map((step, i) => {
          const done = i < currentIndex || order.pipeline_stage === "COMPLETED";
          const current = i === currentIndex && order.pipeline_stage !== "COMPLETED";
          const date = done || current ? enteredAt(order, step.stage) : null;
          return (
            <li key={step.stage} className="relative flex flex-col items-center text-center min-w-0" aria-current={current ? "step" : undefined}>
              {/* Connector to the previous step */}
              {i > 0 && (
                <span
                  className={`absolute top-3.5 right-1/2 w-full h-0.5 ${i <= currentIndex || order.pipeline_stage === "COMPLETED" ? "bg-brand-600" : "bg-border"}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                  done
                    ? "bg-brand-600 border-brand-600 text-white"
                    : current
                    ? "bg-card border-flame-500 text-flame-600 ring-4 ring-flame-100"
                    : "bg-card border-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`mt-1.5 text-[11px] sm:text-xs leading-tight ${current ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {date && <span className="text-[10px] text-muted-foreground">{fmt(date)}</span>}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-foreground/80" data-testid="order-tracker-status">
        {changeRequested
          ? "Your change request is with pre-press. You will receive a revised proof to approve."
          : order.pipeline_stage === "COMPLETED"
          ? dispatchNote
            ? `Dispatched: ${dispatchNote}`
            : STEPS[4].current
          : STEPS[currentIndex]?.current}
      </p>
    </div>
  );
}
