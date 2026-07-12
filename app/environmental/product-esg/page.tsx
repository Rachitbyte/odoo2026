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

interface Department {
  id: number;
  name: string;
}

interface ProductESGProfile {
  id: number;
  productName: string;
  productCode: string;
  deptId: number;
  dept?: Department;
  carbonFootprint: number;
  recyclable: boolean;
  notes: string;
}

export default function ProductESGPage() {
  const [products, setProducts] = useState<ProductESGProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Selection & Search
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<ProductESGProfile>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // View & Export
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [resProducts, resDepts] = await Promise.all([
        fetch("/api/environmental/products"),
        fetch("/api/departments")
      ]);
      if (resProducts.ok) setProducts(await resProducts.json());
      if (resDepts.ok) setDepartments(await resDepts.json());
    } catch (err) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!currentProduct.productName || !currentProduct.productCode || !currentProduct.deptId || currentProduct.carbonFootprint === undefined) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const method = currentProduct.id ? "PUT" : "POST";
    const url = currentProduct.id ? `/api/environmental/products/${currentProduct.id}` : "/api/environmental/products";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProduct),
      });
      if (res.ok) {
        toast.success(currentProduct.id ? "Product updated" : "Product created");
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
      const res = await fetch(`/api/environmental/products/${selectedRowId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
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
    const csv = Papa.unparse(products.map(p => ({
      Product: p.productName,
      Code: p.productCode,
      Department: p.dept?.name || "Unknown",
      Footprint: p.carbonFootprint,
      Recyclable: p.recyclable ? "Yes" : "No"
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "product-profiles.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Product ESG Profiles", 14, 15);
    autoTable(doc, {
      head: [["Product", "Code", "Department", "Footprint", "Recyclable"]],
      body: products.map(p => [
        p.productName, 
        p.productCode, 
        p.dept?.name || "Unknown", 
        p.carbonFootprint.toString(), 
        p.recyclable ? "Yes" : "No"
      ]),
      startY: 20,
    });
    doc.save("product-profiles.pdf");
  };

  const filteredProducts = products.filter(p => 
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.dept?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedRowId);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setCurrentProduct({ productName: "", productCode: "", deptId: departments[0]?.id || 0, carbonFootprint: 0, recyclable: false, notes: "" });
              setModalOpen(true);
            }}
            className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-medium px-6 py-2 h-10 rounded-lg"
          >
            + New Profile
          </Button>
          <Button
            onClick={() => {
              if (selectedProduct) {
                setCurrentProduct(selectedProduct);
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
              <div className="absolute left-0 mt-2 w-40 bg-[#111111] border border-[#2A2A2A] rounded-md shadow-lg z-10 py-1">
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
            placeholder="Search profiles..." 
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
              <TableHead className="text-white font-medium">Product</TableHead>
              <TableHead className="text-white font-medium">Department</TableHead>
              <TableHead className="text-white font-medium text-right">Footprint (kg CO2e)</TableHead>
              <TableHead className="text-white font-medium text-center">Recyclable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-[#9CA3AF]">
                  No products configured yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedRowId === product.id;
                
                return (
                  <TableRow 
                    key={product.id} 
                    onClick={() => setSelectedRowId(isSelected ? null : product.id)}
                    className={`border-b border-[#2A2A2A]/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#22C55E]/10" : "hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <TableCell>
                      <div>
                        <p className="font-semibold text-white">{product.productName}</p>
                        <p className="text-xs text-[#9CA3AF] font-mono">{product.productCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#9CA3AF]">{product.dept?.name || "Unknown"}</TableCell>
                    <TableCell className="text-right font-mono text-[#22C55E] font-medium">{product.carbonFootprint}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={product.recyclable ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}>
                        {product.recyclable ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mt-2 px-1">
        <button onClick={handleView} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Eye className="w-3 h-3 text-[#F97316]" /> View</button>
        <button onClick={() => { if(selectedProduct){ setCurrentProduct(selectedProduct); setModalOpen(true); } else toast.error("Please select a row first") }} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Edit2 className="w-3 h-3 text-[#F97316]" /> Edit</button>
        <button onClick={() => { if(selectedRowId){ setDeleteConfirmOpen(true); } else toast.error("Please select a row first") }} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Trash2 className="w-3 h-3 text-[#9CA3AF]" /> Delete</button>
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2A2A2A] text-white">
          <DialogHeader>
            <DialogTitle>View Product Profile</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 my-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Product Name</label>
                <div className="text-sm text-white mt-1">{selectedProduct.productName}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Product Code</label>
                <div className="text-sm text-white mt-1">{selectedProduct.productCode}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Department</label>
                <div className="text-sm text-white mt-1">{selectedProduct.dept?.name || "Unknown"}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Carbon Footprint</label>
                <div className="text-sm text-[#22C55E] mt-1">{selectedProduct.carbonFootprint} kg CO2e</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#9CA3AF]">Recyclable</label>
                <div className="text-sm text-white mt-1">{selectedProduct.recyclable ? "Yes" : "No"}</div>
              </div>
              {selectedProduct.notes && (
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-[#9CA3AF]">Notes</label>
                  <div className="text-sm text-white mt-1">{selectedProduct.notes}</div>
                </div>
              )}
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
            <DialogTitle>{currentProduct.id ? "Edit Product ESG Profile" : "Add Product ESG Profile"}</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Register product carbon footprint and end-of-life recyclability.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Product Name</label>
                <input
                  type="text"
                  value={currentProduct.productName || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, productName: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Product Code</label>
                <input
                  type="text"
                  value={currentProduct.productCode || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, productCode: e.target.value })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Department</label>
                <select
                  value={currentProduct.deptId || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, deptId: Number(e.target.value) })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                >
                  <option value="">Select Dept</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9CA3AF]">Carbon Footprint (kg CO2e)</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentProduct.carbonFootprint === undefined ? "" : currentProduct.carbonFootprint}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, carbonFootprint: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#22C55E]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="text-sm font-semibold text-white">Is Product Recyclable?</label>
              <button
                onClick={() => setCurrentProduct({ ...currentProduct, recyclable: !currentProduct.recyclable })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  currentProduct.recyclable ? "bg-[#22C55E]" : "bg-[#2A2A2A]"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentProduct.recyclable ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#9CA3AF]">Notes</label>
              <input
                type="text"
                value={currentProduct.notes || ""}
                onChange={(e) => setCurrentProduct({ ...currentProduct, notes: e.target.value })}
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
            <DialogTitle className="text-red-400">Delete Product Profile?</DialogTitle>
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

