import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { discountPct, formatINR } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Zap, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toggle, isInWishlist } = useWishlist();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["product", id, "related"],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase.from("products").select("*").eq("category_id", product.category_id).neq("id", id).limit(6);
      return (data ?? []) as Product[];
    },
    enabled: !!product,
  });

  if (isLoading) {
    return <AppShell><div className="container mx-auto p-4 grid md:grid-cols-2 gap-6">
      <Skeleton className="aspect-square rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" /><Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" /><Skeleton className="h-20 w-full" />
      </div>
    </div></AppShell>;
  }
  if (!product) return <AppShell><div className="container mx-auto p-10 text-center">Product not found</div></AppShell>;

  const final = product.discount_price ?? product.price;
  const pct = discountPct(product.price, product.discount_price);
  const inWish = isInWishlist(product.id);

  const buyNow = () => {
    add.mutate({ productId: product.id }, { onSuccess: () => navigate({ to: "/checkout" }) });
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-4">
        <div className="text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary">Home</Link> / <Link to="/products" className="hover:text-primary">Products</Link> / <span className="text-foreground">{product.name}</span>
        </div>

        <div className="card-elevated p-4 md:p-6 grid md:grid-cols-[40%_60%] gap-6">
          <div className="space-y-3">
            <div className="aspect-square bg-secondary rounded overflow-hidden">
              {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => add.mutate({ productId: product.id })} disabled={product.stock === 0}
                size="lg" className="flex-1 bg-accent text-accent-foreground hover:opacity-90 font-semibold">
                <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
              </Button>
              <Button onClick={buyNow} disabled={product.stock === 0}
                size="lg" className="flex-1 bg-[oklch(0.65_0.2_40)] text-white hover:opacity-90 font-semibold">
                <Zap className="h-4 w-4 mr-2" /> Buy Now
              </Button>
            </div>
          </div>

          <div>
            {product.brand && <div className="text-sm text-muted-foreground">{product.brand}</div>}
            <h1 className="text-xl md:text-2xl font-semibold mt-1">{product.name}</h1>

            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-rating text-white px-2 py-0.5 rounded">
                {product.rating?.toFixed(1)} <Star className="h-3 w-3 fill-white" />
              </span>
              <span className="text-sm text-muted-foreground">{product.rating_count} ratings</span>
            </div>

            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold">{formatINR(final)}</span>
              {pct > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatINR(product.price)}</span>
                  <Badge className="bg-discount text-white">{pct}% off</Badge>
                </>
              )}
            </div>

            <div className="mt-2 text-sm">
              {product.stock > 0
                ? <span className="text-success font-medium">In Stock ({product.stock} available)</span>
                : <span className="text-destructive font-medium">Out of Stock</span>}
            </div>

            <Button variant="outline" onClick={() => toggle.mutate(product.id)} className="mt-3">
              <Heart className={cn("h-4 w-4 mr-2", inWish && "fill-destructive text-destructive")} />
              {inWish ? "In Wishlist" : "Add to Wishlist"}
            </Button>

            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3"><Truck className="h-6 w-6 mx-auto text-primary" /><div className="mt-1">Free Delivery</div></div>
              <div className="p-3"><RotateCcw className="h-6 w-6 mx-auto text-primary" /><div className="mt-1">7-Day Returns</div></div>
              <div className="p-3"><ShieldCheck className="h-6 w-6 mx-auto text-primary" /><div className="mt-1">Warranty</div></div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Specifications</h3>
              <dl className="text-sm divide-y border rounded">
                <div className="grid grid-cols-3 p-2"><dt className="text-muted-foreground">Brand</dt><dd className="col-span-2">{product.brand ?? "—"}</dd></div>
                <div className="grid grid-cols-3 p-2"><dt className="text-muted-foreground">Rating</dt><dd className="col-span-2">{product.rating}</dd></div>
                <div className="grid grid-cols-3 p-2"><dt className="text-muted-foreground">Stock</dt><dd className="col-span-2">{product.stock}</dd></div>
              </dl>
            </div>
          </div>
        </div>

        {(related?.length ?? 0) > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {related!.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
