/*
  # Fix Address Column Issue

  1. Changes
    - Add missing address column to passport_applications table
    - Update existing applications to have proper address field
    - Add proof_of_payment_url column for payment receipts

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'passport_applications' AND column_name = 'proof_of_payment_url'
  ) THEN
    ALTER TABLE passport_applications ADD COLUMN proof_of_payment_url text;
  END IF;
END $$;

-- Ensure address column exists (it should from the original migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'passport_applications' AND column_name = 'address'
  ) THEN
    ALTER TABLE passport_applications ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;
END $$;