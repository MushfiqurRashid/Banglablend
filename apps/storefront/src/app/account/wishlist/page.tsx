import { redirect } from "next/navigation";
import { getCustomerSession, getSupabaseForRequest } from "@/lib/auth/server";
import { WishlistGrid, type WishlistItem } from "@/components/account/wishlist-grid";

export const metadata = { title: "Wishlist", robots: { index: false, follow: false } };

interface WishlistRow {
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

export default async function WishlistPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");

  const supabase = await getSupabaseForRequest();
  const { data } = await supabase
    .from("wishlist_items")
    .select("id, product:products ( id, title, handle, thumbnail_url, thumbnail_alt, variants:product_variants ( prices:product_prices ( amount, currency_code ) ) )")
    .order("created_at", { ascending: false });

  const items: WishlistItem[] = ((data ?? []) as unknown as WishlistRow[]).map((row) => ({
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
      <span className="eyebrow">Saved for later</span>
      <h1>Wishlist</h1>
      <div style={{ marginTop: "2rem" }}>
        <WishlistGrid items={items} />
      </div>
    </>
  );
}
