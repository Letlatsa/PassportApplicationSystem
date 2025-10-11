-- Drop the trigger that automatically logs status changes
DROP TRIGGER IF EXISTS trigger_log_status_change ON passport_applications;

-- Drop the function that was used by the trigger
DROP FUNCTION IF EXISTS log_status_change();
