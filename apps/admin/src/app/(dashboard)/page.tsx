import type { CSSProperties } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  MessageSquareText,
  PackageSearch,
  Plus,
  ShoppingBag,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { getCatalogReadiness, type CatalogReadinessProduct } from "@/lib/catalog";

type Metric = {
  label: string;
  value: number;
  href: string;
  color: string;
  icon: LucideIcon;
  visible: boolean;
};

type AttentionProduct = Omit<CatalogReadinessProduct, "variants"> & {
  id: string;
  title: string;
  handle: string;
  variants: Array<{ sku: string | null; deleted_at: string | null; prices: Array<{ amount: number }> }>;
};

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ access?: string }> }) {
  const { access } = await searchParams;
  const session = await getStaffSession();
  const supabase = await getSupabaseForRequest();

  const [products, orders, customers, newInquiries, paymentAudits, recentActivity, readinessProducts] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("payment_audits").select("*", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("admin_audit_log").select("id, action, resource_label, summary, created_at").order("created_at", { ascending: false }).limit(7),
    supabase
      .from("products")
      .select("id, title, handle, description, thumbnail_url, thumbnail_alt, status, verified, is_placeholder, eligible_markets, variants:product_variants ( sku, deleted_at, prices:product_prices ( amount ) )")
      .is("deleted_at", null),
  ]);

  const metrics: Metric[] = [
    { label: "Active products", value: products.count ?? 0, href: "/products", color: "#22634b", icon: PackageSearch, visible: hasPermission(session, "catalog", "view") },
    { label: "Total orders", value: orders.count ?? 0, href: "/orders", color: "#a33a27", icon: ShoppingBag, visible: hasPermission(session, "orders", "view") },
    { label: "Customers", value: customers.count ?? 0, href: "/customers", color: "#385f82", icon: UsersRound, visible: hasPermission(session, "customers", "view") },
    { label: "New inquiries", value: newInquiries.count ?? 0, href: "/inquiries", color: "#98601a", icon: MessageSquareText, visible: hasPermission(session, "inquiries", "view") },
    { label: "Failed payments", value: paymentAudits.count ?? 0, href: "/payment-audits", color: "#9a3333", icon: WalletCards, visible: hasPermission(session, "payments", "view") },
  ];

  const attention = ((readinessProducts.data ?? []) as unknown as AttentionProduct[])
    .map((product) => {
      const readiness = getCatalogReadiness({
        ...product,
        variants: product.variants.filter((variant) => !variant.deleted_at),
      });
      return { ...product, readiness };
    })
    .filter((product) => !product.readiness.ready)
    .slice(0, 7);

  const hasQueryError = [products, orders, customers, newInquiries, paymentAudits, recentActivity, readinessProducts].some((result) => result.error);
  const canManageCatalog = hasPermission(session, "catalog", "manage");
  const canManageContent = hasPermission(session, "content", "manage");

  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">Daily operations</div>
          <h1 className="page-title">Good day, {session?.fullName?.split(" ")[0] ?? session?.email}.</h1>
          <p className="page-subtitle">Here is what needs attention across Bangla Blend.</p>
        </div>
        <div className="overview-actions">
          {canManageCatalog ? (
            <Link href="/products/new" className="btn btn-primary">
              <Plus aria-hidden="true" /> New product
            </Link>
          ) : null}
          {canManageContent ? (
            <Link href="/content/new" className="btn btn-secondary">
              <Plus aria-hidden="true" /> New content
            </Link>
          ) : null}
        </div>
      </div>

      {access === "denied" ? (
        <div className="notice">
          <AlertTriangle aria-hidden="true" /> Your role does not allow access to that area.
        </div>
      ) : null}
      {hasQueryError ? (
        <div className="notice">
          <AlertTriangle aria-hidden="true" /> Some live metrics could not be loaded. Refresh the page before acting on these totals.
        </div>
      ) : null}

      <div className="metric-grid">
        {metrics.filter((metric) => metric.visible).map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.label} href={metric.href} className="metric-card" style={{ "--metric-color": metric.color } as CSSProperties}>
              <span className="metric-label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <span className="metric-icon">
                <Icon aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="overview-panels">
        <section className="card">
          <div className="panel-heading">
            <h2>Recent activity</h2>
            <Link href="/audit-log">
              View log <ArrowRight aria-hidden="true" style={{ width: 12, height: 12, display: "inline" }} />
            </Link>
          </div>
          {recentActivity.data?.length ? (
            <ul className="activity-list">
              {recentActivity.data.map((entry) => (
                <li key={entry.id}>
                  <div className="activity-summary">{entry.summary}</div>
                  <div className="activity-meta">
                    {entry.action.replaceAll(".", " / ")} &middot; {new Date(entry.created_at).toLocaleString("en-BD")}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">No administrator activity has been recorded yet.</p>
          )}
        </section>

        {hasPermission(session, "catalog", "view") ? (
          <section className="card">
            <div className="panel-heading">
              <h2>Catalog attention</h2>
              <Link href="/products">
                Review all <ArrowRight aria-hidden="true" style={{ width: 12, height: 12, display: "inline" }} />
              </Link>
            </div>
            {attention.length ? (
              <ul className="attention-list">
                {attention.map((product) => (
                  <li key={product.id}>
                    <Link href={`/products/${product.id}`}>
                      <span>
                        {product.title}
                        <small>{product.readiness.missing.join(", ")}</small>
                      </span>
                      <span className="badge badge-warning">Review</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">Every active product passes the publish-readiness checks.</p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
