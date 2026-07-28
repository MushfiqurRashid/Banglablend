import Link from "next/link";
import { CircleX } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";

export const metadata = { title: "Payment not completed", robots: { index: false, follow: false } };

export default function CheckoutFailedPage() {
  return <section className="section"><PageContainer><div className="empty-state"><CircleX size={40} color="var(--color-error)" /><h1>Payment was not completed</h1><p>Your cart is still available. No payment is considered successful without server validation.</p><Link href="/checkout" className="button button-primary">Return to checkout</Link></div></PageContainer></section>;
}
