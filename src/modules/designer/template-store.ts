import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { BUILT_IN_TEMPLATES, DesignTemplate, TemplateElement } from "./templates";

/** Admin-managed design templates (public.design_templates) merged with the built-in starters. */

const frac = z.number().min(0).max(1);
export const TemplateElementSchema: z.ZodType<TemplateElement> = z.union([
  z.object({
    kind: z.literal("text"),
    text: z.string().trim().min(1).max(120),
    x: frac, y: frac, size: z.number().min(0.02).max(1),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    bold: z.boolean().optional(),
    font: z.enum(["heading", "body", "mono"]).optional(),
    align: z.enum(["left", "center"]).optional(),
  }),
  z.object({
    kind: z.literal("rect"),
    x: frac, y: frac, w: frac, h: frac,
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    radius: z.number().min(0).max(200).optional(),
  }),
]);

export const TemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  divisionSlug: z.string().trim().min(1).max(60),
  productId: z.string().trim().min(1).max(80).nullable().optional(),
  elements: z.array(TemplateElementSchema).min(1).max(30),
  isActive: z.boolean().optional(),
});

interface Row { id: string; division_slug: string; product_id: string | null; name: string; elements: TemplateElement[]; is_active: boolean }
const toTemplate = (r: Row): DesignTemplate => ({ id: r.id, name: r.name, divisionSlug: r.division_slug, productId: r.product_id, elements: r.elements, isActive: r.is_active });

/** Stored templates; an empty list when the table has not been migrated yet. */
async function stored(filter?: { divisionSlug?: string; activeOnly?: boolean }): Promise<DesignTemplate[]> {
  let q = db().from("design_templates").select("*").order("created_at");
  if (filter?.divisionSlug) q = q.eq("division_slug", filter.divisionSlug);
  if (filter?.activeOnly) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) {
    console.warn("[templates] design_templates unavailable:", error.message);
    return [];
  }
  return (data as Row[]).map(toTemplate);
}

/** Templates a customer can start from for a product. */
export async function templatesForProduct(productId: string, divisionSlug: string): Promise<DesignTemplate[]> {
  const custom = (await stored({ divisionSlug, activeOnly: true })).filter((t) => !t.productId || t.productId === productId);
  return [...custom, ...BUILT_IN_TEMPLATES.filter((t) => t.divisionSlug === divisionSlug)];
}

export async function listAllTemplates(): Promise<DesignTemplate[]> {
  return [...(await stored()), ...BUILT_IN_TEMPLATES];
}

export async function createTemplate(input: z.infer<typeof TemplateInputSchema>, actorEmail: string): Promise<DesignTemplate> {
  const { data, error } = await db().from("design_templates").insert({
    name: input.name, division_slug: input.divisionSlug, product_id: input.productId ?? null,
    elements: input.elements, is_active: input.isActive ?? true, created_by: actorEmail,
  }).select("*").single();
  if (error) throw new Error(`Save template: ${error.message}`);
  return toTemplate(data as Row);
}

export async function updateTemplate(id: string, input: Partial<z.infer<typeof TemplateInputSchema>>): Promise<DesignTemplate | null> {
  const cols: Record<string, unknown> = {};
  if (input.name !== undefined) cols.name = input.name;
  if (input.divisionSlug !== undefined) cols.division_slug = input.divisionSlug;
  if (input.productId !== undefined) cols.product_id = input.productId;
  if (input.elements !== undefined) cols.elements = input.elements;
  if (input.isActive !== undefined) cols.is_active = input.isActive;
  const { data, error } = await db().from("design_templates").update(cols).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(`Update template: ${error.message}`);
  return data ? toTemplate(data as Row) : null;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await db().from("design_templates").delete().eq("id", id);
  if (error) throw new Error(`Delete template: ${error.message}`);
}
