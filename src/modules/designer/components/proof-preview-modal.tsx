"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

/**
 * Proof preview popup (PRD § 06, § 08). Shows the proof the SERVER rendered from
 * the saved artwork, so what the customer approves is exactly what is printed.
 * For uploaded PDFs the original file is shown above the proof details.
 */
export interface ProofPreviewModalProps {
  /** Server-rendered proof image; null while it is being generated. */
  proofDataUrl: string | null;
  /** Signed link to an uploaded PDF, shown alongside the proof. */
  artworkPreview: string | null;
  proofError: string | null;
  /** On-screen snapshot shown while the server proof is still being rendered. */
  quickPreview?: string | null;
  currentProofVersion: number;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  isApproving: boolean;
  onClose: () => void;
  onRequestChanges: () => void;
  onApprove: () => void;
}

export function ProofPreviewModal({
  proofDataUrl,
  artworkPreview,
  proofError,
  quickPreview,
  currentProofVersion,
  widthMm,
  heightMm,
  bleedMm,
  isApproving,
  onClose,
  onRequestChanges,
  onApprove,
}: ProofPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-card border max-w-2xl w-full rounded-2xl shadow-elevation overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b flex items-center justify-between shrink-0">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-600 text-xs font-medium">
              Digital Proof Inspection
            </span>
            <h3 className="text-lg sm:text-xl font-bold font-heading mt-1">
              Digital Proof Approval Inspection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-mono p-1"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Proof Canvas with Watermark */}
          <div className="relative rounded-xl overflow-hidden border bg-industrial-950 flex justify-center items-center p-3 sm:p-4">
            {proofError ? (
              <p role="alert" className="text-sm text-red-600 py-10">{proofError}</p>
            ) : !proofDataUrl ? (
              quickPreview ? (
                <div className="relative w-full flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={quickPreview} alt="Your design (preview)" className="max-h-72 sm:max-h-96 object-contain rounded opacity-60" />
                  <p role="status" className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-xs text-white animate-pulse">
                    Preparing your print proof…
                  </p>
                </div>
              ) : (
                <p role="status" className="text-sm text-muted-foreground py-10 animate-pulse">Rendering your proof…</p>
              )
            ) : artworkPreview ? (
              <div className="w-full space-y-2">
                <object data={artworkPreview} type="application/pdf" className="w-full h-72 sm:h-96 rounded bg-white" aria-label="Uploaded artwork">
                  <a href={artworkPreview} target="_blank" rel="noreferrer" className="underline text-sm">Open the uploaded PDF</a>
                </object>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofDataUrl} alt={`Proof v${currentProofVersion} details`} className="w-full max-h-40 object-contain rounded" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofDataUrl} alt={`Proof v${currentProofVersion}`} className="max-h-72 sm:max-h-96 object-contain rounded shadow" data-testid="proof-image" />
            )}
          </div>

          <div className="p-3 sm:p-4 rounded-lg bg-secondary/50 border text-xs font-mono space-y-1">
            <div>• Verified Size: {widthMm}mm × {heightMm}mm</div>
            <div>• High-Res Bleed: +{bleedMm}mm included</div>
            <div>• Production Gate: Files unlock immediately upon proof approval</div>
            <div>• Proof Version: v{currentProofVersion} (Pre-Press Asset)</div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-secondary/30 border-t flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestChanges}
            className="text-xs font-mono"
          >
            Adjust Artwork
          </Button>

          <Button
            size="sm"
            onClick={onApprove}
            disabled={isApproving || !proofDataUrl}
            variant="cta"
            className="font-semibold text-xs"
          >
            {isApproving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Recording Approval...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Proof v{currentProofVersion} & Proceed to Checkout
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
