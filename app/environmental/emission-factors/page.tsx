"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Leaf, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface EmissionFactor {
  id: number;
  name: string;
  source: string;
  factorValue: number;
  unit: string;
}

export default function EmissionFactorsPage() {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFactor, setCurrentFactor] = useState<Partial<EmissionFactor>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<number | null>(null);

  const fetchFactors = async () => {
    try {
      const res = await fetch("/api/emission-factors");
      if (res.ok) {
        const data = await res.json();
        setFactors(data);
      }
    } catch (err) {
      toast.error("Failed to load emission factors");
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const handleSave = async () => {
    if (!currentFactor.name || !currentFactor.source || currentFactor.factorValue === undefined || !currentFactor.unit) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const method = currentFactor.id ? "PUT" : "POST";
    const url = currentFactor.id ? `/api/emission-factors/${currentFactor.id}` : "/api/emission-factors";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentFactor),
      });
      if (res.ok) {
        toast.success(currentFactor.id ? "Emission Factor updated" : "Emission Factor created");
        setModalOpen(false);
        fetchFactors();
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
    if (!factorToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/emission-factors/${factorToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Emission Factor deleted");
        setDeleteConfirmOpen(false);
        fetchFactors();
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
            <Leaf className="w-8 h-8 text-[#22C55E]" /> Emission Factors
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Manage global CO2 emission multipliers for calculations.
          </p>
        </div>
        <Button
          onClick={() => {
            setCurrentFactor({ name: "", source: "Expense", factorValue: 0, unit: "kg CO2e" });
            setModalOpen(true);
          }}
          className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Factor
        </Button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-white font-medium">Name</TableHead>
              <TableHead className="text-white font-medium">Source</TableHead>
              <TableHead className="text-white font-medium text-right">Value</TableHead>
              <TableHead className="text-white font-medium text-right">Unit</TableHead>
              <TableHead className="text-white font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-[#9CA3AF]">
                  No emission factors configured yet.
                </TableCell>
              </TableRow>
            ) : (
              factors.map((factor) => (
                <TableRow key={factor.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#22C55E]/5 transition-colors">
                  <TableCell className="font-semibold text-white">{factor.name}</TableCell>
                  <TableCell>
                    <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A]">
                      {factor.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[#22C55E] font-medium">{factor.factorValue}</TableCell>
                  <TableCell className="text-right text-[#9CA3AF]">{factor.unit}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentFactor(factor);
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
                          setFactorToDelete(factor.id);
                          setDeleteConfirmOpen(true);
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

      {/* CRUD Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>{currentFactor.id ? "Edit Emission Factor" : "Add Emission Factor"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Specify the multiplier and unit to calculate CO2 footprint accurately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Name</label>
              <input
                type="text"
                value={currentFactor.name || ""}
                onChange={(e) => setCurrentFactor({ ...currentFactor, name: e.target.value })}
                placeholder="e.g. Grid Electricity (US)"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Source Type</label>
                <select
                  value={currentFactor.source || "Expense"}
                  onChange={(e) => setCurrentFactor({ ...currentFactor, source: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="Expense">Expense</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Fleet">Fleet</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Unit</label>
                <input
                  type="text"
                  value={currentFactor.unit || ""}
                  onChange={(e) => setCurrentFactor({ ...currentFactor, unit: e.target.value })}
                  placeholder="e.g. kg CO2e / kWh"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Factor Value</label>
              <input
                type="number"
                step="0.0001"
                value={currentFactor.factorValue === undefined ? "" : currentFactor.factorValue}
                onChange={(e) => setCurrentFactor({ ...currentFactor, factorValue: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              />
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
            <DialogTitle className="text-red-400">Delete Emission Factor?</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              This action cannot be undone. Are you sure you want to delete this factor?
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
