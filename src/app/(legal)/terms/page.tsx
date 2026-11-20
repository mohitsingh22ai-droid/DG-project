import Link from "next/link";
import { BUSINESS } from "@/lib/business-info";
import { LegalPage, LegalSection, BusinessIdentity } from "@/components/legal/legal-page";

export const metadata = {
  title: "Terms & Conditions · W2P Print House",
  description: "Terms for ordering custom print products from W2P Print House.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={`These terms apply when you use this website or order from ${BUSINESS.brandName}. By creating an account or placing an order you agree to them.`}
    >
      <LegalSection title="1. Who we are">
        <BusinessIdentity />
      </LegalSection>

      <LegalSection title="2. Your account">
        <ul>
          <li>You must give accurate details and keep your password private. You are responsible for activity on your account.</li>
          <li>We may suspend an account that is used fraudulently or in breach of these terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Orders and prices">
        <ul>
          <li>Prices are shown in Indian Rupees. The total at checkout includes GST (CGST + SGST within Delhi, IGST for other states).</li>
          <li>Volume discounts apply automatically at the quantities shown in the price calculator.</li>
          <li>An order is accepted when payment is confirmed. We issue a GST invoice for every paid order.</li>
          <li>If a price is shown incorrectly because of an obvious error, we may cancel the order and refund you in full.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Your artwork and proofs">
        <ul>
          <li>You confirm that you own, or have permission to use, all text, logos, images and data you upload, and that printing them does not infringe anyone&apos;s rights or break any law.</li>
          <li>We do not print unlawful, hateful or infringing content and may refuse or cancel such orders.</li>
          <li>Before production you receive a digital proof. Please check spelling, sizes, colours and layout carefully. <strong>Once you approve a proof, we print exactly what it shows.</strong></li>
          <li>Colours on screen can differ slightly from print because of screen settings and materials; this is not a defect.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Payment">
        <p>Payments are processed securely by Stripe. We do not see or store your full card details.</p>
      </LegalSection>

      <LegalSection title="6. Cancellations, refunds and delivery">
        <p>
          See our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> and{" "}
          <Link href="/shipping-policy">Shipping &amp; Delivery Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property">
        <p>
          You keep the rights to your artwork. You allow us to use it only to produce and deliver your order. The website,
          its design and its templates belong to {BUSINESS.legalName}.
        </p>
      </LegalSection>

      <LegalSection title="8. Liability">
        <p>
          If something goes wrong because of our error, we will reprint or refund the affected items. To the extent
          permitted by law, our liability for any order is limited to the amount paid for that order. Nothing in these
          terms limits your rights under the Consumer Protection Act, 2019.
        </p>
      </LegalSection>

      <LegalSection title="9. Governing law and disputes">
        <p>
          These terms are governed by the laws of India. Courts in {BUSINESS.jurisdiction} have jurisdiction. Please
          contact our <Link href="/contact">Grievance Officer</Link> first; we aim to resolve complaints quickly.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>We may update these terms. The version in force when you place an order applies to that order.</p>
      </LegalSection>
    </LegalPage>
  );
}
