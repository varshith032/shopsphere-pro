import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/types";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [products, orders, profiles] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total_amount", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      const revenue = (orders.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        users: profiles.count ?? 0,
        revenue,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, total_amount, status, created_at").order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Total Revenue", value: formatINR(stats?.revenue ?? 0), icon: DollarSign, color: "bg-success/10 text-success" },
    { label: "Total Orders", value: stats?.orders ?? 0, icon: ShoppingCart, color: "bg-primary/10 text-primary" },
    { label: "Total Products", value: stats?.products ?? 0, icon: Package, color: "bg-accent/20 text-accent-foreground" },
    { label: "Total Users", value: stats?.users ?? 0, icon: Users, color: "bg-warning/20 text-warning-foreground" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="card-elevated p-4">
            <div className={`inline-flex p-2 rounded ${c.color}`}><c.icon className="h-5 w-5" /></div>
            <div className="text-2xl font-bold mt-2">{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="card-elevated p-4">
        <h2 className="font-bold mb-3">Recent Orders</h2>
        <div className="divide-y">
          {(recent ?? []).map((o) => (
            <Link key={o.id} to="/orders/$id" params={{ id: o.id }}
              className="flex items-center justify-between py-2 text-sm hover:bg-secondary px-2 rounded">
              <span className="font-mono">{o.id.slice(0, 8)}</span>
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
              <Badge variant="outline" className="capitalize">{o.status.replace(/_/g, " ")}</Badge>
              <span className="font-semibold">{formatINR(Number(o.total_amount))}</span>
            </Link>
          ))}
          {(recent ?? []).length === 0 && <div className="text-muted-foreground text-sm py-4">No orders yet.</div>}
        </div>
      </div>
    </div>
  );
}
