import type { Metadata, Viewport } from "next";
import { AnnouncementBar } from "@/components/navigation/announcement-bar";
import { DesktopHeader } from "@/components/navigation/desktop-header";
import { Footer } from "@/components/layout/footer";
import { NewsletterSection } from "@/components/layout/newsletter-section";
import { CartDrawer } from "@/components/commerce/cart-drawer";
import { FaqChatWidget } from "@/components/marketing/faq-chat-widget";
import { AppProviders } from "@/providers/app-providers";
import { getActiveMarket, getStorefrontCatalogs } from "@/lib/commerce/server";
import { siteConfig } from "@/config/site";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { PageTransition } from "@/components/layout/page-transition";
import "./globals.css";
import "./search/search.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name}: ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/images/bangla-blend-icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/images/bangla-blend-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/images/bangla-blend-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/images/bangla-blend-icon-192.png",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name}: ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#F6EFE4", colorScheme: "light" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [market, catalogs] = await Promise.all([
    getActiveMarket(),
    getStorefrontCatalogs().catch(() => []),
  ]);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: new URL("/images/bangla-blend-logo-final-v3.webp", siteConfig.url).toString(),
    sameAs: siteConfig.socialLinks.map((social) => social.href),
  };
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <AppProviders initialMarket={market.code}>
          <AnnouncementBar market={market.code} />
          <DesktopHeader catalogs={catalogs} />
          <PageTransition />
          <main id="main-content">{children}</main>
          <NewsletterSection />
          <Footer catalogs={catalogs} />
          <CartDrawer />
          <FaqChatWidget />
          <CookieBanner />
        </AppProviders>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
