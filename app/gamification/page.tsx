"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Award,
  Gift,
  User,
  Building,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Challenge {
  id: number;
  title: string;
  categoryId: number;
  category?: { name: string };
  description: string | null;
  xp: number;
  difficulty: string;
  evidenceRequired: boolean;
  deadline: string;
  status: string;
}

interface Participation {
  id: number;
  challengeId: number;
  challenge?: Challenge;
  employeeName: string;
  progress: number;
  proofUrl: string | null;
  approvalStatus: string;
  xpAwarded: number;
}

interface BadgeItem {
  id: number;
  name: string;
  description: string;
  unlockRule: string;
  icon: string;
}

interface RewardItem {
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
  stock: number;
  status: string;
}

interface EmployeeRank {
  employeeName: string;
  totalXP: number;
  completedChallenges: number;
  csrPoints: number;
}

interface DeptRank {
  id: number;
  deptName: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  totalScore: number;
}

function GamificationPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") || "challenges";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  // Categories for dropdowns
  const [challengeCategories, setChallengeCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Data States
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [employeeLeaderboard, setEmployeeLeaderboard] = useState<EmployeeRank[]>([]);
  const [deptLeaderboard, setDeptLeaderboard] = useState<DeptRank[]>([]);

  // Filters
  const [challengeFilter, setChallengeFilter] = useState("All");

  // Dialog States - Challenge
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Partial<Challenge>>({});
  const [deleteChallengeConfirmOpen, setDeleteChallengeConfirmOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState<number | null>(null);

  // Dialog States - Participation
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [currentPart, setCurrentPart] = useState<Partial<Participation>>({});

  // Dialog States - Badge
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Partial<BadgeItem>>({});
  const [deleteBadgeConfirmOpen, setDeleteBadgeConfirmOpen] = useState(false);
  const [badgeToDelete, setBadgeToDelete] = useState<number | null>(null);

  // Dialog States - Reward
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<Partial<RewardItem>>({});
  const [deleteRewardConfirmOpen, setDeleteRewardConfirmOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<number | null>(null);
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false);
  const [rewardToRedeem, setRewardToRedeem] = useState<RewardItem | null>(null);

  // Data Fetching
  const fetchChallengeCategories = async () => {
    try {
      const res = await fetch("/api/categories?type=CHALLENGE");
      const data = await res.json();
      if (res.ok) setChallengeCategories(data);
    } catch (e) {}
  };

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/gamification/challenges");
      const data = await res.json();
      if (res.ok) setChallenges(data);
    } catch (e) {}
  };

  const fetchParticipations = async () => {
    try {
      const res = await fetch("/api/gamification/participation");
      const data = await res.json();
      if (res.ok) setParticipations(data);
    } catch (e) {}
  };

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/gamification/badges");
      const data = await res.json();
      if (res.ok) setBadges(data);
    } catch (e) {}
  };

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/gamification/rewards");
      const data = await res.json();
      if (res.ok) setRewards(data);
    } catch (e) {}
  };

  const fetchLeaderboards = async () => {
    try {
      const resEmp = await fetch("/api/gamification/leaderboard?view=employee");
      const dataEmp = await resEmp.json();
      if (resEmp.ok) setEmployeeLeaderboard(dataEmp);

      const resDept = await fetch("/api/gamification/leaderboard?view=department");
      const dataDept = await resDept.json();
      if (resDept.ok) setDeptLeaderboard(dataDept);
    } catch (e) {}
  };

  useEffect(() => {
    fetchChallengeCategories();
    fetchChallenges();
    fetchParticipations();
    fetchBadges();
    fetchRewards();
    fetchLeaderboards();
  }, []);

  // Challenge CRUD Actions
  const handleSaveChallenge = async () => {
    setLoading(true);
    const method = currentChallenge.id ? "PUT" : "POST";
    const url = currentChallenge.id
      ? `/api/gamification/challenges/${currentChallenge.id}`
      : "/api/gamification/challenges";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentChallenge),
      });
      if (res.ok) {
        toast.success(currentChallenge.id ? "Challenge updated" : "Challenge created");
        setChallengeModalOpen(false);
        fetchChallenges();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save challenge");
      }
    } catch (err) {
      toast.error("Error communicating with database");
    } finally {
      setLoading(false);
    }
  };

  const updateChallengeStatus = async (challengeId: number, status: string) => {
    try {
      const res = await fetch(`/api/gamification/challenges/${challengeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Challenge status updated to ${status}`);
        fetchChallenges();
      } else {
        toast.error("Failed to update status");
      }
    } catch (e) {
      toast.error("Server error");
    }
  };

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/challenges/${challengeToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Challenge deleted successfully");
        setDeleteChallengeConfirmOpen(false);
        setChallengeToDelete(null);
        fetchChallenges();
      } else {
        toast.error("Failed to delete challenge");
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Participation Actions
  const handleSaveParticipation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gamification/participation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentPart),
      });
      if (res.ok) {
        toast.success("Joined challenge successfully!");
        setPartModalOpen(false);
        fetchParticipations();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to join");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveParticipation = async (partId: number) => {
    try {
      const res = await fetch(`/api/gamification/participation/${partId}/approve`, {
        method: "PUT",
      });
      if (res.ok) {
        const result = await res.json();
        toast.success("Challenge approved — XP awarded!");

        if (result.unlockedBadges && result.unlockedBadges.length > 0) {
          result.unlockedBadges.forEach((badge: any) => {
            toast(`🏆 Badge Unlocked: ${badge.name} ${badge.icon}`, {
              description: "You've qualified for a new sustainability badge!",
              duration: 5000,
            });
          });
        }
        fetchParticipations();
        fetchLeaderboards();
      } else {
        toast.error("Failed to approve");
      }
    } catch (e) {
      toast.error("Server error");
    }
  };

  const handleRejectParticipation = async (partId: number) => {
    try {
      const res = await fetch(`/api/gamification/participation/${partId}/reject`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.success("Challenge submission rejected");
        fetchParticipations();
      } else {
        toast.error("Failed to reject");
      }
    } catch (e) {
      toast.error("Server error");
    }
  };

  // Badge Actions
  const handleSaveBadge = async () => {
    setLoading(true);
    const method = currentBadge.id ? "PUT" : "POST";
    const url = currentBadge.id
      ? `/api/gamification/badges/${currentBadge.id}`
      : "/api/gamification/badges";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentBadge),
      });
      if (res.ok) {
        toast.success(currentBadge.id ? "Badge updated" : "Badge created");
        setBadgeModalOpen(false);
        fetchBadges();
      } else {
        toast.error("Failed to save badge");
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBadge = async () => {
    if (!badgeToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/badges/${badgeToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Badge deleted");
        setDeleteBadgeConfirmOpen(false);
        setBadgeToDelete(null);
        fetchBadges();
      } else {
        toast.error("Failed to delete");
      }
    } catch (e) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  // Reward Actions
  const handleSaveReward = async () => {
    setLoading(true);
    const method = currentReward.id ? "PUT" : "POST";
    const url = currentReward.id
      ? `/api/gamification/rewards/${currentReward.id}`
      : "/api/gamification/rewards";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentReward),
      });
      if (res.ok) {
        toast.success(currentReward.id ? "Reward updated" : "Reward created");
        setRewardModalOpen(false);
        fetchRewards();
      } else {
        toast.error("Failed to save reward");
      }
    } catch (e) {}
  };

  // Filter Challenges
  const filteredChallenges = challenges.filter((c) => {
    if (challengeFilter === "All") return true;
    return c.status === challengeFilter;
  });

  // Dynamically generate the leaderboard widget from fetched data
  const combinedLeaderboard = employeeLeaderboard
    .slice(0, 5) // Show top 5 employees in the widget
    .map((emp, index) => ({
      rank: index + 1,
      name: emp.employeeName,
      type: "employee",
      score: `${emp.totalXP} XP`,
    }));

  return (
    <div className="space-y-6">
      {/* Mockup Title style */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[#F97316]" /> EcoSphere: Gamification
        </h2>
        <p className="text-[#9CA3AF] text-sm mt-1">
          Motivate sustainability targets, review evidence, award achievement badges, and reward top performers.
        </p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          setActiveTab(val);
          const params = new URLSearchParams(searchParams.toString());
          if (val === "challenges") params.delete("tab");
          else params.set("tab", val);
          router.push(`?${params.toString()}`, { scroll: false });
        }} 
        className="w-full"
      >
        {/* Mockup Tab buttons style */}
        <TabsList className="bg-[#141414] border border-[#262626] p-1 gap-2 rounded-xl mb-6">
          <TabsTrigger
            value="challenges"
            className="rounded-lg text-sm text-[#9CA3AF] data-[state=active]:bg-[#F97316] data-[state=active]:text-white transition-all font-semibold"
          >
            Challenges
          </TabsTrigger>
          <TabsTrigger
            value="participation"
            className="rounded-lg text-sm text-[#9CA3AF] data-[state=active]:bg-[#F97316] data-[state=active]:text-white transition-all font-semibold"
          >
            Challenge Participation
          </TabsTrigger>
          <TabsTrigger
            value="badges"
            className="rounded-lg text-sm text-[#9CA3AF] data-[state=active]:bg-[#F97316] data-[state=active]:text-white transition-all font-semibold"
          >
            Badges
          </TabsTrigger>
          <TabsTrigger
            value="rewards"
            className="rounded-lg text-sm text-[#9CA3AF] data-[state=active]:bg-[#F97316] data-[state=active]:text-white transition-all font-semibold"
          >
            Rewards
          </TabsTrigger>
          <TabsTrigger
            value="leaderboard"
            className="rounded-lg text-sm text-[#9CA3AF] data-[state=active]:bg-[#F97316] data-[state=active]:text-white transition-all font-semibold"
          >
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* -------------------- CHALLENGES TAB (MATCHES MOCKUP DESIGN) -------------------- */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => {
                  setCurrentChallenge({
                    title: "",
                    categoryId: challengeCategories[0]?.id || 0,
                    description: "",
                    xp: 100,
                    difficulty: "Medium",
                    evidenceRequired: false,
                    deadline: "",
                    status: "Draft",
                  });
                  setChallengeModalOpen(true);
                }}
                className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold rounded-full px-6 flex items-center gap-2"
              >
                + New Challenge
              </Button>
            </div>

            {/* Pipeline Indicator Flow & Status Filter */}
            <div className="flex flex-wrap items-center gap-2 bg-[#141414] p-3 rounded-xl border border-[#262626]">
              {[
                { name: "Draft", border: "border-gray-500 text-gray-400", activeBg: "bg-gray-500/20" },
                { name: "Active", border: "border-green-500 text-green-400", activeBg: "bg-green-500/20" },
                { name: "Under Review", border: "border-purple-500 text-purple-400", activeBg: "bg-purple-500/20" },
                { name: "Completed", border: "border-blue-500 text-blue-400", activeBg: "bg-blue-500/20" },
                { name: "Archived", border: "border-gray-700 text-gray-500", activeBg: "bg-gray-700/20" }
              ].map((step, idx) => {
                const isActive = challengeFilter === step.name;
                return (
                  <div key={step.name} className="flex items-center">
                    <button
                      onClick={() => setChallengeFilter(challengeFilter === step.name ? "All" : step.name)}
                      className={`px-4 py-2 rounded-lg border text-xs font-semibold tracking-wider transition-all ${
                        isActive
                          ? `${step.activeBg} border-white text-white scale-105 shadow-md`
                          : `${step.border} bg-[#0A0A0A] hover:bg-white/5`
                      }`}
                    >
                      {step.name}
                    </button>
                    {idx < 4 && <ChevronRight className="w-4 h-4 mx-1 text-gray-700 shrink-0" />}
                  </div>
                );
              })}
              {challengeFilter !== "All" && (
                <button
                  onClick={() => setChallengeFilter("All")}
                  className="ml-auto text-xs text-gray-500 hover:text-white underline font-mono"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Challenge Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredChallenges.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#9CA3AF]">
                No challenges match the active pipeline status.
              </div>
            ) : (
              filteredChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="bg-[#141414] border-[#2A2A2A] rounded-2xl hover:border-[#F97316]/50 transition-all flex flex-col justify-between p-4 shadow-xl"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shrink-0" />
                        {challenge.title}
                      </h4>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setCurrentChallenge(challenge);
                            setChallengeModalOpen(true);
                          }}
                          className="h-7 w-7 text-gray-500 hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-2 font-mono">
                      XP: {challenge.xp} • {challenge.difficulty}
                    </p>
                    <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                      Deadline: {new Date(challenge.deadline).getMonth() + 1}/{new Date(challenge.deadline).getDate()}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <Badge
                        className={
                          challenge.status === "Active"
                            ? "bg-green-500/20 text-green-400 border border-green-500/20"
                            : challenge.status === "Draft"
                            ? "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                            : challenge.status === "Under Review"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/20"
                            : challenge.status === "Completed"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                            : "bg-red-500/20 text-red-400 border border-red-500/20"
                        }
                      >
                        {challenge.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    {challenge.status === "Active" && (
                      <Button
                        onClick={() => {
                          setCurrentPart({
                            challengeId: challenge.id,
                            employeeName: "",
                            progress: 0,
                            proofUrl: "",
                          });
                          setPartModalOpen(true);
                        }}
                        className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold rounded-full w-full py-1 text-xs"
                      >
                        Join Challenge
                      </Button>
                    )}
                    {challenge.status === "Draft" && (
                      <Button
                        onClick={() => updateChallengeStatus(challenge.id, "Active")}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full w-full py-1 text-xs"
                      >
                        Activate
                      </Button>
                    )}
                    {challenge.status === "Under Review" && (
                      <Button
                        onClick={() => updateChallengeStatus(challenge.id, "Completed")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full w-full py-1 text-xs"
                      >
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Mockup-Aligned Bottom Widget Row (Badge Gallery & Leaderboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-[#262626] pt-8">
            {/* Badge Gallery */}
            <Card className="bg-[#141414] border-[#2A2A2A] rounded-2xl p-5">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[#F97316]" /> Badge Gallery
              </CardTitle>
              <div className="grid grid-cols-2 gap-4">
                {badges.length === 0 ? (
                  <p className="text-xs text-gray-500 col-span-2">No badges available. Seed the DB to populate.</p>
                ) : (
                  badges.map((b) => (
                    <div
                      key={b.id}
                      className="bg-[#0D0D0D] border border-[#262626] p-3 rounded-xl flex items-center gap-3"
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{b.name}</p>
                        <p className="text-[9px] text-[#9CA3AF] line-clamp-1">{b.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Combined Leaderboard */}
            <Card className="bg-[#141414] border-[#2A2A2A] rounded-2xl p-5">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#F97316]" /> Leaderboard
              </CardTitle>
              <div className="space-y-3">
                <div className="grid grid-cols-3 text-[10px] text-gray-500 font-mono border-b border-[#262626] pb-2 font-bold uppercase">
                  <span>Rank</span>
                  <span>Employee/Dept</span>
                  <span className="text-right">XP</span>
                </div>
                {combinedLeaderboard.map((item) => (
                  <div
                    key={item.name}
                    className="grid grid-cols-3 items-center text-xs py-1 border-b border-[#262626]/40 text-white font-medium"
                  >
                    <span className="font-mono text-gray-400"># {item.rank}</span>
                    <span className="flex items-center gap-1.5">
                      {item.type === "dept" ? (
                        <Building className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                      )}
                      {item.name}
                    </span>
                    <span className="text-right font-mono font-bold text-orange-400">{item.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* -------------------- CHALLENGE PARTICIPATION TAB -------------------- */}
        <TabsContent value="participation">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-[#111] p-1 gap-2 rounded-lg mb-4 border border-[#2A2A2A]">
              <TabsTrigger value="all" className="text-xs">All Participation</TabsTrigger>
              <TabsTrigger value="queue" className="text-xs">Approval Queue</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
                    <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-white font-medium">Employee</TableHead>
                      <TableHead className="text-white font-medium">Challenge</TableHead>
                      <TableHead className="text-white font-medium">Progress</TableHead>
                      <TableHead className="text-white font-medium">Proof</TableHead>
                      <TableHead className="text-white font-medium text-center">Status</TableHead>
                      <TableHead className="text-white font-medium text-right">XP Awarded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-[#9CA3AF]">
                          No employees have joined challenges yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      participations.map((p) => (
                        <TableRow
                          key={p.id}
                          className="border-b border-[#2A2A2A]/50 hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="font-semibold text-white">{p.employeeName}</TableCell>
                          <TableCell className="text-[#9CA3AF] font-medium">
                            {p.challenge?.title || "Challenge"}
                          </TableCell>
                          <TableCell className="w-48">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#222] rounded-full h-2 overflow-hidden border border-[#333]">
                                <div
                                  className="bg-[#F97316] h-full transition-all"
                                  style={{ width: `${p.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-mono text-white">{p.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {p.proofUrl ? (
                              <a
                                href={p.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#F97316] hover:underline inline-flex items-center gap-1 text-xs"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                p.approvalStatus === "Approved"
                                  ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                  : p.approvalStatus === "Pending"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                  : "bg-red-500/20 text-red-400 border border-red-500/20"
                              }
                            >
                              {p.approvalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-[#F97316]">{p.xpAwarded} XP</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="queue" className="space-y-4">
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
                    <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                      <TableHead className="text-white font-medium">Employee</TableHead>
                      <TableHead className="text-white font-medium">Challenge</TableHead>
                      <TableHead className="text-white font-medium">Progress</TableHead>
                      <TableHead className="text-white font-medium">Proof</TableHead>
                      <TableHead className="text-white font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participations.filter((p) => p.approvalStatus === "Pending").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-[#9CA3AF]">
                          Approval queue is empty.
                        </TableCell>
                      </TableRow>
                    ) : (
                      participations
                        .filter((p) => p.approvalStatus === "Pending")
                        .map((p) => (
                          <TableRow
                            key={p.id}
                            className="border-b border-[#2A2A2A]/50 hover:bg-white/5 transition-colors"
                          >
                            <TableCell className="font-semibold text-white">{p.employeeName}</TableCell>
                            <TableCell className="text-[#9CA3AF] font-medium">
                              {p.challenge?.title || "Challenge"}
                            </TableCell>
                            <TableCell className="w-48">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-[#222] rounded-full h-2 overflow-hidden border border-[#333]">
                                  <div
                                    className="bg-amber-500 h-full"
                                    style={{ width: `${p.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono text-white">{p.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {p.proofUrl ? (
                                <a
                                  href={p.proofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#F97316] hover:underline inline-flex items-center gap-1 text-xs"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveParticipation(p.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 flex items-center gap-1 text-xs font-semibold"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectParticipation(p.id)}
                                  className="rounded-lg h-8 flex items-center gap-1 text-xs font-semibold"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* -------------------- BADGES TAB -------------------- */}
        <TabsContent value="badges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Sustainability Badges</h3>
            <Button
              onClick={() => {
                setCurrentBadge({ name: "", description: "", unlockRule: "XP >= 100", icon: "🌱" });
                setBadgeModalOpen(true);
              }}
              className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Badge
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {badges.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#9CA3AF]">
                No achievement badges created.
              </div>
            ) : (
              badges.map((badge) => (
                <Card
                  key={badge.id}
                  className="bg-[#141414] border-[#2A2A2A] rounded-xl hover:border-[#F97316]/30 transition-colors flex flex-col justify-between"
                >
                  <CardHeader className="text-center pb-2 flex flex-col items-center">
                    <span className="text-4xl my-3">{badge.icon}</span>
                    <CardTitle className="text-white text-sm font-bold">{badge.name}</CardTitle>
                    <CardDescription className="text-[#9CA3AF] text-xs mt-1">
                      {badge.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 text-center">
                    <div className="bg-[#0A0A0A] border border-[#2A2A2A] py-1.5 px-3 rounded-lg inline-block text-[9px] font-mono text-[#F97316]">
                      Unlock: {badge.unlockRule}
                    </div>
                  </CardContent>

                  <div className="p-3 bg-[#0A0A0A] border-t border-[#262626] rounded-b-xl flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setCurrentBadge(badge);
                        setBadgeModalOpen(true);
                      }}
                      className="text-gray-500 hover:text-white h-7 w-7 rounded-lg"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setBadgeToDelete(badge.id);
                        setDeleteBadgeConfirmOpen(true);
                      }}
                      className="text-red-400 hover:text-red-300 h-7 w-7 rounded-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* -------------------- REWARDS TAB -------------------- */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Sustainability Store</h3>
            <Button
              onClick={() => {
                setCurrentReward({ name: "", description: "", pointsRequired: 50, stock: 10, status: "Active" });
                setRewardModalOpen(true);
              }}
              className="bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Reward
            </Button>
          </div>

          <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
                <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                  <TableHead className="text-white font-medium">Name</TableHead>
                  <TableHead className="text-white font-medium">Description</TableHead>
                  <TableHead className="text-white font-medium text-right">Points Required</TableHead>
                  <TableHead className="text-white font-medium text-right">Stock</TableHead>
                  <TableHead className="text-white font-medium text-center">Status</TableHead>
                  <TableHead className="text-white font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[#9CA3AF]">
                      No rewards configured. Use the button to add.
                    </TableCell>
                  </TableRow>
                ) : (
                  rewards.map((rew) => {
                    const isOutOfStock = rew.stock <= 0;
                    return (
                      <TableRow
                        key={rew.id}
                        className="border-b border-[#2A2A2A]/50 hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="font-semibold text-white">{rew.name}</TableCell>
                        <TableCell className="text-[#9CA3AF] text-xs max-w-xs truncate">
                          {rew.description}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-white">
                          {rew.pointsRequired} pts
                        </TableCell>
                        <TableCell className="text-right font-mono text-white">{rew.stock}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              isOutOfStock
                                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                : rew.status === "Active"
                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                            }
                          >
                            {isOutOfStock ? "Out of Stock" : rew.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={isOutOfStock}
                              onClick={() => {
                                setRewardToRedeem(rew);
                                setRedeemConfirmOpen(true);
                              }}
                              className="bg-[#F97316]/20 hover:bg-[#F97316] text-[#F97316] hover:text-white rounded-lg h-8 text-xs font-semibold transition-colors"
                            >
                              Redeem
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCurrentReward(rew);
                                setRewardModalOpen(true);
                              }}
                              className="text-gray-500 hover:text-white h-8 w-8 rounded-lg"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setRewardToDelete(rew.id);
                                setDeleteRewardConfirmOpen(true);
                              }}
                              className="text-red-400 hover:text-red-300 h-8 w-8 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* -------------------- LEADERBOARD TAB (BACKUP DETAILED VIEW) -------------------- */}
        <TabsContent value="leaderboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Detailed Employees */}
            <Card className="bg-[#141414] border-[#2A2A2A] rounded-2xl p-5">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2 mb-4">
                Employee Rankings
              </CardTitle>
              <Table>
                <TableHeader className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
                  <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                    <TableHead className="text-white font-medium w-16">Rank</TableHead>
                    <TableHead className="text-white font-medium">Employee Name</TableHead>
                    <TableHead className="text-white font-medium text-right">Total XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeLeaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-[#9CA3AF]">
                        Leaderboard data is currently empty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeeLeaderboard.map((emp, idx) => (
                      <TableRow key={emp.employeeName} className="border-b border-[#2A2A2A]/40">
                        <TableCell className="font-mono text-gray-400"># {idx + 1}</TableCell>
                        <TableCell className="font-semibold text-white">{emp.employeeName}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-orange-400">
                          {emp.totalXP} XP
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            {/* Detailed Departments */}
            <Card className="bg-[#141414] border-[#2A2A2A] rounded-2xl p-5">
              <CardTitle className="text-white text-base font-bold flex items-center gap-2 mb-4">
                Department ESG Scores
              </CardTitle>
              <Table>
                <TableHeader className="bg-[#0A0A0A] border-b border-[#2A2A2A]">
                  <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                    <TableHead className="text-white font-medium w-16">Rank</TableHead>
                    <TableHead className="text-white font-medium">Department</TableHead>
                    <TableHead className="text-white font-medium text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptLeaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-[#9CA3AF]">
                        Leaderboard data is currently empty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deptLeaderboard.map((dept, idx) => (
                      <TableRow key={dept.id} className="border-b border-[#2A2A2A]/40">
                        <TableCell className="font-mono text-gray-400"># {idx + 1}</TableCell>
                        <TableCell className="font-semibold text-white">{dept.deptName}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-green-400">
                          {dept.totalScore}/100
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ==================== DIALOGS & MODALS ==================== */}

      {/* New/Edit Challenge Dialog */}
      <Dialog open={challengeModalOpen} onOpenChange={setChallengeModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentChallenge.id ? "Edit Challenge" : "Add New Challenge"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Configure rules, difficulty parameters, and rewards for this challenge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Challenge Title</label>
              <input
                type="text"
                value={currentChallenge.title || ""}
                onChange={(e) => setCurrentChallenge({ ...currentChallenge, title: e.target.value })}
                placeholder="e.g. Clean Energy Transition Hack"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Category</label>
              <select
                value={currentChallenge.categoryId || ""}
                onChange={(e) => setCurrentChallenge({ ...currentChallenge, categoryId: Number(e.target.value) })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
              >
                <option value="" disabled>Select Category</option>
                {challengeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Description</label>
              <textarea
                value={currentChallenge.description || ""}
                onChange={(e) => setCurrentChallenge({ ...currentChallenge, description: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316] h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">XP Value</label>
                <input
                  type="number"
                  value={currentChallenge.xp || 100}
                  onChange={(e) => setCurrentChallenge({ ...currentChallenge, xp: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Difficulty</label>
                <select
                  value={currentChallenge.difficulty || "Medium"}
                  onChange={(e) => setCurrentChallenge({ ...currentChallenge, difficulty: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Deadline</label>
                <input
                  type="date"
                  value={currentChallenge.deadline ? currentChallenge.deadline.split("T")[0] : ""}
                  onChange={(e) => setCurrentChallenge({ ...currentChallenge, deadline: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-2 flex flex-col justify-end pb-1.5">
                <div className="flex items-center justify-between bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-2.5">
                  <span className="text-xs text-[#9CA3AF] font-semibold">Evidence Required</span>
                  <button
                    onClick={() => setCurrentChallenge({ ...currentChallenge, evidenceRequired: !currentChallenge.evidenceRequired })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      currentChallenge.evidenceRequired ? "bg-[#F97316]" : "bg-[#2A2A2A]"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        currentChallenge.evidenceRequired ? "translate-x-4.5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setChallengeModalOpen(false)} className="text-[#9CA3AF]">
              Cancel
            </Button>
            <Button onClick={handleSaveChallenge} disabled={loading} className="bg-[#F97316] text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Challenge Dialog */}
      <Dialog open={deleteChallengeConfirmOpen} onOpenChange={setDeleteChallengeConfirmOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" /> Confirm Challenge Deletion
            </DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Are you sure you want to delete this challenge? All related participations will be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setDeleteChallengeConfirmOpen(false)} className="text-[#9CA3AF]">
              Cancel
            </Button>
            <Button onClick={handleDeleteChallenge} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Challenge Dialog */}
      <Dialog open={partModalOpen} onOpenChange={setPartModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>Join Sustainability Challenge</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Record your initial joining state and link any proof URLs if starting progress.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Employee Name</label>
              <input
                type="text"
                value={currentPart.employeeName || ""}
                onChange={(e) => setCurrentPart({ ...currentPart, employeeName: e.target.value })}
                placeholder="e.g. Aditi Rao"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Initial Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentPart.progress || 0}
                  onChange={(e) => setCurrentPart({ ...currentPart, progress: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Proof File URL</label>
                <input
                  type="text"
                  value={currentPart.proofUrl || ""}
                  onChange={(e) => setCurrentPart({ ...currentPart, proofUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPartModalOpen(false)} className="text-[#9CA3AF]">
              Cancel
            </Button>
            <Button onClick={handleSaveParticipation} disabled={loading} className="bg-[#F97316] text-white">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Join Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New/Edit Badge Dialog */}
      <Dialog open={badgeModalOpen} onOpenChange={setBadgeModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentBadge.id ? "Edit Badge" : "Add New Badge"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Set unlocked badges metadata and matching rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Badge Name</label>
                <input
                  type="text"
                  value={currentBadge.name || ""}
                  onChange={(e) => setCurrentBadge({ ...currentBadge, name: e.target.value })}
                  placeholder="e.g. Eco Champion"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Icon Emoji</label>
                <input
                  type="text"
                  value={currentBadge.icon || "🏆"}
                  onChange={(e) => setCurrentBadge({ ...currentBadge, icon: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Description</label>
              <textarea
                value={currentBadge.description || ""}
                onChange={(e) => setCurrentBadge({ ...currentBadge, description: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316] h-20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Unlock Rule</label>
              <select
                value={currentBadge.unlockRule || "XP >= 100"}
                onChange={(e) => setCurrentBadge({ ...currentBadge, unlockRule: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
              >
                <option value="XP >= 100">XP &gt;= 100 (Beginner)</option>
                <option value="XP >= 500">XP &gt;= 500 (Intermediate)</option>
                <option value="Completed Challenges >= 3">Completed Challenges &gt;= 3</option>
                <option value="CSR Activities >= 2">CSR Activities &gt;= 2</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setBadgeModalOpen(false)} className="text-[#9CA3AF]">
              Cancel
            </Button>
            <Button onClick={handleSaveBadge} disabled={loading} className="bg-[#F97316] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Badge Confirmation */}
      <Dialog open={deleteBadgeConfirmOpen} onOpenChange={setDeleteBadgeConfirmOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Are you sure you want to delete this badge?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteBadgeConfirmOpen(false)} className="text-[#9CA3AF]">
              Cancel
            </Button>
            <Button onClick={handleDeleteBadge} disabled={loading} className="bg-red-600 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New/Edit Reward Dialog */}
      <Dialog open={rewardModalOpen} onOpenChange={setRewardModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentReward.id ? "Edit Reward" : "Add New Reward"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Create items redeemable with CSR points.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Reward Name</label>
              <input
                type="text"
                value={currentReward.name || ""}
                onChange={(e) => setCurrentReward({ ...currentReward, name: e.target.value })}
                placeholder="e.g. Recycled Bottle Thermos"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Description</label>
              <textarea
                value={currentReward.description || ""}
                onChange={(e) => setCurrentReward({ ...currentReward, description: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316] h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Points Required</label>
                <input
                  type="number"
                  value={currentReward.pointsRequired || 50}
                  onChange={(e) => setCurrentReward({ ...currentReward, pointsRequired: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Stock Level</label>
                <input
                  type="number"
                  value={currentReward.stock || 0}
                  onChange={(e) => setCurrentReward({ ...currentReward, stock: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Status</label>
              <select
                value={currentReward.status || "Active"}
                onChange={(e) => setCurrentReward({ ...currentReward, status: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#F97316]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setRewardModalOpen(false)} className="text-[#9CA3AF]">
              Cancel
            </Button>
            <Button onClick={handleSaveReward} disabled={loading} className="bg-[#F97316] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GamificationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Gamification...</div>}>
      <GamificationPageInner />
    </Suspense>
  );
}
