import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { wholesaleComingSoonPage } from "@/config/coming-soon";

export const metadata: Metadata = {
  title: `${wholesaleComingSoonPage.title} — Coming Soon`,
  description: wholesaleComingSoonPage.description,
};

export default function WholesalePage() {
  return <ComingSoonPage {...wholesaleComingSoonPage} />;
}
