import Link from "next/link";
import { getAllDivisions, getAllProducts } from "@/modules/catalog/catalog-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
                Design, price and order high-quality print products, from labels and race numbers to stamps,
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
          <p className="text-sm text-muted-foreground mt-2">Six specialist ranges. Pick one to choose your size, material and quantity.</p>
          <Link href="/gallery" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline mt-3">
            See all products and our work
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
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
                <span>INSTANT PRICES</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold font-heading tracking-tight text-brand-800">
                No quote forms, no waiting. Pick a size and see your price instantly.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                Your price updates as you change the size, material and quantity. Bulk discounts start from 50 pieces, and GST is always shown.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild variant="cta" className="font-semibold">
                  <Link href="/calculator">
                    Open the price calculator
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="industrial" className="border-industrial-700">
                  <Link href="/variable-data">Variable data printing</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-brand-800 text-white rounded-2xl p-5 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-brand-600 text-brand-200">
                <span>EXAMPLE PRICE</span>
                <Badge variant="outline" className="text-[10px] text-flame-400 border-flame-400/40">
                  STICKERS
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Base price:</span>
                <span className="text-white">₹4.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Size 75 × 75 mm:</span>
                <span className="text-white">56.3 cm² (+₹14.06)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">Gloss vinyl:</span>
                <span className="text-brand-200">Standard</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-200">250 pieces:</span>
                <span className="text-flame-400">30% bulk discount</span>
              </div>
              <div className="pt-2 border-t border-brand-600 flex justify-between font-bold text-sm">
                <span className="text-white">Total (excl. GST):</span>
                <span className="text-flame-400">₹1,445.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE OBJECTIVES VALUE PILLARS (§ 02) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-border pt-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-2 font-mono text-[11px]">
            WHY ORDER FROM US
          </Badge>
          <h2 className="text-3xl font-semibold font-heading tracking-tight text-brand-800">
            Print without the guesswork
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            From your first idea to the parcel at your door.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-glass">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-500 font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base font-heading">Designs that always print right</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our online designer keeps your text and images inside the print area, so nothing gets cut off.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-glass">
            <div className="w-10 h-10 rounded-lg bg-flame-50 flex items-center justify-center text-flame-600 font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base font-heading">You approve before we print</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              See a proof of exactly what will be printed. Ask for changes as often as you need; nothing is printed until you approve it.
            </p>
          </div>

          <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-glass">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base font-heading">Variable data printing</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload a spreadsheet of names or race numbers and get a personalised bib, board or badge for every row.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
