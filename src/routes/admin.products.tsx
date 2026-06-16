import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { formatINR } from "@/lib/types";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const empty: Partial<Product> & { category_id?: string } = {
  name: "", description: "", brand: "", price: 0, discount_price: null,
  stock: 0, image_url: "", featured: false, category_id: undefined,
};

function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product> & { category_id?: string }>(empty);

  const { data: cats } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data as Category[],
  });

  const { data: products } = useQuery({
    queryKey: ["admin", "products", search],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false }).limit(100);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Product[];
    },
  });

  const save = async () => {
    if (!editing.name?.trim()) return toast.error("Name is required");
    const payload = {
      name: editing.name.trim(),
      description: editing.description ?? null,
      brand: editing.brand ?? null,
      price: Number(editing.price),
      discount_price: editing.discount_price ? Number(editing.discount_price) : null,
      stock: Number(editing.stock),
      image_url: editing.image_url ?? null,
      featured: !!editing.featured,
      category_id: editing.category_id || null,
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Product updated" : "Product added");
    setOpen(false); setEditing(empty);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing.id ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Name</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>Brand</Label><Input value={editing.brand ?? ""} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={editing.category_id ?? ""} onValueChange={(v) => setEditing({ ...editing, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Price</Label><Input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
              <div><Label>Discount Price</Label><Input type="number" value={editing.discount_price ?? ""} onChange={(e) => setEditing({ ...editing, discount_price: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Stock</Label><Input type="number" value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></div>
              <div><Label>Featured</Label>
                <Select value={editing.featured ? "1" : "0"} onValueChange={(v) => setEditing({ ...editing, featured: v === "1" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0">No</SelectItem><SelectItem value="1">Yes</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Image URL</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />

      <div className="card-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="p-2">Image</th><th className="p-2">Name</th><th className="p-2">Brand</th>
              <th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="p-2"><img src={p.image_url ?? ""} alt="" className="w-12 h-12 object-cover rounded" /></td>
                <td className="p-2 max-w-xs"><div className="line-clamp-2">{p.name}</div></td>
                <td className="p-2">{p.brand}</td>
                <td className="p-2">{formatINR(p.discount_price ?? p.price)}</td>
                <td className="p-2">{p.stock}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing({ ...p, category_id: p.category_id ?? undefined }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
