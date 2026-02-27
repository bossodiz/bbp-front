-- ===================================
-- Migration 008: สร้าง/แก้ไข Function create_booking_with_pets
-- Run this in Supabase Dashboard > SQL Editor
-- ===================================

-- Drop old version if signature differs
DROP FUNCTION IF EXISTS create_booking_with_pets(INTEGER, TEXT, DATE, TIME, TEXT, NUMERIC, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS create_booking_with_pets(INTEGER, DATE, TIME, TEXT, NUMERIC, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION create_booking_with_pets(
  p_customer_id  INTEGER,
  p_booking_date DATE,
  p_booking_time TIME,
  p_note         TEXT,
  p_deposit_amount NUMERIC,
  p_deposit_status TEXT,
  p_status       TEXT,
  p_pet_service_pairs JSONB
)
RETURNS bookings
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_id  INTEGER := p_customer_id;
  v_pair         JSONB;
  v_new_pet      JSONB;
  v_pet_id       INTEGER;
  v_existing_pet pets%ROWTYPE;
  v_booking      bookings%ROWTYPE;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'กรุณาเลือกลูกค้า';
  END IF;

  IF p_booking_date IS NULL OR p_booking_time IS NULL THEN
    RAISE EXCEPTION 'กรุณาเลือกวันและเวลา';
  END IF;

  INSERT INTO bookings(
    customer_id,
    booking_date,
    booking_time,
    note,
    deposit_amount,
    deposit_status,
    status
  )
  VALUES (
    v_customer_id,
    p_booking_date,
    p_booking_time,
    NULLIF(TRIM(p_note), ''),
    COALESCE(p_deposit_amount, 0),
    COALESCE(NULLIF(TRIM(p_deposit_status), ''), 'NONE'),
    COALESCE(NULLIF(TRIM(p_status), ''), 'PENDING')
  )
  RETURNING * INTO v_booking;

  FOR v_pair IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_pet_service_pairs, '[]'::jsonb))
  LOOP
    v_pet_id := NULL;

    IF NULLIF(TRIM(v_pair->>'petId'), '') IS NOT NULL THEN
      v_pet_id := (v_pair->>'petId')::INTEGER;
    ELSIF v_pair ? 'newPet' THEN
      v_new_pet := v_pair->'newPet';

      IF v_new_pet IS NULL OR NULLIF(TRIM(v_new_pet->>'name'), '') IS NULL THEN
        RAISE EXCEPTION 'ข้อมูลสัตว์เลี้ยงไม่ถูกต้อง';
      END IF;

      SELECT * INTO v_existing_pet
      FROM pets
      WHERE customer_id = v_customer_id
        AND LOWER(name) = LOWER(v_new_pet->>'name')
      LIMIT 1;

      IF v_existing_pet.id IS NOT NULL THEN
        RAISE EXCEPTION 'ลูกค้านี้มีสัตว์เลี้ยงชื่อ "%" อยู่แล้ว', v_existing_pet.name;
      END IF;

      INSERT INTO pets(customer_id, name, type, breed, breed_2, is_mixed_breed, weight, note)
      VALUES (
        v_customer_id,
        v_new_pet->>'name',
        v_new_pet->>'type',
        NULLIF(TRIM(v_new_pet->>'breed'), ''),
        CASE WHEN COALESCE((v_new_pet->>'isMixedBreed')::BOOLEAN, FALSE)
          THEN NULLIF(TRIM(v_new_pet->>'breed2'), '')
          ELSE NULL
        END,
        COALESCE((v_new_pet->>'isMixedBreed')::BOOLEAN, FALSE),
        COALESCE((v_new_pet->>'weight')::NUMERIC, 0),
        NULLIF(TRIM(v_new_pet->>'note'), '')
      )
      RETURNING id INTO v_pet_id;
    END IF;

    IF v_pet_id IS NOT NULL AND NULLIF(TRIM(v_pair->>'serviceType'), '') IS NOT NULL THEN
      INSERT INTO booking_pets(booking_id, pet_id, service_type)
      VALUES (v_booking.id, v_pet_id, v_pair->>'serviceType');
    END IF;
  END LOOP;

  RETURN v_booking;
END;
$$;

GRANT EXECUTE ON FUNCTION create_booking_with_pets(INTEGER, DATE, TIME, TEXT, NUMERIC, TEXT, TEXT, JSONB) TO anon, authenticated;
