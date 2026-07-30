import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";

export const metadata = { title: "Order received", robots: { index: false, follow: false } };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; verification?: string }> }) {
  const query = await searchParams;
  const pending = query.verification === "pending";
  return <section className="section"><PageContainer><div className="empty-state">{pending ? <Clock3 size={40} /> : <CheckCircle2 size={40} color="var(--color-success)" />}<h1>{pending ? "Payment verification in progress" : "Thank you for your order"}</h1><p>{pending ? "Your browser returned from the payment provider. We will confirm payment only after the server verifies the transaction." : `Your order ${query.order ? `(${query.order}) ` : ""}has been received. We’ll send updates using the contact details provided.`}</p><Link href="/account/orders" className="button button-primary">View orders</Link></div></PageContainer></section>;
}
