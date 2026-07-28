import { redirect } from "next/navigation";
import { AddressManager } from "@/components/account/address-manager";
import { getCustomerSession } from "@/lib/auth/server";

export const metadata = { title: "Addresses and Recipients", robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  return <>
    <span className="eyebrow">Saved details</span>
    <h1>Addresses & recipients</h1>
    <AddressManager initialAddresses={customer.addresses ?? []} />
    <div className="account-panel privacy-panel"><h3>Gift recipient privacy</h3><p>Recipient details are retained only for delivery, support, and an explicitly requested future reorder.</p></div>
  </>;
}
