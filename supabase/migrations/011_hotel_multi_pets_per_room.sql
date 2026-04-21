-- ===================================
-- Migration 011: Hotel Multi-Pets Per Room
-- ปรับปรุงระบบโรงแรมให้รองรับหลายสัตว์เลี้ยงต่อห้อง
-- ===================================

-- ===================================
-- 1. สร้างตาราง hotel_bookings_pet (สัตว์เลี้ยงในห้องพัก)
-- ===================================
CREATE TABLE hotel_bookings_pet (
  id SERIAL PRIMARY KEY,
  hotel_booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_hotel_booking_pet UNIQUE(hotel_booking_id, pet_id)
);

CREATE INDEX idx_hotel_bookings_pet_booking_id ON hotel_bookings_pet(hotel_booking_id);
CREATE INDEX idx_hotel_bookings_pet_pet_id ON hotel_bookings_pet(pet_id);

COMMENT ON TABLE hotel_bookings_pet IS 'สัตว์เลี้ยงที่เข้าพักในแต่ละการจองโรงแรม (1 booking สามารถมีหลายสัตว์เลี้ยงได้)';

-- ===================================
-- 2. Migrate ข้อมูลเก่า: ย้าย pet_id จาก hotel_bookings ไปยัง hotel_bookings_pet
-- ===================================
INSERT INTO hotel_bookings_pet (hotel_booking_id, pet_id, created_at)
SELECT id, pet_id, created_at
FROM hotel_bookings
WHERE pet_id IS NOT NULL;

-- ===================================
-- 3. ลบ column pet_id ออกจาก hotel_bookings
-- ===================================
ALTER TABLE hotel_bookings DROP COLUMN IF EXISTS pet_id;

-- ===================================
-- 4. เพิ่ม comment อธิบาย logic ใหม่
-- ===================================
COMMENT ON TABLE hotel_bookings IS 'การจองห้องพักโรงแรมสัตว์เลี้ยง (1 booking = 1 ห้อง, สามารถมีหลายสัตว์ได้)';
COMMENT ON COLUMN hotel_bookings.rate_per_night IS 'ราคาห้องต่อคืน (เหมาห้อง ไม่ว่าจะมีกี่ตัว)';

-- ===================================
-- 5. RLS Policy สำหรับ hotel_bookings
-- ===================================
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on hotel_bookings" ON hotel_bookings
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 6. ปรับปรุง RPC Function: checkout_hotel_booking
-- ให้รองรับโครงสร้างใหม่ (ไม่มี pet_id ใน hotel_bookings แล้ว)
-- ===================================
DROP FUNCTION IF EXISTS checkout_hotel_booking(INTEGER, DATE, JSONB, NUMERIC, TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION checkout_hotel_booking(
  p_hotel_booking_id INTEGER,
  p_check_out_date DATE,
  p_additional_services JSONB DEFAULT '[]'::JSONB,
  p_discount_amount NUMERIC DEFAULT 0,
  p_payment_method TEXT DEFAULT 'CASH',
  p_cash_received NUMERIC DEFAULT NULL,
  p_note TEXT DEFAULT NULL
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
  v_grand_total NUMERIC;
  v_remaining NUMERIC;
BEGIN
  -- Get current booking
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

  -- Calculate nights
  v_total_nights := GREATEST(1, p_check_out_date - v_booking.check_in_date);
  v_room_total := v_booking.rate_per_night * v_total_nights;

  -- Insert additional services
  IF jsonb_typeof(COALESCE(p_additional_services, '[]'::jsonb)) = 'array'
     AND jsonb_array_length(COALESCE(p_additional_services, '[]'::jsonb)) > 0 THEN
    FOR v_item IN
      SELECT * FROM jsonb_array_elements(p_additional_services)
    LOOP
      INSERT INTO hotel_additional_services(
        hotel_booking_id,
        service_id,
        service_name,
        original_price,
        final_price,
        is_price_modified
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

  -- Calculate totals
  v_grand_total := v_room_total + v_services_total - COALESCE(p_discount_amount, 0);
  v_grand_total := GREATEST(0, v_grand_total);
  v_remaining := GREATEST(0, v_grand_total - v_booking.deposit_amount);

  -- Update booking
  UPDATE hotel_bookings SET
    check_out_date = p_check_out_date,
    total_nights = v_total_nights,
    room_total = v_room_total,
    additional_services_total = v_services_total,
    discount_amount = COALESCE(p_discount_amount, 0),
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

GRANT EXECUTE ON FUNCTION checkout_hotel_booking(INTEGER, DATE, JSONB, NUMERIC, TEXT, NUMERIC, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION checkout_hotel_booking IS 'Checkout โรงแรม - คำนวณค่าห้อง + บริการเสริม (รองรับหลายสัตว์เลี้ยงต่อห้อง)';
