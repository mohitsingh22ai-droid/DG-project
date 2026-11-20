import Link from "next/link";
import { BUSINESS } from "@/lib/business-info";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Refund & Cancellation Policy · W2P Print House",
  description: "When orders can be cancelled, when we reprint or refund, and how long refunds take.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro="Every order is printed to your own design, so it cannot be resold. This policy explains when you can cancel, when we reprint or refund, and how long refunds take."
    >
      <LegalSection title="1. Cancelling an order">
        <ul>
          <li>
            <strong>Before you approve the proof:</strong> you can cancel at no cost and receive a full refund.
          </li>
          <li>
            <strong>After proof approval, before printing starts:</strong> contact us as soon as possible. If production has not
            started we cancel the order with a full refund.
          </li>
          <li>
            <strong>Once printing has started:</strong> the order cannot be cancelled, because materials and press time have been used.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. When we reprint or refund">
        <p>We reprint the affected items free of charge, or refund them if you prefer, when:</p>
        <ul>
          <li>the print does not match the proof you approved (wrong size, material, content or colour beyond normal variation);</li>
          <li>items are damaged, defective or missing on delivery;</li>
          <li>we delivered the wrong product or quantity.</li>
        </ul>
        <p>
          Please tell us within <strong>7 days of delivery</strong>, with your order number and photos of the problem. You do
          not need to return items unless we ask.
        </p>
      </LegalSection>

      <LegalSection title="3. When we cannot refund">
        <ul>
          <li>Errors in an approved proof, such as spelling mistakes, wrong details or low-resolution images that you supplied.</li>
          <li>Slight colour differences between your screen and the printed item.</li>
          <li>Change of mind after printing has started.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How refunds are paid">
        <ul>
          <li>Refunds go back to the original payment method through Stripe.</li>
          <li>
            We start the refund within 2 working days of approving it. Your bank usually credits it within{" "}
            <strong>{BUSINESS.refundDays}</strong>.
          </li>
          <li>We email you when the refund has been issued.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. How to ask">
        <p>
          Email <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a> or call {BUSINESS.supportPhone} with your
          order number. If you are not satisfied with our reply, contact our <Link href="/contact">Grievance Officer</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
