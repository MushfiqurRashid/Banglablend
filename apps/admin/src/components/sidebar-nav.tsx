"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileClock,
  FileText,
  Gauge,
  House,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  PackageSearch,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Users,
  UsersRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import type { StaffSession } from "@/lib/auth";

interface NavLeaf {
  href: string;
  label: string;
  icon: LucideIcon;
  resource?: string;
  action?: string;
}

interface NavGroup {
  label: string;
  children: NavLeaf[];
}

const navGroups: NavGroup[] = [
  {
    label: "Workspace",
    children: [{ href: "/", label: "Overview", icon: Gauge }],
  },
  {
    label: "Commerce",
    children: [
      { href: "/orders", label: "Orders", icon: ShoppingBag, resource: "orders", action: "view" },
      { href: "/orders?status=pending", label: "New orders", icon: ClipboardList, resource: "orders", action: "view" },
      { href: "/products", label: "Products", icon: PackageSearch, resource: "catalog", action: "view" },
      { href: "/catalogs", label: "Storefront categories", icon: LayoutGrid, resource: "catalog", action: "view" },
      { href: "/inventory", label: "Inventory", icon: Boxes, resource: "catalog", action: "view" },
    ],
  },
  {
    label: "Relationships",
    children: [
      { href: "/customers", label: "Customers", icon: UsersRound, resource: "customers", action: "view" },
      { href: "/inquiries", label: "Inquiries", icon: MessageSquareText, resource: "inquiries", action: "view" },
    ],
  },
  {
    label: "Storefront",
    children: [
      { href: "/homepage", label: "Homepage", icon: House, resource: "content", action: "view" },
      { href: "/pages", label: "Pages", icon: FileText, resource: "content", action: "view" },
      { href: "/content", label: "Content library", icon: PanelsTopLeft, resource: "content", action: "view" },
    ],
  },
  {
    label: "Insight & control",
    children: [
      { href: "/reports", label: "Reports", icon: BarChart3, resource: "reports", action: "view" },
      { href: "/payment-audits", label: "Payment ledger", icon: WalletCards, resource: "payments", action: "view" },
      { href: "/audit-log", label: "Admin activity", icon: FileClock },
    ],
  },
  {
    label: "Administration",
    children: [
      { href: "/staff", label: "Users & access", icon: Users, resource: "staff", action: "manage" },
      { href: "/settings", label: "Settings", icon: Settings, resource: "settings", action: "manage" },
    ],
  },
];

function hasPermission(permissions: string[], resource?: string, action?: string) {
  if (!resource || !action) return true;
  return permissions.some((permission) => permission === "*:*" || permission === `${resource}:*` || permission === `${resource}:${action}`);
}

function hrefParts(href: string) {
  const [pathname, search = ""] = href.split("?");
  return { pathname, search };
}

function NavList({ permissions, onNavigate }: { permissions: string[]; onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  const isActive = (item: NavLeaf) => {
    const { pathname: targetPath, search } = hrefParts(item.href);
    if (targetPath === "/") return pathname === "/";
    if (!(pathname === targetPath || pathname.startsWith(`${targetPath}/`))) return false;
    return search ? currentSearch === search : !currentSearch;
  };

  return navGroups.map((group) => {
    const items = group.children.filter((item) => hasPermission(permissions, item.resource, item.action));
    if (!items.length) return null;
    return (
      <div className="nav-group" key={group.label}>
        <div className="nav-group-label">{group.label}</div>
        <div className="nav-group-items">
          {items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link href={item.href} className={`nav-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} key={item.href} onClick={onNavigate}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {active ? <ChevronRight className="nav-current" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </div>
      </div>
    );
  });
}

export function SidebarNav({
  session,
  storefrontUrl,
  open,
  onNavigate,
  onClose,
}: {
  session: StaffSession;
  storefrontUrl: string;
  open: boolean;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const initials = (session.fullName ?? session.email)
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside className={`admin-sidebar ${open ? "is-open" : ""}`} aria-label="Admin navigation">
      <div className="sidebar-brand">
        <img src="/images/bangla-blend-icon.png" alt="" />
        <div>
          <strong>Bangla Blend</strong>
          <span>Operations</span>
        </div>
        <button type="button" className="sidebar-close" aria-label="Close navigation" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-navigation">
        <Suspense fallback={null}>
          <NavList permissions={session.role.permissions} onNavigate={onNavigate} />
        </Suspense>
      </nav>

      <div className="sidebar-footer">
        <a className="storefront-link" href={storefrontUrl} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" />
          Open storefront
        </a>
        <div className="staff-summary">
          <span className="staff-avatar">{initials}</span>
          <div className="staff-copy">
            <strong>{session.fullName ?? session.email}</strong>
            <span>
              <ShieldCheck aria-hidden="true" /> {session.role.name}
            </span>
          </div>
          <form action={logoutAction}>
            <button className="icon-button icon-button-dark" type="submit" title="Sign out" aria-label="Sign out">
              <LogOut aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
