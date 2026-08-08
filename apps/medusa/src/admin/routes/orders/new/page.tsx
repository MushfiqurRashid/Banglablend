import { useCallback, useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Button } from "@medusajs/ui";
import { ErrorState, LoadingState, PageHeader, adminPath } from "../../../lib/superadmin";
import { type AdminOrderRecord, loadOrders, OrderTable } from "../order-table";

const NewOrdersPage = () => {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await loadOrders(
        new URLSearchParams({ limit: "50", order: "-created_at", status: "pending" }),
      );
      setOrders(payload.orders);
      setCount(payload.count);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "New orders could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="New Orders"
        subtitle="Pending orders that have been placed and still need the operations team to review payment, stock allocation, and fulfillment."
        badge={`${count.toLocaleString()} pending`}
        actions={
          <>
            <Button variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
            <Button onClick={() => window.location.assign(adminPath("/orders"))}>All orders</Button>
          </>
        }
      />
      {error ? <ErrorState message={error} retry={() => void load()} /> : null}
      {loading ? <LoadingState label="Loading pending orders..." /> : null}
      {!loading ? (
        <OrderTable
          orders={orders}
          title="Pending order queue"
          subtitle="Showing up to 50 newest pending orders, newest first."
          emptyTitle="No new orders"
          emptyDescription="There are no pending orders waiting for review."
        />
      ) : null}
    </div>
  );
};

export const config = defineRouteConfig({
  label: "New Orders",
  nested: "/orders",
  rank: 2,
});

export default NewOrdersPage;
