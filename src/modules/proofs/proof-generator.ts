import { escapeXml } from "./design-render";
import { ProofMetadata } from "./types";

/*
 * Proof artwork (PRD § 08). The approval rules themselves live server-side:
 *   - drafts/draft-store.ts          approve / request changes on a job before payment
 *   - app/api/proofs/[id]/*          approve / request changes on a paid order
 *   - orders/order-store.ts          checkReadyForProduction(): the production-file gate
 */

/**
 * Builds the customer proof (§ 08): the actual artwork drawn at its true
 * proportions inside the trim box, with the bleed area shaded and a caption strip
 * naming the proof version, product, size and date (no text over the artwork). `artworkFragment` is SVG in mm units covering the bleed
 * box (see renderDesignFragment); when it is missing (e.g. PDF/AI uploads that are
 * checked by pre-press) a clearly labelled placeholder is shown instead.
 */
export function generateWatermarkedProofSvg(meta: ProofMetadata, artworkFragment?: string, placeholderLabel?: string): string {
  const w = meta.widthMm || 75;
  const h = meta.heightMm || 75;
  const b = meta.bleedMm ?? 3;
  const fullW = w + 2 * b;
  const fullH = h + 2 * b;
  const strip = Math.max(8, fullH * 0.12);
  const fontSize = Math.max(2.2, Math.min(fullW, fullH) * 0.045);
  const esc = (v: string) => escapeXml(v);

  const artwork =
    artworkFragment ??
    `<rect x="0" y="0" width="${fullW}" height="${fullH}" fill="#F5F5F4"/>
     <text x="${fullW / 2}" y="${fullH / 2}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize * 1.4}" fill="#57534E">${esc(placeholderLabel || "Artwork preview unavailable")}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullW} ${fullH + strip}" width="${fullW * 4}" height="${(fullH + strip) * 4}">
  <defs><clipPath id="bleed"><rect x="0" y="0" width="${fullW}" height="${fullH}"/></clipPath></defs>
  <g clip-path="url(#bleed)">${artwork}</g>
  <path d="M0 0H${fullW}V${fullH}H0Z M${b} ${b}V${b + h}H${b + w}V${b}Z" fill="#000" fill-opacity="0.18" fill-rule="evenodd"/>
  <rect x="${b}" y="${b}" width="${w}" height="${h}" fill="none" stroke="#DC2626" stroke-width="${Math.max(0.15, fullW / 400)}" stroke-dasharray="1 0.6"/>
  <rect x="0" y="${fullH}" width="${fullW}" height="${strip}" fill="#18181B"/>
  <text x="${fontSize}" y="${fullH + strip * 0.42}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" fill="#FAFAFA">${esc(`Proof v${meta.version} · ${meta.productName || meta.materialName || ""}`)}</text>
  <text x="${fontSize}" y="${fullH + strip * 0.8}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize * 0.85}" fill="#A1A1AA">${esc(`Trim ${w}×${h} mm · bleed ${b} mm (shaded) · ${meta.materialName || ""} · ${meta.createdAt.slice(0, 10)}`)}</text>
</svg>`;
}
