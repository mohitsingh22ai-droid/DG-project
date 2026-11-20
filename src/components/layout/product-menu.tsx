"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowRight, Hash, Images, Mountain, PenTool, Scissors, Search, Stamp, Tag, Trophy, X } from "lucide-react";
import { formatINR } from "@/modules/pricing/gst";
import { cn } from "@/lib/utils";

/**
 * "Choose your product" menu (opened from the navbar's Products button).
 * Divisions on the left; the selected division's banner and products on the right,
 * with a search across all products. Data comes from the public /api/catalog
 * summary, loaded the first time the menu opens.
 */

interface MenuDivision {
  slug: string;
  name: string;
  tagline: string;
  description: string;
}
interface MenuProduct {
  slug: string;
  name: string;
  subtitle: string;
  divisionSlug: string;
  imageUrl: string | null;
  basePricePaise: number;
}

const DIVISION_ICONS: Record<string, typeof Tag> = {
  "labels-stickers": Tag,
  "race-event-numbers": Hash,
  "mtb-boards": Mountain,
  stamps: Stamp,
  trophies: Trophy,
  "laser-cut": Scissors,
};

// Loaded once per page session and shared by every open of the menu.
let catalogCache: Promise<{ divisions: MenuDivision[]; products: MenuProduct[] }> | null = null;
function loadCatalog() {
  catalogCache ??= fetch("/api/catalog")
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("catalogue"))))
    .catch((err) => {
      catalogCache = null; // allow a retry next time
      throw err;
    });
  return catalogCache;
}

export function ProductMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [divisions, setDivisions] = useState<MenuDivision[]>([]);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState<string>("");
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setFailed(false);
    loadCatalog()
      .then((data) => {
        setDivisions(data.divisions);
        setProducts(data.products);
        setActive((current) => current || data.divisions[0]?.slug || "");
      })
      .catch(() => setFailed(true));
    searchRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const division = divisions.find((d) => d.slug === active);
  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return products.filter((p) => `${p.name} ${p.subtitle}`.toLowerCase().includes(q));
    return products.filter((p) => p.divisionSlug === active);
  }, [products, active, query]);
  const bannerImage = products.find((p) => p.divisionSlug === active && p.imageUrl)?.imageUrl;

  if (!open || typeof document === "undefined") return null;

  // Rendered at the end of <body>: the sticky header's backdrop blur would otherwise
  // confine a fixed-position overlay to the header box.
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-menu-title"
        className="w-full max-w-6xl rounded-3xl bg-background border border-border shadow-2xl p-4 sm:p-8 mt-14 sm:mt-16"
        data-testid="product-menu"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Our products</div>
            <h2 id="product-menu-title" className="text-3xl sm:text-4xl font-heading font-semibold text-brand-800 mt-1">
              Choose Your Product
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Explore our six specialist printing divisions, all under one roof.</p>
          </div>
          <div className="flex items-center gap-3 md:w-[22rem]">
            <label className="relative flex-1">
              <span className="sr-only">Search for a product</span>
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a product…"
                className="w-full h-11 rounded-full border border-border bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted" aria-label="Close product menu">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {failed ? (
          <p role="alert" className="text-sm text-destructive py-10 text-center">
            The catalogue could not be loaded. <Link href="/#divisions" onClick={onClose} className="underline">Browse all products</Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Divisions */}
            <nav className="lg:col-span-4 xl:col-span-3 flex flex-col gap-1 rounded-2xl border border-border bg-card p-2" aria-label="Divisions">
              {divisions.map((d) => {
                const Icon = DIVISION_ICONS[d.slug] ?? Tag;
                const selected = !query && d.slug === active;
                return (
                  <button
                    key={d.slug}
                    onClick={() => {
                      setQuery("");
                      setActive(d.slug);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-left transition-colors",
                      selected ? "bg-brand-700 text-white" : "text-foreground hover:bg-muted"
                    )}
                    aria-pressed={selected}
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{d.name}</span>
                    <ArrowRight className="w-4 h-4 opacity-60" aria-hidden="true" />
                  </button>
                );
              })}
              <div className="mt-3 rounded-xl bg-muted/70 p-4 hidden lg:block">
                <div className="font-semibold text-sm">Not sure where to start?</div>
                <p className="text-xs text-muted-foreground mt-1">Compare sizes, materials and volume discounts before you design.</p>
                <Link href="/calculator" onClick={onClose} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 mt-3 hover:underline">
                  Price calculator <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </nav>

            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              {/* Division banner */}
              {!query && division && (
                <div className="relative overflow-hidden rounded-2xl bg-brand-800 text-white grid grid-cols-1 sm:grid-cols-2 min-h-[11rem]">
                  <div className="p-6 relative z-10">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">{division.name}</div>
                    <h3 className="text-2xl sm:text-3xl font-heading font-semibold mt-2 leading-tight text-white">{division.tagline}</h3>
                    <p className="text-sm text-brand-100 mt-2 line-clamp-3">{division.description}</p>
                    <Link href={`/divisions/${division.slug}`} onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4 text-white hover:underline">
                      Explore products <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  {bannerImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerImage} alt="" className="hidden sm:block w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* Products, plus the ways to start a job */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {visibleProducts.map((p) => (
                  <MenuCard
                    key={p.slug}
                    href={`/calculator?product=${p.slug}`}
                    onClose={onClose}
                    image={p.imageUrl}
                    title={p.name}
                    subtitle={`From ${formatINR(p.basePricePaise)} / unit · configure & price`}
                  />
                ))}
                {!query &&
                  visibleProducts.slice(0, 1).map((p) => (
                    <MenuCard
                      key={`${p.slug}-design`}
                      href={`/designer/${p.slug}`}
                      onClose={onClose}
                      icon={PenTool}
                      title="Design online"
                      subtitle="Start from a template or upload your artwork"
                    />
                  ))}
                {!query && (
                  <MenuCard href="/gallery" onClose={onClose} icon={Images} title="See real work" subtitle="Finished jobs from every division" />
                )}
              </div>
              {query && visibleProducts.length === 0 && (
                <p className="text-sm text-muted-foreground py-6 text-center">No products match “{query}”.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function MenuCard({
  href,
  onClose,
  image,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  onClose: () => void;
  image?: string | null;
  icon?: typeof Tag;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} onClick={onClose} className="group rounded-2xl border border-border bg-card overflow-hidden hover-lift flex flex-col">
      <div className="aspect-[16/8] bg-muted flex items-center justify-center overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : Icon ? (
          <Icon className="w-9 h-9 text-brand-600" aria-hidden="true" />
        ) : null}
      </div>
      <div className="p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{title}</div>
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        </div>
        <span className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:bg-brand-700 group-hover:text-white transition-colors">
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
