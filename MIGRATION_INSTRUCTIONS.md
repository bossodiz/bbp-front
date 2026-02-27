# Migration Instructions

## Problem
API `/api/bookings` returns error:
```
Could not find the function public.create_booking_with_pets(...)
```

## Solution
Two new migration files have been created:

1. **`007_create_booking_pets_table.sql`** - No-op (table already exists)
2. **`008_create_booking_with_pets_function.sql`** - Creates the missing function

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/008_create_booking_with_pets_function.sql`
4. Paste and run the SQL

### Option 2: Using Supabase CLI
```bash
supabase migration up
```

## What the Function Does
- Creates a new booking with atomic transaction
- Automatically adds associated pets to the booking
- Returns the created booking with all details

## Function Signature
```sql
create_booking_with_pets(
  p_customer_id INTEGER,
  p_booking_date DATE,
  p_booking_time TIME,
  p_note TEXT,
  p_deposit_amount NUMERIC,
  p_deposit_status TEXT,
  p_status TEXT,
  p_pet_service_pairs JSONB
)
```

## Verification
After running the migration, test the API:
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "bookingDate": "2024-03-01",
    "bookingTime": "10:00",
    "petServicePairs": [
      {"petId": 1, "service": "Grooming"}
    ]
  }'
```

The API should return the created booking without errors.
