import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/types";
import type { Order } from "@/lib/types";
import { Package } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — ShopSphere" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  if (!user) return <AppShell><div className="container mx-auto p-10 text-center card-elevated max-w-lg mt-10">
    <Button asChild><Link to="/auth">Sign in to view orders</Link></Button>
  </div></AppShell>;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        {isLoading ? <div>Loading…</div> :
          (orders?.length ?? 0) === 0 ? (
            <div className="card-elevated p-10 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold mt-4">No orders yet</h2>
              <Button asChild className="mt-4"><Link to="/products">Start Shopping</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders!.map((o) => (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }}
                  className="card-elevated card-elevated-hover p-4 flex items-center justify-between block">
                  <div>
                    <div className="text-sm text-muted-foreground">Order ID: <span className="font-mono text-foreground">{o.id.slice(0, 8)}</span></div>
                    <div className="text-sm mt-1">Placed on {new Date(o.created_at).toLocaleDateString()}</div>
                    <div className="text-lg font-bold mt-1">{formatINR(Number(o.total_amount))}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{o.status.replace(/_/g, " ")}</Badge>
                </Link>
              ))}
            </div>
          )}
      </div>
    </AppShell>
  );
}
