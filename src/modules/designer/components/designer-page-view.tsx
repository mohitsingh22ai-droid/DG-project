"use client";

import { VariableDataAttach } from "@/modules/variable-data/components/variable-data-attach";
import React, { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Product } from "@/types/database";
import {
  CanvasElement,
  PrintDimensions,
  SerializedCanvasState,
  TextCanvasElement,
  ShapeCanvasElement,
  ImageCanvasElement,
} from "../types";
import { calculatePrintBounds, computeFittedFontSize } from "../utils/print-constraints";
import { DesignerToolbar } from "./designer-toolbar";
import { applyTemplate, builtInTemplatesFor, DesignTemplate } from "../templates";
import { DirectUploadView } from "./direct-upload-view";
import { ProofPreviewModal } from "./proof-preview-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Save,
  UploadCloud,
  Palette,
  Eye,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Konva from "konva";

// Dynamic client-only import for Konva Stage to prevent SSR window issues
const CanvasStageDynamic = dynamic(
  () => import("./canvas-stage").then((mod) => mod.CanvasStage),
  { ssr: false }
);

interface DesignerPageViewProps {
  product: Product;
  draftId?: string;
  /** Saved design state of an existing draft (reopened job or reorder). */
  initialDesign?: Record<string, unknown> | null;
  initialWidthMm: number;
  initialHeightMm: number;
  selectedMaterialId: string;
  quantity: number;
}

export function DesignerPageView({
  product,
  draftId,
  initialDesign,
  initialWidthMm,
  initialHeightMm,
  selectedMaterialId,
  quantity,
}: DesignerPageViewProps) {
  const router = useRouter();
  // The id is also kept in a ref: state updates are not visible to handlers that
  // run in the same tick (e.g. upload → open proof), which used to create a second, empty job.
  const draftIdRef = useRef<string>(draftId || "");
  const [currentProofVersion, setCurrentProofVersion] = useState<number>(1);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const savedCanvas = initialDesign && Array.isArray((initialDesign as { elements?: unknown }).elements)
    ? (initialDesign as unknown as SerializedCanvasState)
    : null;
  const [mode, setMode] = useState<"designer" | "upload">(
    initialDesign && (initialDesign as { source?: string }).source === "upload" ? "upload" : "designer"
  );
  const stageRef = useRef<Konva.Stage | null>(null);

  const [dimensions] = useState<PrintDimensions>({
    widthMm: initialWidthMm,
    heightMm: initialHeightMm,
    bleedMm: product.default_bleed_mm,
    safetyMarginMm: product.default_safety_margin_mm,
  });

  const [backgroundColor, setBackgroundColor] = useState<string>(savedCanvas?.backgroundColor ?? "#FFFFFF");
  const [showBleedGuide, setShowBleedGuide] = useState<boolean>(true);
  const [showTrimGuide, setShowTrimGuide] = useState<boolean>(true);
  const [showSafeGuide, setShowSafeGuide] = useState<boolean>(true);
  // Editor-only "Show guides" toggle (default on). Guides are never part of the proof or print file (§ 06, § 08).
  const [showGuides, setShowGuides] = useState<boolean>(true);

  // New designs start from the division's first template (PRD § 06), always inside the safe area.
  const [elements, setElements] = useState<CanvasElement[]>(() => {
    if (savedCanvas?.elements) return savedCanvas.elements;
    const starter = builtInTemplatesFor(product.division_slug)[0];
    return starter ? applyTemplate(starter, calculatePrintBounds(dimensions, 700, 520)) : [];
  });
  const [templates, setTemplates] = useState<DesignTemplate[]>(() => builtInTemplatesFor(product.division_slug));
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/templates?division=${encodeURIComponent(product.division_slug)}&product=${encodeURIComponent(product.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data?.templates?.length) setTemplates(data.templates); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [product.division_slug, product.id]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState<boolean>(false);
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [savedJsonNotice, setSavedJsonNotice] = useState<string | null>(null);

  // Compute print pixel bounds
  const bounds = useMemo(() => {
    return calculatePrintBounds(dimensions, 700, 520);
  }, [dimensions]);

  const handleApplyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    if (elements.length > 0 && !window.confirm(`Replace the current design with the "${tpl.name}" template?`)) return;
    setElements(applyTemplate(tpl, bounds));
    setSelectedId(null);
  };

  // Add Text with Placeholder Fitting Rules (§ 04)
  const handleAddText = (type: "heading" | "body") => {
    const isHeading = type === "heading";
    const sampleText = isHeading ? "SAMPLE HEADING" : "High endurance specification line";
    const baseSize = isHeading ? 26 : 14;

    // Apply shrink-to-fit calculation if text exceeds available safe width (§ 04)
    const fittedSize = computeFittedFontSize(sampleText, bounds.safeWidth, baseSize, 10, 48);

    const newElement: TextCanvasElement = {
      id: `text-${Date.now()}`,
      type: "text",
      x: bounds.safeOffsetX,
      y: bounds.safeOffsetY + (elements.length * 30) % 200 + 20,
      text: sampleText,
      fontSize: fittedSize,
      fontFamily: isHeading ? "Plus Jakarta Sans" : "JetBrains Mono",
      fill: isHeading ? "#111318" : "#444D5F",
      align: "left",
      isBold: isHeading,
      rotation: 0,
      opacity: 1,
      autoShrink: true,
    };

    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  // Add Shape
  const handleAddShape = () => {
    const newShape: ShapeCanvasElement = {
      id: `shape-${Date.now()}`,
      type: "rect",
      x: bounds.safeOffsetX + 30,
      y: bounds.safeOffsetY + 40,
      width: 140,
      height: 60,
      fill: "#FF5A1F",
      cornerRadius: 6,
      rotation: 0,
      opacity: 0.9,
    };
    setElements([...elements, newShape]);
    setSelectedId(newShape.id);
  };

  // Upload Logo Image
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result;
      if (typeof src !== "string") return;
      // Keep the logo's own proportions and fit it inside the safe area.
      const probe = new window.Image();
      probe.onload = () => {
        const natW = probe.naturalWidth || 1;
        const natH = probe.naturalHeight || 1;
        const maxW = Math.min(bounds.safeWidth, Math.max(80, bounds.safeWidth * 0.5));
        const maxH = Math.min(bounds.safeHeight, Math.max(80, bounds.safeHeight * 0.5));
        const scale = Math.min(maxW / natW, maxH / natH, 1);
        const width = Math.max(10, Math.round(natW * scale));
        const height = Math.max(10, Math.round(natH * scale));
        const newImg: ImageCanvasElement = {
          id: `img-${Date.now()}`,
          type: "image",
          src,
          x: bounds.safeOffsetX + (bounds.safeWidth - width) / 2,
          y: bounds.safeOffsetY + (bounds.safeHeight - height) / 2,
          width,
          height,
          rotation: 0,
          opacity: 1,
        };
        setElements((prev) => [...prev, newImg]);
        setSelectedId(newImg.id);
      };
      probe.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateSelected = (attrs: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;
        // If updating text, enforce placeholder shrink-to-fit
        const textAttrs = attrs as Partial<TextCanvasElement>;
        if (el.type === "text" && textAttrs.text !== undefined) {
          const fitted = computeFittedFontSize(textAttrs.text, bounds.safeWidth, (el as TextCanvasElement).fontSize);
          return { ...el, ...attrs, fontSize: fitted } as CanvasElement;
        }
        return { ...el, ...attrs } as CanvasElement;
      })
    );
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  // Serialize Canvas State to JSON (§ 06: Saved designs)
  const serializeCanvasState = (): SerializedCanvasState => {
    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      productSlug: product.slug,
      dimensionsMm: dimensions,
      pxPerMm: bounds.scaleFactor,
      backgroundColor,
      elements,
    };
  };

  // Saves the design to the customer's account (PRD § 09 saved designs).
  const handleSaveDesign = async () => {
    // The server decides whether the visitor is signed in (the client auth state may still be loading).
    try {
    const res = await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        name: `${product.name} · ${new Date().toLocaleDateString("en-IN")}`,
        widthMm: dimensions.widthMm,
        heightMm: dimensions.heightMm,
        material: selectedMaterialId,
        canvasState: serializeCanvasState(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSavedJsonNotice(
      res.ok
        ? "Design saved to your account."
        : res.status === 401
          ? "Sign in to save designs to your account."
          : `Could not save the design: ${data.error || res.status}`
    );
    } catch {
      setSavedJsonNotice("Could not save the design: network error. Please try again.");
    }
    setTimeout(() => setSavedJsonNotice(null), 6000);
  };

  // Creates the job draft the first time it is needed (no draft is created just by viewing).
  const ensureDraftId = async (): Promise<string> => {
    if (draftIdRef.current) return draftIdRef.current;
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        widthMm: dimensions.widthMm,
        heightMm: dimensions.heightMm,
        materialId: selectedMaterialId,
        quantity,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not start the job.");
    draftIdRef.current = data.draft.id;
    window.history.replaceState(null, "", `?draft=${data.draft.id}`);
    return data.draft.id as string;
  };

  // Proof preview (§ 06, § 08): the server renders and stores the proof from the saved
  // artwork; the modal shows that stored proof, so what is approved is what is printed.
  const handleOpenProofModal = async () => {
    // Selection handles are editor chrome, never part of the proof.
    setSelectedId(null);
    setProofDataUrl(null);
    setArtworkPreview(null);
    setProofError(null);
    setProofModalOpen(true);
    try {
      const id = await ensureDraftId();
      const patch = await fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            status: "proof_pending",
            ...(mode === "designer" ? { designJson: serializeCanvasState() } : {}),
          },
          action: "PROOF_GENERATED",
        }),
      });
      const data = await patch.json();
      if (!patch.ok) throw new Error(data.error || "The proof could not be generated.");
      const draft = data.draft as { proofVersion: number; proofs: Array<{ version: number; renderedUrl: string }>; artworkUrl?: string | null; designJson?: { kind?: string } | null };
      const proof = draft.proofs.find((pr) => pr.version === draft.proofVersion) ?? draft.proofs[draft.proofs.length - 1];
      setCurrentProofVersion(draft.proofVersion);
      setProofDataUrl(proof?.renderedUrl || null);
      if (draft.artworkUrl && draft.designJson?.kind === "pdf") setArtworkPreview(draft.artworkUrl);
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "The proof could not be generated.");
    }
  };

  const handleApproveProof = async () => {
    setIsApproving(true);
    try {
      const targetDraftId = await ensureDraftId();

      // Step 1: Ensure artwork is saved
      await fetch(`/api/drafts/${targetDraftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: {
            status: "proof_pending",
            ...(mode === "designer" ? { designJson: serializeCanvasState() } : {}),
          },
          action: "PROOF_PENDING_BEFORE_APPROVAL",
        }),
      });

      // Step 2: Formal proof approval endpoint (§ 08 & Task 4: POST /api/drafts/[id]/approve-proof)
      const approveRes = await fetch(`/api/drafts/${targetDraftId}/approve-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!approveRes.ok) {
        const errData = await approveRes.json();
        throw new Error(errData.error || "Approval failed");
      }

      setProofModalOpen(false);
      // Navigate to checkout with draft ID ONLY (PRD § 04, § 05)
      router.push(`/checkout?draft=${targetDraftId}`);
    } catch (err: unknown) {
      console.error("Proof approval error:", err);
      alert(err instanceof Error ? err.message : "Failed to approve proof.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (draftIdRef.current) {
      try {
        const res = await fetch(`/api/drafts/${draftIdRef.current}/request-changes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: "Customer requested artwork adjustments in designer.",
          }),
        });
        const data = await res.json();
        if (data.draft) {
          setCurrentProofVersion(data.draft.proofVersion);
        }
      } catch (err) {
        console.error("Request changes error:", err);
      }
    }
    setProofModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Specs Bar */}
      <div className="p-6 rounded-2xl bg-industrial-950 text-white border border-industrial-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-600 text-xs font-medium">
              Interactive Studio
            </span>
            <span className="text-xs font-mono text-industrial-400">
              {product.division_slug.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight mt-1">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-industrial-300 mt-1">
            <span>Trim Box: <strong className="text-white">{dimensions.widthMm}mm × {dimensions.heightMm}mm</strong></span>
            <span>Bleed: <strong className="text-red-400">+{dimensions.bleedMm}mm</strong></span>
            <span>Safety Margin: <strong className="text-emerald-400">{dimensions.safetyMarginMm}mm</strong></span>
            <span>Batch Quantity: <strong className="text-brand-600">{quantity} units</strong></span>
          </div>
        </div>

        {/* Path Switcher: Designer vs Direct File Upload */}
        <div className="flex items-center gap-2 bg-industrial-900 p-1 rounded-lg border border-industrial-800">
          <Button
            size="sm"
            variant={mode === "designer" ? "default" : "ghost"}
            onClick={() => setMode("designer")}
            className="text-xs font-mono"
          >
            <Palette className="w-3.5 h-3.5 mr-1.5" />
            In-Browser Canvas
          </Button>
          <Button
            size="sm"
            variant={mode === "upload" ? "default" : "ghost"}
            onClick={() => setMode("upload")}
            className="text-xs font-mono"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            Direct File Upload
          </Button>
        </div>
      </div>

      {savedJsonNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedJsonNotice}</span>
        </div>
      )}

      {/* MODE 1: In-Browser Designer */}
      {mode === "designer" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Canvas Work Area (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-4 border-border shadow-elevation">
              <div className="flex items-center justify-between pb-3 border-b text-xs font-mono text-muted-foreground">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Visual Manufacturing Canvas
                </span>
                <div className="flex items-center gap-3">
                  {/* Editor-only "Show guides" toggle */}
                  <Button
                    variant={showGuides ? "secondary" : "outline"}
                    size="sm"
                    data-testid="toggle-guides-button"
                    onClick={() => setShowGuides(!showGuides)}
                    className="h-7 text-xs px-2.5 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-brand-500" />
                    <span>{showGuides ? "Guides ON" : "Guides OFF"}</span>
                  </Button>
                  {templates.length > 0 && (
                    <select
                      aria-label="Start from a template"
                      data-testid="template-select"
                      value=""
                      onChange={(e) => handleApplyTemplate(e.target.value)}
                      className="h-7 rounded-md border border-border bg-background px-2 text-xs"
                    >
                      <option value="">Templates…</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <span>Scale: {bounds.scaleFactor.toFixed(2)} px/mm</span>
                </div>
              </div>

              {/* The Konva Canvas */}
              <div className="mt-3">
                <CanvasStageDynamic
                  bounds={bounds}
                  elements={elements}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onChange={setElements}
                  showBleedGuide={showBleedGuide}
                  showTrimGuide={showTrimGuide}
                  showSafeGuide={showSafeGuide}
                  showGuides={showGuides}
                  backgroundColor={backgroundColor}
                  stageRef={stageRef}
                />
              </div>

              {/* Canvas Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t mt-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveDesign}
                    className="text-xs font-mono"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                    Save to my designs
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleOpenProofModal}
                    className="font-semibold shadow-glow text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Generate Proof & Preview
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Print Zone Legend (§ 06) */}
            <div className="p-4 rounded-xl border bg-secondary/30 grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                <span className="w-3 h-0.5 border-t border-dashed border-red-500" />
                <span>Bleed (+3mm)</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <span className="w-3 h-0.5 bg-foreground" />
                <span>Trim Line (Cut)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
                <span>Safe Margin (-3mm)</span>
              </div>
            </div>
          </div>

          {/* Designer Controls Sidebar (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <DesignerToolbar
              elements={elements}
              selectedId={selectedId}
              onAddText={handleAddText}
              onAddShape={handleAddShape}
              onUploadImage={handleUploadLogo}
              onUpdateSelected={handleUpdateSelected}
              onDeleteSelected={handleDeleteSelected}
              showBleedGuide={showBleedGuide}
              setShowBleedGuide={setShowBleedGuide}
              showTrimGuide={showTrimGuide}
              setShowTrimGuide={setShowTrimGuide}
              showSafeGuide={showSafeGuide}
              setShowSafeGuide={setShowSafeGuide}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
            />
          </div>
        </div>
      ) : (
        /* MODE 2: Direct File Upload Path (§ 06 & § 08) */
        <div className="max-w-2xl mx-auto">
          <DirectUploadView
            product={product}
            widthMm={dimensions.widthMm}
            heightMm={dimensions.heightMm}
            ensureDraftId={ensureDraftId}
            onUploadSuccess={() => {
              handleOpenProofModal();
            }}
          />
        </div>
      )}

      {product.has_variable_data && (
        <div className="max-w-2xl">
          <VariableDataAttach
            quantity={quantity}
            sampleHeaders={product.variable_data_sample_headers}
            ensureDraftId={ensureDraftId}
          />
        </div>
      )}

      {/* Proof preview popup (§ 06 & § 08) */}
      {proofModalOpen && (
        <ProofPreviewModal
          proofDataUrl={proofDataUrl}
          artworkPreview={artworkPreview}
          proofError={proofError}
          currentProofVersion={currentProofVersion}
          widthMm={dimensions.widthMm}
          heightMm={dimensions.heightMm}
          bleedMm={dimensions.bleedMm}
          isApproving={isApproving}
          onClose={() => setProofModalOpen(false)}
          onRequestChanges={handleRequestChanges}
          onApprove={handleApproveProof}
        />
      )}
    </div>
  );
}
