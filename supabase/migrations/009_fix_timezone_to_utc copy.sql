-- ===================================
-- Migration 009: Fix timezone convention to pure UTC
-- เปลี่ยนจาก Bangkok-as-UTC → Real UTC
-- ===================================

-- 1) Migrate existing sales.created_at data: ลบ 7 ชั่วโมงเพื่อแปลงจาก Bangkok-as-UTC กลับเป็น real UTC
UPDATE sales SET created_at = created_at - INTERVAL '7 hours';

-- 2) เปลี่ยน DEFAULT ของ sales.created_at จาก TIMEZONE('Asia/Bangkok', NOW()) เป็น NOW()
ALTER TABLE sales ALTER COLUMN created_at SET DEFAULT NOW();

-- 3) แก้ RPC create_sale_with_items ให้ระบุ created_at = NOW() ชัดเจน
--    (ป้องกัน fallback ไป column default เดิม)
DROP FUNCTION IF EXISTS create_sale_with_items(INTEGER, INTEGER, DECIMAL, DECIMAL, INTEGER, DECIMAL, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, JSONB, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION create_sale_with_items(
  p_booking_id INTEGER DEFAULT NULL,
  p_customer_id INTEGER DEFAULT NULL,
  p_subtotal DECIMAL DEFAULT 0,
  p_discount_amount DECIMAL DEFAULT 0,
  p_promotion_id INTEGER DEFAULT NULL,
  p_custom_discount DECIMAL DEFAULT 0,
  p_deposit_used DECIMAL DEFAULT 0,
  p_total_amount DECIMAL DEFAULT 0,
  p_payment_method TEXT DEFAULT 'CASH',
  p_cash_received DECIMAL DEFAULT NULL,
  p_change DECIMAL DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_sale_type TEXT DEFAULT 'SERVICE',
  p_hotel_booking_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_sale_id INTEGER;
  v_item JSONB;
BEGIN
  INSERT INTO sales (
    booking_id, customer_id, subtotal, discount_amount,
    promotion_id, custom_discount, deposit_used, total_amount,
    payment_method, cash_received, change,
    sale_type, hotel_booking_id, created_at
  ) VALUES (
    p_booking_id, p_customer_id, p_subtotal, p_discount_amount,
    p_promotion_id, p_custom_discount, p_deposit_used, p_total_amount,
    p_payment_method, p_cash_received, p_change,
    p_sale_type, p_hotel_booking_id, NOW()
  ) RETURNING id INTO v_sale_id;

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

  IF p_booking_id IS NOT NULL THEN
    UPDATE bookings SET status = 'COMPLETED' WHERE id = p_booking_id;
  END IF;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION create_sale_with_items(INTEGER, INTEGER, DECIMAL, DECIMAL, INTEGER, DECIMAL, DECIMAL, DECIMAL, TEXT, DECIMAL, DECIMAL, JSONB, TEXT, INTEGER) TO anon, authenticated;
