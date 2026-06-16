export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  price: number;
  discount_price: number | null;
  stock: number;
  image_url: string | null;
  images: unknown;
  rating: number | null;
  rating_count: number | null;
  featured: boolean | null;
  created_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean | null;
  created_at: string;
};

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: string;
  shipping_address: Address;
  estimated_delivery: string | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
};

export const ORDER_STAGES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function discountPct(price: number, discount: number | null | undefined) {
  if (!discount || discount >= price) return 0;
  return Math.round(((price - discount) / price) * 100);
}
