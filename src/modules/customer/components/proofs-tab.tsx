"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, CheckCircle2 } from "lucide-react";
import type { Proof } from "@/types/database";

/**
 * Customer → Proofs (PRD § 08, § 10): every proof version with its state
 * (awaiting approval, approved, changes requested or replaced). Opening one shows
 * the review dialog, where the customer approves it or asks for changes.
 */
interface ProofsTabProps {
  proofs: Proof[];
  setSelectedProofForReview: (proof: Proof) => void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Status wording and colour for each proof state. */
const STATUS: Record<string, { label: string; className: string }> = {
  pending_review: { label: "Awaiting your approval", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  changes_requested: { label: "Changes requested", className: "bg-rose-100 text-rose-800" },
  superseded: { label: "Replaced by a newer version", className: "bg-neutral-100 text-neutral-600" },
};

export function ProofsTab({ proofs, setSelectedProofForReview }: ProofsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-heading">Your proofs</h2>
          <p className="text-xs text-muted-foreground">
            Check each proof before we print. Every version is kept.
          </p>
        </div>
      </div>

      {proofs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FileCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-heading font-bold text-base text-foreground mb-1">No Active Digital Proofs</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Proofs waiting for your approval will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proofs.map((prf) => {
            const status = STATUS[prf.status] ?? STATUS.pending_review;
            // Before payment a proof belongs to a job; afterwards to an order number.
            const isOrdered = !UUID_PATTERN.test(prf.order_id);
            const specLine = [
              prf.spec ? `${prf.spec.widthMm} × ${prf.spec.heightMm} mm` : null,
              prf.spec?.materialName,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Card key={prf.id} className="overflow-hidden flex flex-col" data-testid="proof-card">
                {/* Header: version and status as text, not over the artwork */}
                <div className="flex items-start justify-between gap-3 p-5 pb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-lg font-semibold text-brand-800" data-testid="proof-version">
                        Version {prf.version_number}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                    </div>
                    <div className="text-sm text-foreground mt-1 truncate">{prf.spec?.productName || "Print job"}</div>
                    <div className="text-xs text-muted-foreground">
                      {isOrdered ? `Order ${prf.order_id}` : "Not ordered yet"} · Issued{" "}
                      {new Date(prf.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Proof artwork, shown whole on a neutral background */}
                <button
                  type="button"
                  onClick={() => setSelectedProofForReview(prf)}
                  className="mx-5 rounded-xl border border-border bg-muted/60 p-3 flex items-center justify-center aspect-[16/10] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Open version ${prf.version_number}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prf.watermarked_preview_url} alt={`Proof version ${prf.version_number}`} className="max-w-full max-h-full object-contain rounded" loading="lazy" />
                </button>

                <CardContent className="p-5 space-y-3 flex-1">
                  {specLine && <div className="text-xs text-muted-foreground">{specLine}</div>}

                  {prf.customer_feedback && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm dark:bg-amber-950/20 dark:text-amber-200">
                      <span className="font-semibold block text-xs uppercase tracking-wide">Your change request</span>
                      {prf.customer_feedback}
                    </div>
                  )}

                  {prf.approved_at && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm dark:bg-emerald-950/20 dark:text-emerald-200">
                      <span className="font-semibold block text-xs uppercase tracking-wide">Approved</span>
                      {new Date(prf.approved_at).toLocaleString("en-IN")}
                      {prf.approved_by && <span className="block text-xs">by {prf.approved_by}</span>}
                    </div>
                  )}
                </CardContent>

                <div className="p-5 pt-0">
                  <Button
                    size="sm"
                    variant={prf.status === "pending_review" ? "cta" : "outline"}
                    onClick={() => setSelectedProofForReview(prf)}
                    className="w-full text-xs font-semibold"
                  >
                    {prf.status === "pending_review" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                        Review and approve
                      </>
                    ) : (
                      "View proof"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
