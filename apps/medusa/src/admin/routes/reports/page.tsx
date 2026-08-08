import { useCallback, useEffect, useMemo, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar } from "@medusajs/icons";
import { Button, Container, Heading, Table, Text } from "@medusajs/ui";
import {
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
  ResourceCard,
  adminPath,
  adminRequest,
} from "../../lib/superadmin";
import { formatBusinessOrderReference } from "../../../lib/admin/order-workflow";

interface ReportOrder {
  id: string;
  display_id?: number | string;
  email?: string | null;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  total?: number | null;
  currency_code?: string | null;
  created_at?: string;
}

interface ReportPayload {
  orders: ReportOrder[];
  count: number;
}

const reportFields = [
  "id",
  "display_id",
  "email",
  "status",
  "payment_status",
  "fulfillment_status",
  "total",
  "currency_code",
  "created_at",
].join(",");

function humanize(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not available";
}

const ReportsPage = () => {
  const [data, setData] = useState<ReportPayload>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        order: "-created_at",
        fields: reportFields,
      });
      setData(await adminRequest<ReportPayload>(`/admin/orders?${params.toString()}`));
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reports could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const orders = data?.orders ?? [];
    const totals = orders.reduce<Record<string, number>>((result, order) => {
      if (order.total == null || !order.currency_code) return result;
      const currency = order.currency_code.toUpperCase();
      result[currency] = (result[currency] ?? 0) + Number(order.total);
      return result;
    }, {});
    return {
      pending: orders.filter((order) => order.status === "pending").length,
      paymentAttention: orders.filter(
        (order) =>
          !["captured", "refunded", "partially_refunded"].includes(order.payment_status ?? ""),
      ).length,
      fulfillmentAttention: orders.filter(
        (order) =>
          !["fulfilled", "shipped", "delivered", "returned"].includes(
            order.fulfillment_status ?? "",
          ),
      ).length,
      totals,
    };
  }, [data]);

  const salesSummary = Object.entries(summary.totals)
    .map(([currency, value]) => `${value.toLocaleString()} ${currency}`)
    .join(" + ");

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Reports"
        subtitle="A live operating snapshot from Medusa orders, with direct access to exports, payment evidence, and administrator audit history."
        badge="Live Medusa data"
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            Refresh report
          </Button>
        }
      />
      {error ? <ErrorState message={error} retry={() => void load()} /> : null}
      {loading ? <LoadingState label="Building the order report..." /> : null}
      {!loading && data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="All orders"
              value={data.count}
              detail="Total Medusa order records"
              tone="blue"
            />
            <MetricCard
              label="Pending"
              value={summary.pending}
              detail="Within latest 100 orders"
              tone="orange"
            />
            <MetricCard
              label="Payment attention"
              value={summary.paymentAttention}
              detail="Within latest 100 orders"
              tone="red"
            />
            <MetricCard
              label="Fulfillment attention"
              value={summary.fulfillmentAttention}
              detail="Within latest 100 orders"
              tone="purple"
            />
            <MetricCard
              label="Sales snapshot"
              value={salesSummary || "No totals"}
              detail="Gross values from latest 100 orders"
              tone="green"
            />
          </div>
          <Container className="overflow-hidden p-0">
            <div className="border-ui-border-base border-b px-6 py-4">
              <Heading level="h2">Latest order activity</Heading>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                The ten newest orders included in this report snapshot.
              </Text>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Order</Table.HeaderCell>
                    <Table.HeaderCell>Customer</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Payment</Table.HeaderCell>
                    <Table.HeaderCell>Fulfillment</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Details</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.orders.slice(0, 10).map((order) => (
                    <Table.Row key={order.id}>
                      <Table.Cell>
                        {formatBusinessOrderReference(order.display_id, order.id)}
                      </Table.Cell>
                      <Table.Cell>{order.email || "Guest checkout"}</Table.Cell>
                      <Table.Cell>{humanize(order.status)}</Table.Cell>
                      <Table.Cell>{humanize(order.payment_status)}</Table.Cell>
                      <Table.Cell>{humanize(order.fulfillment_status)}</Table.Cell>
                      <Table.Cell className="text-right">
                        <a
                          className="text-ui-fg-interactive font-medium hover:underline"
                          href={adminPath(`/orders/${encodeURIComponent(order.id)}`)}
                        >
                          Open
                        </a>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          </Container>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResourceCard
              title="Order exports"
              description="Use Medusa's order table filters and export workflow to prepare detailed operational data."
              href={adminPath("/orders")}
              badge="CSV"
            />
            <ResourceCard
              title="Payment audit"
              description="Reconcile SSLCOMMERZ callbacks, rejected validation attempts, and forwarding outcomes."
              href={adminPath("/payment-audits")}
              badge="Payments"
            />
            <ResourceCard
              title="Administrator audit"
              description="Inspect governed changes to products, settings, inquiries, and gifting operations."
              href={adminPath("/superadmin/audit")}
              badge="Evidence"
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Reports",
  icon: ChartBar,
  rank: 3,
});

export default ReportsPage;
