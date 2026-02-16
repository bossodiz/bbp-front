-- ===================================
-- Migration: ระบบสินค้า (Products)
-- สร้างตาราง products + เพิ่ม product_id ใน sale_items
-- ===================================

-- ===================================
-- 1. สร้างตาราง PRODUCTS
-- ===================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'ชิ้น',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

COMMENT ON TABLE products IS 'ตารางสินค้าสำหรับขายหน้าร้าน';
COMMENT ON COLUMN products.sku IS 'รหัสสินค้า (Stock Keeping Unit)';
COMMENT ON COLUMN products.category IS 'หมวดหมู่สินค้า เช่น อาหาร, ของเล่น, อุปกรณ์';
COMMENT ON COLUMN products.price IS 'ราคาขาย';
COMMENT ON COLUMN products.cost IS 'ราคาทุน';
COMMENT ON COLUMN products.stock_quantity IS 'จำนวนสินค้าคงเหลือ';
COMMENT ON COLUMN products.min_stock IS 'จำนวนขั้นต่ำที่ควรมี (แจ้งเตือนเมื่อต่ำกว่า)';
COMMENT ON COLUMN products.unit IS 'หน่วยนับ เช่น ชิ้น, ถุง, กระป๋อง';

-- ===================================
-- 2. เพิ่ม product_id ใน SALE_ITEMS
-- ===================================
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

COMMENT ON COLUMN sale_items.product_id IS 'อ้างอิงไปยังสินค้า (ถ้า item_type = PRODUCT)';

-- ===================================
-- 3. Trigger อัพเดต updated_at อัตโนมัติ
-- ===================================
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- ===================================
-- 4. Trigger ลด stock เมื่อขายสินค้า
-- ===================================
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'PRODUCT' AND NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_decrease_product_stock ON sale_items;
CREATE TRIGGER trigger_decrease_product_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

-- ===================================
-- 5. อัพเดตฟังก์ชัน create_sale_with_items
--    รองรับ product_id ใน items
-- ===================================
CREATE OR REPLACE FUNCTION create_sale_with_items(
  p_booking_id INTEGER DEFAULT NULL,
  p_customer_id INTEGER DEFAULT NULL,
  p_subtotal DECIMAL DEFAULT 0,
  p_discount_amount DECIMAL DEFAULT 0,
  p_promotion_id INTEGER DEFAULT NULL,
  p_custom_discount DECIMAL DEFAULT 0,
  p_deposit_used DECIMAL DEFAULT 0,
  p_total_amount DECIMAL DEFAULT 0,
  p_payment_method VARCHAR DEFAULT 'CASH',
  p_cash_received DECIMAL DEFAULT NULL,
  p_change DECIMAL DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_sale_type VARCHAR DEFAULT 'SERVICE',
  p_hotel_booking_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_sale_id INTEGER;
  v_item JSONB;
BEGIN
  -- สร้าง sale record
  INSERT INTO sales (
    booking_id, customer_id, subtotal, discount_amount,
    promotion_id, custom_discount, deposit_used, total_amount,
    payment_method, cash_received, change,
    sale_type, hotel_booking_id
  ) VALUES (
    p_booking_id, p_customer_id, p_subtotal, p_discount_amount,
    p_promotion_id, p_custom_discount, p_deposit_used, p_total_amount,
    p_payment_method, p_cash_received, p_change,
    p_sale_type, p_hotel_booking_id
  ) RETURNING id INTO v_sale_id;

  -- สร้าง sale_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO sale_items (
      sale_id, service_id, service_name, pet_id,
      original_price, final_price, is_price_modified,
      item_type, quantity, unit_price, product_id
    ) VALUES (
      v_sale_id,
      COALESCE((v_item->>'serviceId')::INTEGER, (v_item->>'service_id')::INTEGER),
      COALESCE(v_item->>'serviceName', v_item->>'service_name', ''),
      COALESCE((v_item->>'petId')::INTEGER, (v_item->>'pet_id')::INTEGER),
      COALESCE((v_item->>'originalPrice')::DECIMAL, (v_item->>'original_price')::DECIMAL, 0),
      COALESCE((v_item->>'finalPrice')::DECIMAL, (v_item->>'final_price')::DECIMAL, 0),
      COALESCE((v_item->>'isPriceModified')::BOOLEAN, (v_item->>'is_price_modified')::BOOLEAN, false),
      COALESCE(v_item->>'itemType', v_item->>'item_type', 'SERVICE'),
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      COALESCE((v_item->>'unitPrice')::DECIMAL, (v_item->>'unit_price')::DECIMAL, 0),
      COALESCE((v_item->>'productId')::INTEGER, (v_item->>'product_id')::INTEGER)
    );
  END LOOP;

  -- อัพเดตสถานะ booking ถ้ามี
  IF p_booking_id IS NOT NULL THEN
    UPDATE bookings SET status = 'COMPLETED' WHERE id = p_booking_id;
  END IF;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;
