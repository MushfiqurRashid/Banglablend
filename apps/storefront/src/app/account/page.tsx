import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/server";
import { LogoutButton } from "@/components/account/logout-button";

export const metadata = { title: "My Account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  return <><span className="eyebrow">Your account</span><h1>Welcome{customer.first_name ? `, ${customer.first_name}` : ""}</h1><p className="lead">Manage delivery preferences, saved recipients, orders and communication choices.</p><div className="account-dashboard" style={{ marginTop: "2rem" }}><Link className="account-panel" href="/account/orders"><h3>Orders & gifts</h3><p>Review order status, tracking, gift history and eligible reorders.</p></Link><Link className="account-panel" href="/account/addresses"><h3>Addresses & recipients</h3><p>Keep Bangladesh and international addresses separate and current.</p></Link></div><div style={{ marginTop: "2rem" }}><LogoutButton /></div></>;
}
