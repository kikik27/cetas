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
  other: {
    'talentapp:project_verification': 'd33ef4f31d08e7aac18845b0ade189c4e376d018ffab47af7d1a1517eb92a6ea3ed6035827d7e3bb49b64fcaa8b0848dde2624e7ba25fb3fd6ee54c0fd44bdc3',
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
      <meta name="talentapp:project_verification" content="d33ef4f31d08e7aac18845b0ade189c4e376d018ffab47af7d1a1517eb92a6ea3ed6035827d7e3bb49b64fcaa8b0848dde2624e7ba25fb3fd6ee54c0fd44bdc3"></meta>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
