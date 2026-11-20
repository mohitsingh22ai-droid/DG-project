import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestDraftProofChanges, calculateDraftPrice, getDraft, presentDraft } from "@/modules/drafts/draft-store";
import { authorizeDraft } from "@/lib/draft-access";

const RequestChangesSchema = z.object({
  feedback: z.string().trim().min(1).max(2000).optional(),
});

/**
 * Before payment (PRD § 06, § 08): the job's owner revises their own design. The
 * current proof is marked "changes requested" with their note and the next version
 * is opened for review. Paid orders use /api/orders/[id]/change-request instead,
 * which goes to pre-press.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = RequestChangesSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Feedback must be 1–2000 characters." }, { status: 400 });
    }

    const draft = await getDraft(id);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const access = await authorizeDraft(req, draft);
    if (!access.ok) return access.response;

    const feedback = parsed.data.feedback || "Customer requested revisions to artwork.";
    const actor = { id: access.actor.id, email: access.actor.email };
    const updatedDraft = await requestDraftProofChanges(id, feedback, actor);
    const pricing = await calculateDraftPrice(updatedDraft);

    // Before payment the customer revises their own design, so no email is sent:
    // the new version and the reason are recorded in the job's proof history.
    return NextResponse.json({
      success: true,
      draft: await presentDraft(updatedDraft),
      pricing,
      message: `Changes requested. Revision v${updatedDraft.proofVersion} is ready for review.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to request proof changes";
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
