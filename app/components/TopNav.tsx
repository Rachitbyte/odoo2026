"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Environmental", href: "/environmental" },
    { name: "Social", href: "/social" },
    { name: "Governance", href: "/governance" },
    { name: "Gamification", href: "/gamification" },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ];

  return (
    <div className="w-full bg-[#111111] border-b border-[#2A2A2A] sticky top-0 z-20 hidden md:block">
      <div className="flex items-center px-4 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-6 py-4 text-sm font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${
                isActive
                  ? "text-white border-[#22C55E]"
                  : "text-[#9CA3AF] border-transparent hover:text-white hover:border-[#2A2A2A]"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
