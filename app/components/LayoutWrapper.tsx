"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <main className="flex-1 min-h-screen relative flex flex-col bg-[#0D0D0D]">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <main className="flex-1 pl-64 min-h-screen relative flex flex-col bg-[#0D0D0D]">
        <div className="flex-1 w-full max-w-7xl mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
