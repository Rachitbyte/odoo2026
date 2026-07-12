"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
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
  Globe,
} from "lucide-react";

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;       // active accent color (Tailwind arbitrary)
  bgColor: string;     // active bg tint
  subItems?: SubItem[];
}

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Environmental: pathname.startsWith("/environmental"),
    Social:        pathname.startsWith("/social"),
    Governance:    pathname.startsWith("/governance"),
  });

  const toggle = (name: string) =>
    setOpenSections(prev => ({ ...prev, [name]: !prev[name] }));

  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10 border-l-2 border-[#22C55E]",
    },
    {
      name: "Environmental",
      href: "/environmental",
      icon: Leaf,
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10 border-l-2 border-[#22C55E]",
      subItems: [
        { name: "Emission Factors",    href: "/environmental/emission-factors" },
        { name: "Product ESG Profile", href: "/environmental/product-esg" },
        { name: "Environmental Goals", href: "/environmental/goals" },
        { name: "Carbon Transactions", href: "/environmental/carbon-transactions" },
      ],
    },
    {
      name: "Social",
      href: "/social",
      icon: Users,
      color: "text-[#F97316]",
      bgColor: "bg-[#F97316]/10 border-l-2 border-[#F97316]",
      subItems: [
        { name: "CSR Activities",       href: "/social" },
        { name: "Employee Participation", href: "/social?tab=participation" },
        { name: "Diversity Dashboard",  href: "/social?tab=diversity" },
      ],
    },
    {
      name: "Governance",
      href: "/governance",
      icon: Shield,
      color: "text-[#3B82F6]",
      bgColor: "bg-[#3B82F6]/10 border-l-2 border-[#3B82F6]",
      subItems: [
        { name: "Policies",             href: "/governance" },
        { name: "Acknowledgements",     href: "/governance?tab=acknowledgements" },
        { name: "Audits",               href: "/governance?tab=audits" },
        { name: "Compliance Issues",    href: "/governance?tab=compliance" },
      ],
    },
    {
      name: "Gamification",
      href: "/gamification",
      icon: Trophy,
      color: "text-[#A855F7]",
      bgColor: "bg-[#A855F7]/10 border-l-2 border-[#A855F7]",
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart2,
      color: "text-[#06B6D4]",
      bgColor: "bg-[#06B6D4]/10 border-l-2 border-[#06B6D4]",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10 border-l-2 border-[#22C55E]",
    },
  ];

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col border-r border-[#2A2A2A] h-screen fixed top-0 left-0 z-30 font-sans">
      {/* Brand */}
      <div className="p-6 border-b border-[#2A2A2A] flex items-center gap-3">
        <Globe className="w-6 h-6 text-[#22C55E] animate-pulse" />
        <div>
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-[#9CA3AF] bg-clip-text text-transparent">
            EcoSphere
          </h1>
          <p className="text-xs text-[#9CA3AF] font-medium tracking-tight">ESG Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
        {navItems.map(item => {
          const isActive = item.subItems
            ? pathname.startsWith(item.href) && item.href !== "/dashboard"
            : pathname === item.href;

          if (item.subItems) {
            const isOpen = openSections[item.name];

            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggle(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? `${item.bgColor} ${item.color}`
                      : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? item.color : "text-[#9CA3AF] group-hover:text-white"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
                    : <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  }
                </button>

                {isOpen && (
                  <div className="pl-9 space-y-0.5 mt-1 border-l border-[#2A2A2A] ml-6">
                    {item.subItems.map(sub => {
                      const isSubActive =
                        (pathname === sub.href && !sub.href.includes("?")) ||
                        (sub.href.includes("?tab=") && currentTab === sub.href.split("?tab=")[1]) ||
                        (!sub.href.includes("?") && pathname === sub.href && !currentTab);

                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
                            isSubActive
                              ? `${item.color} bg-current/5`
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
                  ? `${item.bgColor} ${item.color}`
                  : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? item.color : "text-[#9CA3AF] group-hover:text-white"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Person 3 */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#0E0E0E]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F97316] to-[#3B82F6] flex items-center justify-center font-bold text-sm text-white shadow-lg">
            P3
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate text-white">Person 3</p>
            <p className="text-[10px] text-[#9CA3AF] truncate">Social &amp; Governance</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={
      <aside className="w-64 bg-[#111111] border-r border-[#2A2A2A] h-screen fixed top-0 left-0 z-30" />
    }>
      <SidebarInner />
    </Suspense>
  );
}
