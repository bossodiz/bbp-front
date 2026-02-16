-- ===================================
-- Hotel Feature Migration
-- โรงแรมสัตว์เลี้ยง (Cat & Dog Hotel)
-- ===================================

-- ===================================
-- 1. HOTEL_BOOKINGS TABLE
-- ===================================
CREATE TABLE hotel_bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  rate_per_night DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_nights INTEGER,
  room_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
  additional_services_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20),
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT check_hotel_status CHECK (status IN ('RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
  CONSTRAINT check_hotel_deposit_status CHECK (deposit_status IN ('NONE', 'HELD', 'USED', 'FORFEITED')),
  CONSTRAINT check_hotel_deposit CHECK (deposit_amount >= 0),
  CONSTRAINT check_hotel_rate CHECK (rate_per_night >= 0),
  CONSTRAINT check_hotel_room_total CHECK (room_total >= 0),
  CONSTRAINT check_hotel_grand_total CHECK (grand_total >= 0),
  CONSTRAINT check_hotel_payment_method CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'QR', 'CREDIT_CARD'))
);

CREATE INDEX idx_hotel_bookings_customer_id ON hotel_bookings(customer_id);
CREATE INDEX idx_hotel_bookings_pet_id ON hotel_bookings(pet_id);
CREATE INDEX idx_hotel_bookings_status ON hotel_bookings(status);
CREATE INDEX idx_hotel_bookings_check_in ON hotel_bookings(check_in_date);
CREATE INDEX idx_hotel_bookings_check_out ON hotel_bookings(check_out_date);
CREATE INDEX idx_hotel_bookings_created_at ON hotel_bookings(created_at DESC);

COMMENT ON TABLE hotel_bookings IS 'ตารางจองโรงแรมสัตว์เลี้ยง';
COMMENT ON COLUMN hotel_bookings.status IS 'สถานะ: RESERVED=จองแล้ว, CHECKED_IN=เข้าพักแล้ว, CHECKED_OUT=รับกลับแล้ว, CANCELLED=ยกเลิก';
COMMENT ON COLUMN hotel_bookings.deposit_status IS 'สถานะมัดจำ: NONE=ไม่มี, HELD=มีมัดจำ, USED=ใช้แล้ว, FORFEITED=ยึดมัดจำ';

-- ===================================
-- 2. HOTEL_ADDITIONAL_SERVICES TABLE
-- บริการเสริมที่เพิ่มตอน checkout (อาบน้ำ ตัดขน ฯลฯ)
-- ===================================
CREATE TABLE hotel_additional_services (
  id SERIAL PRIMARY KEY,
  hotel_booking_id INTEGER NOT NULL REFERENCES hotel_bookings(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  service_name VARCHAR(255) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_price_modified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT check_hotel_svc_original_price CHECK (original_price >= 0),
  CONSTRAINT check_hotel_svc_final_price CHECK (final_price >= 0)
);

CREATE INDEX idx_hotel_additional_services_booking ON hotel_additional_services(hotel_booking_id);
CREATE INDEX idx_hotel_additional_services_service ON hotel_additional_services(service_id);

COMMENT ON TABLE hotel_additional_services IS 'บริการเสริมของโรงแรม (อาบน้ำ ตัดขน ฯลฯ)';

-- ===================================
-- 3. TRIGGERS
-- ===================================
CREATE TRIGGER update_hotel_bookings_updated_at BEFORE UPDATE ON hotel_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 4. ROW LEVEL SECURITY
-- ===================================
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_additional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on hotel_bookings" ON hotel_bookings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on hotel_additional_services" ON hotel_additional_services
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 5. FUNCTION: Checkout Hotel Booking (Atomic)
-- ===================================
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
