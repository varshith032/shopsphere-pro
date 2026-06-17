import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const addressSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\d{10}$/),
  address_line: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { shipping_address: unknown }) => ({
    shipping_address: addressSchema.parse(input.shipping_address),
  }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Read user's cart with current product prices from DB (RLS-scoped to user)
    const { data: cart, error: cartErr } = await supabase
      .from("cart_items")
      .select("quantity, product:products(id, name, image_url, price, discount_price, stock)")
      .eq("user_id", userId);
    if (cartErr) throw new Error(cartErr.message);
    if (!cart || cart.length === 0) throw new Error("Cart is empty");

    type Row = { quantity: number; product: { id: string; name: string; image_url: string | null; price: number; discount_price: number | null; stock: number } | null };
    const rows = cart as unknown as Row[];

    let subtotal = 0;
    const orderItems: Array<{ product_id: string; product_name: string; product_image: string | null; quantity: number; price: number }> = [];
    for (const r of rows) {
      if (!r.product) throw new Error("A product in your cart is no longer available");
      if (r.quantity <= 0) throw new Error("Invalid quantity");
      if (r.product.stock < r.quantity) throw new Error(`Insufficient stock for ${r.product.name}`);
      const unit = r.product.discount_price ?? r.product.price;
      subtotal += unit * r.quantity;
      orderItems.push({
        product_id: r.product.id,
        product_name: r.product.name,
        product_image: r.product.image_url,
        quantity: r.quantity,
        price: unit,
      });
    }

    const shipping = subtotal > 0 && subtotal < 500 ? 40 : 0;
    const total = subtotal + shipping;

    const estimated = new Date();
    estimated.setDate(estimated.getDate() + 5);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: total,
        status: "pending",
        payment_status: "paid",
        shipping_address: data.shipping_address,
        estimated_delivery: estimated.toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Failed to create order");

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) throw new Error(itemsErr.message);

    await supabase.from("cart_items").delete().eq("user_id", userId);

    return { orderId: order.id as string };
  });

export const verifyAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });
