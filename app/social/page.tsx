"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Users, CalendarDays, Plus, Pencil, Trash2,
  CheckCircle, XCircle, ExternalLink, AlertCircle, TrendingUp
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Shared Form Styles ────────────────────────────────────────────────────────
const INPUT = "w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#F97316] transition";
const LABEL = "block text-xs font-medium mb-1 text-[#9CA3AF] uppercase tracking-wider";

// ─── Pill Badge ────────────────────────────────────────────────────────────────
function StatusPill({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    orange: "bg-[#F97316]/15 text-[#F97316]",
    green:  "bg-green-900/30 text-green-400",
    red:    "bg-red-900/30 text-red-400",
    yellow: "bg-yellow-900/30 text-yellow-400",
    gray:   "bg-[#2A2A2A] text-[#9CA3AF]",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF]">{sub}</p>}
    </div>
  );
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button onClick={() => setOpen(true)} title="Delete"
        className="p-1.5 rounded hover:bg-red-900/30 text-[#9CA3AF] hover:text-red-400 transition">
        <Trash2 className="w-4 h-4" />
      </button>
      <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Delete {label}?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#9CA3AF] mt-1">This action cannot be undone.</p>
        <div className="flex gap-3 mt-4">
          <DialogClose asChild>
            <button className="flex-1 border border-[#2A2A2A] rounded-md py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
          </DialogClose>
          <button onClick={() => { setOpen(false); onConfirm(); }}
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-md py-2 text-sm text-white font-medium transition">
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inner (needs useSearchParams) ───────────────────────────────────────────
function SocialPageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [mainTab, setMainTab] = useState<"activities" | "participation" | "diversity">(
    tabParam === "participation" ? "participation"
    : tabParam === "diversity"   ? "diversity"
    : "activities"
  );
  const [partTab, setPartTab] = useState<"all" | "queue">("all");

  const [activities, setActivities]         = useState<CSRActivity[]>([]);
  const [participations, setParticipations] = useState<EmployeeParticipation[]>([]);
  const [departments, setDepartments]       = useState<Department[]>([]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [loading, setLoading]               = useState(true);

  // Activity form
  const [actOpen, setActOpen]   = useState(false);
  const [editAct, setEditAct]   = useState<CSRActivity | null>(null);
  const EMPTY_ACT = { title: "", categoryId: "", description: "", deptId: "", date: "", open: "true" };
  const [actForm, setActForm]   = useState<typeof EMPTY_ACT>(EMPTY_ACT);

  // Participation form
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
      const [deptRes, catRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/categories?type=CSR_ACTIVITY"),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (catRes.ok)  setCategories(await catRes.json());
      await Promise.all([loadActivities(), loadParticipations()]);
      setLoading(false);
    })();
  }, [loadActivities, loadParticipations]);

  // ── Activity CRUD ──
  const openNewActivity = () => { setEditAct(null); setActForm(EMPTY_ACT); setActOpen(true); };
  const openEditActivity = (act: CSRActivity) => {
    setEditAct(act);
    setActForm({
      title: act.title, categoryId: String(act.categoryId),
      description: act.description ?? "", deptId: String(act.deptId),
      date: act.date.split("T")[0], open: act.open ? "true" : "false",
    });
    setActOpen(true);
  };
  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const url    = editAct ? `/api/social/activities/${editAct.id}` : "/api/social/activities";
    const method = editAct ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...actForm, open: actForm.open === "true" }),
    });
    if (res.ok) {
      toast.success(editAct ? "Activity updated!" : "Activity created!");
      setActOpen(false); loadActivities();
    } else {
      const err = await res.json(); toast.error(err.error ?? "Failed to save");
    }
  };
  const deleteActivity = async (id: number) => {
    const r = await fetch(`/api/social/activities/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Activity deleted"); loadActivities(); loadParticipations(); }
    else toast.error("Failed to delete");
  };

  // ── Participation CRUD ──
  const submitParticipation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/social/participation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partForm),
    });
    if (res.ok) {
      toast.success("Participation logged!"); setPartOpen(false);
      setPartForm(EMPTY_PART); loadParticipations();
    } else {
      const err = await res.json(); toast.error(err.error ?? "Failed");
    }
  };

  // ── Approve / Reject ──
  const handleApprove = async (id: number) => {
    const res  = await fetch(`/api/social/participation/${id}/approve`, { method: "PUT" });
    const data = await res.json();
    if (res.ok) { toast.success("Participation approved! +50 pts"); loadParticipations(); }
    else toast.error(data.error ?? "Failed to approve");
  };
  const handleReject = async (id: number) => {
    const res = await fetch(`/api/social/participation/${id}/reject`, { method: "PUT" });
    if (res.ok) { toast.success("Participation rejected"); loadParticipations(); }
    else toast.error("Failed to reject");
  };

  // ── Derived ──
  const pendingQueue   = participations.filter(p => p.approvalStatus === "Pending");
  const approvedCount  = participations.filter(p => p.approvalStatus === "Approved").length;
  const totalPoints    = participations.reduce((s, p) => s + p.pointsEarned, 0);
  const openActivities = activities.filter(a => a.open).length;

  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString() : "—";
  const approvalColor = (s: string) =>
    s === "Approved" ? "green" : s === "Rejected" ? "red" : "yellow";

  const TabBtn = ({ tab, label, badge }: { tab: typeof mainTab; label: string; badge?: number }) => (
    <button onClick={() => setMainTab(tab)}
      className={`px-5 py-3 font-medium text-sm transition-all relative ${
        mainTab === tab
          ? "text-[#F97316] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#F97316]"
          : "text-[#9CA3AF] hover:text-white"
      }`}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 bg-[#F97316] text-white text-xs rounded-full px-1.5 py-0.5 align-middle">{badge}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#F97316]" />
            </div>
            Social Module
          </h1>
          <p className="text-[#9CA3AF] mt-1 ml-14">Manage CSR activities and employee participation</p>
        </div>
        {mainTab === "activities" && (
          <button onClick={openNewActivity}
            className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#EA580C] transition shadow-lg shadow-[#F97316]/20">
            <Plus className="w-4 h-4" /> New Activity
          </button>
        )}
        {mainTab === "participation" && (
          <button onClick={() => { setPartForm(EMPTY_PART); setPartOpen(true); }}
            className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#EA580C] transition shadow-lg shadow-[#F97316]/20">
            <Plus className="w-4 h-4" /> Log Participation
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Activities"      value={activities.length}   color="text-[#F97316]" />
        <StatCard label="Open Activities"       value={openActivities}      color="text-green-400" sub="accepting sign-ups" />
        <StatCard label="Pending Approvals"     value={pendingQueue.length} color="text-yellow-400" sub="need review" />
        <StatCard label="Total Points Awarded"  value={totalPoints}         color="text-[#F97316]" sub={`${approvedCount} approved`} />
      </div>

      {/* Main Tabs */}
      <div className="border-b border-[#2A2A2A] flex">
        <TabBtn tab="activities"    label="CSR Activities" />
        <TabBtn tab="participation" label="Employee Participation" badge={pendingQueue.length} />
        <TabBtn tab="diversity"     label="Diversity Dashboard" />
      </div>

      {/* ── CSR ACTIVITIES ── */}
      {mainTab === "activities" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          {activities.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF]">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No CSR activities yet</p>
              <p className="text-xs mt-1">Click "New Activity" to create one</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">Category</th>
                  <th className="px-6 py-4 text-left font-medium">Department</th>
                  <th className="px-6 py-4 text-left font-medium">Date</th>
                  <th className="px-6 py-4 text-left font-medium">Participants</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {activities.map(act => (
                  <tr key={act.id} className="hover:bg-[#F97316]/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{act.title}</div>
                      {act.description && (
                        <div className="text-xs text-[#9CA3AF] mt-0.5 truncate max-w-[180px]">{act.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full">
                        {act.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{act.dept?.name}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {fmt(act.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold">{act.participations?.length ?? 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill label={act.open ? "Open" : "Closed"} color={act.open ? "green" : "gray"} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditActivity(act)} title="Edit"
                          className="p-1.5 rounded hover:bg-[#F97316]/20 text-[#9CA3AF] hover:text-[#F97316] transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete onConfirm={() => deleteActivity(act.id)} label="Activity" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── EMPLOYEE PARTICIPATION ── */}
      {mainTab === "participation" && (
        <div className="space-y-4">
          <div className="flex gap-1 bg-[#111111] rounded-lg p-1 w-fit border border-[#2A2A2A]">
            {(["all", "queue"] as const).map(t => (
              <button key={t} onClick={() => setPartTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  partTab === t ? "bg-[#1A1A1A] text-white shadow" : "text-[#9CA3AF] hover:text-white"
                }`}>
                {t === "all" ? "All Participation" : `Approval Queue${pendingQueue.length > 0 ? ` (${pendingQueue.length})` : ""}`}
              </button>
            ))}
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {partTab === "all" ? (
              participations.length === 0 ? (
                <div className="py-16 text-center text-[#9CA3AF]">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No participation records yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 text-left font-medium">Employee</th>
                      <th className="px-6 py-4 text-left font-medium">Activity</th>
                      <th className="px-6 py-4 text-left font-medium">Proof</th>
                      <th className="px-6 py-4 text-left font-medium">Points</th>
                      <th className="px-6 py-4 text-left font-medium">Status</th>
                      <th className="px-6 py-4 text-left font-medium">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {participations.map(p => (
                      <tr key={p.id} className="hover:bg-[#F97316]/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{p.employeeName}</td>
                        <td className="px-6 py-4 text-[#9CA3AF]">{p.activity?.title ?? "—"}</td>
                        <td className="px-6 py-4">
                          {p.proofUrl
                            ? <a href={p.proofUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#F97316] hover:underline text-xs">
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            : <span className="text-[#9CA3AF] text-xs">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${p.pointsEarned > 0 ? "text-[#F97316]" : "text-[#9CA3AF]"}`}>
                            {p.pointsEarned > 0 ? `+${p.pointsEarned}` : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill label={p.approvalStatus} color={approvalColor(p.approvalStatus)} />
                        </td>
                        <td className="px-6 py-4 text-[#9CA3AF]">{fmt(p.completionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              pendingQueue.length === 0 ? (
                <div className="py-16 text-center text-[#9CA3AF]">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">All clear — no pending approvals!</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 text-left font-medium">Employee</th>
                      <th className="px-6 py-4 text-left font-medium">Activity</th>
                      <th className="px-6 py-4 text-left font-medium">Proof</th>
                      <th className="px-6 py-4 text-left font-medium">Submitted</th>
                      <th className="px-6 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A2A2A]">
                    {pendingQueue.map(p => (
                      <tr key={p.id} className="hover:bg-[#F97316]/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{p.employeeName}</td>
                        <td className="px-6 py-4 text-[#9CA3AF]">{p.activity?.title ?? "—"}</td>
                        <td className="px-6 py-4">
                          {p.proofUrl
                            ? <a href={p.proofUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[#F97316] hover:underline text-xs">
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            : <span className="text-yellow-500/70 text-xs italic">No proof</span>}
                        </td>
                        <td className="px-6 py-4 text-[#9CA3AF] text-xs">{fmt(p.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleApprove(p.id)}
                              className="flex items-center gap-1.5 bg-green-900/30 hover:bg-green-900/60 text-green-400 px-3 py-1.5 rounded-md text-xs font-medium transition">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => handleReject(p.id)}
                              className="flex items-center gap-1.5 bg-red-900/30 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded-md text-xs font-medium transition">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}

      {/* ── DIVERSITY DASHBOARD ── */}
      {mainTab === "diversity" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg text-yellow-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            These cards display demo data for visualization purposes only.
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Female Employees",    value: "42%",    icon: "👩", desc: "of total workforce" },
              { label: "Training Completion", value: "78%",    icon: "📚", desc: "completed this quarter" },
              { label: "Avg. Tenure",         value: "3.2 yrs", icon: "⏳", desc: "across all departments" },
            ].map(card => (
              <div key={card.label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-3 hover:border-[#F97316]/30 transition-colors">
                <div className="text-3xl">{card.icon}</div>
                <div>
                  <div className="text-3xl font-bold text-white">{card.value}</div>
                  <div className="text-sm font-medium text-[#F97316] mt-1">{card.label}</div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">{card.desc}</div>
                </div>
                <span className="inline-block text-[10px] bg-yellow-900/20 text-yellow-500 px-2 py-0.5 rounded">Demo Data</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Activity Modal */}
      <Dialog open={actOpen} onOpenChange={setActOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editAct ? "Edit Activity" : "New CSR Activity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitActivity} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Title *</label>
              <input required value={actForm.title} onChange={e => setActForm({ ...actForm, title: e.target.value })}
                className={INPUT} placeholder="Beach Cleanup Drive" />
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
              <textarea rows={3} value={actForm.description} onChange={e => setActForm({ ...actForm, description: e.target.value })}
                className={INPUT} placeholder="Optional description…" />
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
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg py-2 text-sm font-medium transition shadow-lg shadow-[#F97316]/20">
                {editAct ? "Save Changes" : "Create Activity"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Participation Modal */}
      <Dialog open={partOpen} onOpenChange={setPartOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Log Employee Participation</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitParticipation} className="space-y-4 mt-2">
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
                className={INPUT} placeholder="https://drive.google.com/…" />
            </div>
            <div>
              <label className={LABEL}>Completion Date (optional)</label>
              <input type="date" value={partForm.completionDate} onChange={e => setPartForm({ ...partForm, completionDate: e.target.value })} className={INPUT} />
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg py-2 text-sm font-medium transition shadow-lg shadow-[#F97316]/20">
                Log Participation
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Export with Suspense for useSearchParams ─────────────────────────────────
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
