import Link from "next/link";
import type { MarketCode } from "@bangla-blend/types";
import { sanityFetch } from "@/lib/sanity/client";
import { ANNOUNCEMENT_QUERY } from "@/lib/sanity/queries";

interface Announcement {
  message: string;
  link?: { label?: string; href?: string };
}

export async function AnnouncementBar({ market }: { market: MarketCode }) {
  const announcement = await sanityFetch<Announcement>(ANNOUNCEMENT_QUERY, { market });
  const fallback = market === "bd" ? "The essence of Bangladeshi taste · Crafted in Bangladesh" : "Rooted in Bangladesh · Made for kitchens everywhere";
  return <div className="announcement-bar"><span>{announcement?.message ?? fallback}</span>{announcement?.link?.href && announcement.link.label ? <Link href={announcement.link.href}>{announcement.link.label}</Link> : null}</div>;
}
