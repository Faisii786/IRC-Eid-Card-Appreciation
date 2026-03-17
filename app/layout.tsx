import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Eid Mubarak Card Generator | IRC",
  description:
    "Create personalized Eid Al-Fitr appreciation cards with Arabic name rendering, preview, download, and sharing options.",
  keywords: [
    "Eid card",
    "Eid Mubarak",
    "Arabic greeting card",
    "IRC appreciation",
    "Eid Al-Fitr card generator",
  ],
  applicationName: "IRC Eid Card Appreciation",
  authors: [{ name: "International Recruitment Company" }],
  openGraph: {
    title: "Eid Mubarak Card Generator | IRC",
    description:
      "Create personalized Eid Al-Fitr appreciation cards with Arabic name rendering and instant downloads.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "IRC Eid Card Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eid Mubarak Card Generator | IRC",
    description:
      "Generate personalized Eid appreciation cards in Arabic and share them instantly.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

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
        {children}
      </body>
    </html>
  );
}
