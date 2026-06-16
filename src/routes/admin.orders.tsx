import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, ORDER_STAGES, type Order } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const { data: orders } = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") q = q.eq("status", filter as Order["status"]);
      const { data, error } = await q;
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Order updated");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const filtered = (orders ?? []).filter((o) => !search || o.id.includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search order ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="p-2">Order ID</th><th className="p-2">Date</th><th className="p-2">Total</th><th className="p-2">Payment</th><th className="p-2">Status</th><th className="p-2"></th></tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((o) => (
              <tr key={o.id}>
                <td className="p-2 font-mono"><Link to="/orders/$id" params={{ id: o.id }} className="text-primary hover:underline">{o.id.slice(0, 8)}</Link></td>
                <td className="p-2">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-2 font-semibold">{formatINR(Number(o.total_amount))}</td>
                <td className="p-2"><Badge variant="outline" className="capitalize">{o.payment_status}</Badge></td>
                <td className="p-2">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Order["status"])}>
                    <SelectTrigger className="h-8 w-40 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2"><Link to="/orders/$id" params={{ id: o.id }} className="text-sm text-primary hover:underline">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
