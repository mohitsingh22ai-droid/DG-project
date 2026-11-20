"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { ExtendedProduct } from "@/modules/catalog/catalog-store";
import { calculatePrintPrice, validateConfiguration, MAX_QUANTITY } from "@/modules/pricing/pricing-engine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sliders, Sparkles, Check, ArrowRight, Layers, Tag, Loader2 } from "lucide-react";

export function PricingCalculator({ products: PRODUCTS }: { products: ExtendedProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  const initialProduct = useMemo(
    () => PRODUCTS.find((p) => p.slug === productParam || p.id === productParam) || PRODUCTS[0],
    [productParam]
  );

  const { user, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProduct.id);
  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  );

  const [widthMm, setWidthMm] = useState<number>(selectedProduct.default_width_mm);
  const [heightMm, setHeightMm] = useState<number>(selectedProduct.default_height_mm);
  const [materialId, setMaterialId] = useState<string>(selectedProduct.allowed_materials[0]?.id || "default");
  const [quantity, setQuantity] = useState<number>(100);

  // Sync dimensions when product changes
  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];
    setWidthMm(prod.default_width_mm);
    setHeightMm(prod.default_height_mm);
    setMaterialId(prod.allowed_materials[0]?.id || "default");
  };

  const pricing = useMemo(() => {
    // While the customer is typing, out-of-range values are clamped for the live
    // price and the problem is shown; continuing is blocked until it is fixed.
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
    return calculatePrintPrice({
      product: selectedProduct,
      widthMm: clamp(widthMm, selectedProduct.min_width_mm, selectedProduct.max_width_mm),
      heightMm: clamp(heightMm, selectedProduct.min_height_mm, selectedProduct.max_height_mm),
      materialId: selectedProduct.allowed_materials.some((m) => m.id === materialId)
        ? materialId
        : selectedProduct.allowed_materials[0]?.id ?? materialId,
      quantity: Math.round(clamp(quantity, 1, MAX_QUANTITY)),
    });
  }, [selectedProduct, widthMm, heightMm, materialId, quantity]);

  // "Quantity & Price" cards: the same pricing function, run for each preset quantity
  // with the same (clamped) size and material as the live price above.
  const QUANTITY_PRESETS = [25, 50, 100, 250, 500, 1000];
  const presetPrices = useMemo(() => {
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
    return QUANTITY_PRESETS.map((qty) => {
      const p = calculatePrintPrice({
        product: selectedProduct,
        widthMm: clamp(widthMm, selectedProduct.min_width_mm, selectedProduct.max_width_mm),
        heightMm: clamp(heightMm, selectedProduct.min_height_mm, selectedProduct.max_height_mm),
        materialId: selectedProduct.allowed_materials.some((m) => m.id === materialId)
          ? materialId
          : selectedProduct.allowed_materials[0]?.id ?? materialId,
        quantity: qty,
      });
      return { qty, subtotal: p.formatted.subtotal, unit: p.formatted.unitPrice, discount: p.discountPercentage };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, widthMm, heightMm, materialId]);

  const configError = useMemo(
    () => validateConfiguration(selectedProduct, { widthMm, heightMm, materialId, quantity }),
    [selectedProduct, widthMm, heightMm, materialId, quantity]
  );

  const handleContinueToDesigner = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          widthMm,
          heightMm,
          materialId,
          quantity,
          customerId: user?.id || null,
          customerEmail: user?.email || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to persist job draft");
      }

      const data = await res.json();
      const draftId = data.draft.id;

      if (!user || role === "visitor") {
        if (typeof window !== "undefined") {
          localStorage.setItem("w2p_pending_draft_id", draftId);
        }
        router.push(`/login?redirect=${encodeURIComponent(`/designer/${selectedProduct.slug}?draft=${draftId}`)}`);
      } else {
        router.push(`/designer/${selectedProduct.slug}?draft=${draftId}`);
      }
    } catch (err) {
      console.error("Draft persistence error:", err);
      router.push(`/designer/${selectedProduct.slug}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Controls (Left 7 Cols) */}
      <Card className="lg:col-span-7 border-border shadow-elevation">
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-brand-500 uppercase">
            <Sliders className="w-3.5 h-3.5" />
            <span>Price calculator</span>
          </div>
          <CardTitle className="text-2xl font-bold">Choose your product, size and quantity</CardTitle>
          <CardDescription>
            Your price updates as soon as you change anything.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 1. Product Selection */}
          <div className="space-y-2">
            <Label>Select Product Range</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRODUCTS.map((prod) => {
                const isSelected = prod.id === selectedProductId;
                return (
                  <button
                    key={prod.id}
                    onClick={() => handleProductChange(prod.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-1 ring-brand-500"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div className="text-xs font-mono font-semibold uppercase text-muted-foreground truncate">
                      {prod.division_slug}
                    </div>
                    <div className="font-bold text-xs text-foreground mt-0.5 line-clamp-1">
                      {prod.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Millimetric Dimensions Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <Label>Width (mm)</Label>
                <span className="font-bold text-foreground bg-background px-2 py-0.5 rounded border">
                  {widthMm} mm
                </span>
              </div>
              <input
                type="range"
                min={selectedProduct.min_width_mm}
                max={selectedProduct.max_width_mm}
                value={widthMm}
                onChange={(e) => setWidthMm(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Min: {selectedProduct.min_width_mm}mm</span>
                <span>Max: {selectedProduct.max_width_mm}mm</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <Label>Height (mm)</Label>
                <span className="font-bold text-foreground bg-background px-2 py-0.5 rounded border">
                  {heightMm} mm
                </span>
              </div>
              <input
                type="range"
                min={selectedProduct.min_height_mm}
                max={selectedProduct.max_height_mm}
                value={heightMm}
                onChange={(e) => setHeightMm(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Min: {selectedProduct.min_height_mm}mm</span>
                <span>Max: {selectedProduct.max_height_mm}mm</span>
              </div>
            </div>
          </div>

          {/* 3. Material Options */}
          <div className="space-y-2">
            <Label>Material</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedProduct.allowed_materials.map((mat) => {
                const isSelected = mat.id === materialId;
                return (
                  <button
                    key={mat.id}
                    onClick={() => setMaterialId(mat.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 ring-1 ring-brand-500"
                        : "border-border hover:border-muted-foreground/30 bg-card"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        {mat.name}
                        {mat.badge && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-brand-500 border-brand-300">
                            {mat.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {mat.description}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Quantity & Price (PRD § 05: volume discounts shown up front) */}
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <Label className="text-base font-heading font-semibold text-brand-800">Quantity &amp; Price</Label>
              <span className="text-xs font-semibold rounded-full bg-brand-50 text-brand-700 px-3 py-1">
                {pricing.discountPercentage > 0 ? `${pricing.discountPercentage}% volume discount applied` : "Bigger quantity, bigger savings"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {presetPrices.map((tier) => {
                const selected = quantity === tier.qty;
                return (
                  <button
                    key={tier.qty}
                    type="button"
                    onClick={() => setQuantity(tier.qty)}
                    aria-pressed={selected}
                    className={`relative rounded-xl border px-2 pt-4 pb-3 text-center transition-all ${
                      selected
                        ? "bg-brand-800 text-white border-brand-800 shadow-glow"
                        : "bg-card text-foreground border-border hover:border-brand-300"
                    }`}
                  >
                    {tier.discount > 0 && (
                      <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${selected ? "bg-flame-500 text-white" : "bg-brand-50 text-brand-700"}`}>
                        {tier.discount}% OFF
                      </span>
                    )}
                    <span className="block font-heading text-xl font-semibold">{tier.qty}</span>
                    <span className="block text-sm font-semibold mt-0.5">{tier.subtotal}</span>
                    <span className={`block text-[11px] ${selected ? "text-brand-100" : "text-muted-foreground"}`}>{tier.unit} each</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Or enter a custom quantity
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button type="button" variant="outline" size="icon" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                −
              </Button>
              <Input
                type="number"
                min="1"
                max="50000"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="font-mono text-center font-bold text-base h-11 max-w-[12rem]"
                aria-label="Quantity"
              />
              <Button type="button" variant="outline" size="icon" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}>
                +
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">Card prices exclude GST; the full breakdown is shown alongside.</p>
          </div>
        </CardContent>
      </Card>

      {/* Live Breakdown Output (Right 5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <Card className="border-border bg-industrial-950 text-white shadow-elevation overflow-hidden">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-industrial-800">
              <div className="flex items-center gap-2 text-xs font-mono text-industrial-400">
                <Tag className="w-3.5 h-3.5 text-brand-500" />
                <span>YOUR PRICE</span>
              </div>
              <Badge variant="outline" className="border-industrial-700 text-[10px] text-emerald-400 font-mono">
                INCLUDES GST
              </Badge>
            </div>

            {/* Big Headline Price */}
            <div>
              <div className="text-xs font-mono text-industrial-400 uppercase tracking-widest">
                Unit Price ({quantity} units)
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                  {pricing.formatted.unitPrice}
                </span>
                <span className="text-xs text-industrial-400 font-mono">/ piece</span>
              </div>
            </div>

            {/* Spec breakdown table */}
            <div className="space-y-2 text-xs font-mono border-t border-industrial-800 pt-4">
              <div className="flex justify-between text-industrial-300">
                <span>Product Area:</span>
                <span className="text-white font-semibold">
                  {widthMm}mm × {heightMm}mm ({pricing.areaSqCm.toFixed(1)} cm²)
                </span>
              </div>
              <div className="flex justify-between text-industrial-300">
                <span>Material Multiplier:</span>
                <span className="text-white font-semibold">{pricing.materialMultiplier}x</span>
              </div>
              <div className="flex justify-between text-industrial-300">
                <span>Volume Discount Floor:</span>
                <span className={pricing.discountPercentage > 0 ? "text-brand-600 font-semibold" : "text-industrial-400"}>
                  {pricing.discountPercentage > 0 ? `-${pricing.discountPercentage}% Applied` : "None (under 50 units)"}
                </span>
              </div>
              <div className="flex justify-between text-industrial-300">
                <span>Subtotal (Net):</span>
                <span className="text-white font-semibold">{pricing.formatted.subtotal}</span>
              </div>
              <div className="flex justify-between text-industrial-300">
                <span>GST ({pricing.gstRatePercentage}%):</span>
                <span className="text-white font-semibold">{pricing.formatted.tax}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-industrial-800 pt-3 text-white">
                <span>Total Gross:</span>
                <span className="text-brand-600 text-lg">{pricing.formatted.total}</span>
              </div>
            </div>

            {/* Action Buttons (§ 01, § 03, § 05, § 06: Payment appears only after proof approval) */}
            <div className="pt-2">
              {configError && (
                <p role="alert" className="text-sm text-red-400" data-testid="config-error">
                  {configError}
                </p>
              )}
              <Button
                onClick={handleContinueToDesigner}
                disabled={isSubmitting || !!configError}
                className="w-full h-12 text-base font-semibold shadow-glow"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Continue to design
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Manufacturing Rules Callout */}
        <div className="p-4 rounded-xl border border-border bg-card text-xs space-y-2 font-mono">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-500" />
            <span>Print details:</span>
          </div>
          <div className="text-muted-foreground space-y-1">
            <div>• Edge allowance (bleed): +{selectedProduct.default_bleed_mm} mm</div>
            <div>• Keep text {selectedProduct.default_safety_margin_mm} mm inside the edge</div>
            <div>• Printed from a high-resolution file with exact cut lines</div>
          </div>
        </div>
      </div>
    </div>
  );
}
