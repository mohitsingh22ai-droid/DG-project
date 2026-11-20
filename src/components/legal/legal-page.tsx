import React from "react";
import Link from "next/link";
import { BUSINESS } from "@/lib/business-info";

/**
 * Shared layout for the legal pages (Terms, Privacy, Refund & Cancellation,
 * Shipping & Delivery): title, last-updated date, readable sections and links
 * to the other policies.
 */

export const LEGAL_LINKS = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Refund & Cancellation" },
  { href: "/shipping-policy", label: "Shipping & Delivery" },
  { href: "/contact", label: "Contact Us" },
] as const;

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Legal</div>
      <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-brand-800 mt-1">{title}</h1>
      <p className="text-xs text-muted-foreground mt-2">Last updated: {BUSINESS.policiesUpdated}</p>
      <p className="text-base text-foreground/90 leading-relaxed mt-5">{intro}</p>

      <div className="mt-8 space-y-8">{children}</div>

      <nav aria-label="Other policies" className="mt-12 pt-6 border-t border-border flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-brand-700 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** One numbered section of a legal page. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-heading font-semibold text-brand-800">{title}</h2>
      <div className="space-y-3 text-sm sm:text-[15px] leading-relaxed text-foreground/85 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-brand-700 [&_a]:underline">
        {children}
      </div>
    </section>
  );
}

/** Business identity block reused on several pages. */
export function BusinessIdentity() {
  return (
    <ul>
      <li>
        <strong>{BUSINESS.legalName}</strong> (trading as {BUSINESS.brandName})
      </li>
      <li>Registered office: {BUSINESS.address}</li>
      <li>GSTIN: {BUSINESS.gstin}</li>
      <li>CIN: {BUSINESS.cin}</li>
      <li>
        Email: <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a> · Phone: {BUSINESS.supportPhone}
      </li>
    </ul>
  );
}
