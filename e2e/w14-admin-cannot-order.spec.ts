import { test, expect } from "@playwright/test";
import { TEST_USERS, apiToken } from "./support/auth-helpers";

/**
 * Admin accounts run the production console and must not be able to buy (PRD § 03:
 * ordering is a customer capability). The server refuses before touching the job.
 */
test.describe("Admin accounts cannot place orders", () => {
  test("checkout session is refused for an admin", async ({ request }) => {
    const token = await apiToken(request, TEST_USERS.admin);
    const res = await request.post("/api/checkout/session", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        draftId: "00000000-0000-4000-8000-000000000000",
        customerName: "Admin Test",
        phone: "9810022333",
        shippingAddress: { line1: "1 Test Road", city: "New Delhi", stateCode: "07", postalCode: "110001" },
      },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toMatch(/Admin accounts cannot place orders/);
  });
});
