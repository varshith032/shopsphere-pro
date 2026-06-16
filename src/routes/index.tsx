import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopSphere — Shop Electronics, Fashion, Mobiles & More" },
      { name: "description", content: "India's friendly online marketplace. Top brands, best prices, fast delivery." },
    ],
  }),
  component: HomePage,
});

const BANNERS = [
  { title: "Big Billion Deals", subtitle: "Up to 80% off on Electronics", color: "from-[oklch(0.55_0.22_255)] to-[oklch(0.45_0.2_270)]", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600" },
  { title: "Fashion Forward", subtitle: "Min 50% off on trending styles", color: "from-[oklch(0.6_0.2_20)] to-[oklch(0.5_0.2_350)]", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600" },
  { title: "Home Makeover", subtitle: "Appliances starting at ₹999", color: "from-[oklch(0.55_0.18_180)] to-[oklch(0.5_0.18_230)]", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600" },
];

function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: featured, isLoading: fLoading } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("featured", true).limit(12);
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: trending, isLoading: tLoading } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("rating_count", { ascending: false }).limit(12);
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: newest } = useQuery({
    queryKey: ["products", "newest"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return data as Product[];
    },
  });

  return (
    <AppShell>
      {/* Category strip */}
      <div className="bg-surface border-b">
        <div className="container mx-auto px-2 py-3 overflow-x-auto">
          <div className="flex gap-2 md:gap-6 min-w-max md:justify-center">
            {(categories ?? []).map((c) => (
              <Link key={c.id} to="/products" search={{ category: c.slug } as never}
                className="flex flex-col items-center gap-1 min-w-[72px] p-2 rounded hover:bg-secondary transition">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-secondary">
                  {c.image_url && <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />}
                </div>
                <span className="text-xs font-medium text-center">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Hero carousel */}
      <section className="container mx-auto px-4 pt-4">
        <Carousel className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {BANNERS.map((b, i) => (
              <CarouselItem key={i}>
                <div className={`relative aspect-[3/1] md:aspect-[5/1] rounded-lg overflow-hidden bg-gradient-to-r ${b.color}`}>
                  <img src={b.img} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-40" />
                  <div className="relative h-full flex flex-col justify-center px-6 md:px-16 text-white">
                    <h2 className="text-2xl md:text-5xl font-bold">{b.title}</h2>
                    <p className="mt-2 md:text-lg opacity-95">{b.subtitle}</p>
                    <Button asChild size="lg" className="mt-4 w-fit bg-accent text-accent-foreground hover:opacity-90">
                      <Link to="/products">Shop Now <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex left-2" />
          <CarouselNext className="hidden md:flex right-2" />
        </Carousel>
      </section>

      {/* Trust strip */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Truck, t: "Free Delivery", s: "On orders over ₹500" },
            { icon: ShieldCheck, t: "Secure Payments", s: "100% protected" },
            { icon: RotateCcw, t: "Easy Returns", s: "7-day return policy" },
            { icon: Headphones, t: "24/7 Support", s: "We're here to help" },
          ].map((f, i) => (
            <div key={i} className="card-elevated p-4 flex items-center gap-3">
              <f.icon className="h-8 w-8 text-primary" />
              <div>
                <div className="text-sm font-semibold">{f.t}</div>
                <div className="text-xs text-muted-foreground">{f.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductRow title="Featured Products" products={featured} loading={fLoading} />
      <ProductRow title="Trending Now" products={trending} loading={tLoading} />
      <ProductRow title="New Arrivals" products={newest} loading={false} />

      {/* Promo banner */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-gradient-to-r from-primary to-[oklch(0.45_0.22_270)] text-white p-6 md:p-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-2xl md:text-3xl font-bold">Get an extra 10% off</h3>
            <p className="mt-1 opacity-90">Sign up today and unlock new-member rewards on your first order.</p>
          </div>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:opacity-90">
            <Link to="/auth">Create Account</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

function ProductRow({ title, products, loading }: { title: string; products?: Product[]; loading: boolean }) {
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        <Link to="/products" className="text-sm text-primary font-medium hover:underline">View all</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)
          : (products ?? []).slice(0, 12).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
