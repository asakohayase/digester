import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StytchProvider } from "@/components/StytchProvider";
import { Navbar } from "@/components/ui/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Briefing - Your Daily News Digest",
  description: "Transform your reading into engaging video content. Stay informed with personalized news briefings and seamless content digestion.",
  keywords: "news briefing, video content, news digest, content transformation",
  openGraph: {
    title: "Briefing - Your Daily News Digest",
    description: "Transform your reading into engaging video content",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
         <StytchProvider>
         <Navbar />
        {children}
        </StytchProvider>
      </body>
    </html>
  );
}
