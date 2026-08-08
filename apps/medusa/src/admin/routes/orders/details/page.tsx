import { useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Button, Container, Input, Text } from "@medusajs/ui";
import { ErrorState, LoadingState, PageHeader } from "../../../lib/superadmin";
import { type AdminOrderRecord, loadOrders, OrderTable } from "../order-table";

const OrderDetailsLookupPage = () => {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function search(nextQuery = query) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20", order: "-created_at" });
      const normalizedQuery = nextQuery.trim();
      const businessReference = /^order_(\d+)$/i.exec(normalizedQuery);
      if (businessReference) {
        const displayId = Number(businessReference[1]);
        params.set("limit", "1");
        params.set("offset", String(Math.max(0, displayId - 1)));
        params.set("order", "display_id");
      } else if (normalizedQuery) {
        params.set("q", normalizedQuery);
      }
      const payload = await loadOrders(params);
      setOrders(
        businessReference
          ? payload.orders.filter(
              (order) => Number(order.display_id) === Number(businessReference[1]),
            )
          : payload.orders,
      );
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Orders could not be searched.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search("");
  }, []);

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Order Details"
        subtitle="Find an order by number, ID, or customer email, then open Medusa's native order detail workflow."
        badge="Order lookup"
      />
      <Container>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <label className="flex flex-1 flex-col gap-1">
            <Text size="small" weight="plus">
              Order number, ID, or email
            </Text>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="order_01, internal order_... ID, or customer@example.com"
            />
          </label>
          <Button type="submit" disabled={loading}>
            Search orders
          </Button>
        </form>
      </Container>
      {error ? <ErrorState message={error} retry={() => void search()} /> : null}
      {loading ? <LoadingState label="Searching orders..." /> : null}
      {!loading ? (
        <OrderTable
          orders={orders}
          title={query.trim() ? "Matching orders" : "Recent orders"}
          subtitle={query.trim() ? `Results for "${query.trim()}".` : "The 20 most recent orders."}
          emptyTitle="No orders found"
          emptyDescription="Check the order number, ID, or email and try again."
        />
      ) : null}
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Order Details",
  nested: "/orders",
  rank: 3,
});

export default OrderDetailsLookupPage;
