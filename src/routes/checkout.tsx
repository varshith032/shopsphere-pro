import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { placeOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ShopSphere" }] }),
  component: CheckoutPage,
});


const addressSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\d{10}$/, "Enter 10-digit phone"),
  address_line: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter 6-digit pincode"),
});

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, shipping, total, clear } = useCart();
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);
  const [placed, setPlaced] = useState<{ orderId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", address_line: "", city: "", state: "", pincode: "" });


  if (!user) return <AppShell><div className="container mx-auto p-10 text-center card-elevated max-w-lg mt-10">
    <h2 className="text-xl font-semibold">Sign in to checkout</h2>
    <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>
  </div></AppShell>;

  if (placed) {
    return (
      <AppShell>
        <div className="container mx-auto p-10 text-center card-elevated max-w-lg mt-10">
          <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
          <h2 className="text-2xl font-bold mt-4">Order placed successfully!</h2>
          <p className="text-muted-foreground mt-2">Order ID: <span className="font-mono">{placed.orderId.slice(0, 8)}</span></p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button asChild><Link to="/orders/$id" params={{ id: placed.orderId }}>Track Order</Link></Button>
            <Button asChild variant="outline"><Link to="/products">Continue Shopping</Link></Button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (items.length === 0) return <AppShell><div className="container mx-auto p-10 text-center card-elevated max-w-lg mt-10">
    <h2 className="text-xl font-semibold">Your cart is empty</h2>
    <Button asChild className="mt-4"><Link to="/products">Shop now</Link></Button>
  </div></AppShell>;

  const handlePlaceOrder = async () => {
    const parsed = addressSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({ data: { shipping_address: parsed.data } });
      await clear.mutateAsync();
      setPlaced({ orderId: result.orderId });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div className="card-elevated p-4">
            <h2 className="text-lg font-bold mb-4">Shipping Address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full Name" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} />
              <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
              <Field label="Address" v={form.address_line} on={(v) => setForm({ ...form, address_line: v })} cls="sm:col-span-2" />
              <Field label="City" v={form.city} on={(v) => setForm({ ...form, city: v })} />
              <Field label="State" v={form.state} on={(v) => setForm({ ...form, state: v })} />
              <Field label="Pincode" v={form.pincode} on={(v) => setForm({ ...form, pincode: v })} />
            </div>
          </div>

          <div className="card-elevated p-4">
            <h2 className="text-lg font-bold mb-3">Order Summary</h2>
            <div className="divide-y">
              {items.map((row) => (
                <div key={row.id} className="py-2 flex gap-3 text-sm">
                  <img src={row.product.image_url ?? ""} alt="" className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1 line-clamp-2">{row.product.name}</div>
                  <div>×{row.quantity}</div>
                  <div className="font-semibold">{formatINR((row.product.discount_price ?? row.product.price) * row.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-32">
          <div className="card-elevated p-4">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Price Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <Button disabled={submitting} onClick={handlePlaceOrder} size="lg"
              className="w-full mt-4 bg-accent text-accent-foreground hover:opacity-90 font-semibold">
              {submitting ? "Placing..." : "Place Order"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">Demo checkout — no real payment is processed.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Field({ label, v, on, cls }: { label: string; v: string; on: (v: string) => void; cls?: string }) {
  return (
    <div className={cls}>
      <Label className="text-xs">{label}</Label>
      <Input value={v} onChange={(e) => on(e.target.value)} className="mt-1" />
    </div>
  );
}
