"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Users, Shield, Trophy, BarChart2 } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const modules = [
    {
      title: "Environmental",
      description: "Track Scope 1-3 emissions, calculate carbon footprints, and manage robust ESG goals.",
      icon: <Leaf className="w-8 h-8 mb-4" />,
      color: "group-hover:text-[#22C55E]",
      borderColor: "group-hover:border-[#22C55E]/50",
      bgHover: "hover:bg-[#22C55E]/5",
      link: "/environmental",
    },
    {
      title: "Social",
      description: "Drive CSR activities, track employee participation, and manage organizational diversity.",
      icon: <Users className="w-8 h-8 mb-4" />,
      color: "group-hover:text-[#F97316]",
      borderColor: "group-hover:border-[#F97316]/50",
      bgHover: "hover:bg-[#F97316]/5",
      link: "/social",
    },
    {
      title: "Governance",
      description: "Ensure compliance, track audits, and systematically enforce and acknowledge ESG policies.",
      icon: <Shield className="w-8 h-8 mb-4" />,
      color: "group-hover:text-[#3B82F6]",
      borderColor: "group-hover:border-[#3B82F6]/50",
      bgHover: "hover:bg-[#3B82F6]/5",
      link: "/governance",
    },
    {
      title: "Gamification",
      description: "Reward sustainable actions with XP, Badges, Leaderboards, and unlockable Rewards.",
      icon: <Trophy className="w-8 h-8 mb-4" />,
      color: "group-hover:text-[#A855F7]",
      borderColor: "group-hover:border-[#A855F7]/50",
      bgHover: "hover:bg-[#A855F7]/5",
      link: "/gamification",
    },
    {
      title: "Reports",
      description: "Export audit-ready PDF and CSV reports for stakeholders instantly.",
      icon: <BarChart2 className="w-8 h-8 mb-4" />,
      color: "group-hover:text-[#06B6D4]",
      borderColor: "group-hover:border-[#06B6D4]/50",
      bgHover: "hover:bg-[#06B6D4]/5",
      link: "/reports",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white overflow-hidden font-sans selection:bg-[#22C55E]/30 selection:text-white">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-[#22C55E]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#3B82F6]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#A855F7]/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#22C55E] rounded flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            E
          </div>
          <span className="font-bold text-xl tracking-tight text-white">EcoSphere</span>
        </div>
        <Link href="/dashboard">
          <button className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors">
            Sign In
          </button>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        
        {/* Hero Section */}
        <motion.div 
          className="flex flex-col items-center text-center mb-32 relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-block mb-4 px-4 py-1.5 rounded-full border border-[#2A2A2A] bg-[#111111]/80 backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Introducing EcoSphere 2026
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.1]">
            Enterprise ESG Management, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22C55E] via-[#3B82F6] to-[#A855F7]">
              Gamified.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-[#9CA3AF] max-w-2xl mb-10 leading-relaxed">
            Track emissions, drive CSR initiatives, ensure compliance, and reward sustainability—all in one unified, beautiful platform.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard">
              <button className="h-12 px-8 rounded-full bg-[#22C55E] text-black font-semibold text-sm hover:bg-[#1eb053] transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 group w-full sm:w-auto">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button 
              onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}
              className="h-12 px-8 rounded-full bg-transparent border border-[#2A2A2A] text-white font-medium text-sm hover:bg-[#1A1A1A] transition-all w-full sm:w-auto"
            >
              Explore Modules
            </button>
          </motion.div>
        </motion.div>

        {/* Modules Section */}
        <div id="modules" className="pt-10 scroll-mt-20">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Five Pillars of Sustainability</h2>
            <p className="text-[#9CA3AF] max-w-2xl mx-auto">Everything you need to measure and improve your organizational impact.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.title}
                className={`group relative p-8 rounded-2xl bg-[#111111] border border-[#2A2A2A] transition-all duration-300 ${mod.bgHover} ${mod.borderColor} cursor-pointer overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className={`text-[#9CA3AF] transition-colors duration-300 ${mod.color}`}>
                  {mod.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{mod.title}</h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6">
                  {mod.description}
                </p>
                <Link href={mod.link} className="absolute inset-0 z-10">
                  <span className="sr-only">Go to {mod.title}</span>
                </Link>
                <div className={`absolute bottom-6 left-8 flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${mod.color}`}>
                  Launch Module <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
            
            {/* CTA Card to fill the 6th slot in the grid */}
            <motion.div
              className="p-8 rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-[#2A2A2A] flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4">Ready to start?</h3>
              <Link href="/dashboard" className="w-full">
                <button className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors">
                  Enter EcoSphere
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2A2A] bg-[#0A0A0A] py-8 text-center text-[#9CA3AF] text-sm relative z-10">
        <p>© 2026 EcoSphere. Built for the future.</p>
      </footer>
    </div>
  );
}
