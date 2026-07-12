"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Users,
  Shield,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Sparkles
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ScoresResponse {
  overallScore: number;
  envScore: number;
  socialScore: number;
  govScore: number;
  departmentScores: Array<{
    deptName: string;
    totalScore: number;
  }>;
}

interface EmissionsTrendItem {
  month: string;
  emissions: number;
}

interface DeptScoreItem {
  deptName: string;
  envScore: number;
  socialScore: number;
  govScore: number;
  totalScore: number;
  fill: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  bulletColor: string;
}

export default function DashboardPage() {
  const [scores, setScores] = useState<ScoresResponse>({
    overallScore: 0,
    envScore: 0,
    socialScore: 0,
    govScore: 0,
    departmentScores: []
  });
  const [trend, setTrend] = useState<EmissionsTrendItem[]>([]);
  const [deptScores, setDeptScores] = useState<DeptScoreItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Fetch Scores
    fetch("/api/scores")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setScores(data);
      })
      .catch(() => {});

    // Fetch Trend
    fetch("/api/emissions-trend")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTrend(data);
      })
      .catch(() => {});

    // Fetch Department Scores
    fetch("/api/department-scores")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDeptScores(data);
      })
      .catch(() => {});

    // Fetch Recent Activity
    fetch("/api/recent-activity")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setActivities(data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#22C55E]" /> Corporate ESG Command Center
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Real-time tracking of environmental, social compliance, and governance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 px-4 py-2 rounded-xl text-[#22C55E] text-xs font-semibold">
          <TrendingDown className="w-4 h-4 animate-bounce" /> Total emissions down 12% from last quarter
        </div>
      </div>

      {/* Row 1 - 4 Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Environmental Card */}
        <Card className="bg-[#1A1A1A] border-[#22C55E]/30 border-l-4 rounded-xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#9CA3AF]">Environmental Score</CardTitle>
            <Leaf className="w-5 h-5 text-[#22C55E]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-white font-mono">{scores.envScore}</div>
            <p className="text-xs text-[#9CA3AF] mt-1">Target Carbon footprint reduction</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#22C55E]/20">
              <div className="bg-[#22C55E] h-full" style={{ width: `${scores.envScore}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Social Card */}
        <Card className="bg-[#1A1A1A] border-[#F97316]/30 border-l-4 rounded-xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#9CA3AF]">Social Score</CardTitle>
            <Users className="w-5 h-5 text-[#F97316]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-white font-mono">{scores.socialScore}</div>
            <p className="text-xs text-[#9CA3AF] mt-1">Community & CSR engagement</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F97316]/20">
              <div className="bg-[#F97316] h-full" style={{ width: `${scores.socialScore}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Governance Card */}
        <Card className="bg-[#1A1A1A] border-[#3B82F6]/30 border-l-4 rounded-xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#9CA3AF]">Governance Score</CardTitle>
            <Shield className="w-5 h-5 text-[#3B82F6]" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-white font-mono">{scores.govScore}</div>
            <p className="text-xs text-[#9CA3AF] mt-1">Audit & compliance rating</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3B82F6]/20">
              <div className="bg-[#3B82F6] h-full" style={{ width: `${scores.govScore}%` }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Overall ESG Score */}
        <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#251b36] border-[#A855F7]/40 border-l-4 rounded-xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-200">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-[#A855F7]/10 rounded-full blur-xl group-hover:bg-[#A855F7]/25 transition-all duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white">Overall ESG Index</CardTitle>
            <Sparkles className="w-5 h-5 text-[#A855F7]" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-white font-mono tracking-tight bg-gradient-to-r from-white to-[#a855f7] bg-clip-text text-transparent">
              {scores.overallScore}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">Weighted ESG Performance</p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#A855F7]/20">
              <div className="bg-[#A855F7] h-full" style={{ width: `${scores.overallScore}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 - Line & Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Emissions Trend Line Chart */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Leaf className="w-5 h-5 text-[#22C55E]" /> Emissions Trend (12 mo)
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Monthly corporate carbon output measured in kg CO₂.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold", color: "#22C55E" }}
                />
                <Line
                  type="monotone"
                  dataKey="emissions"
                  name="CO2 (kg)"
                  stroke="#22C55E"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: "#111" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right: Department ESG Ranking Bar Chart */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Department ESG Rankings
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Aggregated weighted scores comparison by operational division.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptScores} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                <XAxis dataKey="deptName" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #333", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Bar dataKey="totalScore" name="Total Score" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3B82F6]" /> Recent Activity Log
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Audit compliance, CSR activities, and emission logging tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] italic text-center py-6">No recent actions logged.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-4 items-start border-l-2 pl-4 py-1" style={{ borderColor: act.bulletColor }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{act.title}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{act.description}</p>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono self-center">
                    {new Date(act.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Operations</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Access core modules directly to record telemetry and trigger challenges.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/environmental/carbon-transactions" className="w-full">
              <Button className="w-full bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 rounded-xl py-6 flex items-center justify-between px-5 font-semibold group transition-all">
                <span>Log Carbon Transactions</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </Link>

            <Link href="/gamification/challenges" className="w-full">
              <Button className="w-full bg-[#F97316]/10 hover:bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/30 rounded-xl py-6 flex items-center justify-between px-5 font-semibold group transition-all">
                <span>Start Employee Challenge</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </Link>

            <Link href="/reports" className="w-full">
              <Button variant="outline" className="w-full bg-transparent hover:bg-white/5 text-white border-[#2A2A2A] rounded-xl py-6 flex items-center justify-between px-5 font-semibold group transition-all">
                <span>Access Reports Builder</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
