import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { listAllTemplates, createTemplate, TemplateInputSchema } from "@/modules/designer/template-store";
import { logAdminAction } from "@/modules/audit/audit-store";

/** Admin: list and create design templates (PRD § 03 "Manage products & templates"). */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;
  return NextResponse.json({ templates: await listAllTemplates() });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;
  const parsed = TemplateInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid template", details: parsed.error.format() }, { status: 400 });
  try {
    const template = await createTemplate(parsed.data, auth.user.email);
    await logAdminAction(auth.user.id, auth.user.email, "product_template_edit", "template", template.id, { created: template.name });
    return NextResponse.json({ template }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to save template" }, { status: 500 });
  }
}
