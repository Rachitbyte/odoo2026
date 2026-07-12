"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Leaf,
  Users,
  Shield,
  Trophy,
  BarChart2,
  Settings,
  ChevronDown,
  ChevronRight,
  Globe
} from "lucide-react";

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const [environmentalOpen, setEnvironmentalOpen] = useState(
    pathname.startsWith("/environmental")
  );

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Environmental",
      href: "/environmental",
      icon: Leaf,
      subItems: [
        { name: "Emission Factors", href: "/environmental/emission-factors" },
        { name: "Product ESG Profile", href: "/environmental/product-esg" },
        { name: "Environmental Goals", href: "/environmental/goals" },
        { name: "Carbon Transactions", href: "/environmental/carbon-transactions" },
      ],
    },
    { name: "Social", href: "/social", icon: Users },
    { name: "Governance", href: "/governance", icon: Shield },
    { name: "Gamification", href: "/gamification", icon: Trophy },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col border-r border-[#2A2A2A] h-screen fixed top-0 left-0 z-30 font-sans">
      {/* Brand Logo / Title */}
      <div className="p-6 border-b border-[#2A2A2A] flex items-center gap-3">
        <Globe className="w-6 h-6 text-[#22C55E] animate-pulse" />
        <div>
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-[#9CA3AF] bg-clip-text text-transparent">
            EcoSphere
          </h1>
          <p className="text-xs text-[#9CA3AF] font-medium tracking-tight">ESG Management</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
        {navItems.map((item) => {
          const isEnvironmental = item.name === "Environmental";
          const isActive = isEnvironmental
            ? pathname.startsWith("/environmental")
            : pathname === item.href;

          if (isEnvironmental && item.subItems) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => setEnvironmentalOpen(!environmentalOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-[#22C55E]/10 text-[#22C55E] border-l-2 border-[#22C55E]"
                      : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? "text-[#22C55E]" : "text-[#9CA3AF] group-hover:text-white"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {environmentalOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  )}
                </button>

                {/* Subitems */}
                {environmentalOpen && (
                  <div className="pl-9 space-y-1 mt-1 border-l border-[#2A2A2A] ml-6">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
                            isSubActive
                              ? "text-[#22C55E] bg-[#22C55E]/5"
                              : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-[#22C55E]/10 text-[#22C55E] border-l-2 border-[#22C55E]"
                  : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-[#22C55E]" : "text-[#9CA3AF] group-hover:text-white"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Session simulation */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#0E0E0E]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#22C55E] to-[#3B82F6] flex items-center justify-center font-bold text-sm text-black">
            P1
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate text-white">Person 1</p>
            <p className="text-[10px] text-[#9CA3AF] truncate">Foundation & Settings</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
