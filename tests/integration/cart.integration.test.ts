import { describe, expect, it } from "vitest";
import { runIntegration, storeFetch } from "./helpers";

describe.runIf(runIntegration)("Medusa cart", () => {
  it("creates, retrieves, changes quantity, persists, and removes an item", async () => {
    const products = await (await storeFetch("/store/products?limit=1&fields=*variants" )).json() as { products: Array<{ variants: Array<{ id: string }> }> };
    const variantId = products.products[0]?.variants[0]?.id;
    expect(variantId).toBeTruthy();
    const created = await (await storeFetch("/store/carts", { method: "POST", body: JSON.stringify({ region_id: process.env.TEST_REGION_ID }) })).json() as { cart: { id: string } };
    const added = await (await storeFetch(`/store/carts/${created.cart.id}/line-items`, { method: "POST", body: JSON.stringify({ variant_id: variantId, quantity: 1 }) })).json() as { cart: { items: Array<{ id: string; quantity: number }> } };
    const item = added.cart.items[0];
    expect(item?.quantity).toBe(1);
    const changed = await (await storeFetch(`/store/carts/${created.cart.id}/line-items/${item?.id}`, { method: "POST", body: JSON.stringify({ quantity: 2 }) })).json() as { cart: { items: Array<{ quantity: number }> } };
    expect(changed.cart.items[0]?.quantity).toBe(2);
    const restored = await (await storeFetch(`/store/carts/${created.cart.id}`)).json() as { cart: { id: string } };
    expect(restored.cart.id).toBe(created.cart.id);
    const removed = await storeFetch(`/store/carts/${created.cart.id}/line-items/${item?.id}`, { method: "DELETE" });
    expect(removed.ok).toBe(true);
  });
});
