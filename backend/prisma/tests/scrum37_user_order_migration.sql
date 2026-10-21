BEGIN;

-- Tạo User
INSERT INTO users (
  id, email, password_hash
)
VALUES (
  'e2000000-0000-4000-8000-000000000001',
  'scrum37-test@example.com',
  'test-hash'
);

-- Tạo Order
INSERT INTO orders (
  id, user_id,
  subtotal_vnd, total_vnd,
  expires_at
)
VALUES (
  'e3000000-0000-4000-8000-000000000001',
  'e2000000-0000-4000-8000-000000000001',
  36000, 36000,
  NOW() + INTERVAL '15 minutes'
);

-- Tạo OrderItem
INSERT INTO order_items (
  id,
  order_id,
  product_id,
  product_name_snapshot,
  size,
  size_percent_snapshot,
  base_price_snapshot_vnd,
  unit_price_vnd,
  quantity,
  line_total_vnd
)
VALUES (
  'e4000000-0000-4000-8000-000000000001',
  'e3000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  'Cà phê đen',
  'M',
  120,
  30000,
  36000,
  1,
  36000
);

-- Kiểm tra quan hệ
SELECT
  u.email,
  o.status AS order_status,
  oi.product_name_snapshot,
  oi.size,
  oi.size_percent_snapshot,
  oi.unit_price_vnd,
  oi.quantity,
  oi.line_total_vnd
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN order_items oi ON oi.order_id = o.id
WHERE u.email = 'scrum37-test@example.com';

ROLLBACK;

SELECT
  (SELECT COUNT(*) FROM users
   WHERE email = 'scrum37-test@example.com') AS test_users,

  (SELECT COUNT(*) FROM orders
   WHERE id = 'e3000000-0000-4000-8000-000000000001') AS test_orders,

  (SELECT COUNT(*) FROM order_items
   WHERE id = 'e4000000-0000-4000-8000-000000000001') AS test_items;