import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import MarketingProvider from "@/providers/MarketingProvider";
import { getWebsiteSettings } from "@/service/settings/website-settings.service";
import { getPublicMarketingConfig } from "@/service/marketing/marketing-settings.service";

import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [{ siteName, faviconUrl }, marketingConfig] = await Promise.all([
    getWebsiteSettings(),
    getPublicMarketingConfig(),
  ]);

  const googleVerification =
    marketingConfig.searchConsole.enabled &&
    marketingConfig.searchConsole.verificationCode
      ? marketingConfig.searchConsole.verificationCode
      : undefined;

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "https://nakivo.vercel.app"
    ),
    title: {
      default: `${siteName} — Online Store`,
      template: `%s | ${siteName}`,
    },
    description: `Shop curated fashion, electronics, and everyday essentials at ${siteName} with fast Cash on Delivery across Bangladesh.`,
    ...(googleVerification
      ? {
          verification: {
            google: googleVerification,
          },
        }
      : {}),
    ...(faviconUrl
      ? {
          icons: {
            icon: faviconUrl,
            shortcut: faviconUrl,
            apple: faviconUrl,
          },
        }
      : {}),
    openGraph: {
      siteName,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const marketingConfig = await getPublicMarketingConfig();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            <MarketingProvider initialConfig={marketingConfig}>
              {children}
              <Toaster richColors position="top-right" />
            </MarketingProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}