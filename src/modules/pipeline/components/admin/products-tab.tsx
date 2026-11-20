"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import type { AdminProduct, FeedbackHandler } from "./types";


/**
 * Admin → Products & pricing tiers (PRD § 03, § 05, § 14). Price changes go live
 * on the storefront immediately: prices are read from the database, not code.
 * Money values are paise (the `*_cents` field names are kept for API compatibility).
 */
export function ProductsTab({ onFeedback }: { onFeedback: FeedbackHandler }) {
  const [productsList, setProductsList] = useState<AdminProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
      }
    } catch (err) {
      console.warn("Failed to fetch products:", err);
    }
  }, []);

  // Load the catalogue when the tab opens.
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /** Saves the pricing fields of the product being edited. */
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setProductFormError(null);

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_price_cents: Number(editingProduct.base_price_cents),
          price_per_sq_cm_cents: Number(editingProduct.price_per_sq_cm_cents),
          pricing_tiers: editingProduct.pricing_tiers,
          gst_rate: Number(editingProduct.gst_rate ?? 18),
          hsn_code: editingProduct.hsn_code || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProductFormError(data.error || "Failed to update product");
        return;
      }

      onFeedback({
        type: "success",
        text: `Product '${editingProduct.name}' updated! Changes are live on the storefront without redeploy.`,
      });
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: unknown) {
      setProductFormError(err instanceof Error ? err.message : "Error saving product");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Parameter-Driven Products & Pricing Tiers</CardTitle>
          <CardDescription className="text-xs">
            Edits take effect immediately on storefront calculations without a code deployment. Tier floors must be consistent and non-overlapping.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsList.map((prod) => (
              <Card key={prod.id} data-testid="admin-product-row" className="border-neutral-200 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-neutral-100 text-neutral-800 text-[10px] uppercase">
                      {prod.division_slug}
                    </Badge>
                    <span className="text-xs font-semibold text-[#FF5A1F]">
                      {formatINR(prod.base_price_cents)} base
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{prod.name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{prod.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="text-xs text-neutral-600 flex justify-between">
                    <span>Price per sq cm:</span>
                    <span className="font-semibold">{formatINR(prod.price_per_sq_cm_cents)}</span>
                  </div>
                  <div className="text-xs text-neutral-600 flex justify-between">
                    <span>Print area:</span>
                    <span>{prod.min_width_mm}mm - {prod.max_width_mm}mm</span>
                  </div>
                  <div className="text-xs text-neutral-600 flex justify-between">
                    <span>Volume discount tiers:</span>
                    <span>{prod.pricing_tiers?.length || 0} tiers configured</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct({ ...prod });
                      setProductFormError(null);
                    }}
                    className="w-full mt-3 text-xs"
                  >
                    Edit Pricing & Tiers
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Modal / Drawer */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-bold text-lg text-neutral-900">Edit {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {productFormError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="base-price" className="text-xs font-semibold text-neutral-700">
                  Base Price (paise)
                </Label>
                <Input
                  id="base-price"
                  data-testid="admin-product-base-price"
                  type="number"
                  min="0"
                  value={editingProduct.base_price_cents}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, base_price_cents: Number(e.target.value) })
                  }
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sq-cm-price" className="text-xs font-semibold text-neutral-700">
                  Price per Sq Cm (paise)
                </Label>
                <Input
                  id="sq-cm-price"
                  type="number"
                  min="0"
                  value={editingProduct.price_per_sq_cm_cents}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price_per_sq_cm_cents: Number(e.target.value) })
                  }
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gst-rate" className="text-xs font-semibold text-neutral-700">
                    GST rate (%)
                  </Label>
                  <select
                    id="gst-rate"
                    value={editingProduct.gst_rate ?? 18}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gst_rate: Number(e.target.value) })}
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {[0, 5, 12, 18, 28].map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="hsn-code" className="text-xs font-semibold text-neutral-700">
                    HSN code
                  </Label>
                  <Input
                    id="hsn-code"
                    value={editingProduct.hsn_code ?? ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsn_code: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                    inputMode="numeric"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-neutral-700 block mb-2">
                  Volume Discount Tiers (PRD § 05)
                </Label>
                <div className="space-y-2">
                  {(editingProduct.pricing_tiers || []).map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 w-16">Min Qty:</span>
                      <Input
                        type="number"
                        min="1"
                        value={t.min_quantity}
                        onChange={(e) => {
                          const updated = [...editingProduct.pricing_tiers];
                          updated[idx] = { ...updated[idx], min_quantity: Number(e.target.value) };
                          setEditingProduct({ ...editingProduct, pricing_tiers: updated });
                        }}
                        className="h-8 text-xs w-24"
                      />
                      <span className="text-xs text-neutral-500 w-16">Discount %:</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={t.discount_percentage}
                        onChange={(e) => {
                          const updated = [...editingProduct.pricing_tiers];
                          updated[idx] = { ...updated[idx], discount_percentage: Number(e.target.value) };
                          setEditingProduct({ ...editingProduct, pricing_tiers: updated });
                        }}
                        className="h-8 text-xs w-24"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="admin-save-product-btn" className="bg-[#FF5A1F] hover:bg-[#E0480F] text-white">
                  Save & Apply Live
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
