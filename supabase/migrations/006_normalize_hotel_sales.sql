-- ===================================
-- Migration 006: Normalize hotel checkout financial data
-- Source of truth for hotel charges: sales + sale_items
-- ===================================

-- 1) Drop old checkout RPC first (it depends on old columns)
DROP FUNCTION IF EXISTS checkout_hotel_booking;

-- 2) Remove duplicated financial columns from hotel_bookings
ALTER TABLE hotel_bookings
  DROP COLUMN IF EXISTS total_nights,
  DROP COLUMN IF EXISTS room_total,
  DROP COLUMN IF EXISTS additional_services_total,
  DROP COLUMN IF EXISTS discount_amount,
  DROP COLUMN IF EXISTS grand_total,
  DROP COLUMN IF EXISTS paid_amount,
  DROP COLUMN IF EXISTS remaining_amount,
  DROP COLUMN IF EXISTS payment_method;

-- 3) Keep a performant lookup path from hotel booking -> checkout sale
CREATE INDEX IF NOT EXISTS idx_sales_hotel_booking_sale_type
  ON sales(hotel_booking_id, sale_type, created_at DESC);

-- 4) Recreate checkout RPC to persist financials only in sales/sale_items

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
  v_existing_sale_id INTEGER;
  v_item JSONB;
  v_services_total NUMERIC := 0;
  v_total_nights INTEGER := 0;
  v_room_total NUMERIC := 0;
  v_subtotal NUMERIC := 0;
  v_promotion_discount NUMERIC := 0;
  v_total_discount NUMERIC := 0;
  v_deposit_used NUMERIC := 0;
  v_total_amount NUMERIC := 0;
  v_sale_id INTEGER;
  v_payment_method TEXT := 'CASH';
BEGIN
  -- Lock booking row to avoid concurrent checkout for same booking.
  SELECT *
  INTO v_booking
  FROM hotel_bookings
  WHERE id = p_hotel_booking_id
  FOR UPDATE;

  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'ไม่พบข้อมูลการจองโรงแรม';
  END IF;

  IF v_booking.status = 'CHECKED_OUT' THEN
    RAISE EXCEPTION 'การจองนี้ได้ checkout แล้ว';
  END IF;

  IF v_booking.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'การจองนี้ถูกยกเลิกแล้ว';
  END IF;

  IF p_check_out_date IS NULL THEN
    RAISE EXCEPTION 'กรุณาระบุวันที่รับกลับ';
  END IF;

  -- Guard against duplicate HOTEL sale rows for the same booking.
  SELECT id
  INTO v_existing_sale_id
  FROM sales
  WHERE hotel_booking_id = p_hotel_booking_id
    AND sale_type = 'HOTEL'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing_sale_id IS NOT NULL THEN
    RAISE EXCEPTION 'การจองนี้มีรายการ checkout อยู่แล้ว';
  END IF;

  v_total_nights := GREATEST(1, p_check_out_date - v_booking.check_in_date);
  v_room_total := COALESCE(v_booking.rate_per_night, 0) * v_total_nights;

  -- Sum additional services from payload (stored as sale_items only).
  IF jsonb_typeof(COALESCE(p_additional_services, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_additional_services, '[]'::jsonb)) > 0 THEN
    FOR v_item IN
      SELECT * FROM jsonb_array_elements(p_additional_services)
    LOOP
      v_services_total := v_services_total + COALESCE((v_item->>'finalPrice')::NUMERIC, 0);
    END LOOP;
  END IF;

  v_subtotal := v_room_total + v_services_total;

  -- Promotion discount (if valid) otherwise fallback to p_discount_amount.
  IF p_promotion_id IS NOT NULL THEN
    SELECT
      CASE
        WHEN type = 'PERCENT' THEN ROUND(v_subtotal * (value / 100))
        WHEN type = 'AMOUNT' THEN value
        ELSE 0
      END
    INTO v_promotion_discount
    FROM promotions
    WHERE id = p_promotion_id
      AND active = true
      AND (applicable_to = 'ALL' OR applicable_to = 'HOTEL')
      AND (start_date IS NULL OR start_date <= p_check_out_date)
      AND (end_date IS NULL OR end_date >= p_check_out_date);

    v_promotion_discount := COALESCE(v_promotion_discount, 0);
  ELSE
    v_promotion_discount := GREATEST(0, COALESCE(p_discount_amount, 0));
  END IF;

  v_total_discount := v_promotion_discount + GREATEST(0, COALESCE(p_custom_discount, 0));
  v_deposit_used := CASE
    WHEN v_booking.deposit_status = 'HELD' AND COALESCE(v_booking.deposit_amount, 0) > 0
      THEN v_booking.deposit_amount
    ELSE 0
  END;

  -- Follow existing convention: total_amount is payable now (after deposit used).
  v_total_amount := GREATEST(0, v_subtotal - v_total_discount - v_deposit_used);
  v_payment_method := COALESCE(NULLIF(TRIM(p_payment_method), ''), 'CASH');

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
    NULL,
    v_booking.customer_id,
    v_subtotal,
    v_promotion_discount,
    p_promotion_id,
    GREATEST(0, COALESCE(p_custom_discount, 0)),
    v_deposit_used,
    v_total_amount,
    v_payment_method,
    CASE WHEN v_payment_method = 'CASH' THEN p_cash_received ELSE NULL END,
    CASE
      WHEN v_payment_method = 'CASH' AND p_cash_received IS NOT NULL
        THEN GREATEST(0, p_cash_received - v_total_amount)
      ELSE NULL
    END,
    'HOTEL',
    p_hotel_booking_id,
    NOW()
  )
  RETURNING id INTO v_sale_id;

  -- Room charge line item (total line in final_price, nightly in unit_price).
  INSERT INTO sale_items(
    sale_id,
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
    'ค่าห้องพัก ' || v_total_nights || ' คืน',
    v_booking.pet_id,
    v_room_total,
    v_room_total,
    FALSE,
    'HOTEL_ROOM',
    v_total_nights,
    COALESCE(v_booking.rate_per_night, 0)
  );

  -- Additional service lines.
  IF jsonb_typeof(COALESCE(p_additional_services, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_additional_services, '[]'::jsonb)) > 0 THEN
    FOR v_item IN
      SELECT * FROM jsonb_array_elements(p_additional_services)
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
        v_booking.pet_id,
        COALESCE((v_item->>'originalPrice')::NUMERIC, 0),
        COALESCE((v_item->>'finalPrice')::NUMERIC, 0),
        COALESCE((v_item->>'isPriceModified')::BOOLEAN, FALSE),
        'SERVICE',
        1,
        COALESCE((v_item->>'finalPrice')::NUMERIC, 0)
      );
    END LOOP;
  END IF;

  UPDATE hotel_bookings
  SET
    check_out_date = p_check_out_date,
    deposit_status = CASE WHEN v_deposit_used > 0 THEN 'USED' ELSE deposit_status END,
    note = COALESCE(NULLIF(TRIM(p_note), ''), v_booking.note),
    status = 'CHECKED_OUT',
    updated_at = NOW()
  WHERE id = p_hotel_booking_id
  RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION checkout_hotel_booking(
  INTEGER,
  DATE,
  JSONB,
  NUMERIC,
  TEXT,
  NUMERIC,
  TEXT,
  INTEGER,
  NUMERIC
) TO anon, authenticated;
