import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatINR, discountPct } from "@/lib/types";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — ShopSphere" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const { items, remove } = useWishlist();
  const { add } = useCart();

  if (!user) return <AppShell><div className="container mx-auto p-10 text-center card-elevated max-w-lg mt-10">
    <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
    <h2 className="text-xl font-semibold mt-4">Sign in to use Wishlist</h2>
    <Button asChild className="mt-4"><Link to="/auth">Sign in</Link></Button>
  </div></AppShell>;

  if (items.length === 0) return <AppShell><div className="container mx-auto p-10 text-center card-elevated max-w-lg mt-10">
    <Heart className="h-12 w-12 mx-auto text-muted-foreground" />
    <h2 className="text-xl font-semibold mt-4">Your wishlist is empty</h2>
    <Button asChild className="mt-4"><Link to="/products">Browse Products</Link></Button>
  </div></AppShell>;

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">My Wishlist ({items.length})</h1>
        <div className="card-elevated divide-y">
          {items.map((row) => {
            const final = row.product.discount_price ?? row.product.price;
            const pct = discountPct(row.product.price, row.product.discount_price);
            return (
              <div key={row.id} className="p-4 flex gap-4 items-center">
                <Link to="/product/$id" params={{ id: row.product.id }} className="w-20 h-20 shrink-0 rounded bg-secondary overflow-hidden">
                  {row.product.image_url && <img src={row.product.image_url} alt={row.product.name} className="w-full h-full object-cover" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to="/product/$id" params={{ id: row.product.id }} className="text-sm font-medium line-clamp-2 hover:text-primary">{row.product.name}</Link>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold">{formatINR(final)}</span>
                    {pct > 0 && <span className="text-xs line-through text-muted-foreground">{formatINR(row.product.price)}</span>}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" onClick={() => { add.mutate({ productId: row.product.id }); remove.mutate(row.id); }}>
                    <ShoppingCart className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Move to Cart</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove.mutate(row.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
