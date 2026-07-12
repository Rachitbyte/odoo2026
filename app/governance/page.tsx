"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, CheckCircle, Download,
  Shield, FileText, ClipboardCheck, AlertTriangle, ExternalLink
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, FileSpreadsheet } from "lucide-react";

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

// ─── Styled status pills matching image ───────────────────────────────────────
function StatusPill({ label }: { label: string }) {
  const cfg: Record<string, string> = {
    // Audit statuses
    "Completed":    "bg-blue-500/10   text-blue-400   border border-blue-500/50",
    "Under Review": "bg-purple-500/10 text-purple-400 border border-purple-500/50",
    "Planned":      "bg-[#2A2A2A]     text-[#9CA3AF]  border border-[#3A3A3A]",
    // Severity
    "High":         "bg-orange-500/10 text-orange-400  border border-orange-500/50",
    "Medium":       "bg-blue-500/10   text-blue-400    border border-blue-500/50",
    "Low":          "bg-[#2A2A2A]     text-[#9CA3AF]   border border-[#3A3A3A]",
    // Issue status
    "Open":         "bg-orange-500/10 text-orange-400  border border-orange-500/50",
    "Resolved":     "bg-green-500/10  text-green-400   border border-green-500/50",
    // Policy
    "Active":       "bg-green-500/10  text-green-400   border border-green-500/50",
    "Archived":     "bg-[#2A2A2A]     text-[#9CA3AF]   border border-[#3A3A3A]",
  };
  const cls = cfg[label] ?? "bg-[#2A2A2A] text-[#9CA3AF] border border-[#3A3A3A]";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${cls}`}>
      {label}
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
        <DialogHeader><DialogTitle className="text-white">Delete {label}?</DialogTitle></DialogHeader>
        <p className="text-sm text-[#9CA3AF] mt-1">This action cannot be undone.</p>
        <div className="flex gap-3 mt-4">
          <DialogClose asChild>
            <button className="flex-1 border border-[#2A2A2A] rounded-md py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
          </DialogClose>
          <button onClick={() => { setOpen(false); onConfirm(); }}
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-md py-2 text-sm text-white font-medium transition">Delete</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export Menu ───────────────────────────────────────────────────────────────
function ExportMenu({ onCsv, onPdf }: { onCsv: () => void, onPdf: () => void }) {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const click = () => setOpen(false);
    if (open) setTimeout(() => window.addEventListener("click", click), 0);
    return () => window.removeEventListener("click", click);
  }, [open]);

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A] px-4 py-2 rounded-md text-sm font-medium transition-all">
        <Download className="w-4 h-4" /> Export ▼
      </button>
      
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-md shadow-xl z-50 overflow-hidden">
          <div className="py-1">
            <button onClick={() => { onCsv(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white flex items-center gap-2 transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-green-400" /> Export as CSV
            </button>
            <button onClick={() => { onPdf(); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white flex items-center gap-2 transition-colors">
              <FileText className="w-4 h-4 text-red-400" /> Export as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overdue helper ────────────────────────────────────────────────────────────
const isOverdue = (dueDate: string, status: string) =>
  status === "Open" && new Date(dueDate) < new Date();

// ──────────────────────────────────────────────────────────────────────────────
// INNER PAGE
// ──────────────────────────────────────────────────────────────────────────────
function GovernancePageInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [mainTab, setMainTab] = useState<"policies" | "acknowledgements" | "audits" | "compliance">(
    tabParam === "acknowledgements" ? "acknowledgements"
    : tabParam === "audits"         ? "audits"
    : tabParam === "compliance"     ? "compliance"
    : "policies"
  );

  useEffect(() => {
    if (tabParam === "acknowledgements") setMainTab("acknowledgements");
    else if (tabParam === "audits") setMainTab("audits");
    else if (tabParam === "compliance") setMainTab("compliance");
    else setMainTab("policies");
  }, [tabParam]);

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

  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString("en-GB").replace(/\//g, "-") : "—";

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

  // ── Export CSV/PDF (audit) ──
  const exportAuditsCsv = () => {
    const headers = ["Title", "Department", "Auditor", "Date", "Findings", "Status"];
    const rows = audits.map(a => [a.title, a.dept?.name ?? "", a.auditor,
      fmt(a.date), a.findings ?? "", a.status]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "audits.csv"; link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported audits.csv");
  };

  const exportAuditsPdf = () => {
    const doc = new jsPDF();
    doc.text("Audits Report", 14, 15);
    autoTable(doc, {
      head: [["Title", "Department", "Auditor", "Date", "Status"]],
      body: audits.map(a => [a.title, a.dept?.name ?? "", a.auditor, fmt(a.date), a.status]),
      startY: 20
    });
    doc.save("audits.pdf");
    toast.success("Exported audits.pdf");
  };

  // ── Export CSV/PDF (policies) ──
  const exportPoliciesCsv = () => {
    const headers = ["Title", "Version", "Effective Date", "Department", "Status", "Acknowledgements"];
    const rows = policies.map(p => [p.title, p.version, fmt(p.effectiveDate),
      p.dept?.name ?? "Global", p.status, String(p.acknowledgements?.length ?? 0)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "policies.csv"; link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported policies.csv");
  };

  const exportPoliciesPdf = () => {
    const doc = new jsPDF();
    doc.text("Policies Report", 14, 15);
    autoTable(doc, {
      head: [["Title", "Version", "Effective Date", "Department", "Status"]],
      body: policies.map(p => [p.title, p.version, fmt(p.effectiveDate), p.dept?.name ?? "Global", p.status]),
      startY: 20
    });
    doc.save("policies.pdf");
    toast.success("Exported policies.pdf");
  };

  const overdueCount = issues.filter(i => isOverdue(i.dueDate, i.status)).length;

  const TABS = [
    { key: "policies",         label: "Policies" },
    { key: "acknowledgements", label: "Policy Acknowledgements" },
    { key: "audits",           label: "Audits" },
    { key: "compliance",       label: "Compliance Issues" },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ── Page Title ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#3B82F6] tracking-tight">
          ④ Governance: Policies, Audits &amp; Compliance
        </h1>
      </div>

      {/* ── Full-width Tab Bar ── */}
      <div className="flex w-full border border-[#2A2A2A] rounded-lg overflow-hidden mb-5">
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-all duration-150 ${
              i < TABS.length - 1 ? "border-r border-[#2A2A2A]" : ""
            } ${
              mainTab === tab.key
                ? "bg-[#1A1A1A] text-[#3B82F6]"
                : "bg-[#0D0D0D] text-[#9CA3AF] hover:text-white hover:bg-[#111111]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: POLICIES
      ══════════════════════════════════════════════════════ */}
      {mainTab === "policies" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center gap-2">
            <button onClick={openNewPolicy}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 px-4 py-2 rounded-md text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> New Policy
            </button>
            <ExportMenu onCsv={exportPoliciesCsv} onPdf={exportPoliciesPdf} />
          </div>

          {/* Policies table */}
          <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Version</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Effective Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Acks</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[#9CA3AF]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                {policies.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-[#9CA3AF] text-xs">No policies found.</td></tr>
                ) : policies.map(p => (
                  <tr key={p.id} className="hover:bg-[#111111] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white text-sm">{p.title}</div>
                      {p.description && <div className="text-xs text-[#6B7280] mt-0.5 truncate max-w-[200px]">{p.description}</div>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#9CA3AF]">{p.version}</td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{fmt(p.effectiveDate)}</td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{p.dept?.name ?? <span className="italic opacity-50">Global</span>}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[#3B82F6] font-bold text-sm">{p.acknowledgements?.length ?? 0}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusPill label={p.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditPolicy(p)} title="Edit"
                          className="p-1 rounded hover:bg-[#2A2A2A] text-[#6B7280] hover:text-white transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ConfirmDelete onConfirm={() => deletePolicy(p.id)} label="Policy" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Policy Acknowledgement summary inline */}
          <div>
            <p className="text-xs font-semibold text-white mb-2">
              Policy Acknowledgements — employee sign-offs tracked per policy
            </p>
            <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Policy</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Acknowledged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                  {acks.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-6 text-center text-[#9CA3AF] text-xs">No acknowledgements yet.</td></tr>
                  ) : acks.map(a => (
                    <tr key={a.id} className="hover:bg-[#111111] transition-colors">
                      <td className="px-5 py-3 font-medium text-white text-xs">{a.employeeName}</td>
                      <td className="px-5 py-3 text-[#9CA3AF] text-xs">{a.policy?.title ?? "—"}</td>
                      <td className="px-5 py-3 text-[#9CA3AF] text-xs">{fmt(a.acknowledgedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: POLICY ACKNOWLEDGEMENTS
      ══════════════════════════════════════════════════════ */}
      {mainTab === "acknowledgements" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Policy Acknowledgements</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Track which employees have acknowledged each active policy</p>
            </div>
            <button onClick={() => { setAckForm(EMPTY_ACK); setAckOpen(true); }}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 px-4 py-2 rounded-md text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> New Acknowledgement
            </button>
          </div>

          {/* Per-policy summary cards */}
          {policies.filter(p => p.status === "Active").length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {policies.filter(p => p.status === "Active").slice(0, 3).map(p => {
                const policyAcks = acks.filter(a => a.policyId === p.id);
                return (
                  <div key={p.id} className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4">
                    <p className="text-xs font-medium text-white truncate">{p.title}</p>
                    <p className="text-2xl font-bold text-[#3B82F6] mt-2">{policyAcks.length}</p>
                    <p className="text-xs text-[#9CA3AF]">acknowledgements</p>
                    <div className="mt-2 w-full bg-[#2A2A2A] rounded-full h-1">
                      <div className="bg-[#3B82F6] h-1 rounded-full"
                        style={{ width: `${Math.min(100, policyAcks.length * 10)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ack table */}
          <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Employee</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Policy</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Acknowledged At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                {acks.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-[#9CA3AF] text-xs">No acknowledgements recorded yet.</td></tr>
                ) : acks.map(a => (
                  <tr key={a.id} className="hover:bg-[#111111] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white text-sm">{a.employeeName}</td>
                    <td className="px-5 py-3.5 text-[#9CA3AF] text-xs">{a.policy?.title ?? "—"}</td>
                    <td className="px-5 py-3.5 text-[#9CA3AF] text-xs">{fmt(a.acknowledgedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: AUDITS  (matches reference image)
      ══════════════════════════════════════════════════════ */}
      {mainTab === "audits" && (
        <div className="space-y-5">
          {/* Action bar */}
          <div className="flex items-center gap-2">
            <button onClick={openNewAudit}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 px-4 py-2 rounded-md text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> New Audit
            </button>
            <ExportMenu onCsv={exportAuditsCsv} onPdf={exportAuditsPdf} />
          </div>

          {/* Audits table */}
          <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Auditor</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Findings</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[#9CA3AF]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                {audits.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-[#9CA3AF] text-xs">No audits found.</td></tr>
                ) : audits.map(a => (
                  <tr key={a.id} className="hover:bg-[#111111] transition-colors group">
                    <td className="px-5 py-3.5 font-medium text-white text-sm">{a.title}</td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{a.dept?.name}</td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{a.auditor}</td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{fmt(a.date)}</td>
                    <td className="px-5 py-3.5 text-xs text-[#9CA3AF] max-w-[180px]">
                      {a.findings
                        ? <span title={a.findings} className="truncate block">{a.findings.slice(0, 40)}{a.findings.length > 40 ? "…" : ""}</span>
                        : <span className="italic opacity-40">None</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusPill label={a.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditAudit(a)} title="Edit"
                          className="p-1 rounded hover:bg-[#2A2A2A] text-[#6B7280] hover:text-white transition">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <ConfirmDelete onConfirm={() => deleteAudit(a.id)} label="Audit" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Embedded Compliance Issues (matches image) ── */}
          <div>
            <p className="text-xs font-semibold text-white mb-2">
              Compliance Issues raised from Audits — severity-tagged, resolution tracked
            </p>
            <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Issue</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Severity</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Department</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-[#9CA3AF]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                  {issues.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-6 text-center text-[#9CA3AF] text-xs">No compliance issues logged.</td></tr>
                  ) : issues.map(i => {
                    const overdue = isOverdue(i.dueDate, i.status);
                    return (
                      <tr key={i.id} className={`transition-colors ${overdue ? "bg-red-950/10 hover:bg-red-950/20" : "hover:bg-[#111111]"}`}>
                        <td className="px-5 py-3 text-white text-xs font-medium max-w-[220px]">
                          <span title={i.description} className="block truncate">
                            {i.description.slice(0, 50)}{i.description.length > 50 ? "…" : ""}
                          </span>
                        </td>
                        <td className="px-5 py-3"><StatusPill label={i.severity} /></td>
                        <td className="px-5 py-3 text-[#9CA3AF] text-xs">{i.audit?.dept?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <StatusPill label={i.status} />
                            {overdue && (
                              <span className="text-[10px] text-red-400 font-bold animate-pulse">⚠ Overdue</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {i.status !== "Resolved" && (
                            <button onClick={() => resolveIssue(i.id)}
                              className="text-xs text-green-400 hover:text-green-300 font-medium transition">
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: COMPLIANCE ISSUES (full view)
      ══════════════════════════════════════════════════════ */}
      {mainTab === "compliance" && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Compliance Issues</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                All issues linked to audits — track owners, due dates, and resolutions
                {overdueCount > 0 && (
                  <span className="ml-2 text-red-400 font-semibold">⚠ {overdueCount} overdue</span>
                )}
              </p>
            </div>
            <button onClick={() => { setIssueForm(EMPTY_ISS); setIssueErrors({}); setIssueOpen(true); }}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-[#3B82F6]/50 text-[#3B82F6] hover:bg-[#3B82F6]/10 px-4 py-2 rounded-md text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Log Issue
            </button>
          </div>

          {/* Full compliance table */}
          <div className="border border-[#2A2A2A] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0D0D0D] border-b border-[#2A2A2A]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Issue</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Severity</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Owner</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Due Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[#9CA3AF]">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[#9CA3AF]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E1E] bg-[#0D0D0D]">
                {issues.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-[#9CA3AF] text-xs">No compliance issues logged.</td></tr>
                ) : issues.map(i => {
                  const overdue = isOverdue(i.dueDate, i.status);
                  return (
                    <tr key={i.id} className={`transition-colors ${overdue ? "bg-red-950/10 hover:bg-red-950/20" : "hover:bg-[#111111]"}`}>
                      <td className="px-5 py-3.5 text-white text-xs font-medium max-w-[200px]">
                        <span title={i.description} className="block truncate">
                          {i.description.slice(0, 50)}{i.description.length > 50 ? "…" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusPill label={i.severity} /></td>
                      <td className="px-5 py-3.5 text-[#9CA3AF] text-xs">{i.audit?.dept?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 text-[#9CA3AF] text-xs">{i.owner}</td>
                      <td className="px-5 py-3.5 text-[#9CA3AF] text-xs">{fmt(i.dueDate)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusPill label={i.status} />
                          {overdue && (
                            <span className="text-[10px] text-red-400 font-bold border border-red-800/50 px-1.5 py-0.5 rounded animate-pulse">
                              ⚠ Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {i.status !== "Resolved" && (
                          <button onClick={() => resolveIssue(i.id)}
                            className="flex items-center gap-1 ml-auto bg-green-900/20 hover:bg-green-900/40 text-green-400 text-xs px-3 py-1.5 rounded font-medium transition">
                            <CheckCircle className="w-3 h-3" /> Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition">
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
              <input required value={auditForm.title} onChange={e => setAuditForm({ ...auditForm, title: e.target.value })} className={INPUT} placeholder="Q2 Waste Audit" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Auditor *</label>
                <input required value={auditForm.auditor} onChange={e => setAuditForm({ ...auditForm, auditor: e.target.value })} className={INPUT} placeholder="S. Nair" />
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
              <textarea rows={2} value={auditForm.findings} onChange={e => setAuditForm({ ...auditForm, findings: e.target.value })} className={INPUT} placeholder="e.g. 3 minor issues…" />
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <button type="button" className="flex-1 border border-[#2A2A2A] rounded-lg py-2 text-sm text-[#9CA3AF] hover:text-white transition">Cancel</button>
              </DialogClose>
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition">
                {editAudit ? "Save Changes" : "Schedule Audit"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compliance Issue Modal */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="!bg-[#1A1A1A] !border-[#2A2A2A] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Log Compliance Issue</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitIssue} className="space-y-4 mt-2">
            <div>
              <label className={LABEL}>Description *</label>
              <textarea required rows={3} value={issueForm.description} onChange={e => setIssueForm({ ...issueForm, description: e.target.value })} className={INPUT} placeholder="e.g. Missing MSDS sheets" />
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
              <button type="submit" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg py-2 text-sm font-medium transition">
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
