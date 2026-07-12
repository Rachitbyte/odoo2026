"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Loader2, ChevronDown, Eye, Edit2, Trash2, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Department {
  id: number;
  name: string;
}

interface EnvironmentalGoal {
  id: number;
  name: string;
  deptId: number;
  dept?: Department;
  targetCo2: number;
  currentCo2: number;
  deadline: string;
  status: string;
}

export default function EnvironmentalGoalsPage() {
  const [goals, setGoals] = useState<EnvironmentalGoal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection & Search
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Partial<EnvironmentalGoal>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // View & Export
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [resGoals, resDepts] = await Promise.all([
        fetch("/api/environmental/goals"),
        fetch("/api/departments")
      ]);
      if (resGoals.ok) setGoals(await resGoals.json());
      if (resDepts.ok) setDepartments(await resDepts.json());
    } catch (err) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!currentGoal.name || !currentGoal.deptId || currentGoal.targetCo2 === undefined || !currentGoal.deadline) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const method = currentGoal.id ? "PUT" : "POST";
    const url = currentGoal.id ? `/api/environmental/goals/${currentGoal.id}` : "/api/environmental/goals";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentGoal),
      });
      if (res.ok) {
        toast.success(currentGoal.id ? "Goal updated" : "Goal created");
        setModalOpen(false);
        fetchData();
        setSelectedRowId(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRowId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/environmental/goals/${selectedRowId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Goal deleted");
        setDeleteConfirmOpen(false);
        setSelectedRowId(null);
        fetchData();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    if (!selectedRowId) {
      toast.error("Please select a row first");
      return;
    }
    setViewModalOpen(true);
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(goals.map(g => ({
      Name: g.name,
      Department: g.dept?.name || "Unknown",
      TargetCO2: g.targetCo2,
      CurrentCO2: g.currentCo2,
      Deadline: new Date(g.deadline).toISOString().split("T")[0],
      Status: g.status
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "environmental-goals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Environmental Goals", 14, 15);
    autoTable(doc, {
      head: [["Name", "Department", "Target CO2", "Current CO2", "Deadline", "Status"]],
      body: goals.map(g => [
        g.name,
        g.dept?.name || "Unknown",
        g.targetCo2.toString(),
        g.currentCo2.toString(),
        new Date(g.deadline).toISOString().split("T")[0],
        g.status
      ]),
      startY: 20,
    });
    doc.save("environmental-goals.pdf");
  };

  const filteredGoals = goals.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.dept?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGoal = goals.find(g => g.id === selectedRowId);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setCurrentGoal({ name: "", deptId: departments[0]?.id || 0, targetCo2: 0, currentCo2: 0, status: "Active", deadline: new Date().toISOString().split("T")[0] });
              setModalOpen(true);
            }}
            className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-medium px-6 py-2 h-10 rounded-lg"
          >
            + New Goal
          </Button>
          <Button
            onClick={() => {
              if (selectedGoal) {
                setCurrentGoal({
                  ...selectedGoal,
                  deadline: new Date(selectedGoal.deadline).toISOString().split("T")[0]
                });
                setModalOpen(true);
              }
            }}
            disabled={!selectedRowId}
            className="bg-[#F97316] hover:bg-[#ea580c] text-white font-medium px-6 py-2 h-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit
          </Button>
          <Button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={!selectedRowId}
            className="bg-[#EF4444] hover:bg-[#dc2626] text-white font-medium px-6 py-2 h-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setExportOpen(!exportOpen)}
              className="bg-[#9CA3AF] hover:bg-[#6B7280] text-black border-none font-medium px-6 py-2 h-10 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export ▼
            </Button>
            {exportOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-md shadow-xl z-50 overflow-hidden">
                <div className="py-1">
                  <button onClick={() => { handleExportCSV(); setExportOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white flex items-center gap-2 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-green-400" /> Export as CSV
                  </button>
                  <button onClick={() => { handleExportPDF(); setExportOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white flex items-center gap-2 transition-colors">
                    <FileText className="w-4 h-4 text-red-400" /> Export as PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search goals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent bg-[#111111]">
              <TableHead className="text-white font-medium">Name</TableHead>
              <TableHead className="text-white font-medium">Department</TableHead>
              <TableHead className="text-white font-medium">Target CO₂</TableHead>
              <TableHead className="text-white font-medium">Current CO₂</TableHead>
              <TableHead className="text-white font-medium">Progress</TableHead>
              <TableHead className="text-white font-medium">Deadline</TableHead>
              <TableHead className="text-white font-medium text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGoals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-[#9CA3AF]">
                  No goals found.
                </TableCell>
              </TableRow>
            ) : (
              filteredGoals.map((goal) => {
                const progressPct = goal.targetCo2 > 0 ? (goal.currentCo2 / goal.targetCo2) * 100 : 0;
                const isOver = progressPct > 100;
                const isSelected = selectedRowId === goal.id;
                
                return (
                  <TableRow 
                    key={goal.id} 
                    onClick={() => setSelectedRowId(isSelected ? null : goal.id)}
                    className={`border-b border-[#2A2A2A]/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#22C55E]/10" : "hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <TableCell className="font-semibold text-white">{goal.name}</TableCell>
                    <TableCell className="text-[#9CA3AF]">{goal.dept?.name || "Unknown"}</TableCell>
                    <TableCell className="text-white">{goal.targetCo2.toLocaleString()} t</TableCell>
                    <TableCell className="text-white">{goal.currentCo2.toLocaleString()} t</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-3 bg-[#2A2A2A] rounded-full overflow-hidden flex-shrink-0">
                          <div 
                            className={`h-full ${isOver ? 'bg-red-500' : 'bg-[#22C55E]'}`} 
                            style={{ width: `${Math.min(progressPct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs ${isOver ? 'text-red-400' : 'text-white'}`}>
                          {progressPct.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#9CA3AF]">{new Date(goal.deadline).toISOString().split("T")[0]}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={
                          goal.status === "Active" ? "border-[#22C55E] text-[#22C55E] bg-[#22C55E]/10" : 
                          goal.status === "Completed" ? "border-blue-400 text-blue-400 bg-blue-400/10" : 
                          "border-amber-400 text-amber-400 bg-amber-400/10"
                        }
                      >
                        {goal.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer Text */}
      <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mt-2 px-1">
        <button onClick={handleView} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Eye className="w-3 h-3 text-[#F97316]" /> View</button>
        <button onClick={() => { if(selectedGoal){ setCurrentGoal({ ...selectedGoal, deadline: new Date(selectedGoal.deadline).toISOString().split("T")[0] }); setModalOpen(true); } else toast.error("Please select a row first") }} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Edit2 className="w-3 h-3 text-[#F97316]" /> Edit</button>
        <button onClick={() => { if(selectedRowId){ setDeleteConfirmOpen(true); } else toast.error("Please select a row first") }} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Trash2 className="w-3 h-3 text-[#9CA3AF]" /> Delete</button>
        <span>•</span>
        <span>Carbon Transactions auto-generated from Purchase/Manufacturing/Fleet/Expenses</span>
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>View Environmental Goal</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4 my-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Goal Name</label>
                <div className="text-sm text-white mt-1">{selectedGoal.name}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Department</label>
                <div className="text-sm text-white mt-1">{selectedGoal.dept?.name || "Unknown"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Status</label>
                <div className="text-sm text-white mt-1">{selectedGoal.status}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Target CO2</label>
                <div className="text-sm text-[#22C55E] mt-1">{selectedGoal.targetCo2.toLocaleString()} t</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Current CO2</label>
                <div className="text-sm text-white mt-1">{selectedGoal.currentCo2.toLocaleString()} t</div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Deadline</label>
                <div className="text-sm text-white mt-1">{new Date(selectedGoal.deadline).toISOString().split("T")[0]}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewModalOpen(false)} className="text-white hover:bg-[#2A2A2A]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CRUD Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentGoal.id ? "Edit Environmental Goal" : "Add Environmental Goal"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Set department carbon limits.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Goal Name</label>
              <input
                type="text"
                value={currentGoal.name || ""}
                onChange={(e) => setCurrentGoal({ ...currentGoal, name: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Department</label>
                <select
                  value={currentGoal.deptId || ""}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, deptId: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select Dept</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Deadline</label>
                <input
                  type="date"
                  value={currentGoal.deadline || ""}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, deadline: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Target CO2 (t)</label>
                <input
                  type="number"
                  value={currentGoal.targetCo2 === undefined ? "" : currentGoal.targetCo2}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, targetCo2: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Current CO2 (t)</label>
                <input
                  type="number"
                  value={currentGoal.currentCo2 === undefined ? "" : currentGoal.currentCo2}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, currentCo2: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Status</label>
              <select
                value={currentGoal.status || "Active"}
                onChange={(e) => setCurrentGoal({ ...currentGoal, status: e.target.value })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="Active">Active</option>
                <option value="On Track">On Track</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-white hover:bg-[#2A2A2A]">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Delete Environmental Goal?</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="text-white hover:bg-[#2A2A2A]">Cancel</Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

