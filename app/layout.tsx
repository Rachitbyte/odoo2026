import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";

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
      <body className="min-h-full bg-[#0D0D0D] text-white font-sans flex">
        <Sidebar />
        <main className="flex-1 pl-64 min-h-screen relative flex flex-col bg-[#0D0D0D]">
          <div className="flex-1 w-full max-w-7xl mx-auto px-8 py-6">
            {children}
          </div>
        </main>
        <Toaster theme="dark" position="top-right" closeButton richColors />
      </body>
    </html>
  );
}
