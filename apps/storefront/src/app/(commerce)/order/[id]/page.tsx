import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export const metadata = { title: "Order status", robots: { index: false, follow: false } };

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <section className="section"><PageContainer><Breadcrumbs items={[{ label: "Order status" }]} /><span className="eyebrow">Tracking</span><h1>Order {id}</h1><div className="empty-state" style={{ marginTop: "2rem" }}><h3>Sign in to view live order details</h3><p>For your privacy, order status is available after a secure account check or through the private link in your confirmation email.</p></div></PageContainer></section>;
}
