import Link from "next/link";
import { BUSINESS } from "@/lib/business-info";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy · W2P Print House",
  description: "What personal data we collect, why, who we share it with and your rights.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains how ${BUSINESS.legalName} collects and uses your personal data, in line with the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.`}
    >
      <LegalSection title="1. What we collect">
        <ul>
          <li><strong>Account details:</strong> name, email, phone number, company name and password (stored only in encrypted form).</li>
          <li><strong>Order details:</strong> delivery address, GSTIN if you provide one, products, quantities and order history.</li>
          <li><strong>Your artwork:</strong> designs you create, files you upload, and spreadsheet (CSV) data you provide for variable-data jobs such as names and race numbers.</li>
          <li><strong>Payment status:</strong> whether a payment succeeded. Card details are handled by Stripe; we never see or store them.</li>
          <li><strong>Technical data:</strong> cookies needed to keep you signed in and to keep a guest&apos;s draft job (see section 6).</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Why we use it">
        <ul>
          <li>To create your account, produce and deliver your orders, and send proofs, invoices and order updates.</li>
          <li>To issue GST invoices and keep accounting records required by law.</li>
          <li>To answer your questions and complaints, and to prevent fraud and misuse.</li>
        </ul>
        <p>We do not sell your personal data and we do not send marketing emails unless you ask for them.</p>
      </LegalSection>

      <LegalSection title="3. Who we share it with">
        <p>Only with service providers that help us run the shop, and only what they need:</p>
        <ul>
          <li><strong>Supabase</strong>: secure database, sign-in and file storage.</li>
          <li><strong>Stripe</strong>: card payments.</li>
          <li><strong>Our email provider</strong>: order and proof emails.</li>
          <li><strong>Vercel</strong>: website hosting.</li>
          <li><strong>Courier partners</strong>: your name, phone and delivery address, to deliver your order.</li>
        </ul>
        <p>We may also disclose data when required by law or by a government authority.</p>
      </LegalSection>

      <LegalSection title="4. How long we keep it">
        <ul>
          <li>Account and design data: while your account is active, or until you ask us to delete it.</li>
          <li>Invoices and order records: for the period required by tax law (generally 8 years).</li>
          <li>Artwork and production files: kept so you can reorder; deleted on request unless needed for an open order.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Your rights">
        <p>
          You can ask to see, correct or delete your personal data, or withdraw consent, by writing to{" "}
          <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>. We reply within 30 days. You can also
          contact our <Link href="/contact">Grievance Officer</Link>.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <p>
          We use only essential cookies: one to keep you signed in, and one that lets a guest return to a job they started
          before signing in. We do not use advertising or tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          Data is sent over HTTPS, files are kept in private storage, and each customer can only access their own orders
          and artwork. No system is completely secure, but we take reasonable measures to protect your data.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes">
        <p>We may update this policy. The date at the top shows when it last changed.</p>
      </LegalSection>
    </LegalPage>
  );
}
