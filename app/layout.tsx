import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LayoutWrapper from "@/app/components/LayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EcoSphere - ESG Management Platform",
  description: "Advanced dark-themed ESG performance tracking, analysis, and reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-[#0D0D0D] text-white font-sans flex flex-col">
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster theme="dark" position="top-right" closeButton richColors />
      </body>
    </html>
  );
}
