import { formatINR } from "@/modules/pricing/gst";
import Link from "next/link";
import { getAllDivisions, getAllProducts } from "@/modules/catalog/catalog-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Zap,
  Sparkles,
  Sliders,
  FileCheck2,
  Cpu,
} from "lucide-react";

// Catalogue pages are cached and refreshed at most once a minute.
export const revalidate = 60;

export default async function HomePage() {
  const [DIVISIONS, PRODUCTS] = await Promise.all([getAllDivisions(), getAllProducts()]);
  return (
    <div className="flex flex-col gap-14 md:gap-20 pb-16">
      {/* HERO: green panel with real product pictures (PRD § 12 "confident accent") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-6 sm:p-10 lg:p-14">
            <div className="space-y-6 relative z-10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-200">
                Six print divisions · One print house
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-semibold leading-[1.05] text-white">
                Custom Printing,
                <span className="block">Made Simple.</span>
              </h1>
              <p className="text-base sm:text-lg text-brand-100 leading-relaxed max-w-xl">
                Design, configure and order high-quality print products, from labels and race numbers to stamps,
                trophies and laser-cut work. Live prices, proofs you approve, print-ready files.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild size="lg" variant="cta" className="text-base">
                  <Link href="#divisions">
                    Design Now
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-base bg-transparent text-white border-white/50 hover:bg-white hover:text-brand-800"
                >
                  <Link href="/gallery">Browse Products</Link>
                </Button>
              </div>
            </div>

            {/* Collage of product pictures */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {PRODUCTS.slice(0, 4).map((prod, i) => (
                <div
                  key={prod.id}
                  className={`overflow-hidden rounded-2xl bg-brand-700 shadow-2xl ring-1 ring-white/10 ${i % 2 === 1 ? "translate-y-4 sm:translate-y-6" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prod.image_url} alt={prod.name} className="w-full aspect-[4/3] object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {[
            { icon: Sliders, title: "Instant Pricing", text: "Live price by size, material and quantity" },
            { icon: Sparkles, title: "Online Designer", text: "Design inside the printable area" },
            { icon: FileCheck2, title: "Proof Before Print", text: "Versioned proofs you approve" },
            { icon: Cpu, title: "Production Ready", text: "300 DPI files with bleed" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT HUB: equal-weight tiles as navigation (PRD § 12) */}
      <section id="divisions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-brand-800">Explore Our Print Range</h2>
          <p className="text-sm text-muted-foreground mt-2">Six specialist divisions. Pick one to choose sizes, materials and quantities.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {DIVISIONS.map((div) => {
            const image = PRODUCTS.find((p) => p.division_slug === div.slug)?.image_url;
            return (
              <Link
                key={div.id}
                href={`/divisions/${div.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover-lift"
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <span className="text-sm font-semibold text-foreground leading-tight">{div.name}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-brand-600 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* REQUIRED SURFACE 2: INSTANT CALCULATOR PREVIEW CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-card p-6 sm:p-12 border border-border shadow-glass relative overflow-hidden">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-flame-50 text-flame-700 font-mono text-xs font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>INSTANT FORMULA PRICING ENGINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold font-heading tracking-tight text-brand-800">
                Stop waiting for quotation emails. Configure dimensions and get live prices.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                Every product calculates dynamically based on millimetric area, material multipliers, and automatic volume discount thresholds starting from 50+ units. Full GST transparency included.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="cta" className="font-semibold">
                  <Link href="/calculator">
                    Launch Interactive Calculator
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="industrial" className="border-industrial-700">
                  <Link href="/divisions/race-event-numbers">
                    Race & Event Numbers (CSV Merge)
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-brand-800 text-white rounded-2xl p-5 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-brand-600 text-brand-200">
                <span>FORMULA MATRIX</span>
                <Badge variant="outline" className="text-[10px] text-flame-400 border-flame-400/40">
                  REAL-TIME
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Base Unit Rate:</span>
                <span className="text-white">₹4.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Area (75mm x 75mm):</span>
                <span className="text-white">56.3 cm² (+₹14.06)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Material (Gloss Vinyl):</span>
                <span className="text-brand-200">1.0x (Standard)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Volume Tier (250 units):</span>
                <span className="text-flame-400">-30% Automated Discount</span>
              </div>
              <div className="pt-2 border-t border-brand-600 flex justify-between font-bold text-sm">
                <span className="text-white">Total (excl. GST):</span>
                <span className="text-flame-400">₹1,445.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REQUIRED SURFACE 3: GALLERY OF REAL WORK ORGANIZED BY PRODUCT FAMILY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase text-brand-600 dark:text-brand-600 tracking-wider">
              Featured Production Work
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight font-heading mt-1 text-brand-800">
              Live Showcase of Real Print Work
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Finished physical outputs from our production floor across all six divisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((prod) => (
            <Card key={prod.id} className="overflow-hidden group hover:border-brand-300 transition-colors">
              <div className="aspect-[4/3] w-full overflow-hidden relative bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.image_url}
                    loading="lazy"
                    decoding="async"
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <Badge
                  variant="industrial"
                  className="absolute top-3 right-3 text-[10px] bg-card/90"
                >
                  {prod.division_slug.toUpperCase()}
                </Badge>
              </div>
              <CardContent className="p-5">
                <div className="text-xs font-mono text-muted-foreground mb-1">
                  Min: {prod.min_width_mm}mm · Max: {prod.max_width_mm}mm
                </div>
                <h4 className="font-bold text-base font-heading group-hover:text-brand-500 transition-colors">
                  {prod.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {prod.subtitle}
                </p>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    From {formatINR(prod.base_price_cents)} / unit
                  </span>
                  <Link
                    href={`/calculator?product=${prod.slug}`}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-600 hover:underline flex items-center gap-1"
                  >
                    Customise & Price
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CORE OBJECTIVES VALUE PILLARS (§ 02) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-border pt-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-2 font-mono text-[11px]">
            THE PRODUCTION ADVANTAGE
          </Badge>
          <h2 className="text-3xl font-semibold font-heading tracking-tight text-brand-800">
            Designed for the Workshop Floor
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Why commercial print businesses need more than just an image upload button.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-glass">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-500 font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base font-heading">Constrained In-Browser Design</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Customers design artwork locked inside bleed, trim, and safety zones. Unprintable artwork is physically impossible to submit.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-glass">
            <div className="w-10 h-10 rounded-lg bg-flame-50 flex items-center justify-center text-flame-600 font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base font-heading">Versioned Proofs & Approval Gate</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every revision is logged (v1, v2). High-resolution print files stay strictly locked until the client formally approves the proof.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-glass">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base font-heading">Server-Side 300 DPI & CSV Merge</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Automated high-res vector output and row-by-row variable data merges (numbers, athlete names, barcodes) generated server-side.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
