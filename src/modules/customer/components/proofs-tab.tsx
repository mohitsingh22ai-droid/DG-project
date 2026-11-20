"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function ProofsTab({ proofs, setSelectedProofForReview }: ProofsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-heading">Digital Proofs & Version Approvals</h2>
          <p className="text-xs text-muted-foreground">
            Inspect artwork previews before production unlocks. Every revision is version-controlled.
          </p>
        </div>
      </div>

      {proofs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FileCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-heading font-bold text-base text-foreground mb-1">No Active Digital Proofs</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Artwork proofs requiring sign-off will appear here once an order enters the PROOF stage.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proofs.map((prf) => (
            <Card key={prf.id} className="overflow-hidden flex flex-col justify-between hover-lift">
              <div>
                <div className="aspect-[16/10] bg-industrial-950 relative overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prf.watermarked_preview_url}
                    alt="Proof Preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                  {/* Watermark badge overlay (§ 08) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white/30 text-2xl font-mono font-extrabold uppercase tracking-widest rotate-[-15deg]">
                      W2P PROOF · v{prf.version_number}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="industrial" className="text-xs">
                      REVISION v{prf.version_number}
                    </Badge>
                    {prf.status === "approved" ? (
                      <Badge variant="success" className="text-xs">
                        APPROVED & UNLOCKED
                      </Badge>
                    ) : prf.status === "superseded" ? (
                      <Badge variant="outline" className="text-xs bg-white/80">
                        REPLACED BY NEWER VERSION
                      </Badge>
                    ) : prf.status === "changes_requested" ? (
                      <Badge variant="destructive" className="text-xs">
                        CHANGES REQUESTED
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs animate-pulse">
                        AWAITING YOUR APPROVAL
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>Associated Order:</span>
                    <span className="font-bold text-foreground">{prf.order_id}</span>
                  </div>

                  {prf.customer_feedback && (
                    <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                      <span className="font-bold block">Revision Requested:</span>
                      {prf.customer_feedback}
                    </div>
                  )}

                  {prf.approved_at && (
                    <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                      <span className="font-bold block">Approved for Manufacture:</span>
                      {new Date(prf.approved_at).toLocaleString("en-IN")}
                      {prf.approved_by && <span className="block">by {prf.approved_by}</span>}
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-5 pt-0">
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProofForReview(prf)}
                    className="text-xs"
                  >
                    Inspect Proof
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedProofForReview(prf)}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {prf.status === "approved" ? "View Sign-Off" : prf.status === "pending_review" ? "Review & Sign" : "View Proof"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
