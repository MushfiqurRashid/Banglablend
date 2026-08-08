import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui";
import { EmptyState, adminPath } from "../../lib/superadmin";
import { formatBusinessOrderReference } from "../../../lib/admin/order-workflow";

export interface AdminOrderRecord {
  id: string;
  display_id?: number | string;
  custom_display_id?: string | null;
  email?: string | null;
  status: string;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  created_at?: string;
}

interface AdminOrdersPayload {
  orders: AdminOrderRecord[];
  count: number;
}

const orderFields = [
  "id",
  "display_id",
  "custom_display_id",
  "email",
  "status",
  "payment_status",
  "fulfillment_status",
  "created_at",
].join(",");

const dateFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
});

export async function loadOrders(params: URLSearchParams) {
  params.set("fields", orderFields);
  const response = await fetch(`/admin/orders?${params.toString()}`, {
    credentials: "include",
  });
  const payload = (await response.json().catch(() => null)) as
    (Partial<AdminOrdersPayload> & { message?: string }) | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? "Orders could not be loaded.");
  }

  return {
    orders: payload?.orders ?? [],
    count: payload?.count ?? payload?.orders?.length ?? 0,
  };
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

function humanize(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "Not available";
}

function orderLabel(order: AdminOrderRecord) {
  return formatBusinessOrderReference(order.display_id, order.custom_display_id ?? order.id);
}

export function OrderTable({
  orders,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
}: {
  orders: AdminOrderRecord[];
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Container className="overflow-hidden p-0">
      <div className="border-ui-border-base border-b px-6 py-4">
        <Heading level="h2">{title}</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          {subtitle}
        </Text>
      </div>
      {orders.length ? (
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Order status</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Fulfillment</Table.HeaderCell>
                <Table.HeaderCell>Received</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <Text weight="plus">{orderLabel(order)}</Text>
                    <Text size="xsmall" className="text-ui-fg-muted max-w-44 truncate">
                      {order.id}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>{order.email || "Guest checkout"}</Table.Cell>
                  <Table.Cell>
                    <Badge color={order.status === "pending" ? "orange" : "grey"}>
                      {humanize(order.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{humanize(order.payment_status)}</Table.Cell>
                  <Table.Cell>{humanize(order.fulfillment_status)}</Table.Cell>
                  <Table.Cell>{formatDate(order.created_at)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-end">
                      <Button size="small" variant="secondary" asChild>
                        <a href={adminPath(`/orders/${encodeURIComponent(order.id)}`)}>
                          View details
                        </a>
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      ) : (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      )}
    </Container>
  );
}
