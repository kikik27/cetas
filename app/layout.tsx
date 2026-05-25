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
  title: "CETAS",
  description: "Grid-based roguelike auto-battler strategy — Fully On-Chain on Celo L2",
  icons: {
    icon: '/favicon.ico',
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* home_bg preload — CSS background-image tidak di-handle next/image */}
        <link rel="preload" as="image" href="/home_bg.png" />
        <link rel="preload" as="image" href="/landing-bg.jpg" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
