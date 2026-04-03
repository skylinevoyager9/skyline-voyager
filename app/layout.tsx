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
    "US travel guides: flights, hotels, weekend trips, national parks, car rental, and trip planning. Partner links may earn us a commission at no extra cost to you.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: "Skyline Voyager",
    title: "Skyline Voyager | USA trip ideas & travel guides",
    description:
      "Practical guides and weekend trip ideas for travel in the United States.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skyline Voyager",
    description:
      "Practical guides and weekend trip ideas for travel in the United States.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <JsonLd />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
