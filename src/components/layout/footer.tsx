import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, ShieldCheck, Lock } from "lucide-react";
import { BUSINESS } from "@/lib/business-info";
import { LEGAL_LINKS } from "@/components/legal/legal-page";

/**
 * Site footer: brand and registered business details (legal name, address, GSTIN),
 * product links, the mandatory policy pages (Terms, Privacy, Refund & Cancellation,
 * Shipping & Delivery, Contact) and the Grievance Officer, as required for an Indian
 * online store taking payments. Business details come from src/lib/business-info.ts.
 */

const PRODUCT_LINKS = [
  { href: "/divisions/labels-stickers", label: "Labels & Stickers" },
  { href: "/divisions/race-event-numbers", label: "Race & Event Numbers" },
  { href: "/divisions/mtb-boards", label: "MTB Boards" },
  { href: "/divisions/stamps", label: "Stamps" },
  { href: "/divisions/trophies", label: "Trophies & Awards" },
  { href: "/divisions/laser-cut", label: "Laser-Cut Work" },
  { href: "/variable-data", label: "Variable Data Printing" },
  { href: "/calculator", label: "Price Calculator" },
  { href: "/gallery", label: "Gallery" },
];

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200 font-sans">{children}</h2>;
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-900 text-brand-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand and registered details */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label={`${BUSINESS.brandName} home`}>
              <span className="w-9 h-9 rounded-lg bg-brand-600 text-white font-extrabold text-xs flex items-center justify-center">W2P</span>
              <span className="font-heading font-semibold text-xl text-white">Print House</span>
            </Link>
            <p className="text-sm text-brand-100/90 leading-relaxed max-w-sm">
              Custom labels, race numbers, MTB boards, stamps, trophies and laser-cut work. Designed online, proofed and printed in India.
            </p>
            <div className="text-xs text-brand-200 space-y-1">
              <div className="font-semibold text-brand-100">{BUSINESS.legalName}</div>
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{BUSINESS.address}</span>
              </div>
              <div>GSTIN: {BUSINESS.gstin}</div>
            </div>
          </div>

          {/* Products */}
          <div className="lg:col-span-3 space-y-3">
            <ColumnTitle>Products</ColumnTitle>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-brand-100 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div className="lg:col-span-2 space-y-3">
            <ColumnTitle>Help &amp; Policies</ColumnTitle>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-brand-100 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact and grievance officer */}
          <div className="lg:col-span-3 space-y-3">
            <ColumnTitle>Contact</ColumnTitle>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-300 shrink-0" aria-hidden="true" />
                <a href={`mailto:${BUSINESS.supportEmail}`} className="hover:text-white break-all">
                  {BUSINESS.supportEmail}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-300 shrink-0" aria-hidden="true" />
                <a href={`tel:${BUSINESS.supportPhone.replace(/\s/g, "")}`} className="hover:text-white">
                  {BUSINESS.supportPhone}
                </a>
              </li>
              <li className="text-xs text-brand-200">{BUSINESS.supportHours}</li>
            </ul>
            <div className="rounded-xl border border-brand-700 bg-brand-800/60 p-3 text-xs space-y-1" data-testid="footer-grievance">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Grievance Officer
              </div>
              <div>
                {BUSINESS.grievanceOfficer.name}, {BUSINESS.grievanceOfficer.designation}
              </div>
              <a href={`mailto:${BUSINESS.grievanceOfficer.email}`} className="block hover:text-white break-all">
                {BUSINESS.grievanceOfficer.email}
              </a>
              <div>{BUSINESS.grievanceOfficer.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-brand-200">
          <div>
            © {year} {BUSINESS.legalName}. All rights reserved.
          </div>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-white">Refunds</Link>
            <Link href="/shipping-policy" className="hover:text-white">Shipping</Link>
          </nav>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Payments secured by Stripe
          </div>
        </div>
      </div>
    </footer>
  );
}
