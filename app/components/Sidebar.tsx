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
  X,
} from "lucide-react";

interface SubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  subItems?: SubItem[];
}

interface SidebarProps {
  onClose?: () => void;
}

function SidebarInner({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Environmental: pathname.startsWith("/environmental"),
    Social:        pathname.startsWith("/social"),
    Governance:    pathname.startsWith("/governance"),
    Gamification:  pathname.startsWith("/gamification"),
    Reports:       pathname.startsWith("/reports"),
    Settings:      pathname.startsWith("/settings"),
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
        { name: "Carbon Transactions", href: "/environmental/carbon-transactions" },
        { name: "Environmental Goals", href: "/environmental/goals" },
      ],
    },
    {
      name: "Social",
      href: "/social",
      icon: Users,
      color: "text-[#F97316]",
      bgColor: "bg-[#F97316]/10 border-l-2 border-[#F97316]",
      subItems: [
        { name: "CSR Activities",         href: "/social" },
        { name: "Employee Participation",  href: "/social?tab=participation" },
        { name: "Diversity Dashboard",     href: "/social?tab=diversity" },
      ],
    },
    {
      name: "Governance",
      href: "/governance",
      icon: Shield,
      color: "text-[#3B82F6]",
      bgColor: "bg-[#3B82F6]/10 border-l-2 border-[#3B82F6]",
      subItems: [
        { name: "Policies",          href: "/governance" },
        { name: "Acknowledgements",  href: "/governance?tab=acknowledgements" },
        { name: "Audits",            href: "/governance?tab=audits" },
        { name: "Compliance Issues", href: "/governance?tab=compliance" },
      ],
    },
    {
      name: "Gamification",
      href: "/gamification",
      icon: Trophy,
      color: "text-[#A855F7]",
      bgColor: "bg-[#A855F7]/10 border-l-2 border-[#A855F7]",
      subItems: [
        { name: "Challenges", href: "/gamification" },
        { name: "Challenge Participation", href: "/gamification?tab=participation" },
        { name: "Badges", href: "/gamification?tab=badges" },
        { name: "Rewards", href: "/gamification?tab=rewards" },
        { name: "Leaderboard", href: "/gamification?tab=leaderboard" },
      ],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart2,
      color: "text-[#06B6D4]",
      bgColor: "bg-[#06B6D4]/10 border-l-2 border-[#06B6D4]",
      subItems: [
        { name: "Environmental", href: "/reports?tab=environmental" },
        { name: "Social", href: "/reports?tab=social" },
        { name: "Governance", href: "/reports?tab=governance" },
        { name: "ESG Summary", href: "/reports?tab=summary" },
        { name: "Custom Builder", href: "/reports?tab=custom" },
      ],
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10 border-l-2 border-[#22C55E]",
      subItems: [
        { name: "Departments", href: "/settings" },
        { name: "Categories", href: "/settings?tab=categories" },
        { name: "ESG Configuration", href: "/settings?tab=esg-config" },
        { name: "Notification Settings", href: "/settings?tab=notifications" },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col border-r border-[#2A2A2A] h-screen fixed top-0 left-0 z-30 font-sans">
      {/* Brand */}
      <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-[#22C55E] animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-[#9CA3AF] bg-clip-text text-transparent">
              EcoSphere
            </h1>
            <p className="text-xs text-[#9CA3AF] font-medium tracking-tight">ESG Management</p>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A] transition-colors md:hidden"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
        {navItems.map(item => {
          const isSectionActive = item.subItems
            ? pathname.startsWith(item.href)
            : pathname === item.href || pathname.startsWith(item.href + "/");

          if (item.subItems) {
            const isOpen = openSections[item.name];

            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => toggle(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isSectionActive
                      ? `${item.bgColor} ${item.color}`
                      : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                        isSectionActive ? item.color : "text-[#9CA3AF] group-hover:text-white"
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
                      const isSubActive = sub.href.includes("?tab=")
                        ? currentTab === sub.href.split("?tab=")[1] && pathname === sub.href.split("?")[0]
                        : pathname === sub.href && !currentTab;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          onClick={onClose}
                          className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
                            isSubActive
                              ? `${item.color} bg-white/5`
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

          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
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

      {/* Footer */}
      <div className="p-4 border-t border-[#2A2A2A] bg-[#0E0E0E]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#22C55E] to-[#3B82F6] flex items-center justify-center font-bold text-sm text-white shadow-lg">
            ES
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate text-white">EcoSphere Admin</p>
            <p className="text-[10px] text-[#9CA3AF] truncate">ESG Platform v2026</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar({ onClose }: SidebarProps) {
  return (
    <Suspense fallback={
      <aside className="w-64 bg-[#111111] border-r border-[#2A2A2A] h-screen fixed top-0 left-0 z-30" />
    }>
      <SidebarInner onClose={onClose} />
    </Suspense>
  );
}
