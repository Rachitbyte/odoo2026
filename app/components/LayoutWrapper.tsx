"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import TopNav from "@/app/components/TopNav";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load initial collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const handleExpand = () => {
    setIsCollapsed(false);
    localStorage.setItem("sidebar-collapsed", "false");
  };

  const handleCollapse = () => {
    setIsCollapsed(true);
    localStorage.setItem("sidebar-collapsed", "true");
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (isLanding) {
    return (
      <main className="flex-1 min-h-screen relative flex flex-col bg-[#0D0D0D]">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Desktop Sidebar */}
      <div className={`hidden md:block transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
        <Sidebar isCollapsed={isCollapsed} onExpand={handleExpand} onCollapse={handleCollapse} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} isCollapsed={false} />
      </div>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen relative flex flex-col bg-[#0D0D0D] transition-all duration-300 ${
        isCollapsed ? "md:pl-20" : "md:pl-64"
      }`}>
        {/* Mobile Top Bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#111111] border-b border-[#2A2A2A]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-[#22C55E] rounded flex items-center justify-center font-bold text-black text-xs shadow-[0_0_10px_rgba(34,197,94,0.3)]">
              E
            </div>
            <span className="font-bold text-sm tracking-tight text-white">EcoSphere</span>
          </Link>
        </div>

        {/* Desktop Top Bar */}
        <TopNav />

        <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
