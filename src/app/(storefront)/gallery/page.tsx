import Link from "next/link";
import { ArrowRight, Calculator, PenTool, ListOrdered } from "lucide-react";
import { getAllDivisions, getAllProducts } from "@/modules/catalog/catalog-store";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/modules/pricing/gst";

export const metadata = {
  title: "Our Work Gallery · W2P Print House",
  description: "Real print work from our six product ranges: labels, race bibs, MTB boards, stamps, trophies and laser-cut work.",
};

export const revalidate = 60;

/**
 * Gallery of real work (PRD § 01, § 12), organised by product family. Each tile
 * leads straight to designing or pricing that product; the chips filter by range
 * (?range=<division slug>), so there is no detour back to the home page.
 */
export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const [{ range }, divisions, products] = await Promise.all([searchParams, getAllDivisions(), getAllProducts()]);
  const activeRange = divisions.some((d) => d.slug === range) ? range : undefined;
  const shown = activeRange ? products.filter((p) => p.division_slug === activeRange) : products;
  const divisionName = (slug: string) => divisions.find((d) => d.slug === slug)?.name ?? slug;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <header className="space-y-2 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-brand-800">Our Work Gallery</h1>
        <p className="text-muted-foreground">
          Real jobs from our print house. Pick one you like, then design your own or check the price for your size and quantity.
        </p>
      </header>

      {/* Filter by product range */}
      <nav aria-label="Filter by product range" className="flex flex-wrap gap-2">
        <Link
          href="/gallery"
          scroll={false}
          aria-current={!activeRange ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            !activeRange ? "bg-brand-700 border-brand-700 text-white" : "bg-card border-border text-foreground hover:border-brand-300"
          }`}
        >
          All products
        </Link>
        {divisions.map((d) => (
          <Link
            key={d.slug}
            href={`/gallery?range=${d.slug}`}
            scroll={false}
            aria-current={activeRange === d.slug ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeRange === d.slug ? "bg-brand-700 border-brand-700 text-white" : "bg-card border-border text-foreground hover:border-brand-300"
            }`}
          >
            {d.name}
          </Link>
        ))}
      </nav>

      {/* Product tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shown.map((prod) => (
          <article
            key={prod.id}
            className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-glass hover-lift"
            data-testid="gallery-card"
          >
            <Link href={`/designer/${prod.slug}`} className="block aspect-[4/3] bg-muted overflow-hidden" aria-label={`Start designing ${prod.name}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prod.image_url}
                alt={prod.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </Link>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">{divisionName(prod.division_slug)}</div>
                <h2 className="text-lg font-semibold text-foreground leading-snug">{prod.name}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2">{prod.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {prod.min_width_mm}–{prod.max_width_mm} mm wide
                </span>
                <span>{prod.allowed_materials.length} materials</span>
                {prod.has_variable_data && (
                  <span className="inline-flex items-center gap-1 text-brand-700">
                    <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
                    Variable data printing
                  </span>
                )}
              </div>
              <div className="mt-auto pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">From</div>
                  <div className="font-semibold text-foreground">{formatINR(prod.base_price_cents)} per piece</div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/calculator?product=${prod.slug}`}>
                      <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                      See prices
                    </Link>
                  </Button>
                  <Button asChild variant="cta" size="sm">
                    <Link href={`/designer/${prod.slug}`}>
                      <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
                      Start designing
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && <p className="text-muted-foreground">No products in this range yet.</p>}

      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Not sure what you need?</h2>
          <p className="text-sm text-muted-foreground">Compare sizes, materials and bulk discounts before you design.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/calculator">
            Open the price calculator
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
