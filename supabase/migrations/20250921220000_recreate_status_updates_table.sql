-- Recreate the table with the correct schema
CREATE TABLE IF NOT EXISTS public.application_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.passport_applications(id) ON DELETE CASCADE,
  status text,
  notes text,
  updated_by text, -- Set type to TEXT to match application code
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.application_status_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_status_updates
CREATE POLICY "Users can view own application updates"
  ON public.application_status_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.passport_applications 
      WHERE passport_applications.id = application_status_updates.application_id 
      AND passport_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all status updates"
  ON public.application_status_updates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%admin%' OR auth.users.raw_user_meta_data->>'role' = 'admin')
    )
  );
