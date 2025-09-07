/*
  # Fix Address Column Issue

  1. Changes
    - Ensure address column exists in passport_applications table
    - Add any missing columns that might cause schema cache issues
    - Refresh the schema cache

  2. Security
    - Maintain existing RLS policies
*/

-- Ensure the address column exists with proper constraints
DO $$
BEGIN
  -- Check if address column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'passport_applications' AND column_name = 'address'
  ) THEN
    ALTER TABLE passport_applications ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;

  -- Ensure address column is NOT NULL if it exists but allows nulls
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'passport_applications' 
    AND column_name = 'address' 
    AND is_nullable = 'YES'
  ) THEN
    -- First update any null values
    UPDATE passport_applications SET address = '' WHERE address IS NULL;
    -- Then set NOT NULL constraint
    ALTER TABLE passport_applications ALTER COLUMN address SET NOT NULL;
  END IF;

  -- Ensure proof_of_payment_url column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'passport_applications' AND column_name = 'proof_of_payment_url'
  ) THEN
    ALTER TABLE passport_applications ADD COLUMN proof_of_payment_url text;
  END IF;
END $$;

-- Update the table comment to refresh schema cache
COMMENT ON TABLE passport_applications IS 'Passport applications with all required fields including address';

-- Refresh the schema cache by updating a system table (this forces Supabase to reload)
SELECT pg_notify('pgrst', 'reload schema');