"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Box, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<ProductESGProfile>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

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
    if (!productToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/environmental/products/${productToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
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
            <Box className="w-8 h-8 text-[#22C55E]" /> Product ESG Profiles
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Track product recyclability and total carbon footprint across departments.
          </p>
        </div>
        <Button
          onClick={() => {
            setCurrentProduct({ productName: "", productCode: "", deptId: departments[0]?.id || 0, carbonFootprint: 0, recyclable: false, notes: "" });
            setModalOpen(true);
          }}
          className="bg-[#22C55E] hover:bg-[#1eb053] text-black font-semibold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Profile
        </Button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-[#111111] border-b border-[#2A2A2A]">
            <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="text-white font-medium">Product</TableHead>
              <TableHead className="text-white font-medium">Department</TableHead>
              <TableHead className="text-white font-medium text-right">Footprint (kg CO2e)</TableHead>
              <TableHead className="text-white font-medium text-center">Recyclable</TableHead>
              <TableHead className="text-white font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-[#9CA3AF]">
                  No products configured yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className="border-b border-[#2A2A2A]/50 hover:bg-[#22C55E]/5 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-semibold text-white">{product.productName}</p>
                      <p className="text-xs text-[#9CA3AF] font-mono">{product.productCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A]">
                      {product.dept?.name || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[#22C55E] font-medium">{product.carbonFootprint}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={product.recyclable ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}>
                      {product.recyclable ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentProduct(product);
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
                          setProductToDelete(product.id);
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
