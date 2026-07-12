"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EnvironmentalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: "Emission Factors", href: "/environmental/emission-factors" },
    { name: "Product ESG Profiles", href: "/environmental/product-esg" },
    { name: "Carbon Transactions", href: "/environmental/carbon-transactions" },
    { name: "Environmental Goals", href: "/environmental/goals" },
  ];

  // We won't show the tabs on the root /environmental page, only on subpages
  if (pathname === "/environmental") {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
        <div className="flex items-center gap-1 bg-[#1A1A1A] border border-[#2A2A2A] p-1 rounded-xl min-w-max">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-[#22C55E] text-black"
                    : "text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A]"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Page Content */}
      <div className="bg-[#0D0D0D]">
        {children}
      </div>
    </div>
  );
}
