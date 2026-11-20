import Link from "next/link";
import { BUSINESS } from "@/lib/business-info";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Shipping & Delivery Policy · W2P Print House",
  description: "Where we deliver, delivery charges and how long production and delivery take.",
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      title="Shipping & Delivery Policy"
      intro="How your order gets from our print house to you."
    >
      <LegalSection title="1. Where we deliver">
        <p>We currently deliver to addresses within India only (6-digit PIN code required).</p>
      </LegalSection>

      <LegalSection title="2. Delivery charges">
        <p>Delivery within India is included in the price. There is no separate delivery charge at checkout.</p>
      </LegalSection>

      <LegalSection title="3. How long it takes">
        <ul>
          <li>
            <strong>Production:</strong> {BUSINESS.productionDays}. Large quantities or variable-data jobs (such as race numbers)
            may take longer; we will tell you if so.
          </li>
          <li>
            <strong>Delivery:</strong> usually {BUSINESS.deliveryDays} by courier, depending on your location.
          </li>
          <li>Timelines start only after you approve your proof, and exclude Sundays and public holidays.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Tracking your order">
        <p>
          You can follow your order&apos;s status (Order, Artwork, Proof, Production, Completed) in{" "}
          <Link href="/dashboard">My Orders</Link>, and we email you at each stage.
        </p>
      </LegalSection>

      <LegalSection title="5. Damaged or missing parcels">
        <p>
          If a parcel arrives damaged or items are missing, tell us within 7 days of delivery with photos. We will reprint or
          refund as described in our <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link>.
        </p>
      </LegalSection>

      <LegalSection title="6. Wrong address">
        <p>Please check your delivery address at checkout. If a parcel is returned because of an incorrect address, we will contact you to arrange re-delivery.</p>
      </LegalSection>
    </LegalPage>
  );
}
