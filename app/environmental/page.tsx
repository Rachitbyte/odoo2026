"use client";

import Link from "next/link";
import { Leaf, Box, Target, List, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function EnvironmentalOverviewPage() {
  const links = [
    {
      title: "Emission Factors",
      description: "Manage global CO2 emission multipliers based on sources.",
      href: "/environmental/emission-factors",
      icon: <Leaf className="w-8 h-8 text-[#22C55E]" />,
    },
    {
      title: "Product ESG Profiles",
      description: "Track recyclability and carbon footprint for product lines.",
      href: "/environmental/product-esg",
      icon: <Box className="w-8 h-8 text-blue-400" />,
    },
    {
      title: "Carbon Transactions",
      description: "Log and review carbon-emitting activities in an immutable ledger.",
      href: "/environmental/carbon-transactions",
      icon: <List className="w-8 h-8 text-purple-400" />,
    },
    {
      title: "Environmental Goals",
      description: "Set and monitor CO2 reduction targets across departments.",
      href: "/environmental/goals",
      icon: <Target className="w-8 h-8 text-orange-400" />,
    }
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-[#2A2A2A] pb-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Environmental Hub
        </h2>
        <p className="text-[#9CA3AF] text-sm mt-1">
          Centralized management for carbon tracking, product sustainability, and environmental goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#22C55E]/50 hover:bg-[#22C55E]/5 transition-all cursor-pointer h-full group">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-[#0D0D0D] rounded-xl border border-[#2A2A2A] group-hover:border-[#22C55E]/30 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#22C55E] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="self-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <ArrowRight className="w-5 h-5 text-[#22C55E]" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
