import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILT_IN_TEMPLATES, applyTemplate, templateTextWidth } from "../templates";
import { calculatePrintBounds } from "../utils/print-constraints";

const sizes = [
  { widthMm: 50, heightMm: 50 },
  { widthMm: 210, heightMm: 148 },
  { widthMm: 300, heightMm: 60 },
  { widthMm: 60, heightMm: 300 },
];

test("every built-in template lands inside the safe area at every size", () => {
  const divisions = new Set(BUILT_IN_TEMPLATES.map((t) => t.divisionSlug));
  assert.equal(divisions.size, 6, "one or more templates per division");
  for (const size of sizes) {
    const b = calculatePrintBounds({ ...size, bleedMm: 3, safetyMarginMm: 3 }, 700, 520);
    const right = b.safeOffsetX + b.safeWidth + 0.5;
    const bottom = b.safeOffsetY + b.safeHeight + 0.5;
    for (const tpl of BUILT_IN_TEMPLATES) {
      for (const el of applyTemplate(tpl, b)) {
        assert.ok(el.x >= b.safeOffsetX - 0.5 && el.y >= b.safeOffsetY - 0.5, `${tpl.id} starts inside`);
        if (el.type === "text") {
          assert.ok(el.x + templateTextWidth(el.text, el.fontSize, !!el.isBold, el.fontFamily === "JetBrains Mono") <= right, `${tpl.id} text fits width at ${size.widthMm}x${size.heightMm}`);
        } else if (el.type !== "image") {
          assert.ok(el.x + el.width <= right && el.y + el.height <= bottom, `${tpl.id} block fits`);
        }
      }
    }
  }
});

test("race bib placeholders are filled", () => {
  const b = calculatePrintBounds({ widthMm: 210, heightMm: 148, bleedMm: 3, safetyMarginMm: 3 }, 700, 520);
  const bib = BUILT_IN_TEMPLATES.find((t) => t.id === "tpl-race-bib")!;
  const texts = applyTemplate(bib, b, { number: "7", name: "ASHA" }).flatMap((e) => (e.type === "text" ? [e.text] : []));
  assert.ok(texts.includes("7") && texts.includes("ASHA"));
});
