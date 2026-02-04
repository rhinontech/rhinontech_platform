-- Reset stuck training status
-- Run this if training gets stuck in "training" state

UPDATE automations 
SET 
  training_status = 'idle',
  training_progress = 0,
  training_job_id = NULL,
  training_message = NULL
WHERE training_status = 'training';

SELECT * FROM automations;
