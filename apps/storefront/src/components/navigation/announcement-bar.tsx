import type { MarketCode } from "@bangla-blend/types";
import { getAnnouncement } from "@/lib/content/queries";
import { LiveAnnouncement } from "./live-announcement";

export async function AnnouncementBar({ market }: { market: MarketCode }) {
  const announcement = await getAnnouncement(market);
  const fallback = market === "bd"
    ? "The essence of Bangladeshi taste \u00b7 Crafted in Bangladesh"
    : "Rooted in Bangladesh \u00b7 Made for kitchens everywhere";
  return <LiveAnnouncement market={market} initial={announcement ?? { message: fallback }} />;
}
