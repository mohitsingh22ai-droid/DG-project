import { formatINR } from "@/modules/pricing/gst";
import Link from "next/link";
import { Division, Product } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sliders } from "lucide-react";

interface DivisionViewProps {
  division: Division;
  products: Product[];
}

export function DivisionView({ division, products }: DivisionViewProps) {
  return (
    <div className="space-y-12 pb-16">
      {/* Header Banner */}
      <div className="p-8 sm:p-12 rounded-2xl bg-industrial-950 text-white border border-industrial-800 relative overflow-hidden">
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at right, ${division.accent_color}, transparent 70%)`,
          }}
        />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center gap-2">
            <Badge variant="industrial" className="text-xs">
              DIVISION {division.order_index} OF 6
            </Badge>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: division.accent_color }}
            />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading tracking-tight">
            {division.name}
          </h1>
          <p className="text-lg font-mono text-brand-600">
            {division.tagline}
          </p>
          <p className="text-sm text-industrial-300 leading-relaxed max-w-2xl font-sans">
            {division.description}
          </p>
        </div>
      </div>

      {/* Products in this range */}
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold font-heading">
              Products in this range
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Choose your own size, material and quantity, then design online or upload your artwork.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => (
            <Card key={prod.id} className="overflow-hidden flex flex-col justify-between group hover:border-brand-500 transition-colors">
              <div>
                <div className="aspect-[16/10] w-full overflow-hidden relative bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prod.image_url}
                    loading="lazy"
                    decoding="async"
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {prod.has_variable_data && (
                    <Badge variant="default" className="absolute top-3 left-3 bg-blue-600 text-[10px] font-mono">
                      Names &amp; numbers from a spreadsheet
                    </Badge>
                  )}
                </div>

                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg font-heading group-hover:text-brand-500 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {prod.subtitle}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/50 border text-xs font-mono space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sizes:</span>
                      <span className="text-foreground font-semibold">
                        {prod.min_width_mm}–{prod.max_width_mm}mm W × {prod.min_height_mm}–{prod.max_height_mm}mm H
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Materials:</span>
                      <span className="text-foreground font-semibold">
                        {prod.allowed_materials.length} options
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Edge allowance (bleed):</span>
                      <span className="text-foreground font-semibold">
                        +{prod.default_bleed_mm}mm
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0 mt-auto">
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground block">FROM</span>
                    <span className="font-mono font-bold text-sm text-foreground">
                      {formatINR(prod.base_price_cents)} per piece
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/calculator?product=${prod.slug}`}>
                        <Sliders className="w-3.5 h-3.5 mr-1.5" />
                        See prices
                      </Link>
                    </Button>
                    <Button asChild variant="cta" size="sm" className="font-semibold">
                      <Link href={`/designer/${prod.slug}`}>Start designing</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
