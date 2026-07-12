"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart2,
  FileText,
  Loader2,
  ArrowUpRight,
  TrendingDown,
  Globe,
  Settings
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

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
        <Link href="/reports/custom">
          <Button className="bg-[#06B6D4] hover:bg-[#0891b2] text-black font-semibold rounded-xl flex items-center gap-2">
            Custom Report Builder <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* 2x2 Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Environmental */}
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

        {/* Card 2: Social */}
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

        {/* Card 3: Governance */}
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

        {/* Card 4: ESG Summary */}
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
      </div>
    </div>
  );
}
