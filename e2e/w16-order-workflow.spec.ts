import { test, expect } from "@playwright/test";
import { TEST_USERS, apiToken } from "./support/auth-helpers";

/**
 * Production workflow rules enforced by the server (PRD § 08, § 11).
 * Uses seeded order W2P-2026-00101 (Customer A, PRODUCTION) without changing it.
 */
test.describe("Order workflow rules", () => {
  test("completing an order needs dispatch details", async ({ request }) => {
    const headers = { Authorization: `Bearer ${await apiToken(request, TEST_USERS.admin)}` };
    const res = await request.patch("/api/admin/orders/W2P-2026-00101/stage", {
      headers,
      data: { stage: "COMPLETED", expectedStage: "PRODUCTION" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/dispatch details/i);
  });

  test("customers cannot request changes once an order is in production, or on someone else's order", async ({ request }) => {
    const owner = { Authorization: `Bearer ${await apiToken(request, TEST_USERS.customerA)}` };
    const inProduction = await request.post("/api/orders/W2P-2026-00101/change-request", {
      headers: owner,
      data: { message: "Please make the logo bigger" },
    });
    expect(inProduction.status()).toBe(409);
    expect((await inProduction.json()).error).toMatch(/already in production/i);

    const stranger = { Authorization: `Bearer ${await apiToken(request, TEST_USERS.customerB)}` };
    const notOwner = await request.post("/api/orders/W2P-2026-00101/change-request", {
      headers: stranger,
      data: { message: "Please make the logo bigger" },
    });
    expect(notOwner.status()).toBe(404);
  });

  test("staff can view a customer's job but only the customer can change or approve it", async ({ request }) => {
    const headers = { Authorization: `Bearer ${await apiToken(request, TEST_USERS.admin)}` };
    const order = (await (await request.get("/api/admin/orders/W2P-2026-00302", { headers })).json()).order;
    expect(order.draft_id).toBeTruthy();

    const view = await request.get(`/api/drafts/${order.draft_id}`, { headers });
    expect(view.status()).toBe(200);

    const approve = await request.post(`/api/drafts/${order.draft_id}/approve-proof`, { headers });
    expect(approve.status()).toBe(403);
    expect((await approve.json()).error).toMatch(/only the customer/i);
  });
});
