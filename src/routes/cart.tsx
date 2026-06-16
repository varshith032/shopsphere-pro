import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatINR, discountPct } from "@/lib/types";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Shopping Cart — ShopSphere" }] }),
  component: CartPage,
});

function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, shipping, total, loading, update, remove } = useCart();
  const navigate = useNavigate();

  if (authLoading) return <AppShell><div className="container mx-auto p-6"><Skeleton className="h-40 w-full" /></div></AppShell>;
  if (!user) return <AppShell><EmptyState title="Please sign in" body="Sign in to view your cart." action={<Button asChild><Link to="/auth">Sign in</Link></Button>} /></AppShell>;
  if (loading) return <AppShell><div className="container mx-auto p-6"><Skeleton className="h-60 w-full" /></div></AppShell>;
  if (items.length === 0) return <AppShell><EmptyState title="Your cart is empty" body="Looks like you haven't added anything yet." action={<Button asChild><Link to="/products">Continue Shopping</Link></Button>} /></AppShell>;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="card-elevated divide-y">
          <h1 className="p-4 text-lg font-bold">My Cart ({items.length})</h1>
          {items.map((row) => {
            const final = row.product.discount_price ?? row.product.price;
            const pct = discountPct(row.product.price, row.product.discount_price);
            return (
              <div key={row.id} className="p-4 flex gap-4">
                <Link to="/product/$id" params={{ id: row.product.id }} className="w-24 h-24 shrink-0 rounded bg-secondary overflow-hidden">
                  {row.product.image_url && <img src={row.product.image_url} alt={row.product.name} className="w-full h-full object-cover" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to="/product/$id" params={{ id: row.product.id }} className="text-sm font-medium line-clamp-2 hover:text-primary">
                    {row.product.name}
                  </Link>
                  {row.product.brand && <div className="text-xs text-muted-foreground">{row.product.brand}</div>}
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <span className="font-bold">{formatINR(final)}</span>
                    {pct > 0 && <>
                      <span className="text-xs line-through text-muted-foreground">{formatINR(row.product.price)}</span>
                      <span className="text-xs text-discount">{pct}% off</span>
                    </>}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border rounded">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => update.mutate({ id: row.id, quantity: row.quantity - 1 })}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-3 text-sm font-medium">{row.quantity}</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => update.mutate({ id: row.id, quantity: row.quantity + 1 })}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(row.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-32 h-fit">
          <div className="card-elevated p-4">
            <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Price Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? <span className="text-success">FREE</span> : formatINR(shipping)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
            <Button onClick={() => navigate({ to: "/checkout" })} size="lg" className="w-full mt-4 bg-accent text-accent-foreground hover:opacity-90 font-semibold">
              <ShoppingBag className="h-4 w-4 mr-2" /> Place Order
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center card-elevated max-w-lg mt-10">
      <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-muted-foreground">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
