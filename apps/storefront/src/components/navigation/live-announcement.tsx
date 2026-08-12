"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "@/components/navigation/smart-link";

interface AnnouncementValue {
  message: string;
  link?: { label?: string; href?: string };
}

export function LiveAnnouncement({ initial, market }: { initial: AnnouncementValue; market: string }) {
  const [announcement, setAnnouncement] = useState(initial);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/announcement?market=${encodeURIComponent(market)}`, { cache: "no-store" });
      if (!response.ok) return;
      const current = await response.json() as AnnouncementValue;
      if (current.message) setAnnouncement(current);
    } catch {
      // Keep the server-rendered value if the brief freshness request is unavailable.
    }
  }, [market]);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(refresh, 5_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return (
    <div className="announcement-bar">
      <span>{announcement.message}</span>
      {announcement.link?.href && announcement.link.label ? <Link href={announcement.link.href}>{announcement.link.label}</Link> : null}
    </div>
  );
}
