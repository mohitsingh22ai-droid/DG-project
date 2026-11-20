import { NextResponse } from "next/server";
import { getAllDivisions, getAllProducts } from "@/modules/catalog/catalog-store";

/**
 * Public catalogue summary for the navigation's product menu. Only fields that the
 * public catalogue pages already show are returned (no pricing formulas or
 * internal settings), for active divisions and products only.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const [divisions, products] = await Promise.all([getAllDivisions(), getAllProducts()]);
    return NextResponse.json(
      {
        divisions: divisions.map((d) => ({ slug: d.slug, name: d.name, tagline: d.tagline, description: d.description })),
        products: products.map((p) => ({
          slug: p.slug,
          name: p.name,
          subtitle: p.subtitle,
          divisionSlug: p.division_slug,
          imageUrl: p.image_url,
          basePricePaise: p.base_price_cents,
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ error: "Catalogue unavailable" }, { status: 503 });
  }
}
