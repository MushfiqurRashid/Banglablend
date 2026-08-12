"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { StaffSession } from "@/lib/auth";
import { SidebarNav } from "./sidebar-nav";

export function AdminShell({
  children,
  session,
  storefrontUrl,
}: {
  children: React.ReactNode;
  session: StaffSession;
  storefrontUrl: string;
}) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="admin-shell">
      <button
        type="button"
        className={`sidebar-backdrop ${navigationOpen ? "is-visible" : ""}`}
        aria-label="Close navigation"
        onClick={() => setNavigationOpen(false)}
      />
      <SidebarNav
        session={session}
        storefrontUrl={storefrontUrl}
        open={navigationOpen}
        onNavigate={() => setNavigationOpen(false)}
        onClose={() => setNavigationOpen(false)}
      />
      <div className="admin-workspace">
        <header className="mobile-header">
          <button
            type="button"
            className="icon-button"
            aria-label={navigationOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen((current) => !current)}
          >
            {navigationOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <div className="mobile-brand">
            <img src="/images/bangla-blend-icon.png" alt="" />
            <span>Bangla Blend Admin</span>
          </div>
          <span className="mobile-role">{session.role.name}</span>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
