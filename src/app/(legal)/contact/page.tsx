import { Mail, Phone, MapPin, Clock, ShieldCheck } from "lucide-react";
import { BUSINESS } from "@/lib/business-info";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Contact Us · W2P Print House",
  description: "Customer support, registered office and Grievance Officer details.",
};

function Row({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground mt-0.5">{children}</div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const g = BUSINESS.grievanceOfficer;
  return (
    <LegalPage title="Contact Us" intro="Questions about an order, a proof or an invoice? We are happy to help.">
      <LegalSection title="Customer support">
        <div className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5">
          <Row icon={Mail} label="Email">
            <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
          </Row>
          <Row icon={Phone} label="Phone">
            <a href={`tel:${BUSINESS.supportPhone.replace(/\s/g, "")}`}>{BUSINESS.supportPhone}</a>
          </Row>
          <Row icon={Clock} label="Hours">{BUSINESS.supportHours}</Row>
          <Row icon={MapPin} label="Registered office">{BUSINESS.address}</Row>
        </div>
        <p>Please include your order number (for example W2P-2026-001234) so we can help faster.</p>
      </LegalSection>

      <LegalSection title="Grievance Officer">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-1.5" data-testid="grievance-officer">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="w-4 h-4 text-brand-700" aria-hidden="true" />
            {g.name}, {g.designation}
          </div>
          <div>
            Email: <a href={`mailto:${g.email}`}>{g.email}</a>
          </div>
          <div>Phone: {g.phone}</div>
          <div>Address: {BUSINESS.address}</div>
        </div>
        <p>
          In line with the Consumer Protection (E-Commerce) Rules, 2020, we acknowledge complaints within 48 hours and aim
          to resolve them within one month of receipt.
        </p>
      </LegalSection>

      <LegalSection title="Business details">
        <ul>
          <li>{BUSINESS.legalName}</li>
          <li>GSTIN: {BUSINESS.gstin}</li>
          <li>CIN: {BUSINESS.cin}</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
