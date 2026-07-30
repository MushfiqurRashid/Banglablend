import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/editorial/coming-soon-page";
import { giftComingSoonPages } from "@/config/coming-soon";

const page = giftComingSoonPages.corporate;

export const metadata: Metadata = {
  title: `${page.title} — Coming Soon`,
  description: page.description,
};

export default function CorporateGiftingPage() {
  return <ComingSoonPage {...page} />;
}
