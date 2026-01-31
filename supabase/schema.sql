-- ===================================
-- BBP (Beauty & Bathing Pet) Database Schema
-- สำหรับ Supabase PostgreSQL
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- DROP EXISTING TABLES (CASCADE)
-- ===================================
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS booking_pets CASCADE;
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
DROP FUNCTION IF EXISTS get_top_customers(VARCHAR, INTEGER) CASCADE;

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
  CONSTRAINT check_pet_weight CHECK (weight >= 0),
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
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  note TEXT,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
  deposit_forfeited_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_deposit_status CHECK (deposit_status IN ('NONE', 'HELD', 'USED', 'FORFEITED')),
  CONSTRAINT check_booking_status CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_deposit_amount CHECK (deposit_amount >= 0)
);

CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_datetime ON bookings(booking_date, booking_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ===================================
-- 10. BOOKING_PETS TABLE (Many-to-Many)
-- ===================================
CREATE TABLE booking_pets (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  service_type VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_booking_pet UNIQUE(booking_id, pet_id)
);

CREATE INDEX idx_booking_pets_booking_id ON booking_pets(booking_id);
CREATE INDEX idx_booking_pets_pet_id ON booking_pets(pet_id);

-- ===================================
-- 11. SALES TABLE (รายได้จากการขาย)
-- ===================================
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL,
  custom_discount DECIMAL(10, 2) DEFAULT 0,
  deposit_used DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'QR', 'CREDIT_CARD')),
  cash_received DECIMAL(10, 2),
  change DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Bangkok', NOW()),
  
  CONSTRAINT check_sales_subtotal CHECK (subtotal >= 0),
  CONSTRAINT check_sales_discount CHECK (discount_amount >= 0),
  CONSTRAINT check_sales_custom_discount CHECK (custom_discount >= 0),
  CONSTRAINT check_sales_deposit CHECK (deposit_used >= 0),
  CONSTRAINT check_sales_total CHECK (total_amount >= 0)
);

CREATE INDEX idx_sales_booking_id ON sales(booking_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

COMMENT ON TABLE sales IS 'ตารางบันทึกข้อมูลการขาย/รายได้';
COMMENT ON COLUMN sales.booking_id IS 'อ้างอิงไปยังการนัดหมาย (ถ้ามี)';
COMMENT ON COLUMN sales.customer_id IS 'อ้างอิงไปยังลูกค้า (ถ้ามี)';
COMMENT ON COLUMN sales.deposit_used IS 'ยอดมัดจำที่ใช้หักลบ';
COMMENT ON COLUMN sales.payment_method IS 'วิธีการชำระเงิน: CASH, QR, CREDIT_CARD';

-- ===================================
-- 12. SALE_ITEMS TABLE (รายการบริการในแต่ละการขาย)
-- ===================================
CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  pet_id INTEGER REFERENCES pets(id) ON DELETE SET NULL,
  pet_name TEXT,
  pet_type TEXT CHECK (pet_type IN ('DOG', 'CAT') OR pet_type IS NULL),
  original_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  is_price_modified BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT check_sale_items_original_price CHECK (original_price >= 0),
  CONSTRAINT check_sale_items_final_price CHECK (final_price >= 0)
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_service_id ON sale_items(service_id);
CREATE INDEX idx_sale_items_pet_id ON sale_items(pet_id);

COMMENT ON TABLE sale_items IS 'ตารางรายการบริการในแต่ละการขาย';
COMMENT ON COLUMN sale_items.is_price_modified IS 'ระบุว่ามีการแก้ไขราคาหรือไม่';

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

CREATE TRIGGER update_breeds_updated_at BEFORE UPDATE ON breeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-set service order_index
CREATE TRIGGER set_service_order BEFORE INSERT ON services
  FOR EACH ROW EXECUTE FUNCTION set_service_order_index();

-- ===================================
-- INSERT INITIAL DATA
-- ===================================

-- Pet Type Configs
INSERT INTO pet_type_configs (id, name, icon, order_index, active, created_at, updated_at) VALUES 
('CAT', 'แมว', 'cat', 2, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
('DOG', 'หมา', 'dog', 1, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00');

-- Size Configs
INSERT INTO size_configs (id, pet_type_id, name, min_weight, max_weight, description, order_index, active, created_at, updated_at) VALUES 
('CAT_L', 'CAT', 'L', 5.00, 7.90, '5 - 7.9 KG', 4, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:23:14.695591+00'), 
('CAT_M', 'CAT', 'M', 4.00, 4.90, '4 - 4.9 KG', 3, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:22:51.889826+00'), 
('CAT_S', 'CAT', 'S', 2.00, 3.90, '2 - 3.9 KG', 2, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:22:38.320789+00'), 
('CAT_XL', 'CAT', 'XL', 8.00, 30.00, '8 KG ขึ้นไป', 5, true, '2026-01-28 17:30:37.43144+00', '2026-01-28 17:30:37.43144+00'), 
('CAT_XS', 'CAT', 'XS', 0.00, 1.90, 'ไม่เกิน 2 KG', 1, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:22:12.573336+00'), 
('DOG_L', 'DOG', 'L', 9.00, 14.90, '9 - 14.9 KG', 4, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:37:46.035596+00'), 
('DOG_M', 'DOG', 'M', 5.00, 8.90, '5 - 8.9 KG', 3, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:37:46.111899+00'), 
('DOG_S', 'DOG', 'S', 2.00, 4.90, '2 - 4.9 KG', 2, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:37:46.185277+00'), 
('DOG_XL', 'DOG', 'XL', 15.00, 19.90, '15 - 19.9 KG', 5, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:37:45.933948+00'), 
('DOG_XS', 'DOG', 'XS', 0.00, 1.90, 'ไม่เกิน 2 KG', 1, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 17:36:59.163414+00'), 
('DOG_XXL', 'DOG', 'XXL', 20.00, 25.00, '20 - 25 KG', 6, true, '2026-01-28 17:37:19.716583+00', '2026-01-28 17:37:19.716583+00');

-- Breeds
INSERT INTO breeds (id, pet_type_id, name, is_mixed, parent_breed_1_id, parent_breed_2_id, order_index, active, created_at, updated_at) VALUES 
(1, 'DOG', 'ชิวาวา', false, null, null, 1, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(2, 'DOG', 'ปอมเมอเรเนียน', false, null, null, 2, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(3, 'DOG', 'ปั๊ก', false, null, null, 3, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(4, 'DOG', 'ยอร์คเชียร์ เทอร์เรีย', false, null, null, 4, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(5, 'DOG', 'ชิสุ', false, null, null, 5, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(6, 'DOG', 'มอลทีส', false, null, null, 6, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(7, 'DOG', 'บีเกิ้ล', false, null, null, 7, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(8, 'DOG', 'โคเกอร์ สแปเนียล', false, null, null, 8, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(9, 'DOG', 'โกลเด้น รีทรีฟเวอร์', false, null, null, 9, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(10, 'DOG', 'ลาบราดอร์ รีทรีฟเวอร์', false, null, null, 10, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(11, 'DOG', 'ฮัสกี้ไซบีเรียน', false, null, null, 11, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(12, 'DOG', 'ไทยหลังอาน', false, null, null, 12, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(13, 'DOG', 'ไทยบางแก้ว', false, null, null, 13, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(14, 'DOG', 'จิ้งจอกญี่ปุ่น (ชิบะ อินุ)', false, null, null, 14, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(15, 'DOG', 'คอร์กี้', false, null, null, 15, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(16, 'DOG', 'ฝรั่งเศส บูลด็อก', false, null, null, 16, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(17, 'DOG', 'พุดเดิ้ล', false, null, null, 17, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(18, 'DOG', 'เยอรมัน เชพเพิร์ด', false, null, null, 18, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(19, 'DOG', 'ดัลเมเชี่ยน', false, null, null, 19, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(20, 'DOG', 'ดอเบอร์แมน', false, null, null, 20, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(21, 'CAT', 'เปอร์เซีย', false, null, null, 1, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(22, 'CAT', 'แมวไทย', false, null, null, 2, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(23, 'CAT', 'สก็อตติช โฟลด์', false, null, null, 3, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(24, 'CAT', 'อเมริกัน ช็อตแฮร์', false, null, null, 4, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(25, 'CAT', 'บริติช ช็อตแฮร์', false, null, null, 5, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(26, 'CAT', 'เมนคูน', false, null, null, 6, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(27, 'CAT', 'แร็กดอลล์', false, null, null, 7, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(28, 'CAT', 'สฟิงซ์', false, null, null, 8, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(29, 'CAT', 'วิเชียรมาศ', false, null, null, 9, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(30, 'CAT', 'บังกอล', false, null, null, 10, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(31, 'CAT', 'อบิสซิเนียน', false, null, null, 11, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(32, 'CAT', 'รัสเซียน บลู', false, null, null, 12, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(33, 'CAT', 'เทอร์กิช แองโกรา', false, null, null, 13, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(34, 'CAT', 'มันชกิ้น', false, null, null, 14, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00'), 
(35, 'CAT', 'แมวมงคล', false, null, null, 15, true, '2026-01-28 13:40:33.228744+00', '2026-01-28 13:40:33.228744+00');

-- Reset breeds sequence to continue from 35
SELECT setval('breeds_id_seq', 35, true);

-- Services
INSERT INTO services (id, name, description, active, created_at, updated_at, order_index, is_special, special_price) VALUES 
(1, 'อาบน้ำ (ขนสั้น)', 'รวมบริการ ตัดเล็บ ไถขนเท้า ท้อง ก้น บีบต่อม เช็ดรอบใบหูชั้นนอก เช็ดรอบดวงตา', true, '2026-01-28 17:44:35.040692+00', '2026-01-28 18:11:23.975073+00', 1, false, null), 
(2, 'อาบน้ำ (ขนยาว)', 'รวมบริการ ตัดเล็บ ไถขนเท้า ท้อง ก้น บีบต่อม เช็ดรอบใบหูชั้นนอก เช็ดรอบดวงตา', true, '2026-01-28 17:48:27.914851+00', '2026-01-28 18:11:23.975073+00', 2, false, null), 
(3, 'อาบน้ำ (ขน 2 ชั้น)', 'รวมบริการ ตัดเล็บ ไถขนเท้า ท้อง ก้น บีบต่อม เช็ดรอบใบหูชั้นนอก เช็ดรอบดวงตา', true, '2026-01-28 17:49:13.542339+00', '2026-01-28 18:11:23.975073+00', 3, false, null), 
(4, 'ตัดขน (ปัตตาเลียน)', 'ไถปัตตาเลียนทั้งตัว', true, '2026-01-28 17:50:19.68013+00', '2026-01-28 18:11:23.975073+00', 4, false, null), 
(5, 'ตัดขน (กรรไกร)', 'ตัดกรรไกรทั้งตัว', true, '2026-01-28 17:51:49.316227+00', '2026-01-28 18:11:23.975073+00', 5, false, null), 
(6, 'SPA', 'อาบน้ำ SPA ด้วยแชมพูสูตรพิเศษ', true, '2026-01-28 17:52:44.909582+00', '2026-01-28 18:11:23.975073+00', 6, false, null), 
(7, 'TREATMENT', 'ทรีตเมนต์สูตรพิเศษ ขนนุ่ม เงา งาม', true, '2026-01-28 17:53:54.199621+00', '2026-01-28 18:11:23.975073+00', 7, false, null), 
(8, 'อาบน้ำ (แมวไทย)', 'รวมบริการ ตัดเล็บ ไถขนเท้า ท้อง ก้น เช็ดรอบใบหูชั้นนอก เช็ดรอบดวงตา', true, '2026-01-28 17:55:28.115613+00', '2026-01-28 18:11:48.885845+00', 1, false, null), 
(9, 'อาบน้ำ (ขนสั้น)', 'รวมบริการ ตัดเล็บ ไถขนเท้า ท้อง ก้น เช็ดรอบใบหูชั้นนอก เช็ดรอบดวงตา', true, '2026-01-28 17:55:59.721174+00', '2026-01-28 18:11:49.296896+00', 2, false, null), 
(10, 'อาบน้ำ (ขนยาว)', 'รวมบริการ ตัดเล็บ ไถขนเท้า ท้อง ก้น เช็ดรอบใบหูชั้นนอก เช็ดรอบดวงตา', true, '2026-01-28 18:01:48.778281+00', '2026-01-28 18:11:49.760613+00', 3, false, null), 
(11, 'ตัดขน (ปัตตาเลียน)', 'ไถปัตตาเลียนทั้งตัว', true, '2026-01-28 18:02:44.602697+00', '2026-01-28 18:11:50.193631+00', 4, false, null), 
(12, 'SPA', 'อาบน้ำ SPA ด้วยแชมพูสูตรพิเศษ', true, '2026-01-28 18:03:26.409105+00', '2026-01-28 18:11:50.629393+00', 5, false, null), 
(13, 'TREATMENT', 'ทรีตเมนต์สูตรพิเศษ ขนนุ่ม เงา งาม', true, '2026-01-28 18:03:49.618421+00', '2026-01-28 18:11:51.052674+00', 6, false, null), 
(14, 'ขจัดคราบมัน', 'ครีมทำความสะอาดคราบมันที่หาง และอาบทั้งตัว', true, '2026-01-28 18:04:34.104197+00', '2026-01-28 18:11:51.535599+00', 7, false, null), 
(15, 'สางขนพันกัน 4 จุดขึ้นไป', '4 จุด ขึ้นไป 100-300 บาท', true, '2026-01-28 18:33:31.502016+00', '2026-01-28 18:33:50.689008+00', 1, true, 100.00), 
(16, 'ขนพันกัน (ติดกันเป็นแผง)', 'สางขนพันกันกรณีติดกันเป็นแผง', true, '2026-01-28 18:34:43.69305+00', '2026-01-28 18:38:10.356172+00', 2, true, 300.00), 
(17, 'ขนพันกัน (ติดกันเป็นแผงทั้งตัว)', 'สางขนพันกันกรณีติดกันเป็นแผงทั้งตัว', true, '2026-01-28 18:38:59.822588+00', '2026-01-28 18:38:59.822588+00', 3, true, 500.00), 
(18, 'บริการดูแลพิเศษเฉพาะตัว', 'กรณีดื้อ ซน ดีด กลัวเสียงไดร์ กลัวน้ำ ไม่ยอม ความยาก และใช้เวลานาน 100-300 บาท', true, '2026-01-28 18:41:49.821376+00', '2026-01-28 18:41:49.821376+00', 4, true, 100.00);

-- Reset services sequence to continue from 18
SELECT setval('services_id_seq', 18, true);

-- Customers (Sample Data)
INSERT INTO customers (id, name, phone, created_at, updated_at) VALUES 
(1, 'บอส', '0818092589', '2026-01-28 13:42:15.022674+00', '2026-01-28 13:42:15.022674+00'), 
(2, 'แอร์', '0882414554', '2026-01-28 16:36:06.416563+00', '2026-01-28 16:36:06.416563+00');

-- Reset customers sequence to continue from 2
SELECT setval('customers_id_seq', 2, true);

-- Pets (Sample Data)
INSERT INTO pets (id, customer_id, name, type, breed, breed_2, is_mixed_breed, weight, note, created_at, updated_at) VALUES 
(1, 1, 'ไข่ดาว', 'CAT', 'แมวไทย', null, false, 4.50, 'ดุมาก กัดด้วย', '2026-01-28 16:35:45.767133+00', '2026-01-28 16:35:45.767133+00'), 
(2, 2, 'นอตี้', 'DOG', 'ปอมเมอเรเนียน', null, false, 4.00, null, '2026-01-28 16:36:25.596955+00', '2026-01-28 16:36:25.596955+00'), 
(3, 2, 'เคร่า', 'CAT', 'สก็อตติช โฟลด์', null, false, 3.50, null, '2026-01-28 16:54:18.576153+00', '2026-01-28 16:54:18.576153+00');

-- Reset pets sequence to continue from 3
SELECT setval('pets_id_seq', 3, true);

-- Promotions (Sample Data)
INSERT INTO promotions (id, name, type, value, free_service_id, active, start_date, end_date, created_at, updated_at) VALUES 
(1, 'ส่วนลด 10%', 'PERCENT', 10.00, null, true, null, null, NOW(), NOW()),
(2, 'ส่วนลด 50 บาท', 'AMOUNT', 50.00, null, true, null, null, NOW(), NOW()),
(3, 'ส่วนลด 100 บาท', 'AMOUNT', 100.00, null, true, null, null, NOW(), NOW());

-- Reset promotions sequence to continue from 3
SELECT setval('promotions_id_seq', 3, true);

-- Service Prices
-- Note: Add your service_prices data here
-- Example structure:
-- INSERT INTO service_prices (service_id, pet_type_id, size_id, price, created_at, updated_at) VALUES
-- (1, 'DOG', 'DOG_XS', 250.00, NOW(), NOW());
-- You can import from service_prices_rows.sql file

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
ALTER TABLE booking_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Allow service role full access on booking_pets" ON booking_pets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on sales" ON sales
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on sale_items" ON sale_items
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on breeds" ON breeds
  FOR ALL USING (true) WITH CHECK (true);

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
  s.id AS sale_id,
  c.id AS customer_id,
  c.name AS customer_name,
  c.phone,
  p.id AS pet_id,
  p.name AS pet_name,
  p.type AS pet_type,
  si.service_name,
  si.final_price,
  s.total_amount,
  s.created_at AS service_date
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN sale_items si ON s.id = si.sale_id
LEFT JOIN pets p ON si.pet_id = p.id
ORDER BY s.created_at DESC;

-- Dashboard Stats View
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM customers) AS total_customers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'PENDING') AS pending_bookings,
  (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURRENT_DATE) AS today_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM sale
-- Dashboard Stats View
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM customers) AS total_customers,
  (SELECT COUNT(*) FROM bookings WHERE status = 'PENDING') AS pending_bookings,
  (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURRENT_DATE) AS today_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE) AS today_revenue;

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

-- ===================================
-- Function: Get Top Customers
-- ===================================
CREATE OR REPLACE FUNCTION get_top_customers(
  sort_by VARCHAR DEFAULT 'visit_count',
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  customer_id INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  total_spent NUMERIC,
  visit_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  IF sort_by = 'visit_count' THEN
    RETURN QUERY
    SELECT 
      s.customer_id,
      s.customer_name,
      s.customer_phone,
      SUM(s.total_amount) as total_spent,
      COUNT(*) as visit_count
    FROM sales s
    WHERE s.customer_id IS NOT NULL
    GROUP BY s.customer_id, s.customer_name, s.customer_phone
    ORDER BY COUNT(*) DESC
    LIMIT result_limit;
  ELSE
    RETURN QUERY
    SELECT 
      s.customer_id,
      s.customer_name,
      s.customer_phone,
      SUM(s.total_amount) as total_spent,
      COUNT(*) as visit_count
    FROM sales s
    WHERE s.customer_id IS NOT NULL
    GROUP BY s.customer_id, s.customer_name, s.customer_phone
    ORDER BY SUM(s.total_amount) DESC
    LIMIT result_limit;
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_top_customers(VARCHAR, INTEGER) TO anon, authenticated;

-- ===================================
-- COMPLETED
-- ===================================
-- Schema created successfully!
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Install @supabase/supabase-js in your Next.js project
-- 3. Create API routes for CRUD operations


