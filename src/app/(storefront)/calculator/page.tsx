import { Suspense } from "react";
import { PricingCalculator } from "@/modules/pricing/components/pricing-calculator";
import { getAllProducts } from "@/modules/catalog/catalog-store";

export const revalidate = 60;

export const metadata = {
  title: "Instant Price Calculator · W2P Print House",
  description: "See the price for any size, material and quantity, with bulk discounts and GST shown.",
};

export default async function CalculatorPage() {
  const products = await getAllProducts();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-600 text-xs font-medium">
          Instant prices
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">
          Price Calculator
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Pick a product, set your size and quantity, and see your price straight away. Bulk discounts apply automatically.
        </p>
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs font-mono">Loading pricing matrix...</div>}>
        <PricingCalculator products={products} />
      </Suspense>
    </div>
  );
}
