ALTER TABLE "WorkflowField"
DROP CONSTRAINT IF EXISTS "WorkflowField_workflowId_fkey";

ALTER TABLE "WorkflowField"
DROP COLUMN IF EXISTS "workflowId";