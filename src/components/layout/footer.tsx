import React from "react";
import Link from "next/link";
import { CheckCircle2, Shield, Cpu, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-brand-900 text-brand-100 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-8 rounded-lg bg-brand-600 text-white font-heading font-extrabold flex items-center justify-center text-xs px-1 shadow-sm">
                W2P
              </div>
              <span className="font-heading font-semibold text-xl text-white tracking-tight">
                W2P
              </span>
            </div>
            <p className="text-xs text-brand-200 leading-relaxed font-sans">
              Commercial-grade web-to-print platform powering six manufacturing divisions under one roof. Instant parameter-driven pricing, browser-based design, and automated 300 DPI production pipelines.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-800 border border-brand-700 text-[11px] font-mono text-flame-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Production Engine Active (300 DPI)
              </span>
            </div>
          </div>

          {/* Product Hub */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-brand-200 font-semibold">
              Product Hub
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/#divisions"
                  className="text-brand-100 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Manufacturing Catalog</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-flame-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/calculator"
                  className="text-brand-100 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Instant Price Calculator</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-flame-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/variable-data"
                  className="text-brand-100 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>CSV Variable Merge</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-flame-400" />
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-brand-100 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>Production Gallery</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-flame-400" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-brand-200 font-semibold">
              Platform Standards
            </h4>
            <ul className="space-y-2.5 text-xs text-brand-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Automated 300 DPI Bleed & Vector Output</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>CSV Variable-Data Batch Merge Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Audit-Logged Proofing & Approval Gate</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-flame-400 shrink-0" />
                <span>Stripe PCI-DSS Per-Order Checkout</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-200 shrink-0" />
                <span>Xero-Ready Invoice Data Schema</span>
              </li>
            </ul>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-brand-200 font-semibold">
              System Consoles
            </h4>
            <div className="space-y-2 text-xs">
              <Link
                href="/calculator"
                className="block p-2.5 rounded bg-brand-800 border border-brand-700 hover:border-brand-500/50 transition-colors"
              >
                <div className="font-semibold text-white">Instant Price Calculator</div>
                <div className="text-brand-200 text-[11px]">Real-time math & volume tiers</div>
              </Link>
              <Link
                href="/dashboard"
                className="block p-2.5 rounded bg-brand-800 border border-brand-700 hover:border-brand-500/50 transition-colors"
              >
                <div className="font-semibold text-white">Customer Portal</div>
                <div className="text-brand-200 text-[11px]">Reorder & proof approvals</div>
              </Link>
              <Link
                href="/production"
                className="block p-2.5 rounded bg-brand-800 border border-brand-700 hover:border-brand-500/50 transition-colors"
              >
                <div className="font-semibold text-white">Internal Production Pipeline</div>
                <div className="text-brand-200 text-[11px]">6-stage fulfillment console</div>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-brand-200 font-mono gap-4">
          <div>
            © 2026 W2P Ltd · All Rights Reserved · Web-to-Print Platform
          </div>
          <div className="flex items-center gap-4">
            <span>w2p.co.in</span>
            <span>·</span>
            <span>support@w2p.co.in</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
