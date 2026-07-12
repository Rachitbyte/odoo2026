"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Settings,
  Bell,
  Database,
  Loader2,
  Check,
  AlertTriangle
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

interface Department {
  id: number;
  name: string;
  code: string;
  head: string;
  parentDeptId: number | null;
  parentDept?: Department | null;
  employeeCount: number;
  status: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface ESGConfig {
  id?: number;
  autoEmissionCalc: boolean;
  requireCsrEvidence: boolean;
  autoBadgeAward: boolean;
  emailAlerts: boolean;
  envWeight: number;
  socialWeight: number;
  govWeight: number;
}

export default function SettingsPage() {
  // Navigation & Loading State
  const [activeTab, setActiveTab] = useState("departments");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  // Data States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [esgConfig, setEsgConfig] = useState<ESGConfig>({
    autoEmissionCalc: false,
    requireCsrEvidence: false,
    autoBadgeAward: false,
    emailAlerts: false,
    envWeight: 0.4,
    socialWeight: 0.3,
    govWeight: 0.3
  });

  // Modal States - Department
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState<Partial<Department>>({});
  const [deleteDeptConfirmOpen, setDeleteDeptConfirmOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<number | null>(null);

  // Modal States - Category
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState<Partial<Category>>({});
  const [deleteCatConfirmOpen, setDeleteCatConfirmOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<number | null>(null);

  // Fetch Data Functions
  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (res.ok) setDepartments(data);
    } catch (err) {
      toast.error("Failed to load departments");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok) setCategories(data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchESGConfig = async () => {
    try {
      const res = await fetch("/api/esg-config");
      const data = await res.json();
      if (res.ok) setEsgConfig(data);
    } catch (err) {
      toast.error("Failed to load ESG settings");
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchCategories();
    fetchESGConfig();
  }, []);

  // Department CRUD Handles
  const handleSaveDept = async () => {
    setLoading(true);
    const method = currentDept.id ? "PUT" : "POST";
    const url = currentDept.id ? `/api/departments/${currentDept.id}` : "/api/departments";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentDept)
      });
      if (res.ok) {
        toast.success(currentDept.id ? "Department updated" : "Department created");
        setDeptModalOpen(false);
        fetchDepartments();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save department");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async () => {
    if (!deptToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${deptToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Department deleted successfully");
        setDeleteDeptConfirmOpen(false);
        setDeptToDelete(null);
        fetchDepartments();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete department");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    } finally {
      setLoading(false);
    }
  };

  // Category CRUD Handles
  const handleSaveCat = async () => {
    setLoading(true);
    const method = currentCat.id ? "PUT" : "POST";
    const url = currentCat.id ? `/api/categories/${currentCat.id}` : "/api/categories";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentCat)
      });
      if (res.ok) {
        toast.success(currentCat.id ? "Category updated" : "Category created");
        setCatModalOpen(false);
        fetchCategories();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save category");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!catToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${catToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted successfully");
        setDeleteCatConfirmOpen(false);
        setCatToDelete(null);
        fetchCategories();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete category");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    } finally {
      setLoading(false);
    }
  };

  // Update Config Handles
  const handleToggleConfig = async (key: keyof ESGConfig, value: boolean) => {
    const updated = { ...esgConfig, [key]: value };
    setEsgConfig(updated);
    try {
      const res = await fetch("/api/esg-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        toast.success("Configuration updated");
      } else {
        toast.error("Failed to save configuration change");
      }
    } catch (err) {
      toast.error("Error saving setting");
    }
  };

  const handleUpdateWeights = async () => {
    setLoading(true);
    // Validation
    const total = Number(esgConfig.envWeight) + Number(esgConfig.socialWeight) + Number(esgConfig.govWeight);
    if (Math.abs(total - 1.0) > 0.001) {
      toast.error("Weights must sum up to exactly 1.0 (currently " + total.toFixed(2) + ")");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/esg-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envWeight: Number(esgConfig.envWeight),
          socialWeight: Number(esgConfig.socialWeight),
          govWeight: Number(esgConfig.govWeight)
        })
      });
      if (res.ok) {
        toast.success("Weights saved successfully");
      } else {
        toast.error("Failed to save weights");
      }
    } catch (err) {
      toast.error("Error saving weights");
    } finally {
      setLoading(false);
    }
  };

  // Seed DB handler
  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed");
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success("Database seeded successfully!");
        fetchDepartments();
        fetchCategories();
        fetchESGConfig();
      } else {
        toast.error(data.error || "Seeding failed");
      }
    } catch (err) {
      toast.error("Error connecting to seeding API");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#22C55E]" /> Settings
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Configure departments, ESG targets, operational parameters, and categories.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex bg-transparent p-0 gap-2 mb-6 h-auto">
          <TabsTrigger
            value="departments"
            className="rounded-md border border-[#2A2A2A] px-6 py-2.5 text-sm font-normal text-[#9CA3AF] data-[state=active]:bg-[#9CA3AF] data-[state=active]:text-black data-[state=active]:border-[#9CA3AF] transition-all"
          >
            Departments
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="rounded-md border border-[#2A2A2A] px-6 py-2.5 text-sm font-normal text-[#9CA3AF] data-[state=active]:bg-[#9CA3AF] data-[state=active]:text-black data-[state=active]:border-[#9CA3AF] transition-all"
          >
            Categories
          </TabsTrigger>
          <TabsTrigger
            value="esg-config"
            className="rounded-md border border-[#2A2A2A] px-6 py-2.5 text-sm font-normal text-[#9CA3AF] data-[state=active]:bg-[#9CA3AF] data-[state=active]:text-black data-[state=active]:border-[#9CA3AF] transition-all"
          >
            ESG Configuration
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-md border border-[#2A2A2A] px-6 py-2.5 text-sm font-normal text-[#9CA3AF] data-[state=active]:bg-[#9CA3AF] data-[state=active]:text-black data-[state=active]:border-[#9CA3AF] transition-all"
          >
            Notification Settings
          </TabsTrigger>
        </TabsList>

        {/* -------------------- DEPARTMENTS TAB -------------------- */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex gap-3 items-center mb-2">
            <Button
              onClick={() => {
                setCurrentDept({ name: "", code: "", head: "", employeeCount: 0, status: "Active", parentDeptId: null });
                setDeptModalOpen(true);
              }}
              className="bg-[#9CA3AF] hover:bg-[#D1D5DB] text-black font-medium rounded-md px-6 flex items-center gap-2"
            >
              + New Department
            </Button>
            <Button
              onClick={() => {
                if (!selectedDeptId) return toast.error("Please select a department to edit");
                const dept = departments.find(d => d.id === selectedDeptId);
                if (dept) {
                  setCurrentDept(dept);
                  setDeptModalOpen(true);
                }
              }}
              className="bg-[#D97706] hover:bg-[#F59E0B] text-black font-medium rounded-md px-6 flex items-center gap-2"
            >
              Edit
            </Button>
            <Button
              onClick={() => {
                if (!selectedDeptId) return toast.error("Please select a department to delete");
                setDeptToDelete(selectedDeptId);
                setDeleteDeptConfirmOpen(true);
              }}
              className="bg-[#F87171] hover:bg-[#FCA5A5] text-black font-medium rounded-md px-6 flex items-center gap-2"
            >
              Delete
            </Button>
          </div>

          <div className="bg-transparent border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
                <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent text-[#9CA3AF]">
                  <TableHead className="font-normal">Name</TableHead>
                  <TableHead className="font-normal">Code</TableHead>
                  <TableHead className="font-normal">Head</TableHead>
                  <TableHead className="font-normal">Parent Department</TableHead>
                  <TableHead className="font-normal text-center">Employees</TableHead>
                  <TableHead className="font-normal text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[#9CA3AF]">
                      No departments configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept) => (
                    <TableRow
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`border-b border-[#2A2A2A]/50 transition-colors cursor-pointer ${selectedDeptId === dept.id ? 'bg-[#2A2A2A]' : 'hover:bg-[#1A1A1A]'}`}
                    >
                      <TableCell className="text-white text-sm">{dept.name}</TableCell>
                      <TableCell className="text-[#9CA3AF] text-sm">{dept.code}</TableCell>
                      <TableCell className="text-[#9CA3AF] text-sm">{dept.head}</TableCell>
                      <TableCell className="text-[#9CA3AF] text-sm">
                        {dept.parentDept ? dept.parentDept.name : "—"}
                      </TableCell>
                      <TableCell className="text-center text-white text-sm">{dept.employeeCount}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            dept.status === "Active"
                              ? "text-green-500 border-green-500 rounded-md font-normal px-3 py-0"
                              : "text-gray-400 border-gray-400 rounded-md font-normal px-3 py-0"
                          }
                        >
                          {dept.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* -------------------- CATEGORIES TAB -------------------- */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">ESG Categorization</h3>
            <Button
              onClick={() => {
                setCurrentCat({ name: "", type: "CSR_ACTIVITY", status: "Active" });
                setCatModalOpen(true);
              }}
              className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Category
            </Button>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
                <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                  <TableHead className="text-white font-medium">Category Name</TableHead>
                  <TableHead className="text-white font-medium">Type</TableHead>
                  <TableHead className="text-white font-medium">Status</TableHead>
                  <TableHead className="text-white font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-[#9CA3AF]">
                      No categories configured. Use the button to add one or Seed Database in the ESG tab.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow
                      key={cat.id}
                      className="border-b border-[#2A2A2A]/50 hover:bg-[#22C55E]/5 transition-colors"
                    >
                      <TableCell className="font-semibold text-white">{cat.name}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            cat.type === "CSR_ACTIVITY"
                              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }
                        >
                          {cat.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            cat.status === "Active"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }
                        >
                          {cat.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCurrentCat(cat);
                              setCatModalOpen(true);
                            }}
                            className="text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A] h-8 w-8 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCatToDelete(cat.id);
                              setDeleteCatConfirmOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* -------------------- ESG CONFIGURATION TAB -------------------- */}
        <TabsContent value="esg-config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weights Card */}
            <div className="space-y-4">
              <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Pillar Scoring Weights</CardTitle>
                  <CardDescription className="text-[#9CA3AF]">
                    Distribute weights dynamically for overall ESG calculations. Must sum to exactly 1.0.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-green-400">Environmental Weight</label>
                    <input
                      type="number"
                      step="0.05"
                      value={esgConfig.envWeight}
                      onChange={(e) => setEsgConfig({ ...esgConfig, envWeight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-orange-400">Social Weight</label>
                    <input
                      type="number"
                      step="0.05"
                      value={esgConfig.socialWeight}
                      onChange={(e) => setEsgConfig({ ...esgConfig, socialWeight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-blue-400">Governance Weight</label>
                    <input
                      type="number"
                      step="0.05"
                      value={esgConfig.govWeight}
                      onChange={(e) => setEsgConfig({ ...esgConfig, govWeight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]"
                    />
                  </div>

                  <Button
                    onClick={handleUpdateWeights}
                    disabled={loading}
                    className="w-full bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold py-2 rounded-lg flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Weights
                  </Button>
                </CardContent>
              </Card>

              {/* Seeding Card */}
              <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-400" /> Database Administration
                  </CardTitle>
                  <CardDescription className="text-[#9CA3AF]">
                    Seed database tables with demo data if they are currently empty.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    {seeding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    Seed Database
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* -------------------- NOTIFICATIONS TAB -------------------- */}
        <TabsContent value="notifications">
          <Card className="bg-[#1A1A1A] border-[#2A2A2A] text-center p-12">
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[#9CA3AF]">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-white">Notification settings coming soon</h3>
              <p className="text-[#9CA3AF] text-sm max-w-sm">
                Receive notifications regarding audit reports, badge achievements, and milestone goals.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global ESG Configuration & Notifications Section */}
      <div className="pt-8">
        <h3 className="text-[#9CA3AF] text-sm font-medium mb-4">ESG Configuration & Notifications</h3>
        <div className="space-y-4 max-w-md">
          {/* Toggle 1 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleToggleConfig("autoEmissionCalc", !esgConfig.autoEmissionCalc)}
              className="relative inline-flex h-6 w-11 items-center rounded-md bg-[#9CA3AF] transition-colors focus:outline-none"
            >
              <span className={`inline-block h-4 w-4 transform rounded-md bg-[#111111] transition-transform ${esgConfig.autoEmissionCalc ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <p className="text-sm text-[#D1D5DB]">Enable auto emission calculation</p>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleToggleConfig("requireCsrEvidence", !esgConfig.requireCsrEvidence)}
              className="relative inline-flex h-6 w-11 items-center rounded-md bg-[#9CA3AF] transition-colors focus:outline-none"
            >
              <span className={`inline-block h-4 w-4 transform rounded-md bg-[#111111] transition-transform ${esgConfig.requireCsrEvidence ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <p className="text-sm text-[#D1D5DB]">Require evidence for all CSR activities</p>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleToggleConfig("autoBadgeAward", !esgConfig.autoBadgeAward)}
              className="relative inline-flex h-6 w-11 items-center rounded-md bg-[#9CA3AF] transition-colors focus:outline-none"
            >
              <span className={`inline-block h-4 w-4 transform rounded-md bg-[#111111] transition-transform ${esgConfig.autoBadgeAward ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <p className="text-sm text-[#D1D5DB]">Auto-award badges on challenge completion</p>
          </div>

          {/* Toggle 4 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleToggleConfig("emailAlerts", !esgConfig.emailAlerts)}
              className="relative inline-flex h-6 w-11 items-center rounded-md bg-[#9CA3AF] transition-colors focus:outline-none"
            >
              <span className={`inline-block h-4 w-4 transform rounded-md bg-[#111111] transition-transform ${esgConfig.emailAlerts ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <p className="text-sm text-[#D1D5DB]">Email alerts for new compliance issues</p>
          </div>
        </div>
      </div>

      {/* ==================== DIALOGS / MODALS ==================== */}

      {/* New/Edit Department Modal */}
      <Dialog open={deptModalOpen} onOpenChange={setDeptModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentDept.id ? "Edit Department" : "Add New Department"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Register details regarding the business unit hierarchy and division head.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Department Name</label>
                <input
                  type="text"
                  value={currentDept.name || ""}
                  onChange={(e) => setCurrentDept({ ...currentDept, name: e.target.value })}
                  placeholder="e.g. Manufacturing"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Department Code</label>
                <input
                  type="text"
                  value={currentDept.code || ""}
                  onChange={(e) => setCurrentDept({ ...currentDept, code: e.target.value })}
                  placeholder="e.g. MFC"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Department Head</label>
                <input
                  type="text"
                  value={currentDept.head || ""}
                  onChange={(e) => setCurrentDept({ ...currentDept, head: e.target.value })}
                  placeholder="e.g. S. Nair"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Employee Count</label>
                <input
                  type="number"
                  value={currentDept.employeeCount || 0}
                  onChange={(e) => setCurrentDept({ ...currentDept, employeeCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Parent Department</label>
                <select
                  value={currentDept.parentDeptId || ""}
                  onChange={(e) => setCurrentDept({ ...currentDept, parentDeptId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">No Parent Department</option>
                  {departments
                    .filter((d) => d.id !== currentDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Status</label>
                <select
                  value={currentDept.status || "Active"}
                  onChange={(e) => setCurrentDept({ ...currentDept, status: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeptModalOpen(false)}
              className="text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDept}
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation Modal */}
      <Dialog open={deleteDeptConfirmOpen} onOpenChange={setDeleteDeptConfirmOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Are you sure you want to delete this department? This action cannot be undone. All child relations will be detached.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDeptConfirmOpen(false);
                setDeptToDelete(null);
              }}
              className="text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteDept}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New/Edit Category Modal */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentCat.id ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Define organizational classifications for social events or challenges.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Category Name</label>
              <input
                type="text"
                value={currentCat.name || ""}
                onChange={(e) => setCurrentCat({ ...currentCat, name: e.target.value })}
                placeholder="e.g. Clean Energy Transition"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Type</label>
                <select
                  value={currentCat.type || "CSR_ACTIVITY"}
                  onChange={(e) => setCurrentCat({ ...currentCat, type: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="CSR_ACTIVITY">CSR Activity</option>
                  <option value="CHALLENGE">Challenge</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Status</label>
                <select
                  value={currentCat.status || "Active"}
                  onChange={(e) => setCurrentCat({ ...currentCat, status: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCatModalOpen(false)}
              className="text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCat}
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Modal */}
      <Dialog open={deleteCatConfirmOpen} onOpenChange={setDeleteCatConfirmOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Are you sure you want to delete this category? This action cannot be undone and may affect active activities and challenges.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteCatConfirmOpen(false);
                setCatToDelete(null);
              }}
              className="text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCat}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

