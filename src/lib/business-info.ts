/**
 * Business details shown in the footer and on the legal pages (Terms, Privacy,
 * Refund & Cancellation, Shipping & Delivery, Contact).
 *
 * ⚠ DEMO DETAILS. Everything below is placeholder data for the demo site.
 * Replace it with the real business details before going live.
 *
 * Name, address and GSTIN come from the same SELLER_* environment variables the
 * GST invoice uses, so the footer, the legal pages and every invoice always show
 * the same seller. The values after `||` are only used when those are not set.
 */
export const BUSINESS = {
  /** Registered legal name of the business. */
  legalName: process.env.SELLER_LEGAL_NAME || "W2P Print House Private Limited",
  /** Name customers see on the site. */
  brandName: "W2P Print House",
  /** Registered office address. */
  address: process.env.SELLER_ADDRESS || "Plot 14, Okhla Industrial Estate, Phase III, New Delhi, Delhi 110020, India",
  gstin: process.env.SELLER_GSTIN || "07AAACW1234F1Z5",
  /** Company Identification Number (demo). */
  cin: "U22219DL2024PTC123456",

  supportEmail: "support@w2p-printhouse.example",
  supportPhone: "+91 11 4000 0000",
  supportHours: "Monday to Saturday, 10:00 am – 6:00 pm IST (closed on public holidays)",

  /** Grievance Officer (Consumer Protection (E-Commerce) Rules, 2020). */
  grievanceOfficer: {
    name: "Ravi Sharma",
    designation: "Grievance Officer",
    email: "grievance@w2p-printhouse.example",
    phone: "+91 11 4000 0001",
  },

  /** Courts for disputes (Terms and Conditions). */
  jurisdiction: "New Delhi, India",

  /**
   * Refund and delivery commitments used in the policies. Checkout adds no
   * separate delivery charge and accepts Indian addresses only, so the
   * shipping policy says exactly that.
   */
  refundDays: "5–7 working days",
  productionDays: "2–4 working days after proof approval",
  deliveryDays: "3–7 working days after dispatch",

  /** Date the legal pages were last revised. */
  policiesUpdated: "20 November 2026",
} as const;
