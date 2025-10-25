-- Update the status check constraint to include 'await_printing'
ALTER TABLE passport_applications
DROP CONSTRAINT IF EXISTS passport_applications_status_check;

ALTER TABLE passport_applications
ADD CONSTRAINT passport_applications_status_check
CHECK (status IN ('submitted', 'approved', 'appointment_booked', 'await_printing', 'ready_for_collection', 'collected', 'rejected'));