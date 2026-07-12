"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Shield, FileText, ClipboardCheck, AlertTriangle,
  Plus, Pencil, Trash2, CheckCircle
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string; }
interface ESGPolicy {
  id: number; title: string; description: string; version: string;
  effectiveDate: string; deptId: number | null; dept: Department | null;
  status: string; acknowledgements: PolicyAck[];
}
interface PolicyAck {
  id: number; policyId: number; policy: { title: string };
  employeeName: string; acknowledgedAt: string;
}
interface Audit {
  id: number; title: string; deptId: number; dept: Department;
  auditor: string; date: string; findings: string | null;
  status: string; complianceIssues: ComplianceIssue[];
}
interface ComplianceIssue {
  id: number; auditId: number;
  audit: { id: number; title: string; dept: Department };
  severity: string; description: string; owner: string;
  dueDate: string; status: string;
}

const INPUT = "w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3B82F6] transition";
const LABEL = "block text-xs font-medium mb-1 text-[#9CA3AF] uppercase tracking-wider";

function Pill({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    blue:   "bg-blue-900/30 text-blue-400",
    amber:  "bg-amber-900/30 text-amber-400",
    green:  "bg-green-900/30 text-green-400",
    red:    "bg-red-900/30 text-red-400",
    gray:   "bg-[#2A2A2A] text-[#9CA3AF]",
    orange: "bg-orange-900/30 text-orange-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#9CA3AF]">{sub}</p>}
    </div>
  );
}

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

const isOverdue = (dueDate: string, status: string) =>
  status === "Open" && new Date(dueDate) < new Date();

// ─── Inner component ──────────────────────────────────────────────────────────
function GovernancePageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [mainTab, setMainTab] = useState<"policies" | "acknowledgements" | "audits" | "compliance">(
    tabParam === "acknowledgements" ? "acknowledgements"
    : tabParam === "audits"         ? "audits"
    : tabParam === "compliance"     ? "compliance"
    : "policies"
  );

  const [policies, setPolicies]       = useState<ESGPolicy[]>([]);
  const [acks, setAcks]               = useState<PolicyAck[]>([]);
  const [audits, setAudits]           = useState<Audit[]>([]);
  const [issues, setIssues]           = useState<ComplianceIssue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]         = useState(true);

  // Policy modal
  const [policyOpen, setPolicyOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<ESGPolicy | null>(null);
  const EMPTY_POL = { title: "", description: "", version: "", effectiveDate: "", deptId: "", status: "Active" };
  const [policyForm, setPolicyForm] = useState<typeof EMPTY_POL>(EMPTY_POL);

  // Ack modal
  const [ackOpen, setAckOpen] = useState(false);
  const EMPTY_ACK = { employeeName: "", policyId: "" };
  const [ackForm, setAckForm] = useState<typeof EMPTY_ACK>(EMPTY_ACK);

  // Audit modal
  const [auditOpen, setAuditOpen] = useState(false);
  const [editAudit, setEditAudit] = useState<Audit | null>(null);
  const EMPTY_AUD = { title: "", auditor: "", date: "", deptId: "", findings: "", status: "Planned" };
  const [auditForm, setAuditForm] = useState<typeof EMPTY_AUD>(EMPTY_AUD);

  // Issue modal
  const [issueOpen, setIssueOpen] = useState(false);
  const EMPTY_ISS = { auditId: "", severity: "Low", description: "", owner: "", dueDate: "" };
  const [issueForm, setIssueForm] = useState<typeof EMPTY_ISS>(EMPTY_ISS);
  const [issueErrors, setIssueErrors] = useState<{ owner?: string; dueDate?: string }>({});

  // ── Loaders ──
  const loadPolicies = useCallback(async () => {
    const r = await fetch("/api/governance/policies"); if (r.ok) setPolicies(await r.json());
  }, []);
  const loadAcks = useCallback(async () => {
    const r = await fetch("/api/governance/acknowledgements"); if (r.ok) setAcks(await r.json());
  }, []);
  const loadAudits = useCallback(async () => {
    const r = await fetch("/api/governance/audits"); if (r.ok) setAudits(await r.json());
  }, []);
  const loadIssues = useCallback(async () => {
    const r = await fetch("/api/governance/compliance"); if (r.ok) setIssues(await r.json());
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const d = await fetch("/api/departments");
      if (d.ok) setDepartments(await d.json());
      await Promise.all([loadPolicies(), loadAcks(), loadAudits(), loadIssues()]);
      setLoading(false);
    })();
  }, [loadPolicies, loadAcks, loadAudits, loadIssues]);

  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString() : "—";
  const auditStatusColor = (s: string) =>
    s === "Completed" ? "blue" : s === "Under Review" ? "amber" : "gray";
  const severityColor = (s: string) =>
    s === "High" ? "red" : s === "Medium" ? "amber" : "gray";

  // ── Policy CRUD ──
  const openNewPolicy = () => { setEditPolicy(null); setPolicyForm(EMPTY_POL); setPolicyOpen(true); };
  const openEditPolicy = (p: ESGPolicy) => {
    setEditPolicy(p);
    setPolicyForm({ title: p.title, description: p.description, version: p.version,
      effectiveDate: p.effectiveDate.split("T")[0], deptId: p.deptId ? String(p.deptId) : "", status: p.status });
    setPolicyOpen(true);
  };
  const submitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editPolicy ? `/api/governance/policies/${editPolicy.id}` : "/api/governance/policies";
    const res = await fetch(url, { method: editPolicy ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(policyForm) });
    if (res.ok) { toast.success(editPolicy ? "Policy updated!" : "Policy created!"); setPolicyOpen(false); loadPolicies(); }
    else { const e = await res.json(); toast.error(e.error ?? "Failed"); }
  };
  const deletePolicy = async (id: number) => {
    const r = await fetch(`/api/governance/policies/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Policy deleted"); loadPolicies(); loadAcks(); }
    else toast.error("Failed to delete");
  };

  // ── Ack ──
  const submitAck = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/governance/acknowledgements", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ackForm) });
    if (res.ok) { toast.success("Acknowledgement recorded!"); setAckOpen(false); setAckForm(EMPTY_ACK); loadAcks(); }
    else { const e = await res.json(); toast.error(e.error ?? "Failed"); }
  };

  // ── Audit CRUD ──
  const openNewAudit = () => { setEditAudit(null); setAuditForm(EMPTY_AUD); setAuditOpen(true); };
  const openEditAudit = (a: Audit) => {
    setEditAudit(a);
    setAuditForm({ title: a.title, auditor: a.auditor, date: a.date.split("T")[0],
      deptId: String(a.deptId), findings: a.findings ?? "", status: a.status });
    setAuditOpen(true);
  };
  const submitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editAudit ? `/api/governance/audits/${editAudit.id}` : "/api/governance/audits";
    const res = await fetch(url, { method: editAudit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(auditForm) });
    if (res.ok) { toast.success(editAudit ? "Audit updated!" : "Audit scheduled!"); setAuditOpen(false); loadAudits(); }
    else { const e = await res.json(); toast.error(e.error ?? "Failed"); }
  };
  const deleteAudit = async (id: number) => {
    const r = await fetch(`/api/governance/audits/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Audit deleted"); loadAudits(); loadIssues(); }
    else toast.error("Failed to delete");
  };

  // ── Compliance ──
  const submitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof issueErrors = {};
    if (!issueForm.owner.trim()) errs.owner = "Owner is required";
    if (!issueForm.dueDate)      errs.dueDate = "Due date is required";
    if (Object.keys(errs).length) { setIssueErrors(errs); return; }
    setIssueErrors({});
    const res = await fetch("/api/governance/compliance", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(issueForm) });
    if (res.ok) { toast.success("Issue logged!"); setIssueOpen(false); setIssueForm(EMPTY_ISS); loadIssues(); }
    else { const e = await res.json(); toast.error(e.error ?? "Failed"); }
  };
  const resolveIssue = async (id: number) => {
    const r = await fetch(`/api/governance/compliance/${id}/resolve`, { method: "PUT" });
    if (r.ok) { toast.success("Issue resolved!"); loadIssues(); }
    else toast.error("Failed to resolve");
  };

  // ── Derived stats ──
  const activePolicies  = policies.filter(p => p.status === "Active").length;
  const plannedAudits   = audits.filter(a => a.status === "Planned").length;
  const openIssues      = issues.filter(i => i.status === "Open").length;
  const overdueIssues   = issues.filter(i => isOverdue(i.dueDate, i.status));

  const TabBtn = ({ tab, label, icon: Icon }: { tab: typeof mainTab; label: string; icon: React.ComponentType<{ className?: string }> }) => (
    <button onClick={() => setMainTab(tab)}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative ${
        mainTab === tab
          ? "text-[#3B82F6] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#3B82F6]"
          : "text-[#9CA3AF] hover:text-white"
      }`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#3B82F6]" />
            </div>
            Governance Module
          </h1>
          <p className="text-[#9CA3AF] mt-1 ml-14">Manage policies, audits, and compliance tracking</p>
        </div>
        {mainTab === "policies"         && <button onClick={openNewPolicy}  className="flex items-center gap-2 bg-[#3B82F6] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#2563EB] transition shadow-lg shadow-[#3B82F6]/20"><Plus className="w-4 h-4" /> New Policy</button>}
        {mainTab === "acknowledgements" && <button onClick={() => { setAckForm(EMPTY_ACK); setAckOpen(true); }} className="flex items-center gap-2 bg-[#3B82F6] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#2563EB] transition shadow-lg shadow-[#3B82F6]/20"><Plus className="w-4 h-4" /> New Acknowledgement</button>}
        {mainTab === "audits"           && <button onClick={openNewAudit}   className="flex items-center gap-2 bg-[#3B82F6] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#2563EB] transition shadow-lg shadow-[#3B82F6]/20"><Plus className="w-4 h-4" /> Schedule Audit</button>}
        {mainTab === "compliance"       && <button onClick={() => { setIssueForm(EMPTY_ISS); setIssueErrors({}); setIssueOpen(true); }} className="flex items-center gap-2 bg-[#3B82F6] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#2563EB] transition shadow-lg shadow-[#3B82F6]/20"><Plus className="w-4 h-4" /> Log Issue</button>}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Policies"    value={activePolicies}        color="text-[#3B82F6]" />
        <StatCard label="Acknowledgements"   value={acks.length}           color="text-green-400" sub="total recorded" />
        <StatCard label="Planned Audits"     value={plannedAudits}         color="text-blue-400"  sub="upcoming" />
        <StatCard label="Open Issues"        value={openIssues}            color={overdueIssues.length > 0 ? "text-red-400" : "text-orange-400"} sub={overdueIssues.length > 0 ? `${overdueIssues.length} overdue` : "all on track"} />
      </div>

      {/* Overdue Banner */}
      {overdueIssues.length > 0 && mainTab === "compliance" && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{overdueIssues.length}</strong> compliance {overdueIssues.length === 1 ? "issue is" : "issues are"} overdue and require immediate attention.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#2A2A2A] flex">
        <TabBtn tab="policies"         label="Policies"            icon={FileText} />
        <TabBtn tab="acknowledgements" label="Acknowledgements"     icon={CheckCircle} />
        <TabBtn tab="audits"           label="Audits"               icon={ClipboardCheck} />
        <TabBtn tab="compliance"       label="Compliance Issues"    icon={AlertTriangle} />
      </div>

      {/* ── POLICIES ── */}
      {mainTab === "policies" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          {policies.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF]">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No policies yet</p>
              <p className="text-xs mt-1">Create your first ESG policy</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">Version</th>
                  <th className="px-6 py-4 text-left font-medium">Effective Date</th>
                  <th className="px-6 py-4 text-left font-medium">Department</th>
                  <th className="px-6 py-4 text-left font-medium">Acks</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {policies.map(p => (
                  <tr key={p.id} className="hover:bg-[#3B82F6]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.title}</div>
                      {p.description && <div className="text-xs text-[#9CA3AF] mt-0.5 truncate max-w-[200px]">{p.description}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#9CA3AF]">{p.version}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{fmt(p.effectiveDate)}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{p.dept?.name ?? <span className="italic opacity-50">Global</span>}</td>
                    <td className="px-6 py-4">
                      <span className="text-[#3B82F6] font-bold">{p.acknowledgements?.length ?? 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Pill label={p.status} color={p.status === "Active" ? "green" : "gray"} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditPolicy(p)} title="Edit"
                          className="p-1.5 rounded hover:bg-[#3B82F6]/20 text-[#9CA3AF] hover:text-[#3B82F6] transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete onConfirm={() => deletePolicy(p.id)} label="Policy" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ACKNOWLEDGEMENTS ── */}
      {mainTab === "acknowledgements" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          {acks.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF]">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No acknowledgements recorded yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-medium">Employee</th>
                  <th className="px-6 py-4 text-left font-medium">Policy</th>
                  <th className="px-6 py-4 text-left font-medium">Acknowledged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {acks.map(a => (
                  <tr key={a.id} className="hover:bg-[#3B82F6]/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{a.employeeName}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{a.policy?.title ?? "—"}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{fmt(a.acknowledgedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── AUDITS ── */}
      {mainTab === "audits" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          {audits.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF]">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No audits scheduled</p>
              <p className="text-xs mt-1">Click "Schedule Audit" to begin</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-medium">Title</th>
                  <th className="px-6 py-4 text-left font-medium">Department</th>
                  <th className="px-6 py-4 text-left font-medium">Auditor</th>
                  <th className="px-6 py-4 text-left font-medium">Date</th>
                  <th className="px-6 py-4 text-left font-medium">Findings</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {audits.map(a => (
                  <tr key={a.id} className="hover:bg-[#3B82F6]/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{a.title}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{a.dept?.name}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{a.auditor}</td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{fmt(a.date)}</td>
                    <td className="px-6 py-4 text-[#9CA3AF] max-w-[180px]">
                      {a.findings
                        ? <span className="truncate block" title={a.findings}>{a.findings.slice(0, 45)}{a.findings.length > 45 ? "…" : ""}</span>
                        : <span className="italic opacity-40">None</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Pill label={a.status} color={auditStatusColor(a.status)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditAudit(a)} title="Edit"
                          className="p-1.5 rounded hover:bg-[#3B82F6]/20 text-[#9CA3AF] hover:text-[#3B82F6] transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <ConfirmDelete onConfirm={() => deleteAudit(a.id)} label="Audit" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── COMPLIANCE ISSUES ── */}
      {mainTab === "compliance" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          {issues.length === 0 ? (
            <div className="py-16 text-center text-[#9CA3AF]">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No compliance issues logged</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#9CA3AF] text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-medium">Description</th>
                  <th className="px-6 py-4 text-left font-medium">Severity</th>
                  <th className="px-6 py-4 text-left font-medium">Department</th>
                  <th className="px-6 py-4 text-left font-medium">Owner</th>
                  <th className="px-6 py-4 text-left font-medium">Due Date</th>
                  <th className="px-6 py-4 text-left font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A]">
                {issues.map(i => {
                  const overdue = isOverdue(i.dueDate, i.status);
                  return (
                    <tr key={i.id} className={`transition-colors ${overdue ? "bg-red-950/20 hover:bg-red-950/30" : "hover:bg-[#3B82F6]/5"}`}>
                      <td className="px-6 py-4 max-w-[200px]">
                        <span className="text-white block truncate" title={i.description}>
                          {i.description.slice(0, 50)}{i.description.length > 50 ? "…" : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Pill label={i.severity} color={severityColor(i.severity)} />
                      </td>
                      <td className="px-6 py-4 text-[#9CA3AF]">{i.audit?.dept?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-[#9CA3AF]">{i.owner}</td>
                      <td className="px-6 py-4 text-[#9CA3AF]">{fmt(i.dueDate)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pill label={i.status} color={i.status === "Resolved" ? "green" : "orange"} />
                          {overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-900/40 text-red-400 border border-red-800/40 animate-pulse">
                              ⚠ Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {i.status !== "Resolved" && (
                          <button onClick={() => resolveIssue(i.id)}
                            className="flex items-center gap-1.5 ml-auto bg-green-900/30 hover:bg-green-900/60 text-green-400 px-3 py-1.5 rounded-md text-xs font-medium transition">
                            <CheckCircle className="w-3.5 h-3.5" /> Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ══ MODALS ══ */}

      {/* Policy Modal */}
      <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editPolicy ? "Edit Policy" : "New ESG Policy"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPolicy} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Title *</label>
              <input required value={policyForm.title} onChange={e => setPolicyForm({ ...policyForm, title: e.target.value })} className={INPUT} placeholder="Anti-Bribery Policy" />
            </div>
            <div>
              <label className={LABEL}>Description</label>
              <textarea rows={2} value={policyForm.description} onChange={e => setPolicyForm({ ...policyForm, description: e.target.value })} className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Version *</label>
                <input required value={policyForm.version} onChange={e => setPolicyForm({ ...policyForm, version: e.target.value })} className={INPUT} placeholder="1.0" />
              </div>
              <div>
                <label className={LABEL}>Effective Date *</label>
                <input required type="date" value={policyForm.effectiveDate} onChange={e => setPolicyForm({ ...policyForm, effectiveDate: e.target.value })} className={INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Department (optional)</label>
                <select value={policyForm.deptId} onChange={e => setPolicyForm({ ...policyForm, deptId: e.target.value })} className={INPUT}>
                  <option value="">Global</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select value={policyForm.status} onChange={e => setPolicyForm({ ...policyForm, status: e.target.value })} className={INPUT}>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition shadow-lg shadow-[#3B82F6]/20">
                {editPolicy ? "Save Changes" : "Create Policy"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ack Modal */}
      <Dialog open={ackOpen} onOpenChange={setAckOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Record Acknowledgement</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAck} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Employee Name *</label>
              <input required value={ackForm.employeeName} onChange={e => setAckForm({ ...ackForm, employeeName: e.target.value })} className={INPUT} placeholder="Jane Doe" />
            </div>
            <div>
              <label className={LABEL}>Policy *</label>
              <select required value={ackForm.policyId} onChange={e => setAckForm({ ...ackForm, policyId: e.target.value })} className={INPUT}>
                <option value="">Select Policy…</option>
                {policies.filter(p => p.status === "Active").map(p => (
                  <option key={p.id} value={p.id}>{p.title} (v{p.version})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition">
                Record
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Audit Modal */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editAudit ? "Edit Audit" : "Schedule Audit"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAudit} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Audit Title *</label>
              <input required value={auditForm.title} onChange={e => setAuditForm({ ...auditForm, title: e.target.value })} className={INPUT} placeholder="Q3 ISO 14001 Audit" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Auditor *</label>
                <input required value={auditForm.auditor} onChange={e => setAuditForm({ ...auditForm, auditor: e.target.value })} className={INPUT} placeholder="Jane Smith" />
              </div>
              <div>
                <label className={LABEL}>Date *</label>
                <input required type="date" value={auditForm.date} onChange={e => setAuditForm({ ...auditForm, date: e.target.value })} className={INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Department *</label>
                <select required value={auditForm.deptId} onChange={e => setAuditForm({ ...auditForm, deptId: e.target.value })} className={INPUT}>
                  <option value="">Select…</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Status</label>
                <select value={auditForm.status} onChange={e => setAuditForm({ ...auditForm, status: e.target.value })} className={INPUT}>
                  <option value="Planned">Planned</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Findings</label>
              <textarea rows={3} value={auditForm.findings} onChange={e => setAuditForm({ ...auditForm, findings: e.target.value })} className={INPUT} placeholder="Optional findings…" />
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition shadow-lg shadow-[#3B82F6]/20">
                {editAudit ? "Save Changes" : "Schedule Audit"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue Modal */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Log Compliance Issue</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitIssue} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Description *</label>
              <textarea required rows={3} value={issueForm.description} onChange={e => setIssueForm({ ...issueForm, description: e.target.value })} className={INPUT} placeholder="Describe the compliance issue…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Related Audit *</label>
                <select required value={issueForm.auditId} onChange={e => setIssueForm({ ...issueForm, auditId: e.target.value })} className={INPUT}>
                  <option value="">Select Audit…</option>
                  {audits.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Severity *</label>
                <select value={issueForm.severity} onChange={e => setIssueForm({ ...issueForm, severity: e.target.value })} className={INPUT}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Owner *</label>
                <input value={issueForm.owner}
                  onChange={e => { setIssueForm({ ...issueForm, owner: e.target.value }); setIssueErrors({ ...issueErrors, owner: undefined }); }}
                  className={`${INPUT} ${issueErrors.owner ? "!border-red-500" : ""}`} placeholder="Manager Name" />
                {issueErrors.owner && <p className="text-red-400 text-xs mt-1">{issueErrors.owner}</p>}
              </div>
              <div>
                <label className={LABEL}>Due Date *</label>
                <input type="date" value={issueForm.dueDate}
                  onChange={e => { setIssueForm({ ...issueForm, dueDate: e.target.value }); setIssueErrors({ ...issueErrors, dueDate: undefined }); }}
                  className={`${INPUT} ${issueErrors.dueDate ? "!border-red-500" : ""}`} />
                {issueErrors.dueDate && <p className="text-red-400 text-xs mt-1">{issueErrors.dueDate}</p>}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition shadow-lg shadow-[#3B82F6]/20">
                Log Issue
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GovernancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GovernancePageInner />
    </Suspense>
  );
}
