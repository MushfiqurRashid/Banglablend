import type { Metadata, Viewport } from "next";
import { DM_Sans, Noto_Sans_Bengali } from "next/font/google";
import { AnnouncementBar } from "@/components/navigation/announcement-bar";
import { DesktopHeader } from "@/components/navigation/desktop-header";
import { Footer } from "@/components/layout/footer";
import { NewsletterSection } from "@/components/layout/newsletter-section";
import { CartDrawer } from "@/components/commerce/cart-drawer";
import { AppProviders } from "@/providers/app-providers";
import { getActiveMarket } from "@/lib/commerce/server";
import { siteConfig } from "@/config/site";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { PageTransition } from "@/components/layout/page-transition";
import { HomeFaqSection } from "@/components/marketing/home-faq-section";
import "./globals.css";
import "./search/search.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const notoSansBengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-noto-sans-bengali", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name}: ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  icons: {
    icon: [{ url: "/images/bangla-blend-logo-final-v3.png", type: "image/png" }],
    apple: "/images/bangla-blend-logo-final-v3.png"
  },
  openGraph: { type: "website", siteName: siteConfig.name, title: `${siteConfig.name}: ${siteConfig.tagline}`, description: siteConfig.description },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = { themeColor: "#F6EFE4", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const market = await getActiveMarket();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: new URL("/images/bangla-blend-logo-final-v3.png", siteConfig.url).toString()
  };
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${notoSansBengali.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <AppProviders initialMarket={market.code}>
          <AnnouncementBar market={market.code} />
          <DesktopHeader />
          <main id="main-content"><PageTransition>{children}</PageTransition></main>
          <HomeFaqSection />
          <NewsletterSection />
          <Footer />
          <CartDrawer />
          <CookieBanner />
        </AppProviders>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
