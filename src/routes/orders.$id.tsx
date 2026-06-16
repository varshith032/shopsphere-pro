import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, ORDER_STAGES, type Order, type OrderItem } from "@/lib/types";
import { CheckCircle2, Circle, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();

  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Order | null;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["order", id, "items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
      if (error) throw error;
      return data as OrderItem[];
    },
  });

  if (!order) return <AppShell><div className="container mx-auto p-10">Loading…</div></AppShell>;

  const currentStageIdx = ORDER_STAGES.indexOf(order.status === "cancelled" ? "pending" : order.status);

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Link to="/orders" className="text-sm text-primary hover:underline">← Back to orders</Link>

        <div className="card-elevated p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="font-mono text-sm">{order.id}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{formatINR(Number(order.total_amount))}</div>
            </div>
          </div>
        </div>

        <div className="card-elevated p-4">
          <h2 className="font-bold mb-4">Order Tracking</h2>
          {order.status === "cancelled" ? (
            <div className="text-destructive">This order was cancelled.</div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {ORDER_STAGES.map((s, i) => {
                const done = i <= currentStageIdx;
                return (
                  <div key={s} className="flex flex-col items-center text-center">
                    {done
                      ? <CheckCircle2 className="h-6 w-6 text-success" />
                      : <Circle className="h-6 w-6 text-muted-foreground" />}
                    <span className={cn("text-xs mt-1 capitalize", done ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {s.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {order.estimated_delivery && (
            <div className="mt-4 text-sm flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Estimated delivery: <strong>{new Date(order.estimated_delivery).toDateString()}</strong></div>
          )}
        </div>

        <div className="card-elevated p-4">
          <h2 className="font-bold mb-3">Shipping Address</h2>
          <div className="text-sm">
            <div className="font-medium">{order.shipping_address.full_name}</div>
            <div className="text-muted-foreground">{order.shipping_address.address_line}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</div>
            <div className="text-muted-foreground">Phone: {order.shipping_address.phone}</div>
          </div>
        </div>

        <div className="card-elevated p-4">
          <h2 className="font-bold mb-3">Items</h2>
          <div className="divide-y">
            {(items ?? []).map((it) => (
              <div key={it.id} className="py-3 flex gap-3">
                <img src={it.product_image ?? ""} alt="" className="w-16 h-16 object-cover rounded bg-secondary" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{it.product_name}</div>
                  <div className="text-xs text-muted-foreground">Qty: {it.quantity}</div>
                </div>
                <div className="font-semibold">{formatINR(Number(it.price) * it.quantity)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
