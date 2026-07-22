import type { Metadata } from "next";
import React from "react";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import IntroVeil from "@/components/IntroVeil";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
});

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const siteUrl = "https://felixpan.ca";
const siteDescription =
  "felix pan — cs @ uwaterloo, software engineer. work, things i've built, and other notes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "felix pan",
    template: "%s · felix pan",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "felix pan",
    description: siteDescription,
    siteName: "felix pan",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "felix pan",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${geist.variable} antialiased`}>
        <IntroVeil />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
