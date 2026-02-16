-- Migration 004: Remove hotel_additional_services table
-- เนื่องจากข้อมูลถูกเก็บใน sale_items แล้ว ไม่จำเป็นต้องมี table นี้อีกต่อไป

-- ลบ table hotel_additional_services
DROP TABLE IF EXISTS hotel_additional_services CASCADE;
