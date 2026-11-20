import { NextRequest, NextResponse } from "next/server";
import { templatesForProduct } from "@/modules/designer/template-store";

/** Public: design templates a customer can start from for a product (PRD § 06). */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product") || "";
  const division = req.nextUrl.searchParams.get("division") || "";
  if (!division) return NextResponse.json({ error: "division is required" }, { status: 400 });
  return NextResponse.json({ templates: await templatesForProduct(productId, division) });
}
