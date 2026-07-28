import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import "./account.css";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <section className="section"><PageContainer><div className="account-shell"><nav className="account-nav" aria-label="Account navigation"><Link href="/account">Overview</Link><Link href="/account/profile">Profile</Link><Link href="/account/addresses">Addresses & recipients</Link><Link href="/account/orders">Orders & gifts</Link></nav><div>{children}</div></div></PageContainer></section>;
}
