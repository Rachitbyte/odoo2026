"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  BarChart2,
  Calendar,
  Building,
  Layers,
  User,
  Tag,
  Search,
  Download,
  ArrowLeft,
  Loader2,
  FileSpreadsheet,
  FileText
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

interface Department {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface ReportRow {
  id: string;
  date: string;
  module: string;
  departmentName: string;
  title: string;
  details: string;
  status: string;
}

export default function CustomReportBuilder() {
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Filters Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Selected Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Results
  const [results, setResults] = useState<ReportRow[]>([]);

  useEffect(() => {
    // Fetch departments
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch(() => {});

    // Fetch categories
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleRunReport = async () => {
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
        toast.success(`Loaded ${data.length} records matching filters`);
      } else {
        toast.error("Failed to compile custom report");
      }
    } catch (e) {
      toast.error("Network error running report");
    } finally {
      setRunning(false);
    }
  };

  // EXPORT 1: CSV
  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.warning("No data to export.");
      return;
    }
    const csvData = results.map((r) => ({
      Date: new Date(r.date).toLocaleDateString(),
      Module: r.module,
      Department: r.departmentName,
      Title: r.title,
      Details: r.details,
      StatusValue: r.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ecosphere-custom-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  // EXPORT 2: EXCEL (renames CSV to .xlsx for demo blob)
  const handleExportExcel = () => {
    if (results.length === 0) {
      toast.warning("No data to export.");
      return;
    }
    const csvData = results.map((r) => ({
      Date: new Date(r.date).toLocaleDateString(),
      Module: r.module,
      Department: r.departmentName,
      Title: r.title,
      Details: r.details,
      StatusValue: r.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ecosphere-custom-report.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel (.xlsx) generated successfully (CSV format simulation)");
  };

  // EXPORT 3: PDF (jsPDF)
  const handleExportPDF = async () => {
    if (results.length === 0) {
      toast.warning("No data to export.");
      return;
    }
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Draw premium header
      doc.setFillColor(13, 13, 13);
      doc.rect(0, 0, 210, 35, "F");

      doc.setFillColor(6, 182, 212); // Cyan accent bar
      doc.rect(0, 33, 210, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("ECOSPHERE CUSTOM REPORT", 15, 20);

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()} | Total Items: ${results.length}`, 15, 28);

      let y = 45;

      // Table headers
      doc.setFillColor(26, 26, 26);
      doc.rect(15, y, 180, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Date", 17, y + 5);
      doc.text("Module", 35, y + 5);
      doc.text("Department", 62, y + 5);
      doc.text("Event Title", 95, y + 5);
      doc.text("Value / Status", 160, y + 5);
      y += 8;

      doc.setFont("helvetica", "normal");
      results.forEach((row, index) => {
        if (y > 270) {
          doc.addPage();
          // Draw header on new page
          doc.setFillColor(13, 13, 13);
          doc.rect(0, 0, 210, 20, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.text("ECOSPHERE CUSTOM REPORT CONTINUED", 15, 12);
          y = 30;

          // Table headers repeated
          doc.setFillColor(26, 26, 26);
          doc.rect(15, y, 180, 8, "F");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.text("Date", 17, y + 5);
          doc.text("Module", 35, y + 5);
          doc.text("Department", 62, y + 5);
          doc.text("Event Title", 95, y + 5);
          doc.text("Value / Status", 160, y + 5);
          y += 8;
          doc.setFont("helvetica", "normal");
        }

        doc.setTextColor(200, 200, 200);
        doc.rect(15, y, 180, 0.2, "F");

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7.5);
        doc.text(new Date(row.date).toLocaleDateString(), 17, y + 5);
        doc.text(row.module, 35, y + 5);
        doc.text(row.departmentName.slice(0, 15), 62, y + 5);
        doc.text(row.title.slice(0, 36), 95, y + 5);
        doc.text(row.status.slice(0, 20), 160, y + 5);
        y += 8;
      });

      doc.save("ecosphere-custom-report.pdf");
      toast.success("PDF generated successfully");
    } catch (e) {
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#2A2A2A] pb-6">
        <Link href="/reports">
          <Button variant="ghost" size="icon" className="text-[#9CA3AF] hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-[#06B6D4]" /> Custom Report Builder
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Build customized queries, filter records, and export reports dynamically.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-xl">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#06B6D4]" /> Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Module */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#06B6D4]" /> ESG Module
            </label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            >
              <option value="">All Modules</option>
              <option value="Environmental">Environmental</option>
              <option value="Social">Social</option>
              <option value="Governance">Governance</option>
              <option value="Gamification">Gamification</option>
            </select>
          </div>

          {/* Employee Name */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#06B6D4]" /> Employee Name
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Search Name..."
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#06B6D4]" /> ESG Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#06B6D4]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Run Button */}
          <div className="col-span-full flex justify-end mt-2">
            <Button
              onClick={handleRunReport}
              disabled={running}
              className="bg-[#06B6D4] hover:bg-[#0891b2] text-black font-semibold px-6 rounded-lg flex items-center gap-2"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Run Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Content */}
      <Card className="bg-[#1A1A1A] border-[#2A2A2A] rounded-xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#2A2A2A]/50 pb-4">
          <div>
            <CardTitle className="text-white text-lg">Query Results</CardTitle>
            <CardDescription className="text-[#9CA3AF]">
              Export results dynamically into multiple structured formats.
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={results.length === 0}
              onClick={handleExportCSV}
              className="border-[#2A2A2A] bg-transparent text-[#9CA3AF] hover:text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={results.length === 0}
              onClick={handleExportExcel}
              className="border-[#2A2A2A] bg-transparent text-[#9CA3AF] hover:text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={results.length === 0 || loading}
              onClick={handleExportPDF}
              className="border-[#2A2A2A] bg-transparent text-[#9CA3AF] hover:text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
              <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                <TableHead className="text-white font-medium">Date</TableHead>
                <TableHead className="text-white font-medium">Module</TableHead>
                <TableHead className="text-white font-medium">Department</TableHead>
                <TableHead className="text-white font-medium">Event Title</TableHead>
                <TableHead className="text-white font-medium">Telemetry Details</TableHead>
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
                  <TableRow
                    key={row.id}
                    className="border-b border-[#2A2A2A]/50 hover:bg-[#06B6D4]/5 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-[#9CA3AF]">
                      {new Date(row.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          row.module === "Environmental"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : row.module === "Social"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : row.module === "Governance"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }
                      >
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
    </div>
  );
}
