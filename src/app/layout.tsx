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

export const metadata: Metadata = {
  title: "felix pan",
  description: "personal site",
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
