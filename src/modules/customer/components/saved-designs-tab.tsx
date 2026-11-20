"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkCheck } from "lucide-react";
import type { SavedDesign } from "@/types/database";

/**
 * Customer → Saved designs (PRD § 06, § 09): artwork saved to the account,
 * reopened in the designer for a new order.
 */
export function SavedDesignsTab({ savedDesigns }: { savedDesigns: SavedDesign[] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-heading">Saved designs</h2>
        <span className="text-xs font-mono text-muted-foreground">
          Designs you saved, ready to order again
        </span>
      </div>

      {savedDesigns.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <BookmarkCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-heading font-bold text-base text-foreground mb-1">No Saved Designs in Library</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
            Save a design in the designer to reuse it anytime.
          </p>
          <Button asChild size="sm" className="text-xs font-semibold bg-brand-500 hover:bg-brand-600">
            <Link href="/designer/custom-die-cut-vinyl">Open Visual Designer</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDesigns.map((des) => (
            <Card key={des.id} className="overflow-hidden border-border hover:border-brand-500 transition-colors">
              <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={des.preview_url}
                  alt={des.name}
                  className="w-full h-full object-cover"
                />
                <Badge variant="industrial" className="absolute top-3 right-3 text-[10px]">
                  {des.width_mm}mm × {des.height_mm}mm
                </Badge>
              </div>
              <CardContent className="p-5 space-y-3">
                <div>
                  <h4 className="font-bold text-base font-heading">{des.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{des.material}</p>
                </div>
                <div className="pt-3 border-t flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/designer/${(des as SavedDesign & { product_slug?: string }).product_slug || des.product_id}?design=${des.id}`)}
                    className="w-full text-xs font-semibold"
                  >
                    Open in Designer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
