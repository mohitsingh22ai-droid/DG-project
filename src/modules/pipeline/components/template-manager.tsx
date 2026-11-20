"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DesignTemplate, TemplateElement } from "@/modules/designer/templates";

const DIVISIONS = [
  ["labels-stickers", "Labels & Stickers"],
  ["race-event-numbers", "Race & Event Numbers"],
  ["mtb-boards", "MTB Boards"],
  ["stamps", "Stamps"],
  ["trophies", "Trophies"],
  ["laser-cut", "Laser-Cut Work"],
] as const;

/** Small scaled preview of a template inside a 4:3 safe area. */
function TemplatePreview({ elements }: { elements: TemplateElement[] }) {
  return (
    <svg viewBox="0 0 400 300" className="w-full rounded border border-neutral-200 bg-white" aria-hidden="true">
      {elements.map((el, i) =>
        el.kind === "rect" ? (
          <rect key={i} x={el.x * 400} y={el.y * 300} width={el.w * 400} height={el.h * 300} rx={el.radius ?? 0} fill={el.color} />
        ) : (
          <text
            key={i}
            x={el.align === "center" ? 200 : el.x * 400}
            y={el.y * 300}
            dominantBaseline="hanging"
            textAnchor={el.align === "center" ? "middle" : "start"}
            fontSize={el.size * 300}
            fontWeight={el.bold ? 700 : 400}
            fontFamily={el.font === "mono" ? "monospace" : "sans-serif"}
            fill={el.color}
            textLength={el.text.length * el.size * 300 * 0.56 > 400 ? 392 : undefined}
            lengthAdjust="spacingAndGlyphs"
          >
            {el.text}
          </text>
        )
      )}
    </svg>
  );
}

const blankText = (): TemplateElement => ({ kind: "text", text: "Text", x: 0.5, y: 0.4, size: 0.15, color: "#111318", bold: true, font: "heading", align: "center" });
const blankRect = (): TemplateElement => ({ kind: "rect", x: 0, y: 0, w: 1, h: 0.2, color: "#2A2DC8", radius: 0 });

/**
 * Admin: manage design templates (PRD § 03 "Manage products & templates").
 * Positions and sizes are fractions of the product's safe area, so a template
 * fits every size of a product and can never place content outside it.
 */
export function TemplateManager() {
  const [products, setProducts] = useState<Array<{ id: string; name: string; division_slug?: string }>>([]);
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [division, setDivision] = useState<string>(DIVISIONS[0][0]);
  const [productId, setProductId] = useState("");
  const [elements, setElements] = useState<TemplateElement[]>([blankText()]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/templates");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setTemplates(data.templates || []);
    else setError(data.error || "Could not load templates.");
  }, []);

  // Templates and the product list (for the "product" picker) load when the tab opens.
  useEffect(() => {
    load();
    fetch("/api/admin/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProducts(data?.products || []))
      .catch(() => undefined);
  }, [load]);

  const updateEl = (i: number, patch: Partial<TemplateElement>) =>
    setElements((prev) => prev.map((el, j) => (j === i ? ({ ...el, ...patch } as TemplateElement) : el)));

  const save = async () => {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, divisionSlug: division, productId: productId || null, elements }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the template.");
      setNotice(`Template "${data.template.name}" saved.`);
      setName("");
      setElements([blankText()]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save the template.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (t: DesignTemplate) => {
    const res = await fetch(`/api/admin/templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || "Update failed.");
    await load();
  };

  const remove = async (t: DesignTemplate) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    const res = await fetch(`/api/admin/templates/${t.id}`, { method: "DELETE" });
    if (!res.ok) setError((await res.json().catch(() => ({}))).error || "Delete failed.");
    await load();
  };

  const divisionProducts = products.filter((p) => !p.division_slug || p.division_slug === division);
  const num = (v: string) => Math.min(1, Math.max(0, Number(v) || 0));

  return (
    <div className="space-y-6" data-testid="template-manager">
      {error && <div role="alert" className="p-3 rounded border border-red-200 bg-red-50 text-xs text-red-700">{error}</div>}
      {notice && <div role="status" className="p-3 rounded border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">{notice}</div>}

      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">New design template</CardTitle>
          <CardDescription className="text-xs">
            Positions and sizes are fractions (0–1) of the product&apos;s safe area, so the layout fits every size and stays printable.
            Use <code>{"{{number}}"}</code> and <code>{"{{name}}"}</code> as placeholders for race numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" data-testid="template-name" />
              <select value={division} onChange={(e) => { setDivision(e.target.value); setProductId(""); }} className="h-8 rounded-md border border-neutral-200 px-2 text-xs" aria-label="Division">
                {DIVISIONS.map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
              </select>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-8 rounded-md border border-neutral-200 px-2 text-xs" aria-label="Product">
                <option value="">All products in division</option>
                {divisionProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {elements.map((el, i) => (
              <div key={i} className="p-2 rounded border border-neutral-200 bg-neutral-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{el.kind === "text" ? "Text" : "Block"} {i + 1}</span>
                  <button type="button" className="text-red-600" onClick={() => setElements((p) => p.filter((_, j) => j !== i))} disabled={elements.length === 1}>Remove</button>
                </div>
                {el.kind === "text" && (
                  <Input value={el.text} onChange={(e) => updateEl(i, { text: e.target.value })} className="h-7 text-xs" aria-label="Text" />
                )}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 items-center">
                  <label>x <Input type="number" step="0.05" min="0" max="1" value={el.x} onChange={(e) => updateEl(i, { x: num(e.target.value) })} className="h-7 text-xs" /></label>
                  <label>y <Input type="number" step="0.05" min="0" max="1" value={el.y} onChange={(e) => updateEl(i, { y: num(e.target.value) })} className="h-7 text-xs" /></label>
                  {el.kind === "text" ? (
                    <>
                      <label>size <Input type="number" step="0.01" min="0.02" max="1" value={el.size} onChange={(e) => updateEl(i, { size: Math.max(0.02, num(e.target.value)) })} className="h-7 text-xs" /></label>
                      <label className="flex items-center gap-1 pt-4"><input type="checkbox" checked={!!el.bold} onChange={(e) => updateEl(i, { bold: e.target.checked })} /> bold</label>
                      <label className="flex items-center gap-1 pt-4"><input type="checkbox" checked={el.align === "center"} onChange={(e) => updateEl(i, { align: e.target.checked ? "center" : "left" })} /> centre</label>
                    </>
                  ) : (
                    <>
                      <label>w <Input type="number" step="0.05" min="0" max="1" value={el.w} onChange={(e) => updateEl(i, { w: num(e.target.value) })} className="h-7 text-xs" /></label>
                      <label>h <Input type="number" step="0.05" min="0" max="1" value={el.h} onChange={(e) => updateEl(i, { h: num(e.target.value) })} className="h-7 text-xs" /></label>
                      <span />
                    </>
                  )}
                  <label>colour <input type="color" value={el.color} onChange={(e) => updateEl(i, { color: e.target.value })} className="h-7 w-full" /></label>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="text-xs" onClick={() => setElements((p) => [...p, blankText()])} disabled={elements.length >= 30}>+ Text</Button>
              <Button type="button" size="sm" variant="outline" className="text-xs" onClick={() => setElements((p) => [...p, blankRect()])} disabled={elements.length >= 30}>+ Colour block</Button>
              <Button type="button" size="sm" className="text-xs" onClick={save} disabled={saving || !name.trim()} data-testid="template-save">
                {saving ? "Saving…" : "Save template"}
              </Button>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-600 mb-2">Preview (safe area)</div>
            <TemplatePreview elements={elements} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All templates</CardTitle>
          <CardDescription className="text-xs">Built-in starters ship with the platform; your templates appear first in the designer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="p-3 rounded-lg border border-neutral-200 space-y-2" data-testid="template-card">
              <TemplatePreview elements={t.elements} />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-neutral-500">
                    {DIVISIONS.find(([s]) => s === t.divisionSlug)?.[1] ?? t.divisionSlug}
                    {t.productId ? ` · ${products.find((p) => p.id === t.productId)?.name ?? t.productId}` : ""}
                  </div>
                </div>
                {t.builtIn ? (
                  <Badge className="bg-neutral-100 text-neutral-700">Built-in</Badge>
                ) : (
                  <Badge className={t.isActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{t.isActive ? "Active" : "Hidden"}</Badge>
                )}
              </div>
              {!t.builtIn && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggle(t)}>{t.isActive ? "Hide" : "Show"}</Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 text-red-600" onClick={() => remove(t)}>Delete</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
