import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Filter } from "lucide-react";

type Search = { q?: string; category?: string; sort?: string; minPrice?: number; maxPrice?: number; rating?: number };

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    category: typeof s.category === "string" ? s.category : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    minPrice: typeof s.minPrice === "number" ? s.minPrice : undefined,
    maxPrice: typeof s.maxPrice === "number" ? s.maxPrice : undefined,
    rating: typeof s.rating === "number" ? s.rating : undefined,
  }),
  head: () => ({ meta: [{ title: "All Products — ShopSphere" }, { name: "description", content: "Browse all products on ShopSphere." }] }),
  component: ProductsPage,
});

const PAGE_SIZE = 24;

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  const activeCat = categories?.find((c) => c.slug === search.category);

  const { data, isLoading } = useQuery({
    queryKey: ["products", "list", search, page],
    queryFn: async () => {
      let q = supabase.from("products").select("*", { count: "exact" });
      if (search.q) q = q.ilike("name", `%${search.q}%`);
      if (activeCat) q = q.eq("category_id", activeCat.id);
      if (search.minPrice != null) q = q.gte("price", search.minPrice);
      if (search.maxPrice != null) q = q.lte("price", search.maxPrice);
      if (search.rating != null) q = q.gte("rating", search.rating);

      switch (search.sort) {
        case "price_asc": q = q.order("price", { ascending: true }); break;
        case "price_desc": q = q.order("price", { ascending: false }); break;
        case "newest": q = q.order("created_at", { ascending: false }); break;
        case "popular":
        default: q = q.order("rating_count", { ascending: false }); break;
      }

      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { items: (data ?? []) as Product[], total: count ?? 0 };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">{activeCat?.name ?? "All Products"}</span>
          {search.q && <><span>/</span><span>Search: "{search.q}"</span></>}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Mobile filter */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <Filters search={search} categories={categories ?? []} onChange={(s) => navigate({ search: s as never })} />
              </SheetContent>
            </Sheet>
          </div>

          <aside className="hidden md:block w-60 shrink-0">
            <div className="card-elevated p-4 sticky top-32">
              <Filters search={search} categories={categories ?? []} onChange={(s) => navigate({ search: s as never })} />
            </div>
          </aside>

          <div className="flex-1">
            <div className="card-elevated p-3 mb-4 flex items-center justify-between gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">{data?.total ?? 0} products found</div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Sort by:</span>
                <Select value={search.sort ?? "popular"} onValueChange={(v) => navigate({ search: { ...search, sort: v } as never })}>
                  <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popularity</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
              </div>
            ) : (data?.items.length ?? 0) === 0 ? (
              <div className="card-elevated p-10 text-center">
                <h3 className="text-lg font-semibold">No products found</h3>
                <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {data!.items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Filters({ search, categories, onChange }: { search: Search; categories: Category[]; onChange: (s: Search) => void }) {
  const [range, setRange] = useState<[number, number]>([search.minPrice ?? 0, search.maxPrice ?? 200000]);
  const ratings = useMemo(() => [4, 3, 2], []);
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Categories</h4>
        <div className="space-y-1 text-sm max-h-60 overflow-y-auto">
          <button
            className={`block w-full text-left px-2 py-1 rounded ${!search.category ? "bg-secondary font-medium" : "hover:bg-secondary"}`}
            onClick={() => onChange({ ...search, category: undefined })}
          >All</button>
          {categories.map((c) => (
            <button key={c.id}
              className={`block w-full text-left px-2 py-1 rounded ${search.category === c.slug ? "bg-secondary font-medium" : "hover:bg-secondary"}`}
              onClick={() => onChange({ ...search, category: c.slug })}
            >{c.name}</button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Price Range</h4>
        <Slider
          min={0} max={200000} step={500}
          value={range}
          onValueChange={(v) => setRange(v as [number, number])}
        />
        <div className="flex justify-between text-xs mt-2 text-muted-foreground">
          <span>₹{range[0]}</span><span>₹{range[1]}</span>
        </div>
        <Button size="sm" variant="outline" className="mt-2 w-full"
          onClick={() => onChange({ ...search, minPrice: range[0], maxPrice: range[1] })}>Apply</Button>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Customer Rating</h4>
        <div className="space-y-2 text-sm">
          {ratings.map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={search.rating === r}
                onCheckedChange={(c) => onChange({ ...search, rating: c ? r : undefined })} />
              {r}★ & above
            </label>
          ))}
        </div>
      </div>

      <Button variant="ghost" size="sm" className="w-full"
        onClick={() => onChange({})}>Clear all filters</Button>
    </div>
  );
}
