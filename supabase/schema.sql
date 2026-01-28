-- ===================================
-- BBP (Beauty & Bathing Pet) Database Schema
-- สำหรับ Supabase PostgreSQL
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- DROP EXISTING TABLES (CASCADE)
-- ===================================
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS pos_order_items CASCADE;
DROP TABLE IF EXISTS pos_orders CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS service_prices CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS breeds CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS size_configs CASCADE;
DROP TABLE IF EXISTS pet_type_configs CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Drop views
DROP VIEW IF EXISTS service_history CASCADE;
DROP VIEW IF EXISTS dashboard_stats CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;

-- ===================================
-- 1. CUSTOMERS TABLE
-- ===================================
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_phone UNIQUE(phone)
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- ===================================
-- 2. PETS TABLE
-- ===================================
CREATE TABLE pets (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL,
  breed VARCHAR(255),
  breed_2 VARCHAR(255),
  is_mixed_breed BOOLEAN NOT NULL DEFAULT false,
  weight DECIMAL(5,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_pet_type CHECK (type IN ('DOG', 'CAT')),
  CONSTRAINT check_pet_weight CHECK (weight > 0),
  CONSTRAINT check_mixed_breed CHECK (
    (is_mixed_breed = false AND breed_2 IS NULL) OR
    (is_mixed_breed = true AND breed IS NOT NULL AND breed_2 IS NOT NULL)
  )
);

CREATE INDEX idx_pets_customer_id ON pets(customer_id);
CREATE INDEX idx_pets_type ON pets(type);

-- ===================================
-- 3. PET TYPE CONFIGS TABLE
-- ===================================
CREATE TABLE pet_type_configs (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  order_index INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_order_index UNIQUE(order_index)
);

CREATE INDEX idx_pet_type_configs_active ON pet_type_configs(active);

-- ===================================
-- 4. SIZE CONFIGS TABLE
-- ===================================
CREATE TABLE size_configs (
  id VARCHAR(50) PRIMARY KEY,
  pet_type_id VARCHAR(50) NOT NULL REFERENCES pet_type_configs(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  min_weight DECIMAL(5,2),
  max_weight DECIMAL(5,2),
  description VARCHAR(255),
  order_index INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_weight_range CHECK (
    min_weight IS NULL OR 
    max_weight IS NULL OR 
    min_weight < max_weight
  )
);

CREATE INDEX idx_size_configs_pet_type_id ON size_configs(pet_type_id);
CREATE INDEX idx_size_configs_active ON size_configs(active);

-- ===================================
-- 5. SERVICES TABLE
-- ===================================
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_special BOOLEAN NOT NULL DEFAULT false,
  special_price DECIMAL(10,2),
  active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_special_service CHECK (
    (is_special = false AND special_price IS NULL) OR
    (is_special = true AND special_price IS NOT NULL AND special_price >= 0)
  )
);

CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_order ON services(order_index);
CREATE INDEX idx_services_is_special ON services(is_special);

-- ===================================
-- 6. SERVICE PRICES TABLE
-- ===================================
CREATE TABLE service_prices (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  pet_type_id VARCHAR(50) REFERENCES pet_type_configs(id) ON DELETE CASCADE,
  size_id VARCHAR(50) REFERENCES size_configs(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_service_pet_size UNIQUE(service_id, pet_type_id, size_id),
  CONSTRAINT check_price CHECK (price >= 0),
  CONSTRAINT check_pet_type_size CHECK (
    (pet_type_id IS NOT NULL AND size_id IS NOT NULL) OR
    (pet_type_id IS NULL AND size_id IS NULL)
  )
);

CREATE INDEX idx_service_prices_service_id ON service_prices(service_id);
CREATE INDEX idx_service_prices_pet_type_size ON service_prices(pet_type_id, size_id);

-- ===================================
-- 7. BREEDS TABLE (สายพันธุ์สัตว์)
-- ===================================
CREATE TABLE breeds (
  id SERIAL PRIMARY KEY,
  pet_type_id VARCHAR(50) NOT NULL REFERENCES pet_type_configs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_mixed BOOLEAN NOT NULL DEFAULT false,
  parent_breed_1_id INTEGER REFERENCES breeds(id) ON DELETE SET NULL,
  parent_breed_2_id INTEGER REFERENCES breeds(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_breed_name_per_type UNIQUE(pet_type_id, name),
  CONSTRAINT check_mixed_breeds CHECK (
    (is_mixed = false AND parent_breed_1_id IS NULL AND parent_breed_2_id IS NULL) OR
    (is_mixed = true AND parent_breed_1_id IS NOT NULL AND parent_breed_2_id IS NOT NULL)
  )
);

CREATE INDEX idx_breeds_pet_type_id ON breeds(pet_type_id);
CREATE INDEX idx_breeds_active ON breeds(active);
CREATE INDEX idx_breeds_is_mixed ON breeds(is_mixed);

-- ===================================
-- 8. PROMOTIONS TABLE
-- ===================================
CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  free_service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_promotion_type CHECK (type IN ('PERCENT', 'AMOUNT', 'FREE_SERVICE')),
  CONSTRAINT check_free_service CHECK (
    (type = 'FREE_SERVICE' AND free_service_id IS NOT NULL) OR
    (type != 'FREE_SERVICE' AND free_service_id IS NULL)
  )
);

CREATE INDEX idx_promotions_active ON promotions(active);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);

-- ===================================
-- 9. BOOKINGS TABLE
-- ===================================
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  pet_type VARCHAR(10) NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  note TEXT,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
  deposit_forfeited_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_booking_pet_type CHECK (pet_type IN ('DOG', 'CAT')),
  CONSTRAINT check_deposit_status CHECK (deposit_status IN ('NONE', 'HELD', 'USED', 'FORFEITED')),
  CONSTRAINT check_booking_status CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_deposit_amount CHECK (deposit_amount >= 0)
);

CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_datetime ON bookings(booking_date, booking_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ===================================
-- 10. POS_ORDERS TABLE
-- ===================================
CREATE TABLE pos_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_used DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_pos_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_subtotal CHECK (subtotal >= 0),
  CONSTRAINT check_discount CHECK (discount_amount >= 0),
  CONSTRAINT check_deposit CHECK (deposit_used >= 0),
  CONSTRAINT check_total CHECK (total_amount >= 0)
);

CREATE INDEX idx_pos_orders_customer_id ON pos_orders(customer_id);
CREATE INDEX idx_pos_orders_created_at ON pos_orders(created_at DESC);
CREATE INDEX idx_pos_orders_order_number ON pos_orders(order_number);
CREATE INDEX idx_pos_orders_status ON pos_orders(status);

-- ===================================
-- 10. POS ORDER ITEMS TABLE
-- ===================================
CREATE TABLE pos_order_items (
  id SERIAL PRIMARY KEY,
  pos_order_id INTEGER NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name VARCHAR(255) NOT NULL,
  pet_type_id VARCHAR(50),
  size_id VARCHAR(50),
  original_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  is_price_modified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_original_price CHECK (original_price >= 0),
  CONSTRAINT check_final_price CHECK (final_price >= 0)
);

CREATE INDEX idx_pos_order_items_pos_order_id ON pos_order_items(pos_order_id);
CREATE INDEX idx_pos_order_items_service_id ON pos_order_items(service_id);

-- ===================================
-- 11. PAYMENTS TABLE
-- ===================================
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  pos_order_id INTEGER NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_payment_method CHECK (method IN ('CASH', 'QR', 'CREDIT_CARD')),
  CONSTRAINT check_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_pos_order_id ON payments(pos_order_id);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- ===================================
-- TRIGGERS: AUTO UPDATE updated_at
-- ===================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_type_configs_updated_at BEFORE UPDATE ON pet_type_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_size_configs_updated_at BEFORE UPDATE ON size_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_prices_updated_at BEFORE UPDATE ON service_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pos_orders_updated_at BEFORE UPDATE ON pos_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breeds_updated_at BEFORE UPDATE ON breeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-set service order_index
CREATE TRIGGER set_service_order BEFORE INSERT ON services
  FOR EACH ROW EXECUTE FUNCTION set_service_order_index();

-- ===================================
-- INSERT DEFAULT DATA
-- ===================================

-- Default Pet Types
INSERT INTO pet_type_configs (id, name, icon, order_index, active) VALUES
  ('DOG', 'หมา', 'dog', 1, true),
  ('CAT', 'แมว', 'cat', 2, true);

-- Default Sizes for Dogs
INSERT INTO size_configs (id, pet_type_id, name, min_weight, max_weight, description, order_index, active) VALUES
  ('DOG_XS', 'DOG', 'XS', 0, 2, 'ไม่เกิน 2kg', 1, true),
  ('DOG_S', 'DOG', 'S', 2, 5, '2-5kg', 2, true),
  ('DOG_M', 'DOG', 'M', 5, 10, '5-10kg', 3, true),
  ('DOG_L', 'DOG', 'L', 10, 20, '10-20kg', 4, true),
  ('DOG_XL', 'DOG', 'XL', 20, NULL, '20kg ขึ้นไป', 5, true);

-- Default Sizes for Cats
INSERT INTO size_configs (id, pet_type_id, name, min_weight, max_weight, description, order_index, active) VALUES
  ('CAT_XS', 'CAT', 'XS', 0, 1.5, 'ไม่เกิน 1.5kg', 1, true),
  ('CAT_S', 'CAT', 'S', 1.5, 3, '1.5-3kg', 2, true),
  ('CAT_M', 'CAT', 'M', 3, 5, '3-5kg', 3, true),
  ('CAT_L', 'CAT', 'L', 5, NULL, '5kg ขึ้นไป', 4, true);

-- Default Dog Breeds
INSERT INTO breeds (pet_type_id, name, is_mixed, parent_breed_1_id, parent_breed_2_id, order_index, active) VALUES
  ('DOG', 'ชิวาวา', false, NULL, NULL, 1, true),
  ('DOG', 'ปอมเมอเรเนียน', false, NULL, NULL, 2, true),
  ('DOG', 'ปั๊ก', false, NULL, NULL, 3, true),
  ('DOG', 'ยอร์คเชียร์ เทอร์เรีย', false, NULL, NULL, 4, true),
  ('DOG', 'ชิสุ', false, NULL, NULL, 5, true),
  ('DOG', 'มอลทีส', false, NULL, NULL, 6, true),
  ('DOG', 'บีเกิ้ล', false, NULL, NULL, 7, true),
  ('DOG', 'โคเกอร์ สแปเนียล', false, NULL, NULL, 8, true),
  ('DOG', 'โกลเด้น รีทรีฟเวอร์', false, NULL, NULL, 9, true),
  ('DOG', 'ลาบราดอร์ รีทรีฟเวอร์', false, NULL, NULL, 10, true),
  ('DOG', 'ฮัสกี้ไซบีเรียน', false, NULL, NULL, 11, true),
  ('DOG', 'ไทยหลังอาน', false, NULL, NULL, 12, true),
  ('DOG', 'ไทยบางแก้ว', false, NULL, NULL, 13, true),
  ('DOG', 'จิ้งจอกญี่ปุ่น (ชิบะ อินุ)', false, NULL, NULL, 14, true),
  ('DOG', 'คอร์กี้', false, NULL, NULL, 15, true),
  ('DOG', 'ฝรั่งเศส บูลด็อก', false, NULL, NULL, 16, true),
  ('DOG', 'พุดเดิ้ล', false, NULL, NULL, 17, true),
  ('DOG', 'เยอรมัน เชพเพิร์ด', false, NULL, NULL, 18, true),
  ('DOG', 'ดัลเมเชี่ยน', false, NULL, NULL, 19, true),
  ('DOG', 'ดอเบอร์แมน', false, NULL, NULL, 20, true);

-- Default Cat Breeds
INSERT INTO breeds (pet_type_id, name, is_mixed, parent_breed_1_id, parent_breed_2_id, order_index, active) VALUES
  ('CAT', 'เปอร์เซีย', false, NULL, NULL, 1, true),
  ('CAT', 'แมวไทย', false, NULL, NULL, 2, true),
  ('CAT', 'สก็อตติช โฟลด์', false, NULL, NULL, 3, true),
  ('CAT', 'อเมริกัน ช็อตแฮร์', false, NULL, NULL, 4, true),
  ('CAT', 'บริติช ช็อตแฮร์', false, NULL, NULL, 5, true),
  ('CAT', 'เมนคูน', false, NULL, NULL, 6, true),
  ('CAT', 'แร็กดอลล์', false, NULL, NULL, 7, true),
  ('CAT', 'สฟิงซ์', false, NULL, NULL, 8, true),
  ('CAT', 'วิเชียรมาศ', false, NULL, NULL, 9, true),
  ('CAT', 'บังกอล', false, NULL, NULL, 10, true),
  ('CAT', 'อบิสซิเนียน', false, NULL, NULL, 11, true),
  ('CAT', 'รัสเซียน บลู', false, NULL, NULL, 12, true),
  ('CAT', 'เทอร์กิช แองโกรา', false, NULL, NULL, 13, true),
  ('CAT', 'มันชกิ้น', false, NULL, NULL, 14, true),
  ('CAT', 'แมวมงคล', false, NULL, NULL, 15, true);

-- ===================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_type_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (ยังไม่มีระบบ auth)
-- ในอนาคตถ้ามี authentication จะปรับ policy ตามบทบาท (admin, staff, etc.)

-- For now, allow service_role full access
CREATE POLICY "Allow service role full access on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on pets" ON pets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on pet_type_configs" ON pet_type_configs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on size_configs" ON size_configs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on services" ON services
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on service_prices" ON service_prices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on promotions" ON promotions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on bookings" ON bookings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on pos_orders" ON pos_orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on pos_order_items" ON pos_order_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on payments" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on breeds" ON breeds
  FOR ALL USING (true) WITH CHECK (true);

-- Allow anon read access to configurations (for public display)
CREATE POLICY "Allow anon read on pet_type_configs" ON pet_type_configs
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read on size_configs" ON size_configs
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read on services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read on service_prices" ON service_prices
  FOR SELECT USING (true);

CREATE POLICY "Allow anon read on breeds" ON breeds
  FOR SELECT USING (true);

-- ===================================
-- VIEWS
-- ===================================

-- Service History View
CREATE OR REPLACE VIEW service_history AS
SELECT 
  po.id AS order_id,
  po.order_number,
  c.id AS customer_id,
  c.name AS customer_name,
  c.phone,
  p.id AS pet_id,
  p.name AS pet_name,
  p.type AS pet_type,
  poi.service_name,
  poi.final_price,
  po.total_amount,
  po.created_at AS service_date
FROM pos_orders po
LEFT JOIN customers c ON po.customer_id = c.id
LEFT JOIN pets p ON po.pet_id = p.id
LEFT JOIN pos_order_items poi ON po.id = poi.pos_order_id
WHERE po.status = 'COMPLETED'
ORDER BY po.created_at DESC;

-- Dashboard Stats View
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM customers) AS total_customers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'PENDING') AS pending_bookings,
  (SELECT COUNT(*) FROM pos_orders WHERE DATE(created_at) = CURRENT_DATE) AS today_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM pos_orders WHERE DATE(created_at) = CURRENT_DATE) AS today_revenue;

-- ===================================
-- FUNCTIONS
-- ===================================

-- Function: Auto-set service order_index
CREATE OR REPLACE FUNCTION set_service_order_index()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  IF NEW.order_index IS NULL OR NEW.order_index = 0 THEN
    -- หา max order แยกตาม type (is_special)
    SELECT COALESCE(MAX(order_index), 0) INTO max_order 
    FROM services 
    WHERE is_special = COALESCE(NEW.is_special, false);
    NEW.order_index := max_order + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate Order Number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  order_date TEXT;
  order_count INTEGER;
  new_order_number VARCHAR(50);
BEGIN
  order_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO order_count
  FROM pos_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_order_number := 'ORD-' || order_date || '-' || LPAD(order_count::TEXT, 4, '0');
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pos_order_number BEFORE INSERT ON pos_orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- ===================================
-- COMPLETED
-- ===================================
-- Schema created successfully!
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Install @supabase/supabase-js in your Next.js project
-- 3. Create API routes for CRUD operations
