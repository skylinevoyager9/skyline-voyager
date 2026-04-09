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
    "Independent US travel guides with a stays-first lens—hotels and lodging, then flights, weekends, parks, and cars. Partner links may earn us a commission at no extra cost to you.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: "Skyline Voyager",
    title: "Skyline Voyager | USA trip ideas & travel guides",
    description:
      "Editorial guides for US trips—where to stay, how to compare rates, and how to plan flights and weekends without the fluff.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skyline Voyager",
    description:
      "Editorial US travel guides: hotels, trips, and planning—with transparent partner links.",
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
