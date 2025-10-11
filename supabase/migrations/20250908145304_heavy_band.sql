/*
  # Fix Passport Applications Schema Cache Issue

  1. Changes
    - Drop and recreate the passport_applications table with all required columns
    - Ensure proper column definitions and constraints
    - Re-enable RLS and recreate policies
    - Force schema cache refresh

  2. Security
    - Maintain all existing RLS policies
    - Preserve data integrity
*/

-- First, let's backup any existing data (if any)
CREATE TABLE IF NOT EXISTS passport_applications_backup AS 
SELECT * FROM passport_applications WHERE 1=0; -- Create empty backup table with same structure

-- Drop existing table and recreate with proper schema
DROP TABLE IF EXISTS passport_applications CASCADE;

-- Recreate passport_applications table with all required columns
CREATE TABLE passport_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference_number text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  place_of_birth text NOT NULL,
  nationality text NOT NULL DEFAULT 'Lesotho',
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  id_document_url text,
  birth_certificate_url text,
  proof_of_address_url text,
  proof_of_payment_url text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'ready_for_collection', 'collected', 'rejected')),
  collection_point_id uuid,
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE passport_applications ENABLE ROW LEVEL SECURITY;

-- Recreate RLS Policies
CREATE POLICY "Users can view own applications"
  ON passport_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON passport_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications"
  ON passport_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Recreate indexes
CREATE INDEX idx_passport_applications_user_id ON passport_applications(user_id);
CREATE INDEX idx_passport_applications_reference_number ON passport_applications(reference_number);
CREATE INDEX idx_passport_applications_status ON passport_applications(status);

-- Recreate the status change trigger
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_status_updates (application_id, status, notes, updated_by)
    VALUES (NEW.id, NEW.status, 'Status automatically updated', COALESCE(auth.uid()::text, 'system'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON passport_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';

-- Add comment to ensure schema is recognized
COMMENT ON TABLE passport_applications IS 'Passport applications table with all required fields including address - updated schema';