import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server-auth";
import { getOrderById, logOrderNote } from "@/modules/orders/order-store";
import { getDraft, updateDraft } from "@/modules/drafts/draft-store";
import { signedUploadUrl, downloadFile, deleteFile } from "@/lib/storage";
import { precheckArtwork, inspectArtwork, fileExtension } from "@/modules/designer/artwork-validation";
import { logAdminAction } from "@/modules/audit/audit-store";

/**
 * Pre-press uploads corrected artwork for a paid order (PRD § 08 change requests).
 * Same checks as a customer upload (type by content, resolution, unsafe SVG).
 * Allowed only while the order is at ARTWORK; the next step is "Send revised proof",
 * which builds proof v+1 from this file for the customer to approve.
 *
 *   POST { fileName, sizeBytes } → one-time signed upload URL
 *   PUT  { path, fileName }      → inspect the stored file and attach it to the order's job
 */

const RequestSchema = z.object({ fileName: z.string().trim().min(1).max(200), sizeBytes: z.number().int().positive() });
const ConfirmSchema = z.object({ path: z.string().min(1).max(512), fileName: z.string().trim().min(1).max(200) });

async function loadArtworkOrder(id: string) {
  const order = await getOrderById(id);
  if (!order) return { error: NextResponse.json({ error: `Order '${id}' not found` }, { status: 404 }) };
  if (!order.draft_id) return { error: NextResponse.json({ error: "This order has no job artwork." }, { status: 409 }) };
  if (order.pipeline_stage !== "ARTWORK") {
    return { error: NextResponse.json({ error: "Artwork can only be replaced while the order is at ARTWORK." }, { status: 409 }) };
  }
  return { order, draftId: order.draft_id };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;
  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "fileName and sizeBytes are required." }, { status: 400 });
  const problem = precheckArtwork(parsed.data.fileName, parsed.data.sizeBytes);
  if (problem) return NextResponse.json({ error: problem }, { status: 422 });

  const loaded = await loadArtworkOrder((await params).id);
  if ("error" in loaded) return loaded.error;

  const path = `drafts/${loaded.draftId}/prepress-${crypto.randomUUID()}.${fileExtension(parsed.data.fileName)}`;
  const upload = await signedUploadUrl("artwork", path);
  return NextResponse.json({ path: upload.path, signedUrl: upload.signedUrl });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;
  const parsed = ConfirmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "path and fileName are required." }, { status: 400 });

  const loaded = await loadArtworkOrder((await params).id);
  if ("error" in loaded) return loaded.error;
  const { order, draftId } = loaded;

  // The path must be one issued for this order's job.
  if (!parsed.data.path.startsWith(`drafts/${draftId}/prepress-`) || parsed.data.path.includes("..")) {
    return NextResponse.json({ error: "Invalid upload reference." }, { status: 400 });
  }
  const draft = await getDraft(draftId);
  if (!draft) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await downloadFile("artwork", parsed.data.path);
  } catch {
    return NextResponse.json({ error: "The upload was not received. Please try again." }, { status: 400 });
  }
  const check = inspectArtwork(new Uint8Array(bytes), parsed.data.fileName, draft.options.widthMm, draft.options.heightMm);
  if (!check.ok) {
    await deleteFile("artwork", parsed.data.path);
    return NextResponse.json({ error: check.error, warnings: check.warnings }, { status: 422 });
  }

  const actor = { id: auth.user.id, email: auth.user.email };
  await updateDraft(
    draftId,
    {
      uploadedFileRef: parsed.data.path,
      designJson: {
        source: "upload",
        uploadedBy: "prepress",
        fileName: parsed.data.fileName,
        kind: check.kind,
        contentType: check.contentType,
        sizeBytes: bytes.length,
        pixelWidth: check.pixelWidth,
        pixelHeight: check.pixelHeight,
        effectiveDpi: check.effectiveDpi,
        warnings: check.warnings,
      },
    },
    actor,
    "PREPRESS_ARTWORK_UPLOADED"
  );
  await logOrderNote(order.id, order.pipeline_stage, auth.user.email, `Pre-press uploaded corrected artwork: ${parsed.data.fileName}`);
  await logAdminAction(auth.user.id, auth.user.email, "order_artwork_replace", "order", order.order_number, {
    artworkReplaced: parsed.data.fileName,
  });

  return NextResponse.json({ success: true, kind: check.kind, warnings: check.warnings, effectiveDpi: check.effectiveDpi });
}

/** Uploading and checking large artwork can take longer than the default limit. */
export const maxDuration = 60;
