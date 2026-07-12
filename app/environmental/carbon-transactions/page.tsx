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

interface EmissionFactor {
  id: number;
  name: string;
  source: string;
  factorValue: number;
  unit: string;
}

interface CarbonTransaction {
  id: number;
  source: string;
  refId: string | null;
  deptId: number;
  dept?: Department;
  emissionFactorId: number;
  emissionFactor?: EmissionFactor;
  quantity: number;
  co2Amount: number;
  transactionDate: string;
}

export default function CarbonTransactionsPage() {
  const [transactions, setTransactions] = useState<CarbonTransaction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection & Search
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState<Partial<CarbonTransaction>>({});

  // View & Export
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [resTx, resDepts, resFactors] = await Promise.all([
        fetch("/api/environmental/carbon-transactions"),
        fetch("/api/departments"),
        fetch("/api/emission-factors")
      ]);
      if (resTx.ok) setTransactions(await resTx.json());
      if (resDepts.ok) setDepartments(await resDepts.json());
      if (resFactors.ok) setEmissionFactors(await resFactors.json());
    } catch (err) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!currentTx.source || !currentTx.deptId || !currentTx.emissionFactorId || currentTx.quantity === undefined) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/environmental/carbon-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentTx),
      });
      if (res.ok) {
        toast.success("Carbon Transaction logged successfully");
        setModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to log transaction");
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
    const csv = Papa.unparse(transactions.map(t => ({
      Date: new Date(t.transactionDate).toLocaleDateString(),
      Source: t.source,
      RefID: t.refId || "",
      Department: t.dept?.name || "Unknown",
      EmissionFactor: t.emissionFactor?.name || "",
      Quantity: t.quantity,
      CO2Generated: t.co2Amount
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "carbon-transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Carbon Transactions", 14, 15);
    autoTable(doc, {
      head: [["Date", "Source", "Ref ID", "Department", "Factor", "Qty", "CO2 Generated"]],
      body: transactions.map(t => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.source,
        t.refId || "-",
        t.dept?.name || "Unknown",
        t.emissionFactor?.name || "-",
        t.quantity.toString(),
        t.co2Amount.toString() + " kg"
      ]),
      startY: 20,
    });
    doc.save("carbon-transactions.pdf");
  };

  const filteredTransactions = transactions.filter(t => 
    t.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.refId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.dept?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTx = transactions.find(t => t.id === selectedRowId);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setCurrentTx({ 
                source: "Manual Entry", 
                deptId: departments[0]?.id || 0, 
                emissionFactorId: emissionFactors[0]?.id || 0,
                quantity: 0,
                transactionDate: new Date().toISOString().split("T")[0] 
              });
              setModalOpen(true);
            }}
            className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-medium px-6 py-2 h-10 rounded-lg"
          >
            + Log Transaction
          </Button>
          <Button
            onClick={handleView}
            disabled={!selectedRowId}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 h-10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View
          </Button>
          <div className="relative">
            <Button
              onClick={() => setExportOpen(!exportOpen)}
              className={`border font-medium px-6 py-2 h-10 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                exportOpen
                  ? "bg-[#2A2A2A] border-[#3A3A3A] text-white"
                  : "bg-[#1A1A1A] border-[#2A2A2A] text-[#9CA3AF] hover:bg-[#2A2A2A] hover:text-white hover:border-[#3A3A3A]"
              }`}
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
            placeholder="Search transactions..." 
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
              <TableHead className="text-white font-medium">Date</TableHead>
              <TableHead className="text-white font-medium">Source / Ref ID</TableHead>
              <TableHead className="text-white font-medium">Department</TableHead>
              <TableHead className="text-white font-medium">Emission Factor</TableHead>
              <TableHead className="text-white font-medium text-right">Qty</TableHead>
              <TableHead className="text-white font-medium text-right">CO2 Generated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-[#9CA3AF]">
                  No carbon transactions logged yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => {
                const isSelected = selectedRowId === tx.id;

                return (
                  <TableRow 
                    key={tx.id} 
                    onClick={() => setSelectedRowId(isSelected ? null : tx.id)}
                    className={`border-b border-[#2A2A2A]/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#22C55E]/10" : "hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <TableCell className="text-[#9CA3AF] whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-white">{tx.source}</div>
                      {tx.refId && <div className="text-xs text-[#9CA3AF] font-mono">Ref: {tx.refId}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A]">
                        {tx.dept?.name || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white">{tx.emissionFactor?.name}</div>
                      <div className="text-xs text-[#9CA3AF]">{tx.emissionFactor?.factorValue} {tx.emissionFactor?.unit}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">{tx.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-[#22C55E] font-bold">+{tx.co2Amount.toLocaleString()} kg</span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-[#9CA3AF] mt-2 px-1">
        Transactions are immutable and cannot be edited or deleted.
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>View Carbon Transaction</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4 my-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Source</label>
                <div className="text-sm text-white mt-1">{selectedTx.source}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Ref ID</label>
                <div className="text-sm text-white mt-1">{selectedTx.refId || "N/A"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Department</label>
                <div className="text-sm text-white mt-1">{selectedTx.dept?.name || "Unknown"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Transaction Date</label>
                <div className="text-sm text-white mt-1">{new Date(selectedTx.transactionDate).toLocaleDateString()}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Emission Factor</label>
                <div className="text-sm text-white mt-1">{selectedTx.emissionFactor?.name}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Quantity</label>
                <div className="text-sm text-white mt-1">{selectedTx.quantity}</div>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Total CO2 Generated</label>
                <div className="text-sm text-[#22C55E] mt-1 font-bold">+{selectedTx.co2Amount.toLocaleString()} kg</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewModalOpen(false)} className="text-white hover:bg-[#2A2A2A]">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Carbon Transaction</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Manually register a carbon-emitting activity. CO2 will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Source / Activity</label>
                <input
                  type="text"
                  value={currentTx.source || ""}
                  onChange={(e) => setCurrentTx({ ...currentTx, source: e.target.value })}
                  placeholder="e.g. Flight to NY"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Reference ID (Optional)</label>
                <input
                  type="text"
                  value={currentTx.refId || ""}
                  onChange={(e) => setCurrentTx({ ...currentTx, refId: e.target.value })}
                  placeholder="e.g. TKT-8492"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Department</label>
                <select
                  value={currentTx.deptId || ""}
                  onChange={(e) => setCurrentTx({ ...currentTx, deptId: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select Dept</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Transaction Date</label>
                <input
                  type="date"
                  value={currentTx.transactionDate || ""}
                  onChange={(e) => setCurrentTx({ ...currentTx, transactionDate: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E] [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-[#2A2A2A] pt-4">
              <label className="text-xs font-semibold text-[#9CA3AF]">Emission Factor</label>
              <select
                value={currentTx.emissionFactorId || ""}
                onChange={(e) => setCurrentTx({ ...currentTx, emissionFactorId: Number(e.target.value) })}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">Select Factor</option>
                {emissionFactors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.factorValue} {f.unit})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Quantity (Multiplier)</label>
              <input
                type="number"
                step="0.1"
                value={currentTx.quantity === undefined ? "" : currentTx.quantity}
                onChange={(e) => setCurrentTx({ ...currentTx, quantity: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 500 (km)"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            
            {/* Live Calculation Preview */}
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg p-3 flex items-center justify-between">
              <div className="text-sm text-[#9CA3AF]">Estimated CO2 Output:</div>
              <div className="text-lg font-bold text-[#22C55E]">
                {(() => {
                  const factor = emissionFactors.find(f => f.id === currentTx.emissionFactorId);
                  if (factor && currentTx.quantity !== undefined) {
                    return (factor.factorValue * currentTx.quantity).toLocaleString() + " kg";
                  }
                  return "0 kg";
                })()}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-white hover:bg-[#2A2A2A]">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

