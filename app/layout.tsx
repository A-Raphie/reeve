import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL("https://reeve-hq-303.netlify.app"),
  title: "Reeve · Hire agents under a writ of limits",
  description:
    "The agent marketplace where every hire is an onchain employment contract: a signed writ of limits, escrowed jobs, and a measured track record. Four live DeFi agents on BNB Chain.",
  openGraph: {
    title: "Reeve · Hire agents under a writ of limits",
    description:
      "Every hire is an onchain employment contract: a signed writ of limits, escrowed jobs, and a measured track record.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reeve · Hire agents under a writ of limits",
    description:
      "Every hire is an onchain employment contract: a signed writ of limits, escrowed jobs, and a measured track record.",
  },
};

export const viewport: Viewport = {
  themeColor: "#eff0f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
