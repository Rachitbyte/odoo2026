"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, List, Loader2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState<Partial<CarbonTransaction>>({});

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <List className="w-8 h-8 text-[#22C55E]" /> Carbon Transactions Ledger
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Immutable log of all carbon-emitting activities across the organization.
          </p>
        </div>
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
          className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Log Transaction
        </Button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-white font-medium">Date</TableHead>
              <TableHead className="text-white font-medium">Source / Ref ID</TableHead>
              <TableHead className="text-white font-medium">Department</TableHead>
              <TableHead className="text-white font-medium">Emission Factor</TableHead>
              <TableHead className="text-white font-medium text-right">Qty</TableHead>
              <TableHead className="text-white font-medium text-right">CO2 Generated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-[#9CA3AF]">
                  No carbon transactions logged yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#22C55E]/5 transition-colors">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              <div className="text-lg font-bold text-[#22C55E] flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> 
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
