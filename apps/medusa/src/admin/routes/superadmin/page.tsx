import { useCallback, useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui";
import {
  ErrorState,
  LoadingState,
  MetricCard,
  PageHeader,
  ResourceCard,
  adminPath,
  adminRequest,
  safeExternalUrl,
} from "../../lib/superadmin";

interface AttentionProduct {
  id: string;
  title: string;
  handle: string;
  missing: string[];
}

interface OverviewPayload {
  role: { id: string; label: string; authorized: boolean };
  metrics: {
    products: number;
    storefront_ready_products: number;
    orders: number;
    customers: number;
    promotions: number;
    regions: number;
    admin_users: number;
    new_inquiries: number;
    payment_exceptions: number;
    settings: number;
  };
  attention: {
    catalog: AttentionProduct[];
    inquiries: Array<{
      id: string;
      type: string;
      email: string;
      company?: string | null;
      contact_person?: string | null;
      created_at?: string;
    }>;
    payment_exceptions: Array<{
      id: string;
      status: string;
      transaction_id: string;
      order_reference?: string | null;
    }>;
  };
  recent_activity: Array<{
    id: string;
    action: string;
    summary: string;
    actor_email?: string | null;
    created_at?: string;
  }>;
  integrations: {
    storefront: { configured: boolean; url: string };
    sanity_studio: { configured: boolean; url: string };
    search: { configured: boolean };
    payments: { sslcommerz_enabled: boolean; sandbox: boolean };
  };
}

const metricDefinitions: Array<{
  key: keyof OverviewPayload["metrics"];
  label: string;
  detail: string;
  tone: "grey" | "green" | "blue" | "orange" | "red" | "purple";
}> = [
  { key: "products", label: "Products", detail: "All catalog records", tone: "blue" },
  {
    key: "storefront_ready_products",
    label: "Storefront ready",
    detail: "Passed publishing checks",
    tone: "green",
  },
  { key: "orders", label: "Orders", detail: "Transactional records", tone: "purple" },
  { key: "customers", label: "Customers", detail: "Customer profiles", tone: "grey" },
  { key: "new_inquiries", label: "New inquiries", detail: "Waiting for triage", tone: "orange" },
  {
    key: "payment_exceptions",
    label: "Payment exceptions",
    detail: "Needs reconciliation",
    tone: "red",
  },
];

const activityDateFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatActivityDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : activityDateFormatter.format(date);
}

function IntegrationStatus({
  label,
  ready,
  detail,
}: {
  label: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <div className="border-ui-border-base flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div>
        <Text weight="plus">{label}</Text>
        <Text size="small" className="text-ui-fg-subtle">
          {detail}
        </Text>
      </div>
      <Badge color={ready ? "green" : "orange"}>{ready ? "Configured" : "Needs setup"}</Badge>
    </div>
  );
}

function ActivityEntry({ activity }: { activity: OverviewPayload["recent_activity"][number] }) {
  const timestamp = formatActivityDate(activity.created_at);

  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <Text weight="plus">{activity.summary}</Text>
        <Badge color="grey">{activity.action.split(".").at(-1) || "update"}</Badge>
      </div>
      <Text size="small" className="text-ui-fg-subtle mt-1">
        {activity.actor_email || "System administrator"}
        {timestamp ? ` · ${timestamp}` : ""}
      </Text>
    </div>
  );
}

const SuperadminDashboard = () => {
  const [data, setData] = useState<OverviewPayload>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminRequest<OverviewPayload>("/admin/superadmin/overview"));
      setError(undefined);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The superadmin overview could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const storefrontUrl = safeExternalUrl(data?.integrations.storefront.url);

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Superadmin control center"
        subtitle="Manage catalog, sales, customers, operations, staff access, content handoffs, settings, and audit evidence from one organized workspace."
        badge="Full application access"
        actions={
          <>
            <Button
              variant="secondary"
              disabled={!storefrontUrl}
              onClick={() => {
                if (storefrontUrl) {
                  window.open(storefrontUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              View storefront
            </Button>
            <Button onClick={() => window.location.assign(adminPath("/superadmin/catalog"))}>
              Manage catalog
            </Button>
          </>
        }
      />

      {loading ? <LoadingState label="Loading the operational overview…" /> : null}
      {error ? <ErrorState message={error} retry={() => void load()} /> : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {metricDefinitions.map((definition) => (
              <MetricCard
                key={definition.key}
                label={definition.label}
                value={data.metrics[definition.key]}
                detail={definition.detail}
                tone={definition.tone}
              />
            ))}
          </div>

          <Container>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <Heading level="h2">Priority queue</Heading>
                <Text className="text-ui-fg-subtle mt-1">
                  Items most likely to block publishing or customer operations.
                </Text>
              </div>
              <Button variant="secondary" isLoading={loading} onClick={() => void load()}>
                Refresh data
              </Button>
            </div>
            <div className="border-ui-border-base mt-5 overflow-x-auto rounded-lg border">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Area</Table.HeaderCell>
                    <Table.HeaderCell>Record</Table.HeaderCell>
                    <Table.HeaderCell>Needs attention</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.attention.catalog.map((product) => (
                    <Table.Row key={`catalog-${product.id}`}>
                      <Table.Cell>
                        <Badge color="blue">Catalog</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="plus">{product.title}</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          /{product.handle}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{product.missing.join(", ")}</Table.Cell>
                      <Table.Cell className="text-right">
                        <a
                          className="text-ui-fg-interactive hover:underline"
                          href={adminPath(
                            `/superadmin/catalog?product=${encodeURIComponent(product.id)}`,
                          )}
                        >
                          Review
                        </a>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {data.attention.inquiries.map((inquiry) => (
                    <Table.Row key={`inquiry-${inquiry.id}`}>
                      <Table.Cell>
                        <Badge color="orange">Inquiry</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="plus">
                          {inquiry.company || inquiry.contact_person || inquiry.email}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {inquiry.type}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>New submission awaiting triage</Table.Cell>
                      <Table.Cell className="text-right">
                        <a
                          className="text-ui-fg-interactive hover:underline"
                          href={adminPath("/inquiries")}
                        >
                          Open
                        </a>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {data.attention.payment_exceptions.map((payment) => (
                    <Table.Row key={`payment-${payment.id}`}>
                      <Table.Cell>
                        <Badge color="red">Payment</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="plus">
                          {payment.order_reference || payment.transaction_id}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {payment.transaction_id}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{payment.status.replaceAll("_", " ")}</Table.Cell>
                      <Table.Cell className="text-right">
                        <a
                          className="text-ui-fg-interactive hover:underline"
                          href={adminPath("/payment-audits")}
                        >
                          Reconcile
                        </a>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                  {!data.attention.catalog.length &&
                  !data.attention.inquiries.length &&
                  !data.attention.payment_exceptions.length ? (
                    <Table.Row>
                      <Table.Cell>
                        <Badge color="green">All clear</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text weight="plus">No priority items</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="text-ui-fg-subtle">
                          No catalog, inquiry, or payment exceptions are waiting.
                        </Text>
                      </Table.Cell>
                      <Table.Cell />
                    </Table.Row>
                  ) : null}
                </Table.Body>
              </Table>
            </div>
          </Container>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ResourceCard
              title="Catalog workspace"
              description="Create products, upload and order media, edit descriptions, variants, pricing, inventory, markets, origin, and storefront readiness."
              href={adminPath("/superadmin/catalog")}
              badge="Full CRUD"
            />
            <ResourceCard
              title="Sales & customers"
              description="Review orders, payments, fulfillment, returns, customer profiles, addresses, and service history."
              href={adminPath("/orders")}
              badge="Transactional"
            />
            <ResourceCard
              title="Data management"
              description="A structured directory of every safe business data domain, its owner, and its supported management workflow."
              href={adminPath("/superadmin/data")}
              badge="Organized"
            />
            <ResourceCard
              title="Editorial Studio"
              description="Manage homepage content, recipes, journal, navigation, FAQs, legal pages, sourcing, and translations."
              href={data.integrations.sanity_studio.url}
              badge="Sanity"
              external
            />
            <ResourceCard
              title="Application settings"
              description="Maintain grouped operational settings with typed values, public/secret boundaries, and change tracking."
              href={adminPath("/superadmin/settings")}
              badge={`${data.metrics.settings} settings`}
            />
            <ResourceCard
              title="Admin users & roles"
              description="Invite staff, assign least-privilege roles, review access, and keep superadmin membership restricted."
              href={adminPath("/settings/users")}
              badge={`${data.metrics.admin_users} users`}
            />
            <ResourceCard
              title="Inquiries"
              description="Triage contact, newsletter, wholesale, and corporate gifting submissions with ownership and notes."
              href={adminPath("/inquiries")}
              badge={`${data.metrics.new_inquiries} new`}
            />
            <ResourceCard
              title="Audit trail"
              description="Review append-only evidence for product, setting, inquiry, and gift-order changes made by administrators."
              href={adminPath("/superadmin/audit")}
              badge="Immutable"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Container>
              <Heading level="h2">Integration health</Heading>
              <Text className="text-ui-fg-subtle mt-1">
                Configuration signals only; use deployment monitoring for uptime.
              </Text>
              <div className="mt-4">
                <IntegrationStatus
                  label="Customer storefront"
                  ready={data.integrations.storefront.configured}
                  detail={data.integrations.storefront.url}
                />
                <IntegrationStatus
                  label="Editorial Studio"
                  ready={data.integrations.sanity_studio.configured}
                  detail={data.integrations.sanity_studio.url}
                />
                <IntegrationStatus
                  label="Search index"
                  ready={data.integrations.search.configured}
                  detail="Meilisearch administrative connection"
                />
                <IntegrationStatus
                  label="SSLCOMMERZ"
                  ready={data.integrations.payments.sslcommerz_enabled}
                  detail={data.integrations.payments.sandbox ? "Sandbox mode" : "Live mode"}
                />
              </div>
            </Container>

            <Container>
              <div className="flex items-center justify-between">
                <div>
                  <Heading level="h2">Recent admin activity</Heading>
                  <Text className="text-ui-fg-subtle mt-1">Most recent governed changes.</Text>
                </div>
                <a
                  className="text-ui-fg-interactive hover:underline"
                  href={adminPath("/superadmin/audit")}
                >
                  View all
                </a>
              </div>
              <div className="divide-ui-border-base mt-4 divide-y">
                {data.recent_activity.length ? (
                  data.recent_activity.map((activity) => (
                    <ActivityEntry key={activity.id} activity={activity} />
                  ))
                ) : (
                  <Text className="text-ui-fg-subtle py-6">
                    No governed changes have been recorded yet.
                  </Text>
                )}
              </div>
            </Container>
          </div>
        </>
      ) : null}
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Superadmin",
  icon: Buildings,
});

export default SuperadminDashboard;
