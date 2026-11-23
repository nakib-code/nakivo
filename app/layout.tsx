import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import { getWebsiteSettings } from "@/service/settings/website-settings.service";

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
  const { siteName, faviconUrl } = await getWebsiteSettings();

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "https://nakivo.vercel.app"
    ),
    title: {
      default: `${siteName} — Online Store`,
      template: `%s | ${siteName}`,
    },
    description: `Shop curated fashion, electronics, and everyday essentials at ${siteName} with fast Cash on Delivery across Bangladesh.`,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}