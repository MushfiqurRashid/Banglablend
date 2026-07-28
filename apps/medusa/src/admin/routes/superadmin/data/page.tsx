import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Container, Heading, Input, Table, Text } from "@medusajs/ui";
import {
  EmptyState,
  PageHeader,
  ResourceCard,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";

interface IntegrationPayload {
  integrations: {
    storefront: { configured: boolean; url: string };
    sanity_studio: { configured: boolean; url: string };
    search: { configured: boolean };
    payments: { sslcommerz_enabled: boolean; sandbox: boolean };
  };
}

interface ResourceDefinition {
  title: string;
  description: string;
  href: string;
  badge: string;
  external?: boolean;
  keywords?: string[];
}

interface ResourceSection {
  title: string;
  description: string;
  owner: string;
  resources: ResourceDefinition[];
}

function internal(
  title: string,
  description: string,
  path: string,
  badge: string,
  keywords: string[] = [],
): ResourceDefinition {
  return {
    title,
    description,
    href: adminPath(path),
    badge,
    keywords,
  };
}

function sectionId(title: string) {
  return `data-section-${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

const DataPage = () => {
  const [query, setQuery] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationPayload["integrations"]>({
    storefront: { configured: false, url: "http://localhost:3000" },
    sanity_studio: { configured: false, url: "http://localhost:3333" },
    search: { configured: false },
    payments: { sslcommerz_enabled: false, sandbox: true },
  });

  useEffect(() => {
    const controller = new AbortController();
    adminRequest<IntegrationPayload>("/admin/superadmin/overview", {
      signal: controller.signal,
    })
      .then((payload) => setIntegrations(payload.integrations))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          // The directory remains useful with local fallback URLs.
        }
      });
    return () => controller.abort();
  }, []);

  const sections = useMemo<ResourceSection[]>(
    () => [
      {
        title: "Catalog and merchandising",
        description:
          "Customer-facing products and the structures that organize, price, and promote them.",
        owner: "Medusa commerce",
        resources: [
          internal(
            "Catalog workspace",
            "Guided product readiness, descriptions, media, market eligibility, origin, and storefront visibility.",
            "/superadmin/catalog",
            "Guided CRUD",
            ["images", "descriptions", "markets", "origin"],
          ),
          internal(
            "Products",
            "Native product, variant, option, media, price, sales-channel, and stock management.",
            "/products",
            "Core CRUD",
            ["variants", "sku", "media", "pricing"],
          ),
          internal(
            "Collections",
            "Maintain the primary merchandising collections and their product membership.",
            "/collections",
            "Core CRUD",
          ),
          internal(
            "Categories",
            "Create and organize the hierarchical customer-facing category tree.",
            "/categories",
            "Core CRUD",
          ),
          internal(
            "Product options",
            "Manage reusable product options and option values.",
            "/product-options",
            "Core CRUD",
          ),
          internal(
            "Product tags",
            "Maintain reusable tags used by filters, badges, and operational classification.",
            "/settings/product-tags",
            "Core CRUD",
          ),
          internal(
            "Product types",
            "Maintain internal product-type classification.",
            "/settings/product-types",
            "Core CRUD",
          ),
          internal(
            "Price lists",
            "Manage scheduled, customer-specific, and market-specific price overrides.",
            "/price-lists",
            "Core CRUD",
            ["prices", "currency"],
          ),
          internal(
            "Promotions",
            "Create discount rules and manage promotion eligibility.",
            "/promotions",
            "Core CRUD",
          ),
          internal(
            "Campaigns",
            "Group promotions under governed campaign budgets and schedules.",
            "/campaigns",
            "Core CRUD",
          ),
        ],
      },
      {
        title: "Inventory, markets, tax, and fulfillment",
        description:
          "Availability and delivery configuration that controls whether an order can be accepted safely.",
        owner: "Medusa commerce",
        resources: [
          internal(
            "Inventory",
            "Inventory items, attributes, stock levels, and location-specific availability.",
            "/inventory",
            "Core CRUD",
            ["stock", "levels"],
          ),
          internal(
            "Reservations",
            "Inspect and maintain inventory reservations created by carts and orders.",
            "/reservations",
            "Workflow",
          ),
          internal(
            "Stock locations",
            "Warehouses and locations linked to sales channels and fulfillment providers.",
            "/settings/locations",
            "Core CRUD",
          ),
          internal(
            "Shipping profiles",
            "Group products by the delivery behavior and options they require.",
            "/settings/locations/shipping-profiles",
            "Core CRUD",
          ),
          internal(
            "Shipping option types",
            "Reusable labels and codes for customer delivery choices.",
            "/settings/locations/shipping-option-types",
            "Core CRUD",
          ),
          internal(
            "Regions",
            "Currencies, countries, payment providers, and regional commerce rules.",
            "/settings/regions",
            "Core CRUD",
            ["markets", "currency", "payments"],
          ),
          internal(
            "Sales channels",
            "Control where products are offered and which stock locations fulfill them.",
            "/settings/sales-channels",
            "Core CRUD",
          ),
          internal(
            "Tax regions",
            "Tax regions, rates, provinces, and product overrides.",
            "/settings/tax-regions",
            "Core CRUD",
          ),
          internal(
            "Return reasons",
            "Approved customer-facing and operational reasons for returns.",
            "/settings/return-reasons",
            "Core CRUD",
          ),
          internal(
            "Refund reasons",
            "Approved classifications used when issuing a refund.",
            "/settings/refund-reasons",
            "Core CRUD",
          ),
        ],
      },
      {
        title: "Sales, customers, and service operations",
        description:
          "Transactional customer records. Use supported workflows so financial and fulfillment history remains intact.",
        owner: "Medusa commerce and Bangla Blend operations",
        resources: [
          internal(
            "Orders",
            "Review orders and perform supported allocation, fulfillment, shipment, return, exchange, claim, and refund actions.",
            "/orders",
            "Workflow",
            ["sales", "payments", "fulfillment"],
          ),
          internal(
            "Customers",
            "Customer profiles, addresses, groups, metadata, and customer-owned order history.",
            "/customers",
            "Core CRUD",
          ),
          internal(
            "Customer groups",
            "Organize customers for pricing, promotions, and service workflows.",
            "/customer-groups",
            "Core CRUD",
          ),
          internal(
            "Inquiries",
            "Triage contact, newsletter, wholesale, and corporate gifting submissions.",
            "/inquiries",
            "Operational CRUD",
            ["support", "wholesale", "corporate"],
          ),
          internal(
            "Payment reconciliation",
            "Review safe SSLCOMMERZ callback evidence and payment exceptions without rewriting provider history.",
            "/payment-audits",
            "Read only",
            ["payment audit", "sslcommerz"],
          ),
          internal(
            "Workflow executions",
            "Inspect framework workflow state for operational diagnosis and controlled recovery.",
            "/settings/workflows",
            "System view",
          ),
        ],
      },
      {
        title: "Application governance and access",
        description:
          "Configuration, users, roles, keys, and evidence that keep maintenance organized and accountable.",
        owner: "Superadmin and engineering",
        resources: [
          internal(
            "Application settings",
            "Typed, grouped operational values with public and secret boundaries.",
            "/superadmin/settings",
            "Governed CRUD",
            ["configuration", "feature settings"],
          ),
          internal(
            "Administrator audit",
            "Append-only before-and-after evidence for governed administrative changes.",
            "/superadmin/audit",
            "Immutable",
            ["history", "activity"],
          ),
          internal(
            "Admin users",
            "Invite staff, review membership, edit names and metadata, and remove obsolete access.",
            "/settings/users",
            "Access control",
          ),
          internal(
            "Roles",
            "Assign least-privilege native Medusa roles when RBAC is enabled.",
            "/settings/roles",
            "RBAC",
          ),
          internal(
            "Policies",
            "Review native Medusa permission policies when RBAC is enabled.",
            "/settings/policies",
            "Read only",
          ),
          internal(
            "Publishable API keys",
            "Manage storefront-safe API keys and their sales-channel scope.",
            "/settings/publishable-api-keys",
            "Rotate / revoke",
          ),
          internal(
            "Secret API keys",
            "Create, rotate, and revoke server-side Admin API credentials.",
            "/settings/secret-api-keys",
            "Sensitive",
          ),
          {
            title: "Custom API documentation",
            description:
              "Open the Bangla Blend Swagger contract for governed custom Admin and Store endpoints.",
            href: "/docs",
            badge: "Reference",
            external: true,
            keywords: ["openapi", "swagger"],
          },
        ],
      },
      {
        title: "Editorial content and customer experience",
        description:
          "Narrative content lives in Sanity; the storefront presents verified content and Medusa commerce data.",
        owner: "Sanity Studio and storefront",
        resources: [
          {
            title: "Sanity Content Studio",
            description:
              "Homepage, recipes, journal, navigation, FAQs, legal pages, sourcing, translations, and product storytelling.",
            href: integrations.sanity_studio.url,
            badge: integrations.sanity_studio.configured ? "Configured" : "Needs setup",
            external: true,
            keywords: ["cms", "recipes", "journal", "legal", "navigation"],
          },
          {
            title: "Customer storefront",
            description:
              "Verify published catalog, editorial content, customer journeys, and market-specific behavior.",
            href: integrations.storefront.url,
            badge: integrations.storefront.configured ? "Configured" : "Needs setup",
            external: true,
            keywords: ["website", "shop", "customer ui"],
          },
          internal(
            "Translations",
            "Manage Medusa-owned translations and locales when the translation feature is enabled.",
            "/settings/translations",
            "Feature gated",
          ),
          internal(
            "Integration health",
            "Review configuration signals for storefront, Studio, search, and payment providers.",
            "/superadmin",
            "Overview",
            ["meilisearch", "sslcommerz"],
          ),
        ],
      },
    ],
    [integrations],
  );

  const visibleSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sections;
    return sections
      .map((section) => ({
        ...section,
        resources: section.resources.filter((resource) =>
          [
            resource.title,
            resource.description,
            resource.badge,
            section.title,
            section.owner,
            ...(resource.keywords ?? []),
          ].some((value) => value.toLowerCase().includes(normalized)),
        ),
      }))
      .filter((section) => section.resources.length);
  }, [query, sections]);

  const resourceCount = sections.reduce((total, section) => total + section.resources.length, 0);
  const shownCount = visibleSections.reduce(
    (total, section) => total + section.resources.length,
    0,
  );

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Business data directory"
        subtitle="An organized map of every maintainable application domain, its authoritative system, and its safe management workflow. Use these views instead of editing database tables directly."
        badge="All application domains"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/superadmin"))}
            >
              Control center
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/superadmin/audit"))}
            >
              Audit history
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Container>
          <Badge color="blue">Commerce source of truth</Badge>
          <Heading level="h2" className="mt-3">
            Medusa owns transactional data
          </Heading>
          <Text className="text-ui-fg-subtle mt-2">
            Products, variants, SKUs, images, prices, stock, markets, customers, carts, orders,
            payments, shipping, fulfillment, promotions, and refunds are managed through Medusa
            domain views and workflows.
          </Text>
        </Container>
        <Container>
          <Badge color="purple">Content source of truth</Badge>
          <Heading level="h2" className="mt-3">
            Sanity owns editorial content
          </Heading>
          <Text className="text-ui-fg-subtle mt-2">
            Recipes, journal stories, regions, producers, navigation, legal pages, sourcing
            evidence, translations, and product storytelling belong in Studio. Never correct price,
            stock, order, or payment truth there.
          </Text>
        </Container>
      </div>

      <Container>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <label className="flex w-full max-w-2xl flex-col gap-1">
            <Text size="small" weight="plus">
              Find a data domain
            </Text>
            <Input
              placeholder="Products, stock, customers, payments, roles, recipes..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="flex items-center gap-2">
            <Badge color="grey">
              {shownCount} of {resourceCount} resources
            </Badge>
            {query ? (
              <Button size="small" variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : null}
          </div>
        </div>
      </Container>

      {visibleSections.length ? (
        visibleSections.map((section) => (
          <section key={section.title} aria-labelledby={sectionId(section.title)}>
            <Container className="mb-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <Heading level="h2" id={sectionId(section.title)}>
                    {section.title}
                  </Heading>
                  <Text className="text-ui-fg-subtle mt-1 max-w-4xl">{section.description}</Text>
                </div>
                <Badge color="grey">{section.owner}</Badge>
              </div>
            </Container>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {section.resources.map((resource) => (
                <ResourceCard
                  key={`${section.title}-${resource.title}`}
                  title={resource.title}
                  description={resource.description}
                  href={resource.href}
                  badge={resource.badge}
                  external={resource.external}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <Container>
          <EmptyState
            title="No matching data domain"
            description="Try a broader business term such as product, order, stock, customer, payment, content, or access."
          />
        </Container>
      )}

      <Container>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge color="red">Protected history</Badge>
            <Heading level="h2" className="mt-3">
              Records without generic edit or delete controls
            </Heading>
            <Text className="text-ui-fg-subtle mt-1 max-w-4xl">
              Full maintenance access does not make every database row mutable. These domains use
              explicit business actions so evidence and system integrity remain intact.
            </Text>
          </div>
          <a
            className="text-ui-fg-interactive text-sm font-medium hover:underline"
            href={adminPath("/superadmin/audit")}
          >
            Review immutable audit evidence
          </a>
        </div>
        <div className="border-ui-border-base mt-5 overflow-hidden rounded-lg border">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Protected domain</Table.HeaderCell>
                <Table.HeaderCell>Allowed maintenance action</Table.HeaderCell>
                <Table.HeaderCell>Why direct CRUD is unsafe</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {[
                [
                  "Orders, payments, refunds, returns, and fulfillment history",
                  "Cancel, refund, return, exchange, fulfill, reconcile",
                  "Financial and customer-service history must remain traceable.",
                ],
                [
                  "Payment callback and idempotency evidence",
                  "Inspect and reconcile",
                  "Provider evidence must not be rewritten after processing.",
                ],
                [
                  "Administrator audit records",
                  "Search and inspect",
                  "The evidence trail is append-only and cannot audit its own deletion.",
                ],
                [
                  "Passwords, auth identities, sessions, tokens, and secret keys",
                  "Invite, reset, rotate, or revoke",
                  "Secret values must never be displayed or manually overwritten as raw rows.",
                ],
                [
                  "Migrations, module links, events, and workflow state",
                  "Deploy, retry, or repair through engineering runbooks",
                  "Framework-owned rows require transactional invariants and versioned code.",
                ],
                [
                  "Meilisearch documents",
                  "Rebuild the index",
                  "Search is a disposable projection of Medusa and verified Sanity content.",
                ],
              ].map(([domain, action, reason]) => (
                <Table.Row key={domain}>
                  <Table.Cell>
                    <Text weight="plus">{domain}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="orange">{action}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle max-w-xl">{reason}</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Container>
    </div>
  );
};

export default DataPage;
