/*
  # Lesotho Passport E-Applications System Schema

  1. New Tables
    - `passport_applications` - Main application data with personal info, documents, and status
    - `collection_points` - Available locations for passport collection
    - `application_status_updates` - Audit trail for all status changes
    - `notification_logs` - Track all SMS and email notifications sent

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add admin policies for management access
    - Secure file storage integration

  3. Features
    - Complete passport application workflow
    - Real-time status tracking
    - Document management
    - Collection point selection
    - QR code generation for secure collection
*/

-- Create passport_applications table
CREATE TABLE IF NOT EXISTS passport_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
  passport_photo_url text,
  id_document_url text,
  birth_certificate_url text,
  proof_of_address_url text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'appointment_booked', 'await_printing', 'ready_for_collection', 'collected', 'rejected')),
  collection_point_id uuid,
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create collection_points table
CREATE TABLE IF NOT EXISTS collection_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  phone text NOT NULL,
  operating_hours text NOT NULL DEFAULT '08:00 - 16:30 (Mon-Fri)',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create application_status_updates table
CREATE TABLE IF NOT EXISTS application_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES passport_applications(id) ON DELETE CASCADE,
  status text NOT NULL,
  notes text,
  updated_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES passport_applications(id) ON DELETE CASCADE,
  type text CHECK (type IN ('sms', 'email')) NOT NULL,
  recipient text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE passport_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for passport_applications
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

-- RLS Policies for collection_points
CREATE POLICY "Anyone can view active collection points"
  ON collection_points
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage collection points"
  ON collection_points
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- RLS Policies for application_status_updates
CREATE POLICY "Users can view own application updates"
  ON application_status_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM passport_applications 
      WHERE passport_applications.id = application_status_updates.application_id 
      AND passport_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all status updates"
  ON application_status_updates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- RLS Policies for notification_logs
CREATE POLICY "Users can view own notifications"
  ON notification_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM passport_applications 
      WHERE passport_applications.id = notification_logs.application_id 
      AND passport_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all notifications"
  ON notification_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email LIKE '%admin%'
    )
  );

-- Insert sample collection points
INSERT INTO collection_points (name, address, district, phone, operating_hours) VALUES
  ('Maseru Central Post Office', 'Kingsway Road, Maseru Central', 'Maseru', '+266 2231 2345', '08:00 - 16:30 (Mon-Fri)'),
  ('Leribe District Office', 'Main Street, Leribe', 'Leribe', '+266 2240 0123', '08:00 - 16:00 (Mon-Fri)'),
  ('Mafeteng Municipal Office', 'Central Square, Mafeteng', 'Mafeteng', '+266 2270 0456', '08:00 - 16:00 (Mon-Fri)'),
  ('Mohale''s Hoek District Center', 'Government Road, Mohale''s Hoek', 'Mohale''s Hoek', '+266 2278 5789', '08:00 - 15:30 (Mon-Fri)'),
  ('Qacha''s Nek Border Office', 'Border Complex, Qacha''s Nek', 'Qacha''s Nek', '+266 2295 6123', '08:00 - 16:00 (Mon-Fri)'),
  ('Thaba-Tseka Mountain Office', 'Highland Road, Thaba-Tseka', 'Thaba-Tseka', '+266 2290 4567', '09:00 - 15:00 (Mon-Fri)');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_passport_applications_user_id ON passport_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_applications_reference_number ON passport_applications(reference_number);
CREATE INDEX IF NOT EXISTS idx_passport_applications_status ON passport_applications(status);
CREATE INDEX IF NOT EXISTS idx_application_status_updates_application_id ON application_status_updates(application_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_application_id ON notification_logs(application_id);

-- Function to automatically create status update when status changes
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

-- Create trigger for automatic status logging
DROP TRIGGER IF EXISTS trigger_log_status_change ON passport_applications;
CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON passport_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change();