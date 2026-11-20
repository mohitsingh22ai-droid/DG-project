import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateWatermarkedProofSvg } from "../proof-generator";
import { ProofMetadata } from "../types";

/*
 * The approval gate itself (paid + approved proof → files unlock) is covered by
 * pipeline/__tests__/pipeline-rules.test.ts (checkReadyForProduction) and the
 * draft state machine tests; this file covers the proof artwork.
 */
describe("Watermarked visual proof (PRD § 08)", () => {
  const meta: ProofMetadata = {
    version: 1,
    widthMm: 175,
    heightMm: 155,
    materialName: "0.8mm Flexible Polypropylene",
    bleedMm: 4.0,
    orderNumber: "DH-2026-00101",
    createdAt: new Date().toISOString(),
  };

  it("labels the proof with its version and print geometry", () => {
    const svg = generateWatermarkedProofSvg(meta);
    assert.ok(svg.includes("PROOF v1"));
    assert.ok(svg.includes("Trim 175×155 mm"));
    assert.ok(svg.includes("bleed 4 mm"));
  });

  it("shows the version it was generated for", () => {
    assert.ok(generateWatermarkedProofSvg({ ...meta, version: 3 }).includes("PROOF v3"));
  });
});
