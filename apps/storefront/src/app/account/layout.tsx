import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { LogoutButton } from "@/components/account/logout-button";
import "./account.css";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="section">
      <PageContainer>
        <div className="account-shell">
          <nav className="account-nav" aria-label="Account navigation">
            <Link href="/account">Dashboard</Link>
            <Link href="/account/orders">My Orders</Link>
            <Link href="/account/order-tracking">Order Tracking</Link>
            <Link href="/account/addresses">Addresses</Link>
            <Link href="/account/profile">Account Details</Link>
            <Link href="/account/wishlist">Wishlist</Link>
            <Link href="/account/saved-boxes">Saved Boxes</Link>
            <LogoutButton />
          </nav>
          <div>{children}</div>
        </div>
      </PageContainer>
    </section>
  );
}
