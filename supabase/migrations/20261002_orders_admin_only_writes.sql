-- =============================================================================
-- Orders: stop browsers writing them. Idempotent.
--
-- The storefront was retired in the v3 renewal (/shop, /cart and /checkout all
-- redirect away), but the policies its checkout relied on were left open:
--   * anyone could insert an order and its items, at any price;
--   * anon could flip a guest order from unpaid to paid
--     (orders_update_guest_finalize), which is how CheckoutPage marked an
--     order paid without the server ever asking PayPal;
--   * a signed-in owner could update their own order, payment_status included.
--
-- Nothing live writes orders any more. Admins keep update (order status and
-- notes in /admin/orders); edge functions use the service role and bypass RLS.
--
-- If the shop comes back, its checkout must create the order and take the
-- money server-side, as capture-inquiry-payment does — not reopen these.
-- =============================================================================

drop policy if exists orders_update_guest_finalize on koreabylocal.orders;
drop policy if exists orders_insert on koreabylocal.orders;
drop policy if exists order_items_insert on koreabylocal.order_items;

drop policy if exists orders_update_owner_admin on koreabylocal.orders;
drop policy if exists orders_update_admin on koreabylocal.orders;
create policy orders_update_admin on koreabylocal.orders
  for update using (koreabylocal.is_admin()) with check (koreabylocal.is_admin());
