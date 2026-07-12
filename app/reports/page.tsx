"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  BarChart2,
  FileText,
  Loader2,
  ArrowUpRight,
  TrendingDown,
  Globe,
  Settings,
  Download,
  FileSpreadsheet
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

function ReportsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") || "summary";

  const [activeTab, setActiveTab] = useState(tabParam);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  // --- Custom Builder State ---
  const [running, setRunning] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    // Fetch filter options
    fetch("/api/departments").then(r => r.json()).then(d => { if(Array.isArray(d)) setDepartments(d) }).catch(()=>{});
    fetch("/api/categories").then(r => r.json()).then(d => { if(Array.isArray(d)) setCategories(d) }).catch(()=>{});
  }, []);

  const handleRunCustomReport = async () => {
    setRunning(true);
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (selectedDept) params.append("deptId", selectedDept);
    if (selectedModule) params.append("module", selectedModule);
    if (employeeName) params.append("employeeName", employeeName);
    if (selectedCategory) params.append("categoryId", selectedCategory);

    try {
      const res = await fetch(`/api/reports/custom?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data);
        toast.success(`Loaded ${data.length} records`);
      } else {
        toast.error("Failed to compile custom report");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setRunning(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) return toast.warning("No data");
    const csv = Papa.unparse(results.map(r => ({
      Date: new Date(r.date).toLocaleDateString(),
      Module: r.module,
      Department: r.departmentName,
      Title: r.title,
      Details: r.details,
      Status: r.status
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "custom-report.csv";
    link.click();
    toast.success("CSV exported");
  };

  const handleExportExcel = () => {
    if (results.length === 0) return toast.warning("No data");
    const csv = Papa.unparse(results.map(r => ({
      Date: new Date(r.date).toLocaleDateString(),
      Module: r.module,
      Department: r.departmentName,
      Title: r.title,
      Details: r.details,
      Status: r.status
    })));
    const blob = new Blob([csv], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "custom-report.xlsx";
    link.click();
    toast.success("Excel generated");
  };

  const handleExportCustomPDF = async () => {
    if (results.length === 0) return toast.warning("No data");
    setLoadingReport("customPDF");
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      doc.setFillColor(13, 13, 13); doc.rect(0, 0, 210, 35, "F");
      doc.setFillColor(6, 182, 212); doc.rect(0, 33, 210, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
      doc.text("ECOSPHERE CUSTOM REPORT", 15, 20);
      doc.setFontSize(8); doc.setTextColor(156, 163, 175); doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()} | Total Items: ${results.length}`, 15, 28);

      let y = 45;
      doc.setFillColor(26, 26, 26); doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Date", 17, y + 5); doc.text("Module", 35, y + 5); doc.text("Department", 62, y + 5);
      doc.text("Event Title", 95, y + 5); doc.text("Value / Status", 160, y + 5);
      y += 8;

      doc.setFont("helvetica", "normal");
      results.forEach(row => {
        if (y > 270) {
          doc.addPage();
          doc.setFillColor(13, 13, 13); doc.rect(0, 0, 210, 20, "F");
          doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.text("REPORT CONTINUED", 15, 12);
          y = 30;
          doc.setFillColor(26, 26, 26); doc.rect(15, y, 180, 8, "F");
          doc.setFontSize(8); doc.setFont("helvetica", "bold");
          doc.text("Date", 17, y + 5); doc.text("Module", 35, y + 5); doc.text("Department", 62, y + 5);
          doc.text("Event Title", 95, y + 5); doc.text("Value / Status", 160, y + 5);
          y += 8; doc.setFont("helvetica", "normal");
        }
        doc.setTextColor(200, 200, 200); doc.rect(15, y, 180, 0.2, "F");
        doc.setTextColor(0, 0, 0); doc.setFontSize(7.5);
        doc.text(new Date(row.date).toLocaleDateString(), 17, y + 5);
        doc.text(row.module, 35, y + 5);
        doc.text(row.departmentName.slice(0, 15), 62, y + 5);
        doc.text(row.title.slice(0, 36), 95, y + 5);
        doc.text(row.status.slice(0, 20), 160, y + 5);
        y += 8;
      });
      doc.save("custom-report.pdf");
      toast.success("PDF generated");
    } catch (e) {
      toast.error("Failed to generate PDF");
    } finally {
      setLoadingReport(null);
    }
  };

  const tabs = [
    { name: "Environmental", value: "environmental" },
    { name: "Social", value: "social" },
    { name: "Governance", value: "governance" },
    { name: "ESG Summary", value: "summary" },
    { name: "Custom Builder", value: "custom" },
  ];

  const drawHeader = (doc: any, title: string) => {
    // Premium Dark Theme Header Bar
    doc.setFillColor(13, 13, 13); // #0D0D0D
    doc.rect(0, 0, 210, 40, "F");

    // Green Accent bar
    doc.setFillColor(34, 197, 94); // #22C55E
    doc.rect(0, 38, 210, 2, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ECOSPHERE", 15, 22);

    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175); // #9CA3AF
    doc.setFont("helvetica", "normal");
    doc.text("ESG COMPLIANCE & PERFORMANCE SYSTEM", 15, 30);

    // Report Type Title on Right
    doc.setTextColor(6, 182, 212); // #06B6D4 (Cyan)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 195, 24, { align: "right" });

    // Date
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 30, { align: "right" });

    // Page margin start
    return 55;
  };

  const drawFooter = (doc: any, pageNumber: number) => {
    doc.setFillColor(42, 42, 42); // #2A2A2A border line
    doc.rect(15, 280, 180, 0.5, "F");

    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("CONFIDENTIAL - FOR INTERNAL AUDIT PURPOSES ONLY", 15, 287);
    doc.text(`Page ${pageNumber}`, 195, 287, { align: "right" });
  };

  // 1. Environmental Report
  const generateEnvironmentalReport = async () => {
    setLoadingReport("environmental");
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      // Fetch Data
      const resTxns = await fetch("/api/environmental/carbon-transactions"); // Person 2 route
      const txns = resTxns.ok ? await resTxns.json() : [];

      const resGoals = await fetch("/api/environmental/goals"); // Person 2 route
      const goals = resGoals.ok ? await resGoals.json() : [];

      let y = drawHeader(doc, "Environmental Report");

      // Section 1: Summary Stats
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(26, 26, 26); // #1A1A1A
      doc.rect(15, y, 180, 25, "F");

      doc.setTextColor(6, 182, 212); // Cyan
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CARBON EMISSIONS LOGGED", 25, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${txns.length} Transactions`, 25, y + 18);

      doc.setTextColor(34, 197, 94); // Green
      doc.setFontSize(10);
      doc.text("ACTIVE COMPLIANCE GOALS", 115, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${goals.length} Goals Registered`, 115, y + 18);

      y += 40;

      // Section 2: Goals Progress Table
      doc.setTextColor(34, 197, 94); // Green Header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Department Goals Progress", 15, y);
      y += 8;

      // Table Header
      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Goal Name", 20, y + 5);
      doc.text("Dept", 75, y + 5);
      doc.text("Target CO2 (kg)", 110, y + 5);
      doc.text("Current CO2 (kg)", 145, y + 5);
      doc.text("Status", 180, y + 5);
      y += 8;

      doc.setTextColor(50, 50, 50);
      if (goals.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.text("No active goals registered in database.", 20, y + 6);
        y += 12;
      } else {
        doc.setFont("helvetica", "normal");
        goals.forEach((g: any) => {
          doc.setTextColor(100, 100, 100);
          doc.rect(15, y, 180, 0.2, "F"); // Row divider

          doc.setTextColor(0, 0, 0);
          doc.text(g.name, 20, y + 6);
          doc.text(g.dept?.name || "N/A", 75, y + 6);
          doc.text(String(g.targetCo2), 110, y + 6);
          doc.text(String(g.currentCo2), 145, y + 6);
          doc.text(g.status, 180, y + 6);
          y += 10;
        });
      }

      y += 10;

      // Section 3: Recent Transactions
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Recent Carbon Log Transactions", 15, y);
      y += 8;

      // Table Header
      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Source", 20, y + 5);
      doc.text("Dept", 65, y + 5);
      doc.text("Qty", 105, y + 5);
      doc.text("CO2 Footprint (kg)", 135, y + 5);
      doc.text("Date", 175, y + 5);
      y += 8;

      if (txns.length === 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "italic");
        doc.text("No recent carbon transactions logged.", 20, y + 6);
        y += 12;
      } else {
        doc.setFont("helvetica", "normal");
        txns.slice(0, 10).forEach((t: any) => {
          doc.setTextColor(200, 200, 200);
          doc.rect(15, y, 180, 0.2, "F");

          doc.setTextColor(0, 0, 0);
          doc.text(t.source, 20, y + 6);
          doc.text(t.dept?.name || "N/A", 65, y + 6);
          doc.text(String(t.quantity), 105, y + 6);
          doc.text(String(t.co2Amount), 135, y + 6);
          doc.text(new Date(t.transactionDate || t.createdAt).toLocaleDateString(), 175, y + 6);
          y += 10;
        });
      }

      drawFooter(doc, 1);
      doc.save("environmental-report.pdf");
      toast.success("Environmental PDF generated successfully!");
    } catch (e) {
      toast.error("Failed to compile Environmental report PDF.");
    } finally {
      setLoadingReport(null);
    }
  };

  // 2. Social Report
  const generateSocialReport = async () => {
    setLoadingReport("social");
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      // Fetch CSR Activities and participation
      const resActs = await fetch("/api/social/activities"); // Person 3 route
      const activities = resActs.ok ? await resActs.json() : [];

      const resParts = await fetch("/api/social/participation"); // Person 3 route
      const participations = resParts.ok ? await resParts.json() : [];

      let y = drawHeader(doc, "Social (CSR) Report");

      // Stats
      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 25, "F");
      doc.setTextColor(249, 115, 22); // Orange
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("CSR INITIATIVES LOGGED", 25, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${activities.length} Activities`, 25, y + 18);

      doc.setTextColor(168, 85, 247); // Purple
      doc.text("EMPLOYEE CSR PARTICIPATIONS", 115, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${participations.length} Submissions`, 115, y + 18);

      y += 40;

      // CSR Table
      doc.setTextColor(249, 115, 22); // Orange
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Active CSR Initiatives List", 15, y);
      y += 8;

      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Activity Title", 20, y + 5);
      doc.text("Category", 80, y + 5);
      doc.text("Department", 120, y + 5);
      doc.text("Date", 160, y + 5);
      doc.text("Status", 185, y + 5);
      y += 8;

      if (activities.length === 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "italic");
        doc.text("No CSR Activities logged in database.", 20, y + 6);
        y += 12;
      } else {
        doc.setFont("helvetica", "normal");
        activities.forEach((act: any) => {
          doc.setTextColor(200, 200, 200);
          doc.rect(15, y, 180, 0.2, "F");

          doc.setTextColor(0, 0, 0);
          doc.text(act.title, 20, y + 6);
          doc.text(act.category?.name || "CSR Activity", 80, y + 6);
          doc.text(act.dept?.name || "N/A", 120, y + 6);
          doc.text(new Date(act.date).toLocaleDateString(), 160, y + 6);
          doc.text(act.open ? "Open" : "Closed", 185, y + 6);
          y += 10;
        });
      }

      drawFooter(doc, 1);
      doc.save("social-report.pdf");
      toast.success("Social PDF generated successfully!");
    } catch (e) {
      toast.error("Failed to compile Social report PDF.");
    } finally {
      setLoadingReport(null);
    }
  };

  // 3. Governance Report
  const generateGovernanceReport = async () => {
    setLoadingReport("governance");
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      // Fetch Audits and compliance issues
      const resAudits = await fetch("/api/governance/audits"); // Person 3 route
      const audits = resAudits.ok ? await resAudits.json() : [];

      const resComp = await fetch("/api/governance/compliance"); // Person 3 route
      const compliance = resComp.ok ? await resComp.json() : [];

      let y = drawHeader(doc, "Governance Report");

      // Stats
      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 25, "F");
      doc.setTextColor(59, 130, 246); // Blue
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("REGISTERED COMPLIANCE AUDITS", 25, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${audits.length} Audits Completed`, 25, y + 18);

      doc.setTextColor(239, 68, 68); // Red
      doc.text("OPEN COMPLIANCE VIOLATIONS", 115, y + 10);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`${compliance.filter((c: any) => c.status === "Open").length} Active Issues`, 115, y + 18);

      y += 40;

      // Audits Table
      doc.setTextColor(59, 130, 246); // Blue
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Compliance Audits Log", 15, y);
      y += 8;

      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Audit Title", 20, y + 5);
      doc.text("Department", 70, y + 5);
      doc.text("Auditor", 110, y + 5);
      doc.text("Audit Date", 145, y + 5);
      doc.text("Status", 180, y + 5);
      y += 8;

      if (audits.length === 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "italic");
        doc.text("No compliance audits logged in database.", 20, y + 6);
        y += 12;
      } else {
        doc.setFont("helvetica", "normal");
        audits.forEach((a: any) => {
          doc.setTextColor(200, 200, 200);
          doc.rect(15, y, 180, 0.2, "F");

          doc.setTextColor(0, 0, 0);
          doc.text(a.title, 20, y + 6);
          doc.text(a.dept?.name || "N/A", 70, y + 6);
          doc.text(a.auditor, 110, y + 6);
          doc.text(new Date(a.date).toLocaleDateString(), 145, y + 6);
          doc.text(a.status, 180, y + 6);
          y += 10;
        });
      }

      y += 10;

      // Open Issues Table
      doc.setTextColor(239, 68, 68); // Red
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Active Compliance & Severity Issues", 15, y);
      y += 8;

      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Description", 20, y + 5);
      doc.text("Severity", 80, y + 5);
      doc.text("Responsible Owner", 115, y + 5);
      doc.text("Due Date", 155, y + 5);
      doc.text("Status", 185, y + 5);
      y += 8;

      const openIssues = compliance.filter((c: any) => c.status === "Open");
      if (openIssues.length === 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "italic");
        doc.text("All compliance issues fully resolved. Good standing status.", 20, y + 6);
        y += 12;
      } else {
        doc.setFont("helvetica", "normal");
        openIssues.forEach((issue: any) => {
          doc.setTextColor(200, 200, 200);
          doc.rect(15, y, 180, 0.2, "F");

          doc.setTextColor(0, 0, 0);
          doc.text(issue.description, 20, y + 6);
          doc.text(issue.severity, 80, y + 6);
          doc.text(issue.owner, 115, y + 6);
          doc.text(new Date(issue.dueDate).toLocaleDateString(), 155, y + 6);
          doc.text(issue.status, 185, y + 6);
          y += 10;
        });
      }

      drawFooter(doc, 1);
      doc.save("governance-report.pdf");
      toast.success("Governance PDF generated successfully!");
    } catch (e) {
      toast.error("Failed to compile Governance report PDF.");
    } finally {
      setLoadingReport(null);
    }
  };

  // 4. ESG Summary Report
  const generateEsgSummaryReport = async () => {
    setLoadingReport("summary");
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();

      // Fetch Scores
      const resScores = await fetch("/api/scores");
      const scores = resScores.ok ? await resScores.json() : { overallScore: 0, envScore: 0, socialScore: 0, govScore: 0, departmentScores: [] };

      let y = drawHeader(doc, "ESG Performance Summary");

      // Big overall index score card
      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 45, "F");

      doc.setTextColor(168, 85, 247); // Purple
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("OVERALL CORPORATE ESG STATUS INDEX", 25, y + 12);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text(`${scores.overallScore}/100`, 25, y + 25);

      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text("Weighted ESG aggregate index across corporate operations", 25, y + 34);

      // Pillar scores column block
      doc.setFillColor(42, 42, 42); // #2A2A2A divider line
      doc.rect(105, y + 5, 0.5, 35, "F");

      doc.setTextColor(34, 197, 94); // Green
      doc.setFontSize(10);
      doc.text(`Environmental Pillar: ${scores.envScore}/100`, 115, y + 12);

      doc.setTextColor(249, 115, 22); // Orange
      doc.text(`Social Pillar: ${scores.socialScore}/100`, 115, y + 22);

      doc.setTextColor(59, 130, 246); // Blue
      doc.text(`Governance Pillar: ${scores.govScore}/100`, 115, y + 32);

      y += 60;

      // Scores by Department
      doc.setTextColor(168, 85, 247); // Purple Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Department Score Breakdown", 15, y);
      y += 8;

      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("Department Name", 20, y + 5);
      doc.text("Environmental Score", 75, y + 5);
      doc.text("Social Score", 115, y + 5);
      doc.text("Governance Score", 150, y + 5);
      doc.text("Total Weighted Score", 180, y + 5, { align: "right" });
      y += 8;

      if (!scores.departmentScores || scores.departmentScores.length === 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "italic");
        doc.text("No departmental score records found. Seed database settings.", 20, y + 6);
        y += 12;
      } else {
        doc.setFont("helvetica", "normal");
        scores.departmentScores.forEach((ds: any) => {
          doc.setTextColor(200, 200, 200);
          doc.rect(15, y, 180, 0.2, "F");

          doc.setTextColor(0, 0, 0);
          doc.text(ds.deptName, 20, y + 6);
          doc.text(`${ds.environmentalScore || 0}/100`, 75, y + 6);
          doc.text(`${ds.socialScore || 0}/100`, 115, y + 6);
          doc.text(`${ds.governanceScore || 0}/100`, 150, y + 6);
          doc.setFont("helvetica", "bold");
          doc.text(`${ds.totalScore || 0}/100`, 195, y + 6, { align: "right" });
          doc.setFont("helvetica", "normal");
          y += 10;
        });
      }

      drawFooter(doc, 1);
      doc.save("esg-summary.pdf");
      toast.success("ESG Summary PDF generated successfully!");
    } catch (e) {
      toast.error("Failed to compile ESG Summary report PDF.");
    } finally {
      setLoadingReport(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Horizontal Tabs Bar */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent">
        <div className="flex items-center gap-2 bg-[#141414] border border-[#262626] p-1 rounded-xl min-w-max">
          {tabs.map((t) => {
            const isActive = activeTab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setActiveTab(t.value);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("tab", t.value);
                  router.push(`?${params.toString()}`, { scroll: false });
                }}
                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-[#2A2A2A] text-white"
                    : "text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-[#06B6D4]" /> Reports Repository
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Generate and export verified ESG documentation tables in PDF format.
          </p>
        </div>
      </div>

      {/* Report Cards / Custom Builder */}
      {activeTab === "custom" ? (
        <div className="space-y-8">
          {/* Custom Report Builder: Filters */}
          <Card className="bg-[#141414] border-[#2A2A2A] rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#9CA3AF]" /> Custom Report Builder: Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]"
                />
                <select 
                  value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]">
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select 
                  value={selectedModule} onChange={e => setSelectedModule(e.target.value)}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]">
                  <option value="">All Modules</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Social">Social</option>
                  <option value="Governance">Governance</option>
                  <option value="Gamification">Gamification</option>
                </select>
                <input
                  type="text"
                  placeholder="Employee Name"
                  value={employeeName}
                  onChange={e => setEmployeeName(e.target.value)}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4] max-w-[150px]"
                />
                <select 
                  value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-[#0D0D0D] border border-[#2A2A2A] text-[#9CA3AF] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#06B6D4]">
                  <option value="">All ESG Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button 
                  onClick={handleRunCustomReport} disabled={running}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white border-b-[4px] border-b-transparent"></span>}
                  Run Report
                </Button>
                <Button onClick={handleExportCustomPDF} disabled={results.length === 0 || loadingReport === "customPDF"} variant="outline" className="bg-[#0D0D0D] border-[#2A2A2A] hover:bg-[#1A1A1A] hover:text-white text-[#9CA3AF] text-sm px-4 py-1.5 rounded-lg">
                  {loadingReport === "customPDF" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />} Export: PDF
                </Button>
                <Button onClick={handleExportExcel} disabled={results.length === 0} variant="outline" className="bg-[#0D0D0D] border-[#2A2A2A] hover:bg-[#1A1A1A] hover:text-white text-[#9CA3AF] text-sm px-4 py-1.5 rounded-lg">
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Export: Excel
                </Button>
                <Button onClick={handleExportCSV} disabled={results.length === 0} variant="outline" className="bg-[#0D0D0D] border-[#2A2A2A] hover:bg-[#1A1A1A] hover:text-white text-[#9CA3AF] text-sm px-4 py-1.5 rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export: CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-xl">
            <CardHeader className="border-b border-[#2A2A2A]/50 pb-4">
              <CardTitle className="text-white text-lg">Query Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
                  <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                    <TableHead className="text-white font-medium">Date</TableHead>
                    <TableHead className="text-white font-medium">Module</TableHead>
                    <TableHead className="text-white font-medium">Department</TableHead>
                    <TableHead className="text-white font-medium">Event Title</TableHead>
                    <TableHead className="text-white font-medium">Details</TableHead>
                    <TableHead className="text-white font-medium text-right">Value/Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-[#9CA3AF]">
                        No search results found. Choose filters above and click Run Report.
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((row) => (
                      <TableRow key={row.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#06B6D4]/5">
                        <TableCell className="font-mono text-xs text-[#9CA3AF]">{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={
                            row.module === "Environmental" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            row.module === "Social" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                            row.module === "Governance" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          }>
                            {row.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-white">{row.departmentName}</TableCell>
                        <TableCell className="text-white font-medium text-xs max-w-xs truncate">{row.title}</TableCell>
                        <TableCell className="text-[#9CA3AF] text-xs max-w-md truncate">{row.details}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-white text-xs">{row.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeTab === "environmental" && (
            <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl hover:border-[#22C55E]/30 transition-colors shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#22C55E]" /> Environmental (Pillar E) Report
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Export carbon transactions footprint data and active department emissions progress targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex justify-between items-center">
            <span className="text-xs text-[#9CA3AF] font-mono">Format: PDF</span>
            <Button
              onClick={generateEnvironmentalReport}
              disabled={loadingReport !== null}
              className="bg-[#22C55E]/10 hover:bg-[#22C55E] text-[#22C55E] hover:text-black border border-[#22C55E]/30 font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {loadingReport === "environmental" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate PDF
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Card 2: Social */}
        {activeTab === "social" && (
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl hover:border-[#F97316]/30 transition-colors shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#F97316]" /> Social (Pillar S) Report
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Generate employee participation totals and community CSR initiative list summaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex justify-between items-center">
            <span className="text-xs text-[#9CA3AF] font-mono">Format: PDF</span>
            <Button
              onClick={generateSocialReport}
              disabled={loadingReport !== null}
              className="bg-[#F97316]/10 hover:bg-[#F97316] text-[#F97316] hover:text-black border border-[#F97316]/30 font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {loadingReport === "social" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate PDF
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Card 3: Governance */}
        {activeTab === "governance" && (
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl hover:border-[#3B82F6]/30 transition-colors shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#3B82F6]" /> Governance (Pillar G) Report
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Export compliance audits lists and highlight active compliance due-date issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex justify-between items-center">
            <span className="text-xs text-[#9CA3AF] font-mono">Format: PDF</span>
            <Button
              onClick={generateGovernanceReport}
              disabled={loadingReport !== null}
              className="bg-[#3B82F6]/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-black border border-[#3B82F6]/30 font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {loadingReport === "governance" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate PDF
            </Button>
          </CardContent>
        </Card>
        )}

        {/* Card 4: ESG Summary */}
        {activeTab === "summary" && (
        <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl hover:border-[#A855F7]/30 transition-colors shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#A855F7]" /> ESG Index Summary Report
            </CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Distribute departmental ESG rating scores and overall corporate ESG indexes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex justify-between items-center">
            <span className="text-xs text-[#9CA3AF] font-mono">Format: PDF</span>
            <Button
              onClick={generateEsgSummaryReport}
              disabled={loadingReport !== null}
              className="bg-[#A855F7]/10 hover:bg-[#A855F7] text-[#A855F7] hover:text-black border border-[#A855F7]/30 font-semibold rounded-xl px-5 py-2.5 transition-colors"
            >
              {loadingReport === "summary" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Generate PDF
            </Button>
          </CardContent>
        </Card>
        )}
      </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading Reports...</div>}>
      <ReportsPageInner />
    </Suspense>
  );
}
