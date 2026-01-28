-- ===================================
-- Migration: Add Special Services Support
-- เพิ่มฟีเจอร์บริการพิเศษที่ไม่เกี่ยวข้องกับประเภทสัตว์และขนาด
-- Run Date: 2026-01-29
-- ===================================

-- 1. เพิ่ม columns ใหม่ในตาราง services
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS is_special BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS special_price DECIMAL(10,2);

-- 2. เพิ่ม constraint สำหรับบริการพิเศษ
ALTER TABLE services 
DROP CONSTRAINT IF EXISTS check_special_service;

ALTER TABLE services
ADD CONSTRAINT check_special_service CHECK (
  (is_special = false AND special_price IS NULL) OR
  (is_special = true AND special_price IS NOT NULL AND special_price >= 0)
);

-- 3. เพิ่ม index สำหรับ is_special
CREATE INDEX IF NOT EXISTS idx_services_is_special ON services(is_special);

-- 4. ปรับ service_prices ให้ pet_type_id และ size_id เป็น nullable
ALTER TABLE service_prices 
ALTER COLUMN pet_type_id DROP NOT NULL,
ALTER COLUMN size_id DROP NOT NULL;

-- 5. เพิ่ม constraint สำหรับ service_prices
ALTER TABLE service_prices
DROP CONSTRAINT IF EXISTS check_pet_type_size;

ALTER TABLE service_prices
ADD CONSTRAINT check_pet_type_size CHECK (
  (pet_type_id IS NOT NULL AND size_id IS NOT NULL) OR
  (pet_type_id IS NULL AND size_id IS NULL)
);

-- 6. Comment สำหรับ documentation
COMMENT ON COLUMN services.is_special IS 'บริการพิเศษที่ไม่เกี่ยวข้องกับประเภทสัตว์และขนาด (ราคาคงที่)';
COMMENT ON COLUMN services.special_price IS 'ราคาเดียวสำหรับบริการพิเศษ (ใช้เมื่อ is_special = true)';

-- 7. อัพเดท function set_service_order_index ให้แยก order ตาม type
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
-- Verification Query
-- ===================================
-- ตรวจสอบว่า migration สำเร็จหรือไม่
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name IN ('is_special', 'special_price')
ORDER BY ordinal_position;

-- ===================================
-- Example: Insert Special Service
-- ===================================
-- ตัวอย่างการเพิ่มบริการพิเศษ (ยังไม่ execute)
/*
INSERT INTO services (name, description, is_special, special_price, active, order_index)
VALUES ('ตัดเล็บ', 'บริการตัดเล็บสัตว์เลี้ยง (ทุกประเภท)', true, 100, true, 0);
*/

-- ===================================
-- Rollback Script (ถ้าต้องการย้อนกลับ)
-- ===================================
/*
-- ลบ constraint และ index
ALTER TABLE service_prices DROP CONSTRAINT IF EXISTS check_pet_type_size;
DROP INDEX IF EXISTS idx_services_is_special;
ALTER TABLE services DROP CONSTRAINT IF EXISTS check_special_service;

-- ปรับ service_prices กลับเป็น NOT NULL
ALTER TABLE service_prices 
ALTER COLUMN pet_type_id SET NOT NULL,
ALTER COLUMN size_id SET NOT NULL;

-- ลบ columns
ALTER TABLE services 
DROP COLUMN IF EXISTS special_price,
DROP COLUMN IF EXISTS is_special;
*/
