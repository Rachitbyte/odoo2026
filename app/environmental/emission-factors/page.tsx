"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Loader2, ChevronDown, Eye, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  
  // Selection & Search
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [currentFactor, setCurrentFactor] = useState<Partial<EmissionFactor>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // View & Export
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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
      const res = await fetch(`/api/emission-factors/${selectedRowId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Emission Factor deleted");
        setDeleteConfirmOpen(false);
        setSelectedRowId(null);
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

  const handleView = () => {
    if (!selectedRowId) {
      toast.error("Please select a row first");
      return;
    }
    setViewModalOpen(true);
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(factors.map(f => ({
      Name: f.name,
      Source: f.source,
      Value: f.factorValue,
      Unit: f.unit
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "emission-factors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Emission Factors", 14, 15);
    autoTable(doc, {
      head: [["Name", "Source", "Value", "Unit"]],
      body: factors.map(f => [f.name, f.source, f.factorValue.toString(), f.unit]),
      startY: 20,
    });
    doc.save("emission-factors.pdf");
  };

  const filteredFactors = factors.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFactor = factors.find(f => f.id === selectedRowId);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setCurrentFactor({ name: "", source: "Expense", factorValue: 0, unit: "kg CO2e" });
              setModalOpen(true);
            }}
            className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-medium px-6 py-2 h-10 rounded-lg"
          >
            + New Factor
          </Button>
          <Button
            onClick={() => {
              if (selectedFactor) {
                setCurrentFactor(selectedFactor);
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
              Export <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
            {exportOpen && (
              <div className="absolute left-0 mt-2 w-40 bg-[#111111] border border-[#2A2A2A] rounded-md shadow-lg z-50 py-1">
                <button onClick={() => { handleExportCSV(); setExportOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2A2A2A]">Export CSV</button>
                <button onClick={() => { handleExportPDF(); setExportOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2A2A2A]">Export PDF</button>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input 
            type="text" 
            placeholder="Search factors..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#22C55E]"
          />
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent bg-[#111111]">
              <TableHead className="text-white font-medium">Name</TableHead>
              <TableHead className="text-white font-medium">Source</TableHead>
              <TableHead className="text-white font-medium text-right">Value</TableHead>
              <TableHead className="text-white font-medium">Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFactors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-[#9CA3AF]">
                  No emission factors configured yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredFactors.map((factor) => {
                const isSelected = selectedRowId === factor.id;
                
                return (
                  <TableRow 
                    key={factor.id} 
                    onClick={() => setSelectedRowId(isSelected ? null : factor.id)}
                    className={`border-b border-[#2A2A2A]/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#22C55E]/10" : "hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <TableCell className="font-semibold text-white">{factor.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A]">
                        {factor.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-[#22C55E] font-medium">{factor.factorValue}</TableCell>
                    <TableCell className="text-[#9CA3AF]">{factor.unit}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mt-2 px-1">
        <button onClick={handleView} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Eye className="w-3 h-3 text-[#F97316]" /> View</button>
        <button onClick={() => { if(selectedFactor){ setCurrentFactor(selectedFactor); setModalOpen(true); } else toast.error("Please select a row first") }} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Edit2 className="w-3 h-3 text-[#F97316]" /> Edit</button>
        <button onClick={() => { if(selectedRowId){ setDeleteConfirmOpen(true); } else toast.error("Please select a row first") }} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Trash2 className="w-3 h-3 text-[#9CA3AF]" /> Delete</button>
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>View Emission Factor</DialogTitle>
          </DialogHeader>
          {selectedFactor && (
            <div className="space-y-4 my-4">
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Name</label>
                <div className="text-sm text-white mt-1">{selectedFactor.name}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Source</label>
                <div className="text-sm text-white mt-1">{selectedFactor.source}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Factor Value</label>
                <div className="text-sm text-white mt-1">{selectedFactor.factorValue}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Unit</label>
                <div className="text-sm text-white mt-1">{selectedFactor.unit}</div>
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

