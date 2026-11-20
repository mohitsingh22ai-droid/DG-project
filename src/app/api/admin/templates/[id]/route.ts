import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { updateTemplate, deleteTemplate, TemplateInputSchema } from "@/modules/designer/template-store";
import { logAdminAction } from "@/modules/audit/audit-store";

const UUID = /^[0-9a-f-]{36}$/i;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Built-in templates cannot be edited." }, { status: 400 });
  const parsed = TemplateInputSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid template", details: parsed.error.format() }, { status: 400 });
  try {
    const template = await updateTemplate(id, parsed.data);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    await logAdminAction(auth.user.id, auth.user.email, "product_template_edit", "template", id, { updated: Object.keys(parsed.data) });
    return NextResponse.json({ template });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Built-in templates cannot be deleted." }, { status: 400 });
  try {
    await deleteTemplate(id);
    await logAdminAction(auth.user.id, auth.user.email, "product_template_edit", "template", id, { deleted: true });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete template" }, { status: 500 });
  }
}
