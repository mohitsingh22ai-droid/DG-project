import { computeFittedFontSize } from "./utils/print-constraints";
import { CanvasElement, PrintBoundsInPixels } from "./types";

/**
 * Design templates (PRD § 03, § 06): starting layouts a customer opens in the
 * designer. Positions are fractions (0–1) of the product's SAFE area, so one
 * template fits every size of a parameter-driven product and can never place
 * content outside the printable zone. Text size is a fraction of the safe height
 * and is shrunk to fit the safe width.
 */

export type TemplateElement =
  | { kind: "text"; text: string; x: number; y: number; size: number; color: string; bold?: boolean; font?: "heading" | "body" | "mono"; align?: "left" | "center" }
  | { kind: "rect"; x: number; y: number; w: number; h: number; color: string; radius?: number };

export interface DesignTemplate {
  id: string;
  name: string;
  /** Product it belongs to, or null for every product in the division. */
  productId: string | null;
  divisionSlug: string;
  elements: TemplateElement[];
  isActive: boolean;
  builtIn?: boolean;
}

const FONTS = { heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans", mono: "JetBrains Mono" } as const;

const T = (text: string, x: number, y: number, size: number, color: string, opts: Partial<Extract<TemplateElement, { kind: "text" }>> = {}): TemplateElement => ({ kind: "text", text, x, y, size, color, ...opts });
const R = (x: number, y: number, w: number, h: number, color: string, radius = 0): TemplateElement => ({ kind: "rect", x, y, w, h, color, radius });

const builtIn = (id: string, divisionSlug: string, name: string, elements: TemplateElement[]): DesignTemplate => ({ id, name, productId: null, divisionSlug, elements, isActive: true, builtIn: true });

/** Starter layouts that ship with the platform, one set per division. */
export const BUILT_IN_TEMPLATES: DesignTemplate[] = [
  builtIn("tpl-sticker-badge", "labels-stickers", "Brand badge", [
    R(0, 0, 1, 1, "#17442E", 24),
    T("YOUR BRAND", 0.5, 0.32, 0.2, "#FFFFFF", { bold: true, font: "heading", align: "center" }),
    T("HANDMADE IN DELHI", 0.5, 0.62, 0.09, "#B8D1BF", { font: "mono", align: "center" }),
  ]),
  builtIn("tpl-sticker-label", "labels-stickers", "Product label", [
    T("Product name", 0.04, 0.1, 0.18, "#111318", { bold: true, font: "heading" }),
    R(0.04, 0.38, 0.5, 0.02, "#FF5A1F"),
    T("Net wt. 250 g · Best before 06/2027", 0.04, 0.5, 0.08, "#444D5F", { font: "body" }),
    T("www.yourbrand.in", 0.04, 0.78, 0.08, "#17442E", { font: "mono" }),
  ]),
  builtIn("tpl-race-bib", "race-event-numbers", "Race bib", [
    R(0, 0, 1, 0.2, "#1F5A3C"),
    T("EVENT NAME 2026", 0.5, 0.04, 0.1, "#FFFFFF", { bold: true, font: "heading", align: "center" }),
    T("{{number}}", 0.5, 0.28, 0.4, "#111318", { bold: true, font: "heading", align: "center" }),
    T("{{name}}", 0.5, 0.74, 0.1, "#111318", { bold: true, font: "heading", align: "center" }),
    R(0, 0.9, 1, 0.1, "#F59E0B"),
  ]),
  builtIn("tpl-mtb-board", "mtb-boards", "Number board", [
    R(0, 0, 1, 0.22, "#111318", 8),
    T("SERIES · ROUND 1", 0.5, 0.05, 0.11, "#FFD400", { bold: true, font: "heading", align: "center" }),
    T("27", 0.5, 0.3, 0.45, "#111318", { bold: true, font: "heading", align: "center" }),
    T("RIDER NAME", 0.5, 0.8, 0.1, "#111318", { bold: true, font: "heading", align: "center" }),
  ]),
  builtIn("tpl-stamp-received", "stamps", "Received stamp", [
    T("RECEIVED", 0.5, 0.12, 0.28, "#1D4ED8", { bold: true, font: "heading", align: "center" }),
    T("DATE: ____________", 0.5, 0.5, 0.15, "#1D4ED8", { font: "mono", align: "center" }),
    T("COMPANY NAME", 0.5, 0.76, 0.13, "#1D4ED8", { font: "mono", align: "center" }),
  ]),
  builtIn("tpl-stamp-address", "stamps", "Address stamp", [
    T("Company Name Pvt Ltd", 0.02, 0.08, 0.22, "#111318", { bold: true, font: "heading" }),
    T("12, Industrial Area, New Delhi 110020", 0.02, 0.42, 0.15, "#111318", { font: "body" }),
    T("GSTIN 07AAAAA0000A1Z5", 0.02, 0.7, 0.15, "#111318", { font: "mono" }),
  ]),
  builtIn("tpl-trophy-plate", "trophies", "Winner plate", [
    T("WINNER", 0.5, 0.08, 0.2, "#5B3A06", { bold: true, font: "heading", align: "center" }),
    T("Tournament name 2026", 0.5, 0.38, 0.13, "#5B3A06", { font: "body", align: "center" }),
    T("Recipient name", 0.5, 0.6, 0.12, "#5B3A06", { font: "body", align: "center" }),
    T("CATEGORY", 0.5, 0.82, 0.08, "#5B3A06", { font: "mono", align: "center" }),
  ]),
  builtIn("tpl-laser-sign", "laser-cut", "Logo sign", [
    T("BRAND", 0.5, 0.2, 0.36, "#111318", { bold: true, font: "heading", align: "center" }),
    T("TAGLINE GOES HERE", 0.5, 0.66, 0.12, "#1F5A3C", { font: "heading", align: "center" }),
  ]),
];

export function builtInTemplatesFor(divisionSlug: string): DesignTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.divisionSlug === divisionSlug);
}

/** Conservative width estimate (bold caps in Plus Jakarta Sans run ~0.72 em per glyph). */
export function templateTextWidth(text: string, fontSize: number, bold: boolean, mono: boolean): number {
  const em = mono ? 0.62 : bold ? 0.74 : 0.62;
  return [...text].length * fontSize * em;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

/** Turns a template into canvas elements inside the given safe area. */
export function applyTemplate(template: Pick<DesignTemplate, "elements">, b: PrintBoundsInPixels, overrides: Record<string, string> = {}): CanvasElement[] {
  const stamp = Date.now();
  return template.elements.map((el, i): CanvasElement => {
    const x = b.safeOffsetX + clamp01(el.x) * b.safeWidth;
    const y = b.safeOffsetY + clamp01(el.y) * b.safeHeight;
    if (el.kind === "rect") {
      const width = Math.max(5, Math.min(clamp01(el.w) * b.safeWidth, b.safeOffsetX + b.safeWidth - x));
      const height = Math.max(5, Math.min(clamp01(el.h) * b.safeHeight, b.safeOffsetY + b.safeHeight - y));
      return { id: `tpl-${stamp}-${i}`, type: "rect", x, y, width, height, fill: el.color, cornerRadius: el.radius ?? 0, rotation: 0, opacity: 1 };
    }
    const text = el.text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => overrides[k] ?? (k === "number" ? "1042" : k === "name" ? "RUNNER NAME" : k.toUpperCase()));
    const fontFamily = FONTS[el.font ?? "body"];
    const base = Math.max(5, clamp01(el.size) * b.safeHeight);
    const available = el.align === "center" ? b.safeWidth : b.safeOffsetX + b.safeWidth - x;
    const mono = el.font === "mono";
    const fontSize = computeFittedFontSize(text, available, base, 2, 400, (t, size) => templateTextWidth(t, size, !!el.bold, mono));
    const textWidth = templateTextWidth(text, fontSize, !!el.bold, mono);
    const left = el.align === "center" ? b.safeOffsetX + Math.max(0, (b.safeWidth - textWidth) / 2) : Math.min(x, b.safeOffsetX + Math.max(0, b.safeWidth - textWidth));
    const top = Math.min(y, b.safeOffsetY + b.safeHeight - fontSize * 1.2);
    return { id: `tpl-${stamp}-${i}`, type: "text", x: left, y: Math.max(b.safeOffsetY, top), text, fontSize, fontFamily, fill: el.color, align: "left", isBold: !!el.bold, rotation: 0, opacity: 1, autoShrink: true };
  });
}
