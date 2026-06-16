import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export type CartRow = { id: string; product_id: string; quantity: number; product: Product };

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async (): Promise<CartRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity, product:products(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as unknown as CartRow[];
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user) throw new Error("Sign in to add to cart");
      const { data: existing } = await supabase
        .from("cart_items").select("id, quantity")
        .eq("user_id", user.id).eq("product_id", productId).maybeSingle();
      if (existing) {
        const { error } = await supabase.from("cart_items")
          .update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items")
          .insert({ user_id: user.id, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cart"] }); toast.success("Added to cart"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cart"] }); toast.success("Removed from cart"); },
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = query.data ?? [];
  const subtotal = items.reduce((s, r) => s + (r.product?.discount_price ?? r.product?.price ?? 0) * r.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 500 ? 40 : 0;
  const total = subtotal + shipping;
  const count = items.reduce((s, r) => s + r.quantity, 0);

  return { items, subtotal, shipping, total, count, loading: query.isLoading, add, update, remove, clear };
}
