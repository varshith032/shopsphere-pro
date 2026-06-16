import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/admin/categories")({ component: AdminCategories });

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Category>>({ name: "", slug: "", image_url: "" });

  const { data: cats } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data as Category[],
  });

  const save = async () => {
    const payload = { name: editing.name!, slug: editing.slug!, image_url: editing.image_url };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false); setEditing({ name: "", slug: "", image_url: "" });
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => setEditing({ name: "", slug: "", image_url: "" })}><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(cats ?? []).map((c) => (
          <div key={c.id} className="card-elevated p-3 flex items-center gap-3">
            <img src={c.image_url ?? ""} alt={c.name} className="w-14 h-14 rounded object-cover bg-secondary" />
            <div className="flex-1">
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => del(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
