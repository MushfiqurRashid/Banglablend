import { redirect } from "next/navigation";
import { getCustomerSession, getSupabaseForRequest } from "@/lib/auth/server";
import { SavedBoxesGrid, type SavedBoxSummary } from "@/components/account/saved-boxes-grid";

export const metadata = { title: "Saved Boxes", robots: { index: false, follow: false } };

export default async function SavedBoxesPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");

  const supabase = await getSupabaseForRequest();
  const { data } = await supabase
    .from("saved_boxes")
    .select("id, catalog:storefront_catalogs ( name, handle, box_size ), items:saved_box_items ( product:products ( title, thumbnail_url ) )")
    .order("created_at", { ascending: false });

  return (
    <>
      <span className="eyebrow">Build a box, save it for later</span>
      <h1>Saved Boxes</h1>
      <div style={{ marginTop: "2rem" }}>
        <SavedBoxesGrid boxes={(data ?? []) as unknown as SavedBoxSummary[]} />
      </div>
    </>
  );
}
