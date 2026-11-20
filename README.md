# W2P — Web-to-Print Platform (Digital Heroes PRD, Level 2)

A transactional web-to-print platform for a print house with six divisions: labels & stickers,
race & event numbers, MTB boards, stamps, trophies and laser-cut work. Customers configure,
design, proof, pay for and reorder print jobs; staff run every job from quote to production
in one console, with print-ready files generated on the server.

**Live site:** https://dgpr-project.vercel.app

## Test credentials

Demo accounts are created by `npm run seed` (development passwords; change them for anything public).

| Role | Email | Password |
|---|---|---|
| Admin | `admin@w2p.co.in` | `admin123` |
| Customer | `sarah@enduroclub.uk` | `customer123` |
| Customer | `customerb@example.com` | `customer123` |

Stripe runs in test mode: pay with card `4242 4242 4242 4242`, any future expiry, any CVC.

## What to try

| Journey | Where |
|---|---|
| Browse divisions and the work gallery | `/`, `/gallery` |
| Instant price with volume discounts and GST | `/calculator` |
| Design inside the print area (templates, text, logo) or upload artwork | `/designer/<product-slug>` |
| Proof versions, approve or request changes | Designer proof modal, customer dashboard → Proofs |
| Checkout (Stripe), order tracking, invoices, one-click reorder | Customer dashboard |
| Pipeline, production file download, reports, Xero export, templates, users, archive | `/production` (admin) |

## Feature map (PRD → implementation)

| PRD § | Feature | Code |
|---|---|---|
| 03 | Roles and route protection | `src/middleware.ts`, `src/lib/server-auth.ts`, `src/lib/draft-access.ts`, RLS in `supabase/migrations` |
| 04 | Parameter-driven products, dynamic sizing, text fitting | `src/modules/catalog`, `src/modules/print-engine/text-fit.ts` |
| 05 | Pricing engine, volume tiers, GST, Stripe checkout, Xero-ready records | `src/modules/pricing`, `src/app/api/checkout`, `src/modules/orders/xero-generator.ts`, `/api/admin/accounting/export` |
| 06 | Designer with safe-area constraints, design templates, server-rendered proof, upload path, saved designs | `src/modules/designer`, `src/modules/proofs/design-render.ts` |
| 07 | Print-ready PDF/PNG with bleed and crop marks, CSV variable-data merge (one file per row) | `src/modules/print-engine`, `src/modules/variable-data` |
| 08 | Versioned proofs, approval log, change requests, approval gate | `src/modules/proofs`, `src/modules/drafts`, `src/app/api/proofs`, `src/app/api/drafts/[id]` |
| 09–10 | Accounts, order history, saved designs, reorder, invoices | `src/modules/customer`, `src/modules/orders/reorder-service.ts` |
| 11 | Production pipeline, search and filters, file download, reports, archive | `src/modules/pipeline`, `src/app/api/admin` |
| 13 | Email notifications (order, proof, stage, completion) | `src/modules/email` |

Design decisions and resolved ambiguities are recorded in [`docs/DECISIONS.md`](docs/DECISIONS.md);
the database schema is documented in [`docs/SCHEMA.md`](docs/SCHEMA.md).

## Stack

Next.js 15 (App Router) · React 19 · Tailwind · Konva (designer) · Supabase (Postgres, Auth, Storage, RLS) ·
Stripe Checkout · pdf-lib / resvg (print files) · Resend or SMTP (email) · Playwright + node:test.

## Run locally

1. `npm install`
2. Create a Supabase project and run the SQL files in `supabase/migrations/` in order
   (SQL editor, or `supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in the values (never commit it).
4. `npm run seed` — catalogue and demo accounts.
5. `npm run dev` → http://localhost:3000

## Tests

```bash
npm test                  # unit
npm run test:integration  # API + database
npm run test:e2e:all      # Playwright: desktop, tablet, mobile
```

## Deploy (Vercel)

Import the repository, add every variable from `.env.example` under Project → Settings →
Environment Variables, set `NEXT_PUBLIC_APP_URL` to the deployment URL, and point a Stripe
webhook at `/api/webhooks/stripe` (events listed in `.env.example`).
