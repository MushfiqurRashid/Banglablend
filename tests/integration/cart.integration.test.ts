import { describe, expect, it } from "vitest";
import { anonSupabaseClient, runIntegration, storefrontFetch } from "./helpers";

// storefrontFetch doesn't persist cookies across calls the way a browser would, and the cart id
// lives in an httpOnly cookie -- so each call here forwards the Set-Cookie from the previous one.
function cartCookie(response: Response) {
  const raw = response.headers.get("set-cookie");
  return raw?.split(";")[0];
}

describe.runIf(runIntegration)("storefront cart", () => {
  it("creates, retrieves, changes quantity, persists, and removes an item", async () => {
    const supabase = anonSupabaseClient();
    const { data: variant } = await supabase.from("product_variants").select("id").limit(1).maybeSingle();
    const variantId = (variant as { id?: string } | null)?.id;
    expect(variantId).toBeTruthy();

    const createResponse = await storefrontFetch("/api/cart", { method: "POST", body: JSON.stringify({ variantId, quantity: 1 }) });
    const cookie = cartCookie(createResponse);
    expect(cookie).toBeTruthy();
    const created = (await createResponse.json()) as { cart: { id: string; items: Array<{ id: string; quantity: number }> } };
    const item = created.cart.items[0];
    expect(item?.quantity).toBe(1);

    const changed = (await (
      await storefrontFetch("/api/cart", { method: "PATCH", headers: { cookie: cookie! }, body: JSON.stringify({ lineId: item?.id, quantity: 2 }) })
    ).json()) as { cart: { items: Array<{ quantity: number }> } };
    expect(changed.cart.items[0]?.quantity).toBe(2);

    const restored = (await (await storefrontFetch("/api/cart", { headers: { cookie: cookie! } })).json()) as { cart?: { id: string } };
    expect(restored.cart?.id).toBe(created.cart.id);

    const removed = await storefrontFetch("/api/cart", { method: "DELETE", headers: { cookie: cookie! }, body: JSON.stringify({ lineId: item?.id }) });
    expect(removed.ok).toBe(true);
  });
});
