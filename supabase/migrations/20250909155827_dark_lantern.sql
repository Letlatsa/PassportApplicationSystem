/*
  # Enhanced Passport System with Officials and Collection Points

  1. New Tables
    - `officials` - Passport officials with district assignments
    - `biometrics_appointments` - Appointment scheduling system
    - `biometrics_data` - Store biometric information
    - Enhanced `collection_points` with district mapping
    - Enhanced `passport_applications` with collection point selection

  2. Security
    - Enable RLS on all new tables
    - Add policies for officials based on district access
    - Add policies for appointment management

  3. Changes
    - Update application workflow to include collection point selection
    - Add rejection reason tracking
    - Add biometrics data storage
*/

-- Create user roles enum with official role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_new') THEN
    CREATE TYPE user_role_new AS ENUM ('citizen', 'official', 'admin');
  END IF;
END $$;

-- Create districts enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'district_enum') THEN
    CREATE TYPE district_enum AS ENUM (
      'Butha-Buthe', 
      'Leribe', 
      'Berea', 
      'Maseru', 
      'Mafeteng', 
      'Mohale''s Hoek', 
      'Qacha''s Nek', 
      'Quthing', 
      'Mokhotlong', 
      'Thaba-Tseka'
    );
  END IF;
END $$;

-- Create appointment status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
  END IF;
END $$;

-- Update collection_points table with district mapping
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collection_points' AND column_name = 'district_enum'
  ) THEN
    ALTER TABLE collection_points ADD COLUMN district_enum district_enum;
    
    -- Update existing records with proper district enum values
    UPDATE collection_points SET district_enum = 'Maseru' WHERE district = 'Maseru';
    UPDATE collection_points SET district_enum = 'Leribe' WHERE district = 'Leribe';
    UPDATE collection_points SET district_enum = 'Mafeteng' WHERE district = 'Mafeteng';
    UPDATE collection_points SET district_enum = 'Mohale''s Hoek' WHERE district = 'Mohale''s Hoek';
    UPDATE collection_points SET district_enum = 'Qacha''s Nek' WHERE district = 'Qacha''s Nek';
    UPDATE collection_points SET district_enum = 'Thaba-Tseka' WHERE district = 'Thaba-Tseka';
  END IF;
END $$;

-- Create officials table
CREATE TABLE IF NOT EXISTS officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  district district_enum NOT NULL,
  position text DEFAULT 'Passport Officer',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create biometrics appointments table
CREATE TABLE IF NOT EXISTS biometrics_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES passport_applications(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  official_id uuid REFERENCES officials(id),
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create biometrics data table
CREATE TABLE IF NOT EXISTS biometrics_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES passport_applications(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES biometrics_appointments(id),
  passport_photo_url text,
  fingerprint_data jsonb,
  captured_by uuid REFERENCES officials(id),
  captured_at timestamptz DEFAULT now(),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add rejection_reason to passport_applications if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passport_applications' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE passport_applications ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Add assigned_official to passport_applications if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'passport_applications' AND column_name = 'assigned_official'
  ) THEN
    ALTER TABLE passport_applications ADD COLUMN assigned_official uuid REFERENCES officials(id);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometrics_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometrics_data ENABLE ROW LEVEL SECURITY;

-- Policies for officials table
CREATE POLICY "Admins can manage all officials"
  ON officials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%admin%' OR auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

CREATE POLICY "Officials can view their own data"
  ON officials
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for biometrics appointments
CREATE POLICY "Users can view their own appointments"
  ON biometrics_appointments
  FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

CREATE POLICY "Officials can view appointments in their district"
  ON biometrics_appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officials o
      JOIN passport_applications pa ON pa.id = biometrics_appointments.application_id
      JOIN collection_points cp ON cp.id = pa.collection_point_id
      WHERE o.user_id = auth.uid() 
      AND o.district = cp.district_enum
      AND o.is_active = true
    )
  );

CREATE POLICY "Admins can manage all appointments"
  ON biometrics_appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%admin%' OR auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- Policies for biometrics data
CREATE POLICY "Officials can manage biometrics in their district"
  ON biometrics_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officials o
      JOIN passport_applications pa ON pa.id = biometrics_data.application_id
      JOIN collection_points cp ON cp.id = pa.collection_point_id
      WHERE o.user_id = auth.uid() 
      AND o.district = cp.district_enum
      AND o.is_active = true
    )
  );

CREATE POLICY "Admins can manage all biometrics data"
  ON biometrics_data
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%admin%' OR auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );

-- Update passport applications policies for officials
CREATE POLICY "Officials can view applications in their district"
  ON passport_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officials o
      JOIN collection_points cp ON cp.id = passport_applications.collection_point_id
      WHERE o.user_id = auth.uid() 
      AND o.district = cp.district_enum
      AND o.is_active = true
    )
  );

CREATE POLICY "Officials can update applications in their district"
  ON passport_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officials o
      JOIN collection_points cp ON cp.id = passport_applications.collection_point_id
      WHERE o.user_id = auth.uid() 
      AND o.district = cp.district_enum
      AND o.is_active = true
    )
  );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_officials_updated_at') THEN
    CREATE TRIGGER update_officials_updated_at
      BEFORE UPDATE ON officials
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_biometrics_appointments_updated_at') THEN
    CREATE TRIGGER update_biometrics_appointments_updated_at
      BEFORE UPDATE ON biometrics_appointments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert sample collection points with proper district mapping
INSERT INTO collection_points (name, address, district, district_enum, contact_person, contact_phone, is_active) VALUES
  ('Maseru Central Post Office', 'Kingsway Road, Maseru 100', 'Maseru', 'Maseru', 'Thabo Mofolo', '+266 2231 2345', true),
  ('Leribe District Office', 'Main Street, Hlotse', 'Leribe', 'Leribe', 'Mamello Thabane', '+266 2240 0123', true),
  ('Mafeteng Municipal Office', 'Hospital Road, Mafeteng', 'Mafeteng', 'Mafeteng', 'Palesa Mokhele', '+266 2270 0456', true),
  ('Mohale''s Hoek District Center', 'Government Road, Mohale''s Hoek', 'Mohale''s Hoek', 'Mohale''s Hoek', 'Tsepo Ramokoena', '+266 2278 5789', true),
  ('Qacha''s Nek Border Office', 'Border Gate, Qacha''s Nek', 'Qacha''s Nek', 'Qacha''s Nek', 'Lineo Makhetha', '+266 2295 6012', true),
  ('Thaba-Tseka Mountain Office', 'Mountain Road, Thaba-Tseka', 'Thaba-Tseka', 'Thaba-Tseka', 'Mpho Letsie', '+266 2290 3456', true)
ON CONFLICT (name) DO NOTHING;

-- Create function to auto-assign applications to officials
CREATE OR REPLACE FUNCTION assign_application_to_official()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign to an active official in the same district as collection point
  UPDATE passport_applications 
  SET assigned_official = (
    SELECT o.id 
    FROM officials o
    JOIN collection_points cp ON cp.id = NEW.collection_point_id
    WHERE o.district = cp.district_enum 
    AND o.is_active = true
    ORDER BY RANDOM()
    LIMIT 1
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auto_assign_official') THEN
    CREATE TRIGGER auto_assign_official
      AFTER INSERT ON passport_applications
      FOR EACH ROW
      EXECUTE FUNCTION assign_application_to_official();
  END IF;
END $$;