
-- 1. Restrict reviews public read to authenticated users (hide user_id from anon enumeration)
DROP POLICY IF EXISTS "Reviews: public read" ON public.reviews;
CREATE POLICY "Reviews: authenticated read" ON public.reviews FOR SELECT TO authenticated USING (true);

-- 2. Move has_role to a private schema so it's not exposed via PostgREST RPC
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Recreate policies to use private.has_role
DROP POLICY IF EXISTS "Categories: admin write" ON public.categories;
CREATE POLICY "Categories: admin write" ON public.categories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Products: admin write" ON public.products;
CREATE POLICY "Products: admin write" ON public.products FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Orders: own read" ON public.orders;
CREATE POLICY "Orders: own read" ON public.orders FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Orders: admin update" ON public.orders;
CREATE POLICY "Orders: admin update" ON public.orders FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "OrderItems: own read" ON public.order_items;
CREATE POLICY "OrderItems: own read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
    AND (o.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))));

-- Drop the public-schema has_role so PostgREST stops exposing it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
