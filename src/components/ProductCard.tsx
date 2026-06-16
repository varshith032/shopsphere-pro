import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { discountPct, formatINR } from "@/lib/types";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { toggle, isInWishlist } = useWishlist();
  const inWish = isInWishlist(product.id);
  const pct = discountPct(product.price, product.discount_price);
  const final = product.discount_price ?? product.price;

  return (
    <div className="group card-elevated card-elevated-hover overflow-hidden flex flex-col h-full">
      <Link to="/product/$id" params={{ id: product.id }} className="block relative aspect-square bg-secondary overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">No image</div>
        )}
        {pct > 0 && (
          <Badge className="absolute top-2 left-2 bg-discount text-white">{pct}% OFF</Badge>
        )}
        <Button
          type="button"
          variant="secondary" size="icon"
          onClick={(e) => { e.preventDefault(); toggle.mutate(product.id); }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 hover:bg-white"
          aria-label="Toggle wishlist"
        >
          <Heart className={cn("h-4 w-4", inWish && "fill-destructive text-destructive")} />
        </Button>
      </Link>
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.brand && <div className="text-xs text-muted-foreground">{product.brand}</div>}
        <Link to="/product/$id" params={{ id: product.id }}
          className="text-sm font-medium line-clamp-2 hover:text-primary min-h-[2.5rem]">
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold bg-rating text-white px-1.5 py-0.5 rounded">
            {product.rating?.toFixed(1) ?? "4.0"} <Star className="h-3 w-3 fill-white" />
          </span>
          <span className="text-xs text-muted-foreground">({product.rating_count ?? 0})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold">{formatINR(final)}</span>
          {pct > 0 && (
            <>
              <span className="text-xs text-muted-foreground line-through">{formatINR(product.price)}</span>
              <span className="text-xs text-discount font-medium">{pct}% off</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
