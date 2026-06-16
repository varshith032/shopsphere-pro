import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export type WishRow = { id: string; product_id: string; product: Product };

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async (): Promise<WishRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, product_id, product:products(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as unknown as WishRow[];
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Sign in to use wishlist");
      const { data: existing } = await supabase.from("wishlist_items")
        .select("id").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
      if (existing) {
        await supabase.from("wishlist_items").delete().eq("id", existing.id);
        return "removed" as const;
      }
      await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      return "added" as const;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(res === "added" ? "Added to wishlist" : "Removed from wishlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const items = query.data ?? [];
  const isInWishlist = (productId: string) => items.some((r) => r.product_id === productId);

  return { items, count: items.length, loading: query.isLoading, toggle, remove, isInWishlist };
}
