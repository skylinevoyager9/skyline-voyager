import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/lib/site";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans-ui",
  subsets: ["latin"],
  display: "swap",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Skyline Voyager | USA trip ideas & travel guides",
    template: "%s | Skyline Voyager",
  },
  description:
    "US travel guides and live flight search—book air travel on Skyline Voyager with real-time fares via Duffel.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: "Skyline Voyager",
    title: "Skyline Voyager | USA trip ideas & travel guides",
    description:
      "Editorial US trip guides and live flight booking—search fares and checkout on Skyline Voyager.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skyline Voyager",
    description:
      "Editorial US travel guides and Duffel-powered flight booking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full w-full max-w-full overflow-x-hidden`}
    >
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden antialiased">
        <JsonLd />
        <SiteHeader />
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
