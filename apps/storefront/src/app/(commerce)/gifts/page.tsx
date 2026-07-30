import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { giftsComingSoonPage } from "@/config/coming-soon";

export const metadata: Metadata = {
  title: `${giftsComingSoonPage.title} — Coming Soon`,
  description: giftsComingSoonPage.description,
};

export default function GiftsPage() {
  return <ComingSoonPage {...giftsComingSoonPage} />;
}
