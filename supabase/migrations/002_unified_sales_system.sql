-- ===================================
-- Migration: ระบบ Sales แบบรวมศูนย์
-- รองรับ: บริการ (SERVICE), โรงแรม (HOTEL), สินค้า (PRODUCT)
-- ===================================

-- ===================================
-- 1. เพิ่มคอลัมน์ใน SALES TABLE
-- ===================================
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS sale_type VARCHAR(20) NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN IF NOT EXISTS hotel_booking_id INTEGER REFERENCES hotel_bookings(id) ON DELETE SET NULL;

ALTER TABLE sales
  ADD CONSTRAINT check_sale_type CHECK (sale_type IN ('SERVICE', 'HOTEL', 'PRODUCT', 'MIXED'));

CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);
CREATE INDEX IF NOT EXISTS idx_sales_hotel_booking_id ON sales(hotel_booking_id);

COMMENT ON COLUMN sales.sale_type IS 'ประเภทการขาย: SERVICE=บริการ, HOTEL=โรงแรม, PRODUCT=สินค้า, MIXED=ผสม';
COMMENT ON COLUMN sales.hotel_booking_id IS 'อ้างอิงไปยังการจองโรงแรม (ถ้ามี)';

-- ===================================
-- 2. เพิ่มคอลัมน์ใน SALE_ITEMS TABLE
-- ===================================
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) NOT NULL DEFAULT 'SERVICE',
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE sale_items
  ADD CONSTRAINT check_item_type CHECK (item_type IN ('SERVICE', 'HOTEL_ROOM', 'PRODUCT')),
  ADD CONSTRAINT check_quantity CHECK (quantity >= 1);

CREATE INDEX IF NOT EXISTS idx_sale_items_item_type ON sale_items(item_type);

COMMENT ON COLUMN sale_items.item_type IS 'ประเภทรายการ: SERVICE=บริการ, HOTEL_ROOM=ค่าห้องพัก, PRODUCT=สินค้า';
COMMENT ON COLUMN sale_items.quantity IS 'จำนวน (คืน/ชิ้น)';
COMMENT ON COLUMN sale_items.unit_price IS 'ราคาต่อหน่วย (ต่อคืน/ต่อชิ้น)';

-- อัพเดตข้อมูลเดิม: ตั้ง unit_price = final_price สำหรับรายการที่มีอยู่แล้ว
UPDATE sale_items SET unit_price = final_price WHERE unit_price = 0 AND final_price > 0;

-- ===================================
-- 3. เพิ่มคอลัมน์ใน PROMOTIONS TABLE
-- ===================================
ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS applicable_to VARCHAR(20) NOT NULL DEFAULT 'ALL';

ALTER TABLE promotions
  ADD CONSTRAINT check_applicable_to CHECK (applicable_to IN ('ALL', 'SERVICE', 'HOTEL', 'PRODUCT'));

CREATE INDEX IF NOT EXISTS idx_promotions_applicable_to ON promotions(applicable_to);

COMMENT ON COLUMN promotions.applicable_to IS 'ใช้ได้กับประเภท: ALL=ทั้งหมด, SERVICE=บริการ, HOTEL=โรงแรม, PRODUCT=สินค้า';

-- ===================================
-- 4. แก้ฟังก์ชัน create_sale_with_items
--    รองรับ sale_type + hotel_booking_id + item_type/quantity/unit_price
-- ===================================
CREATE OR REPLACE FUNCTION create_sale_with_items(
  p_booking_id INTEGER,
  p_customer_id INTEGER,
  p_subtotal NUMERIC,
  p_discount_amount NUMERIC,
  p_promotion_id INTEGER,
  p_custom_discount NUMERIC,
  p_deposit_used NUMERIC,
  p_total_amount NUMERIC,
  p_payment_method TEXT,
  p_cash_received NUMERIC,
  p_change NUMERIC,
  p_items JSONB,
  p_sale_type TEXT DEFAULT 'SERVICE',
  p_hotel_booking_id INTEGER DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id INTEGER;
  v_item JSONB;
BEGIN
  IF jsonb_typeof(COALESCE(p_items, '[]'::jsonb)) <> 'array'
     OR jsonb_array_length(COALESCE(p_items, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'กรุณาระบุรายการบริการ';
  END IF;

  INSERT INTO sales(
    booking_id,
    customer_id,
    subtotal,
    discount_amount,
    promotion_id,
    custom_discount,
    deposit_used,
    total_amount,
    payment_method,
    cash_received,
    change,
    sale_type,
    hotel_booking_id,
    created_at
  )
  VALUES (
    p_booking_id,
    p_customer_id,
    COALESCE(p_subtotal, 0),
    COALESCE(p_discount_amount, 0),
    p_promotion_id,
    COALESCE(p_custom_discount, 0),
    COALESCE(p_deposit_used, 0),
    COALESCE(p_total_amount, 0),
    p_payment_method,
    p_cash_received,
    p_change,
    COALESCE(p_sale_type, 'SERVICE'),
    p_hotel_booking_id,
    NOW()
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN
    SELECT *
    FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
  LOOP
    INSERT INTO sale_items(
      sale_id,
      service_id,
      service_name,
      pet_id,
      original_price,
      final_price,
      is_price_modified,
      item_type,
      quantity,
      unit_price
    )
    VALUES (
      v_sale_id,
      NULLIF(v_item->>'serviceId', '')::INTEGER,
      COALESCE(NULLIF(TRIM(v_item->>'serviceName'), ''), 'ไม่ระบุบริการ'),
      NULLIF(v_item->>'petId', '')::INTEGER,
      COALESCE((v_item->>'originalPrice')::NUMERIC, 0),
      COALESCE((v_item->>'finalPrice')::NUMERIC, 0),
      COALESCE((v_item->>'isPriceModified')::BOOLEAN, FALSE),
      COALESCE(NULLIF(v_item->>'itemType', ''), 'SERVICE'),
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      COALESCE((v_item->>'unitPrice')::NUMERIC, COALESCE((v_item->>'finalPrice')::NUMERIC, 0))
    );
  END LOOP;

  IF p_booking_id IS NOT NULL THEN
    UPDATE bookings
    SET status = 'COMPLETED', updated_at = NOW()
    WHERE id = p_booking_id;
  END IF;

  RETURN v_sale_id;
END;
$$;

-- ===================================
-- 5. แก้ฟังก์ชัน checkout_hotel_booking
--    ให้สร้าง sale เข้าระบบหลักด้วย + รองรับโปรโมชั่น
-- ===================================
DROP FUNCTION IF EXISTS checkout_hotel_booking(INTEGER, DATE, JSONB, NUMERIC, TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION checkout_hotel_booking(
  p_hotel_booking_id INTEGER,
  p_check_out_date DATE,
  p_additional_services JSONB DEFAULT '[]'::JSONB,
  p_discount_amount NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'CASH',
  p_cash_received NUMERIC DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_promotion_id INTEGER DEFAULT NULL,
  p_custom_discount NUMERIC DEFAULT 0
)
RETURNS hotel_bookings
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking hotel_bookings%ROWTYPE;
  v_item JSONB;
  v_services_total NUMERIC := 0;
  v_total_nights INTEGER;
  v_room_total NUMERIC;
  v_subtotal NUMERIC;
  v_grand_total NUMERIC;
  v_remaining NUMERIC;
  v_sale_id INTEGER;
  v_promotion_discount NUMERIC := 0;
  v_deposit_used NUMERIC := 0;
BEGIN
  -- ดึงข้อมูลการจอง
  SELECT * INTO v_booking FROM hotel_bookings WHERE id = p_hotel_booking_id;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'ไม่พบข้อมูลการจองโรงแรม';
  END IF;

  IF v_booking.status = 'CHECKED_OUT' THEN
    RAISE EXCEPTION 'การจองนี้ได้ checkout แล้ว';
  END IF;

  IF v_booking.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'การจองนี้ถูกยกเลิกแล้ว';
  END IF;

  -- คำนวณจำนวนคืน
  v_total_nights := GREATEST(1, p_check_out_date - v_booking.check_in_date);
  v_room_total := v_booking.rate_per_night * v_total_nights;

  -- เพิ่มบริการเสริมเข้า hotel_additional_services
  IF jsonb_typeof(COALESCE(p_additional_services, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_additional_services, '[]'::jsonb)) > 0 THEN
    FOR v_item IN
      SELECT * FROM jsonb_array_elements(p_additional_services)
    LOOP
      INSERT INTO hotel_additional_services(
        hotel_booking_id, service_id, service_name,
        original_price, final_price, is_price_modified
      )
      VALUES (
        p_hotel_booking_id,
        NULLIF(v_item->>'serviceId', '')::INTEGER,
        COALESCE(NULLIF(TRIM(v_item->>'serviceName'), ''), 'ไม่ระบุบริการ'),
        COALESCE((v_item->>'originalPrice')::NUMERIC, 0),
        COALESCE((v_item->>'finalPrice')::NUMERIC, 0),
        COALESCE((v_item->>'isPriceModified')::BOOLEAN, FALSE)
      );
      v_services_total := v_services_total + COALESCE((v_item->>'finalPrice')::NUMERIC, 0);
    END LOOP;
  END IF;

  v_subtotal := v_room_total + v_services_total;

  -- คำนวณส่วนลดโปรโมชั่น
  IF p_promotion_id IS NOT NULL THEN
    SELECT
      CASE
        WHEN type = 'PERCENT' THEN ROUND(v_subtotal * (value / 100))
        WHEN type = 'AMOUNT' THEN value
        ELSE 0
      END INTO v_promotion_discount
    FROM promotions
    WHERE id = p_promotion_id AND active = true;
    v_promotion_discount := COALESCE(v_promotion_discount, 0);
  END IF;

  -- คำนวณยอดรวม
  v_grand_total := GREATEST(0, v_subtotal - v_promotion_discount - COALESCE(p_custom_discount, 0));
  v_deposit_used := CASE WHEN v_booking.deposit_amount > 0 THEN v_booking.deposit_amount ELSE 0 END;
  v_remaining := GREATEST(0, v_grand_total - v_deposit_used);

  -- สร้าง sale เข้าระบบหลัก
  INSERT INTO sales(
    customer_id, subtotal, discount_amount, promotion_id, custom_discount,
    deposit_used, total_amount, payment_method, cash_received, change,
    sale_type, hotel_booking_id, created_at
  )
  VALUES (
    v_booking.customer_id, v_subtotal, v_promotion_discount, p_promotion_id,
    COALESCE(p_custom_discount, 0), v_deposit_used, v_remaining,
    p_payment_method, p_cash_received,
    CASE WHEN p_payment_method = 'CASH' AND p_cash_received IS NOT NULL
      THEN GREATEST(0, p_cash_received - v_remaining) ELSE NULL END,
    'HOTEL', p_hotel_booking_id, NOW()
  )
  RETURNING id INTO v_sale_id;

  -- เพิ่ม sale_item: ค่าห้องพัก
  INSERT INTO sale_items(
    sale_id, service_name, pet_id,
    original_price, final_price, is_price_modified,
    item_type, quantity, unit_price
  )
  VALUES (
    v_sale_id,
    'ค่าห้องพัก ' || v_total_nights || ' คืน',
    v_booking.pet_id,
    v_room_total, v_room_total, false,
    'HOTEL_ROOM', v_total_nights, v_booking.rate_per_night
  );

  -- เพิ่ม sale_items: บริการเสริม
  IF jsonb_typeof(COALESCE(p_additional_services, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_additional_services, '[]'::jsonb)) > 0 THEN
    FOR v_item IN
      SELECT * FROM jsonb_array_elements(p_additional_services)
    LOOP
      INSERT INTO sale_items(
        sale_id, service_id, service_name, pet_id,
        original_price, final_price, is_price_modified,
        item_type, quantity, unit_price
      )
      VALUES (
        v_sale_id,
        NULLIF(v_item->>'serviceId', '')::INTEGER,
        COALESCE(NULLIF(TRIM(v_item->>'serviceName'), ''), 'ไม่ระบุบริการ'),
        v_booking.pet_id,
        COALESCE((v_item->>'originalPrice')::NUMERIC, 0),
        COALESCE((v_item->>'finalPrice')::NUMERIC, 0),
        COALESCE((v_item->>'isPriceModified')::BOOLEAN, FALSE),
        'SERVICE', 1,
        COALESCE((v_item->>'finalPrice')::NUMERIC, 0)
      );
    END LOOP;
  END IF;

  -- อัพเดตการจองโรงแรม
  UPDATE hotel_bookings SET
    check_out_date = p_check_out_date,
    total_nights = v_total_nights,
    room_total = v_room_total,
    additional_services_total = v_services_total,
    discount_amount = v_promotion_discount + COALESCE(p_custom_discount, 0),
    grand_total = v_grand_total,
    paid_amount = v_grand_total,
    remaining_amount = 0,
    deposit_status = CASE WHEN v_booking.deposit_amount > 0 THEN 'USED' ELSE 'NONE' END,
    payment_method = p_payment_method,
    note = COALESCE(NULLIF(TRIM(p_note), ''), v_booking.note),
    status = 'CHECKED_OUT',
    updated_at = NOW()
  WHERE id = p_hotel_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;
