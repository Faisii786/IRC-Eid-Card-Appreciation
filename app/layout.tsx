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
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "Eid Mubarak | بطاقة تهنئة عيد الفطر",
  description:
    "إنشاء بطاقات تهنئة عيد الفطر الشخصية بتنسيق عربي مع عرض المفاجأة، وتحميلها ومشاركتها.",
  keywords: [
    "بطاقة تهنئة عيد الفطر",
    "عيد مبارك",
    "بطاقة تهنئة عربية",
    "IRC تهنئة",
    "Eid Al-Fitr card generator",
  ],
  applicationName: "بطاقة تهنئة عيد الفطر",
  authors: [{ name: "International Recruitment Company" }],
  openGraph: {
    title: "عيد مبارك | بطاقة تهنئة عيد الفطر",
    description:
      "إنشاء بطاقات تهنئة عيد الفطر الشخصية بتنسيق عربي مع عرض المفاجأة، وتحميلها ومشاركتها.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "بطاقة تهنئة عيد الفطر",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "عيد مبارك | بطاقة تهنئة عيد الفطر",
    description:
      "إنشاء بطاقات تهنئة عيد الفطر الشخصية بتنسيق عربي مع عرض المفاجأة، وتحميلها ومشاركتها.",
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
