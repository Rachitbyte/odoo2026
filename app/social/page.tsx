"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, CheckCircle, XCircle,
  ExternalLink, UserPlus, Users, BarChart3, TrendingUp, Award
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string; }
interface Category   { id: number; name: string; }
interface CSRActivity {
  id: number; title: string; description: string | null;
  categoryId: number; category: Category;
  deptId: number; dept: Department;
  date: string; open: boolean;
  participations: EmployeeParticipation[];
}
interface EmployeeParticipation {
  id: number; employeeName: string; activityId: number;
  activity: { id: number; title: string; };
  proofUrl: string | null; approvalStatus: string;
  pointsEarned: number; completionDate: string | null;
  createdAt: string;
}
interface ESGConfig {
  requireCsrEvidence: boolean;
}

const INPUT = "w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316] transition";
const LABEL = "block text-xs font-medium mb-1 text-[#9CA3AF] uppercase tracking-wider";

// ─── Category emoji map ────────────────────────────────────────────────────────
const categoryEmoji: Record<string, string> = {
  "Environment":    "🌱",
  "Community":      "🤝",
  "Health":         "🩺",
  "Education":      "📚",
  "Blood Donation": "🩸",
  "Tree Plantation":"🌳",
  "Beach Cleanup":  "🏖️",
  "ESG Workshop":   "📊",
  "Sports":         "⚽",
  "Volunteering":   "🙌",
  "default":        "🌍",
};
const getEmoji = (name: string) =>
  categoryEmoji[name] ?? Object.entries(categoryEmoji).find(([k]) => name.toLowerCase().includes(k.toLowerCase()))?.[1] ?? "🌍";

// ─── Approval status pill ──────────────────────────────────────────────────────
function ApprovalPill({ status }: { status: string }) {
  const cfg = {
    Pending:  "bg-orange-500/20 text-orange-400 border border-orange-500/40",
    Approved: "bg-green-500/20  text-green-400  border border-green-500/40",
    Rejected: "bg-red-500/20    text-red-400    border border-red-500/40",
  }[status] ?? "bg-[#2A2A2A] text-[#9CA3AF]";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-semibold ${cfg}`}>
      {status}
    </span>
  );
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button onClick={() => setOpen(true)} title="Delete"
        className="p-1 rounded hover:bg-red-900/30 text-[#6B7280] hover:text-red-400 transition">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Delete {label}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#9CA3AF] mt-1">This action cannot be undone.</p>
        <div className="flex gap-3 mt-4">
          <DialogClose render={<button className="flex-1 border border-[#2A2A2A] rounded-md py-2 text-sm text-[#9CA3AF] hover:text-white transition" />} >Cancel</DialogClose>
          <button onClick={() => { setOpen(false); onConfirm(); }}
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-md py-2 text-sm text-white font-medium transition">
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// INNER PAGE
// ──────────────────────────────────────────────────────────────────────────────
function SocialPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [mainTab, setMainTab] = useState<"activities" | "participation" | "diversity">(
    tabParam === "participation" ? "participation"
    : tabParam === "diversity"  ? "diversity"
    : "activities"
  );

  useEffect(() => {
    if (tabParam === "participation") setMainTab("participation");
    else if (tabParam === "diversity") setMainTab("diversity");
    else setMainTab("activities");
  }, [tabParam]);

  const [activities, setActivities]         = useState<CSRActivity[]>([]);
  const [participations, setParticipations] = useState<EmployeeParticipation[]>([]);
  const [departments, setDepartments]       = useState<Department[]>([]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [esgConfig, setEsgConfig]           = useState<ESGConfig | null>(null);
  const [loading, setLoading]               = useState(true);

  // ── Activity CRUD modal ──
  const [actOpen, setActOpen]   = useState(false);
  const [editAct, setEditAct]   = useState<CSRActivity | null>(null);
  const EMPTY_ACT = { title: "", categoryId: "", description: "", deptId: "", date: "", open: "true" };
  const [actForm, setActForm]   = useState<typeof EMPTY_ACT>(EMPTY_ACT);

  // ── Join (log participation) modal ──
  const [joinOpen, setJoinOpen]         = useState(false);
  const [joinActivity, setJoinActivity] = useState<CSRActivity | null>(null);
  const EMPTY_JOIN = { employeeName: "", proofUrl: "", completionDate: "" };
  const [joinForm, setJoinForm]         = useState<typeof EMPTY_JOIN>(EMPTY_JOIN);

  // ── New Participation modal (from Participation tab) ──
  const [partOpen, setPartOpen] = useState(false);
  const EMPTY_PART = { employeeName: "", activityId: "", proofUrl: "", completionDate: "" };
  const [partForm, setPartForm] = useState<typeof EMPTY_PART>(EMPTY_PART);

  // ── Load ──
  const loadActivities = useCallback(async () => {
    const r = await fetch("/api/social/activities");
    if (r.ok) setActivities(await r.json());
  }, []);
  const loadParticipations = useCallback(async () => {
    const r = await fetch("/api/social/participation");
    if (r.ok) setParticipations(await r.json());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [deptRes, catRes, cfgRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/categories?type=CSR_ACTIVITY"),
        fetch("/api/esg-config"),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (catRes.ok)  setCategories(await catRes.json());
      if (cfgRes.ok)  setEsgConfig(await cfgRes.json());
      await Promise.all([loadActivities(), loadParticipations()]);
      setLoading(false);
    })();
  }, [loadActivities, loadParticipations]);

  // ── Activity CRUD ──
  const openNewActivity = () => { setEditAct(null); setActForm(EMPTY_ACT); setActOpen(true); };
  const openEditActivity = (act: CSRActivity) => {
    setEditAct(act);
    setActForm({ title: act.title, categoryId: String(act.categoryId),
      description: act.description ?? "", deptId: String(act.deptId),
      date: act.date.split("T")[0], open: act.open ? "true" : "false" });
    setActOpen(true);
  };
  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const url    = editAct ? `/api/social/activities/${editAct.id}` : "/api/social/activities";
    const method = editAct ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...actForm, open: actForm.open === "true" }) });
    if (res.ok) { toast.success(editAct ? "Activity updated!" : "Activity created!"); setActOpen(false); loadActivities(); }
    else { const err = await res.json(); toast.error(err.error ?? "Failed to save"); }
  };
  const deleteActivity = async (id: number) => {
    const r = await fetch(`/api/social/activities/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Activity deleted"); loadActivities(); loadParticipations(); }
    else toast.error("Failed to delete");
  };

  // ── Join (log participation from card) ──
  const openJoin = (act: CSRActivity) => {
    setJoinActivity(act);
    setJoinForm(EMPTY_JOIN);
    setJoinOpen(true);
  };
  const submitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinActivity) return;
    const res = await fetch("/api/social/participation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeName: joinForm.employeeName, activityId: joinActivity.id,
        proofUrl: joinForm.proofUrl || null, completionDate: joinForm.completionDate || null }),
    });
    if (res.ok) {
      toast.success(`Joined "${joinActivity.title}"!`);
      setJoinOpen(false); setJoinForm(EMPTY_JOIN);
      loadActivities(); loadParticipations();
    } else { const err = await res.json(); toast.error(err.error ?? "Failed to join"); }
  };

  // ── Log participation from participation tab ──
  const submitPart = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/social/participation", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(partForm) });
    if (res.ok) { toast.success("Participation logged!"); setPartOpen(false); setPartForm(EMPTY_PART); loadParticipations(); }
    else { const err = await res.json(); toast.error(err.error ?? "Failed"); }
  };

  // ── Approve / Reject ──
  const handleApprove = async (id: number) => {
    const res  = await fetch(`/api/social/participation/${id}/approve`, { method: "PUT" });
    const data = await res.json();
    if (res.ok) { toast.success("Approved! +50 pts"); loadParticipations(); }
    else toast.error(data.error ?? "Failed to approve");
  };
  const handleReject = async (id: number) => {
    const res = await fetch(`/api/social/participation/${id}/reject`, { method: "PUT" });
    if (res.ok) { toast.success("Rejected"); loadParticipations(); }
    else toast.error("Failed to reject");
  };

  // ── Derived ──
  const pendingQueue    = participations.filter(p => p.approvalStatus === "Pending");
  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString() : "—";

  const TABS = [
    { key: "activities",    label: "CSR Activities" },
    { key: "participation", label: "Employee Participation" },
    { key: "diversity",     label: "Diversity Dashboard" },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ── Page Title ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#F97316] tracking-tight">
          ⊙ Social: CSR &amp; Employee Engagement
        </h1>
      </div>

      {/* ── Full-width Tab Bar ── */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] mb-5">
        <div className="flex w-full border border-[#2A2A2A] rounded-lg overflow-hidden min-w-max">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`flex-1 py-3 px-5 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                i < TABS.length - 1 ? "border-r border-[#2A2A2A]" : ""
              } ${
                mainTab === tab.key
                  ? "bg-[#1A1A1A] text-[#F97316]"
                  : "bg-[#0D0D0D] text-[#9CA3AF] hover:text-white hover:bg-[#111111]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: CSR ACTIVITIES
      ══════════════════════════════════════════════════════ */}
      {mainTab === "activities" && (
        <div className="space-y-6">
          {/* Add button */}
          <div>
            <button onClick={openNewActivity}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 px-4 py-2 rounded-md text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> New Activity
            </button>
          </div>

          {/* Activity Cards Grid */}
          {activities.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF] bg-[#111111] rounded-xl border border-[#2A2A2A]">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No CSR activities yet</p>
              <p className="text-xs mt-1 opacity-60">Click "+ New Activity" to create one</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {activities.map(act => {
                const joinedCount = act.participations?.length ?? 0;
                const evidenceRequired = esgConfig?.requireCsrEvidence && !act.open;
                const emoji = getEmoji(act.category?.name ?? "");
                return (
                  <div key={act.id}
                    className="bg-[#111111] border border-[#3B82F6]/40 rounded-xl p-4 flex flex-col gap-3 hover:border-[#3B82F6]/70 hover:shadow-lg hover:shadow-[#3B82F6]/10 transition-all duration-200 group">
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{emoji}</span>
                        <div>
                          <h3 className="font-semibold text-white text-sm leading-tight">{act.title}</h3>
                          <p className="text-[#9CA3AF] text-xs mt-0.5">{joinedCount} joined</p>
                        </div>
                      </div>
                      {/* Edit/Delete actions — visible on hover */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditActivity(act)} title="Edit"
                          className="p-1 rounded hover:bg-[#2A2A2A] text-[#6B7280] hover:text-white transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ConfirmDelete onConfirm={() => deleteActivity(act.id)} label="Activity" />
                      </div>
                    </div>

                    {/* Status */}
                    <p className="text-xs text-[#9CA3AF]">
                      {esgConfig?.requireCsrEvidence
                        ? "Evidence Required"
                        : act.open ? "Open" : "Closed"}
                    </p>

                    {/* Join Button */}
                    <button
                      onClick={() => act.open ? openJoin(act) : toast.error("This activity is closed")}
                      className={`w-full py-1.5 rounded-md text-sm font-medium border transition-all duration-150 ${
                        act.open
                          ? "border-[#3B82F6]/60 text-[#3B82F6] hover:bg-[#3B82F6]/10"
                          : "border-[#2A2A2A] text-[#6B7280] cursor-not-allowed"
                      }`}
                    >
                      Join
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Embedded Approval Queue ── */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3">
              Employee Participation: approval queue
            </h2>
            <div className="border border-[#2A2A2A] rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF]">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF]">Activity/Challenge</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF]">Proof</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF]">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF]">Approval</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[#9CA3AF]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E1E]">
                  {participations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#9CA3AF] text-xs">
                        No participation records yet.
                      </td>
                    </tr>
                  ) : (
                    participations.map(p => (
                      <tr key={p.id} className="hover:bg-[#111111] transition-colors bg-[#0D0D0D]">
                        <td className="px-4 py-3 font-medium text-white text-xs">{p.employeeName}</td>
                        <td className="px-4 py-3 text-[#9CA3AF] text-xs">{p.activity?.title ?? "—"}</td>
                        <td className="px-4 py-3 text-xs">
                          {p.proofUrl
                            ? <a href={p.proofUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#3B82F6] hover:underline">
                                {p.proofUrl.split("/").pop()?.slice(0, 12) ?? "View"} <ExternalLink className="w-3 h-3" />
                              </a>
                            : <span className="text-[#4B5563]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className={p.pointsEarned > 0 ? "text-[#F97316] font-semibold" : "text-[#4B5563]"}>
                            {p.pointsEarned > 0 ? p.pointsEarned : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ApprovalPill status={p.approvalStatus} />
                        </td>
                        <td className="px-4 py-3">
                          {p.approvalStatus === "Pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleApprove(p.id)}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">
                                Approve
                              </button>
                              <button onClick={() => handleReject(p.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: EMPLOYEE PARTICIPATION
      ══════════════════════════════════════════════════════ */}
      {mainTab === "participation" && (
        <div className="space-y-5">
          {/* Header action */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Employee Participation</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Track and manage all employee CSR participation records</p>
            </div>
            <button onClick={() => { setPartForm(EMPTY_PART); setPartOpen(true); }}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/10 px-4 py-2 rounded-md text-sm font-medium transition-all">
              <UserPlus className="w-4 h-4" /> Log Participation
            </button>
          </div>

          {/* Participation summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Records", value: participations.length, icon: Users, color: "text-[#F97316]" },
              { label: "Pending Approval", value: pendingQueue.length, icon: TrendingUp, color: "text-yellow-400" },
              { label: "Points Awarded", value: participations.reduce((s, p) => s + p.pointsEarned, 0), icon: Award, color: "text-green-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-[#9CA3AF]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sub-tabs: All | Pending Queue */}
          <div className="flex gap-1 bg-[#0D0D0D] rounded-lg p-1 border border-[#2A2A2A] w-fit">
            {(["all", "queue"] as const).map(t => {
              const [partSubTab, setPartSubTab] = ["all", () => {}] as any; // handled below
              return (
                <button key={t}
                  id={`part-subtab-${t}`}
                  onClick={() => {
                    document.querySelectorAll('[id^="part-subtab-"]').forEach(el => el.classList.remove('bg-[#1A1A1A]', 'text-white'));
                    document.getElementById(`part-subtab-${t}`)?.classList.add('bg-[#1A1A1A]', 'text-white');
                    const allRows = document.querySelectorAll('[data-part-row]');
                    allRows.forEach(row => {
                      const status = row.getAttribute('data-status');
                      if (t === 'all') (row as HTMLElement).style.display = '';
                      else (row as HTMLElement).style.display = status === 'Pending' ? '' : 'none';
                    });
                  }}
                  className="px-4 py-1.5 rounded-md text-xs font-medium text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A] transition">
                  {t === "all" ? "All Records" : `Pending Queue (${pendingQueue.length})`}
                </button>
              );
            })}
          </div>

          {/* Full participation table */}
          <div className="border border-[#2A2A2A] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] border-b border-[#2A2A2A]">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Activity</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Proof</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Points</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Completion</th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                {participations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#9CA3AF]">
                      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>No participation records yet.</p>
                    </td>
                  </tr>
                ) : (
                    participations.map(p => (
                    <tr key={p.id} data-part-row data-status={p.approvalStatus} className="hover:bg-[#111111] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white">{p.employeeName}</td>
                      <td className="px-5 py-3.5 text-[#9CA3AF]">{p.activity?.title ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        {p.proofUrl
                          ? <a href={p.proofUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[#3B82F6] hover:underline text-xs">
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          : <span className="text-[#4B5563] text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={p.pointsEarned > 0 ? "text-[#F97316] font-bold" : "text-[#4B5563]"}>
                          {p.pointsEarned > 0 ? `+${p.pointsEarned}` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ApprovalPill status={p.approvalStatus} />
                      </td>
                      <td className="px-5 py-3.5 text-[#9CA3AF] text-xs">{fmt(p.completionDate)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {p.approvalStatus === "Pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleApprove(p.id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">
                              Approve
                            </button>
                            <button onClick={() => handleReject(p.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: DIVERSITY DASHBOARD
      ══════════════════════════════════════════════════════ */}
      {mainTab === "diversity" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-white">Diversity Dashboard</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Workforce diversity & inclusion overview</p>
          </div>

          {/* Demo notice */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-900/10 border border-yellow-800/30 rounded-lg text-yellow-500/80 text-xs">
            ⚠ These metrics display demo data for presentation purposes.
          </div>

          {/* Top KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Female Employees", value: "42%",    emoji: "👩", sub: "of total workforce", color: "from-pink-500/20 to-pink-500/5", border: "border-pink-500/30" },
              { label: "Training Completion", value: "78%", emoji: "📚", sub: "completed this quarter", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/30" },
              { label: "Avg. Tenure",       value: "3.2 yrs", emoji: "⏳", sub: "across all departments", color: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/30" },
            ].map(c => (
              <div key={c.label} className={`bg-gradient-to-br ${c.color} border ${c.border} rounded-xl p-5 flex flex-col gap-2`}>
                <div className="text-3xl">{c.emoji}</div>
                <div className="text-3xl font-bold text-white">{c.value}</div>
                <div>
                  <p className="text-sm font-medium text-white/90">{c.label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{c.sub}</p>
                </div>
                <span className="text-[10px] text-yellow-500 bg-yellow-900/20 px-2 py-0.5 rounded w-fit">Demo Data</span>
              </div>
            ))}
          </div>

          {/* Breakdown section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Department diversity */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#F97316]" /> Department Diversity
              </h3>
              <div className="space-y-3">
                {[
                  { dept: "Engineering",  pct: 35, color: "bg-blue-500" },
                  { dept: "HR",           pct: 68, color: "bg-pink-500" },
                  { dept: "Operations",   pct: 42, color: "bg-orange-500" },
                  { dept: "Finance",      pct: 51, color: "bg-purple-500" },
                ].map(d => (
                  <div key={d.dept}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#9CA3AF]">{d.dept}</span>
                      <span className="text-white font-medium">{d.pct}%</span>
                    </div>
                    <div className="w-full bg-[#2A2A2A] rounded-full h-1.5">
                      <div className={`${d.color} h-1.5 rounded-full transition-all duration-700`} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-yellow-500 mt-4">* Demo Data</p>
            </div>

            {/* CSR Engagement */}
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#22C55E]" /> CSR Engagement (Live)
              </h3>
              <div className="space-y-3">
                {activities.slice(0, 4).map(act => {
                  const count = act.participations?.length ?? 0;
                  const pct   = Math.min(100, count * 10);
                  return (
                    <div key={act.id}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF] truncate max-w-[140px]">{act.title}</span>
                        <span className="text-white font-medium">{count} joined</span>
                      </div>
                      <div className="w-full bg-[#2A2A2A] rounded-full h-1.5">
                        <div className="bg-[#22C55E] h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <p className="text-xs text-[#9CA3AF] italic">No activities yet.</p>
                )}
              </div>
              <p className="text-[10px] text-green-500 mt-4">* Live Data from CSR Activities</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Activity Create/Edit Modal */}
      <Dialog open={actOpen} onOpenChange={setActOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editAct ? "Edit Activity" : "New CSR Activity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitActivity} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Title *</label>
              <input required value={actForm.title} onChange={e => setActForm({ ...actForm, title: e.target.value })}
                className={INPUT} placeholder="Tree Plantation Drive" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Category *</label>
                <select required value={actForm.categoryId} onChange={e => setActForm({ ...actForm, categoryId: e.target.value })} className={INPUT}>
                  <option value="">Select…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Department *</label>
                <select required value={actForm.deptId} onChange={e => setActForm({ ...actForm, deptId: e.target.value })} className={INPUT}>
                  <option value="">Select…</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Description</label>
              <textarea rows={2} value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })} className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Date *</label>
                <input required type="date" value={actForm.date} onChange={e => setActForm({ ...actForm, date: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select value={actForm.open} onChange={e => setActForm({ ...actForm, open: e.target.value })} className={INPUT}>
                  <option value="true">Open</option>
                  <option value="false">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose render={<button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition" />} >Cancel</DialogClose>
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition">
                {editAct ? "Save Changes" : "Create Activity"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Join Activity Modal */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Join: <span className="text-[#3B82F6]">{joinActivity?.title}</span>
            </DialogTitle>
          </DialogHeader>
          {joinActivity && (
            <form onSubmit={submitJoin} className="space-y-4 mt-2">
              <div>
                <label className={LABEL}>Your Name *</label>
                <input required value={joinForm.employeeName} onChange={e => setJoinForm({ ...joinForm, employeeName: e.target.value })}
                  className={INPUT} placeholder="Jane Doe" />
              </div>
              {esgConfig?.requireCsrEvidence && (
                <div className="px-3 py-2 bg-yellow-900/10 border border-yellow-800/30 rounded-md text-yellow-400 text-xs">
                  ⚠ Evidence is required for this activity. Please provide a proof URL.
                </div>
              )}
              <div>
                <label className={LABEL}>Proof URL {esgConfig?.requireCsrEvidence ? "*" : "(optional)"}</label>
                <input type="url" value={joinForm.proofUrl} onChange={e => setJoinForm({ ...joinForm, proofUrl: e.target.value })}
                  className={INPUT} placeholder="https://drive.google.com/…" />
              </div>
              <div>
                <label className={LABEL}>Completion Date (optional)</label>
                <input type="date" value={joinForm.completionDate} onChange={e => setJoinForm({ ...joinForm, completionDate: e.target.value })} className={INPUT} />
              </div>
              <div className="flex gap-3 pt-2">
                <DialogClose render={<button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition" />} >Cancel</DialogClose>
                <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition">
                  Confirm Join
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Participation Modal (from Participation tab) */}
      <Dialog open={partOpen} onOpenChange={setPartOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Log Employee Participation</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPart} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Employee Name *</label>
              <input required value={partForm.employeeName} onChange={e => setPartForm({ ...partForm, employeeName: e.target.value })}
                className={INPUT} placeholder="Jane Doe" />
            </div>
            <div>
              <label className={LABEL}>Activity *</label>
              <select required value={partForm.activityId} onChange={e => setPartForm({ ...partForm, activityId: e.target.value })} className={INPUT}>
                <option value="">Select Activity…</option>
                {activities.filter(a => a.open).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Proof URL (optional)</label>
              <input type="url" value={partForm.proofUrl} onChange={e => setPartForm({ ...partForm, proofUrl: e.target.value })}
                className={INPUT} placeholder="https://…" />
            </div>
            <div>
              <label className={LABEL}>Completion Date (optional)</label>
              <input type="date" value={partForm.completionDate} onChange={e => setPartForm({ ...partForm, completionDate: e.target.value })} className={INPUT} />
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose render={<button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition" />} >Cancel</DialogClose>
              <button type="submit" className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg py-2 text-sm font-medium transition">
                Log Participation
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SocialPageInner />
    </Suspense>
  );
}

