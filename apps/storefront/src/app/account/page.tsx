import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession, getSupabaseForRequest } from "@/lib/auth/server";
import { OrdersTable, type OrderSummary } from "@/components/account/orders-table";
import { WishlistGrid, type WishlistItem } from "@/components/account/wishlist-grid";

export const metadata = { title: "My Account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");

  const supabase = await getSupabaseForRequest();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [ordersCountResult, recentOrdersResult, wishlistCountResult, wishlistPreviewResult, deliveredThisMonthResult] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, display_id, created_at, currency_code, total, payment_status, fulfillment_status")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("wishlist_items").select("id", { count: "exact", head: true }),
    supabase
      .from("wishlist_items")
      .select("id, product:products ( id, title, handle, thumbnail_url, thumbnail_alt, variants:product_variants ( prices:product_prices ( amount, currency_code ) ) )")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("fulfillment_status", "delivered").gte("updated_at", startOfMonth),
  ]);

  const recentOrders = (recentOrdersResult.data ?? []) as OrderSummary[];
  const addresses = customer.addresses ?? [];
  const addressPreview = addresses.slice(0, 2);
  const initials = (customer.first_name?.[0] ?? customer.email[0] ?? "?").toUpperCase();

  interface WishlistPreviewRow {
    id: string;
    product: {
      id: string;
      title: string;
      handle: string;
      thumbnail_url: string | null;
      thumbnail_alt: string | null;
      variants: { prices: { amount: number; currency_code: string }[] }[];
    } | null;
  }
  const wishlistPreview: WishlistItem[] = ((wishlistPreviewResult.data ?? []) as unknown as WishlistPreviewRow[]).map((row) => ({
    id: row.id,
    product: row.product
      ? {
          id: row.product.id,
          title: row.product.title,
          handle: row.product.handle,
          thumbnail_url: row.product.thumbnail_url,
          thumbnail_alt: row.product.thumbnail_alt,
          price: row.product.variants[0]?.prices[0]
            ? { amount: row.product.variants[0].prices[0].amount, currencyCode: row.product.variants[0].prices[0].currency_code.toUpperCase() }
            : undefined,
        }
      : null,
  }));

  return (
    <>
      <span className="eyebrow">Your account</span>
      <h1>Welcome back{customer.first_name ? `, ${customer.first_name}` : ""}!</h1>
      <p className="lead">Here&apos;s an overview of your account.</p>

      <div className="account-profile-banner" style={{ marginTop: "2rem" }}>
        <div className="account-avatar" aria-hidden="true">{initials}</div>
        <div>
          <strong>{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email}</strong>
          <p>{customer.email}</p>
          {customer.phone ? <p>{customer.phone}</p> : null}
        </div>
        <Link className="button" href="/account/profile">View Account Details</Link>
      </div>

      <div className="account-stat-grid">
        <div className="account-stat-card">
          <strong>{ordersCountResult.count ?? 0}</strong>
          <span>Total Orders</span>
          <Link href="/account/orders">View all orders</Link>
        </div>
        <div className="account-stat-card">
          <strong>{wishlistCountResult.count ?? 0}</strong>
          <span>Wishlist Items</span>
          <Link href="/account/wishlist">View wishlist</Link>
        </div>
        <div className="account-stat-card">
          <strong>{addresses.length}</strong>
          <span>Saved Addresses</span>
          <Link href="/account/addresses">View addresses</Link>
        </div>
        <div className="account-stat-card">
          <span className="account-stat-card-heading">Recent Activity</span>
          <p>
            You have {deliveredThisMonthResult.count ?? 0} order{deliveredThisMonthResult.count === 1 ? "" : "s"} delivered this month.
          </p>
        </div>
      </div>

      <div className="account-action-row">
        <h2>Recent Orders</h2>
        <Link href="/account/orders" className="text-link">View all orders</Link>
      </div>
      <OrdersTable orders={recentOrders} />

      <div className="account-action-row">
        <h2>Saved Addresses</h2>
        <Link href="/account/addresses" className="text-link">View all addresses</Link>
      </div>
      <div className="account-dashboard">
        {addressPreview.map((address) => (
          <div className="account-panel address-card" key={address.id}>
            <div>
              {address.is_default_shipping ? <span className="address-badge">Primary</span> : null}
            </div>
            <p>
              {address.first_name} {address.last_name}
              <br />
              {address.address_1}
              {address.address_2 ? `, ${address.address_2}` : ""}
              <br />
              {address.city}
              {address.postal_code ? ` ${address.postal_code}` : ""}
              {address.country_code ? `, ${address.country_code.toUpperCase()}` : ""}
              <br />
              {address.phone}
            </p>
          </div>
        ))}
        <Link href="/account/addresses" className="account-panel account-panel-add">
          <span>+</span>
          Add New Address
        </Link>
      </div>

      <div className="account-action-row">
        <h2>Wishlist Preview</h2>
        <Link href="/account/wishlist" className="text-link">View full wishlist</Link>
      </div>
      <WishlistGrid items={wishlistPreview} />
    </>
  );
}
