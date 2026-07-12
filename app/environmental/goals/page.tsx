"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Target, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<Partial<EnvironmentalGoal>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

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
    if (!goalToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/environmental/goals/${goalToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Goal deleted");
        setDeleteConfirmOpen(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-[#22C55E]" /> Environmental Goals
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Track CO2 reduction targets and current progress per department.
          </p>
        </div>
        <Button
          onClick={() => {
            setCurrentGoal({ name: "", deptId: departments[0]?.id || 0, targetCo2: 0, currentCo2: 0, status: "Active", deadline: new Date().toISOString().split("T")[0] });
            setModalOpen(true);
          }}
          className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Goal
        </Button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-white font-medium">Goal Name</TableHead>
              <TableHead className="text-white font-medium">Department</TableHead>
              <TableHead className="text-white font-medium text-right">Target (kg)</TableHead>
              <TableHead className="text-white font-medium text-right">Current (kg)</TableHead>
              <TableHead className="text-white font-medium">Progress</TableHead>
              <TableHead className="text-white font-medium text-center">Status</TableHead>
              <TableHead className="text-white font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-[#9CA3AF]">
                  No environmental goals configured yet.
                </TableCell>
              </TableRow>
            ) : (
              goals.map((goal) => {
                const progressPct = goal.targetCo2 > 0 ? (goal.currentCo2 / goal.targetCo2) * 100 : 0;
                const isOver = progressPct > 100;
                
                return (
                  <TableRow key={goal.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#22C55E]/5 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-white">{goal.name}</div>
                      <div className="text-xs text-[#9CA3AF]">Due: {new Date(goal.deadline).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A]">
                        {goal.dept?.name || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">{goal.targetCo2.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-white">{goal.currentCo2.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="w-24 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isOver ? 'bg-red-500' : 'bg-[#22C55E]'}`} 
                          style={{ width: `${Math.min(progressPct, 100)}%` }}
                        />
                      </div>
                      <div className={`text-xs mt-1 ${isOver ? 'text-red-400' : 'text-[#9CA3AF]'}`}>
                        {progressPct.toFixed(1)}% {isOver && "(Over limit)"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={goal.status === "Active" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}>
                        {goal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentGoal({
                              ...goal,
                              deadline: new Date(goal.deadline).toISOString().split("T")[0]
                            });
                            setModalOpen(true);
                          }}
                          className="text-[#9CA3AF] hover:text-white hover:bg-[#2A2A2A] h-8 w-8 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setGoalToDelete(goal.id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* CRUD Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentGoal.id ? "Edit Environmental Goal" : "Add Environmental Goal"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Set department carbon limits. Overages will be flagged.
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
                <label className="text-xs font-semibold text-[#9CA3AF]">Target CO2 (kg)</label>
                <input
                  type="number"
                  value={currentGoal.targetCo2 === undefined ? "" : currentGoal.targetCo2}
                  onChange={(e) => setCurrentGoal({ ...currentGoal, targetCo2: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Current CO2 (kg) {currentGoal.id ? "(Edit)" : "(Start)"}</label>
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
                <option value="Archived">Archived</option>
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
